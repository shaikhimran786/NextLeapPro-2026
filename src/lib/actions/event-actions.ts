"use server";

import crypto from "crypto";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth-utils";
import { generateTicketCode } from "@/lib/payment-link";

export async function registerForEvent(eventId: number, ticketType?: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: true,
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.status !== "published") {
    throw new Error("This event is not accepting registrations");
  }

  if (event.capacity) {
    const registeredCount = event.registrations.filter(
      (r) => r.status !== "cancelled"
    ).length;
    if (registeredCount >= event.capacity) {
      throw new Error("Event is at full capacity");
    }
  }

  const existingRegistration = await prisma.eventRegistration.findFirst({
    where: { eventId, userId },
  });

  if (existingRegistration && existingRegistration.status !== "cancelled") {
    if (existingRegistration.paymentStatus === "pending" && Number(event.price) > 0) {
      const existingToken = existingRegistration.paymentToken || crypto.randomBytes(32).toString("hex");
      if (!existingRegistration.paymentToken) {
        await prisma.eventRegistration.update({
          where: { id: existingRegistration.id },
          data: { paymentToken: existingToken },
        });
      }
      return {
        success: true,
        registration: {
          id: existingRegistration.id,
          status: existingRegistration.status,
          paymentStatus: existingRegistration.paymentStatus,
        },
        requiresPayment: true,
        paymentToken: existingToken,
        message: "You have a pending payment for this event",
      };
    }
    throw new Error("Already registered for this event");
  }

  const isFreeEvent = Number(event.price) === 0;
  const ticketCode = isFreeEvent ? generateTicketCode() : null;
  const paymentToken = isFreeEvent ? null : crypto.randomBytes(32).toString("hex");

  const registration = await prisma.$transaction(async (tx) => {
    let reg;
    if (existingRegistration) {
      reg = await tx.eventRegistration.update({
        where: { id: existingRegistration.id },
        data: {
          status: isFreeEvent ? "registered" : "pending",
          paymentStatus: isFreeEvent ? "paid" : "pending",
          paidAmount: null,
          qrCode: ticketCode,
          paymentToken,
          registeredAt: new Date(),
        },
      });
    } else {
      reg = await tx.eventRegistration.create({
        data: {
          eventId,
          userId,
          status: isFreeEvent ? "registered" : "pending",
          paymentStatus: isFreeEvent ? "paid" : "pending",
          paidAmount: null,
          qrCode: ticketCode,
          paymentToken,
        },
      });
    }

    await tx.adminAuditLog.create({
      data: {
        userId,
        action: isFreeEvent ? "event_rsvp" : "event_registration_pending",
        target: `Event #${eventId}: ${event.title}`,
        details: {
          registrationId: reg.id,
          ticketType,
          price: event.price,
          isFree: isFreeEvent,
        },
      },
    });

    return reg;
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");

  if (!isFreeEvent) {
    return {
      success: true,
      registration: {
        id: registration.id,
        status: registration.status,
        paymentStatus: registration.paymentStatus,
      },
      requiresPayment: true,
      paymentToken,
      message: "Please complete payment to confirm your registration",
    };
  }

  return {
    success: true,
    registration: {
      id: registration.id,
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      ticketCode,
    },
    requiresPayment: false,
    message: "You're registered! Check your tickets for details.",
  };
}

export async function confirmEventPayment(_registrationId: number) {
  throw new Error("Self-confirmation is no longer supported. Please complete payment through the Razorpay checkout on the event page.");
}

export async function cancelEventRegistration(eventId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const registration = await prisma.eventRegistration.findFirst({
    where: { eventId, userId },
  });

  if (!registration) {
    throw new Error("No registration found");
  }

  if (registration.status === "cancelled") {
    throw new Error("Registration already cancelled");
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventRegistration.update({
      where: { id: registration.id },
      data: { status: "cancelled" },
    });

    await tx.adminAuditLog.create({
      data: {
        userId,
        action: "event_registration_cancelled",
        target: `Event #${eventId}`,
        details: { registrationId: registration.id },
      },
    });
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");

  return { success: true };
}

export async function getEventJoinLink(eventId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  const registration = await prisma.eventRegistration.findFirst({
    where: { 
      eventId, 
      userId, 
      status: "registered",
      paymentStatus: "paid",
    },
  });

  if (!registration) {
    throw new Error("Must be registered with completed payment to join");
  }

  const now = new Date();
  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);

  if (now < eventStart || now > eventEnd) {
    throw new Error("Event is not currently live");
  }

  return {
    success: true,
    joinLink: event.onlineLink,
  };
}

export async function getRegistrationStatus(eventId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const registration = await prisma.eventRegistration.findFirst({
    where: { eventId, userId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      qrCode: true,
      paidAmount: true,
      registeredAt: true,
    },
  });

  return registration;
}
