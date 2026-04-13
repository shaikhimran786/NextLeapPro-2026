import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateTicketCode } from "@/lib/payment-link";
import { isEventExpired } from "@/lib/event-utils";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventId = parseInt(id);

  try {
    const body = await request.json();
    const { email, firstName, lastName } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, first name, and last name are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { error: "This event is not accepting registrations" },
        { status: 400 }
      );
    }

    if (isEventExpired(event)) {
      return NextResponse.json(
        { error: "This event has already ended. Registration is no longer available." },
        { status: 400 }
      );
    }

    if (event.capacity) {
      const currentRegistrations = event.registrations.filter(
        (r) => r.status !== "cancelled"
      ).length;
      if (currentRegistrations >= event.capacity) {
        return NextResponse.json(
          { error: "This event is fully booked" },
          { status: 400 }
        );
      }
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash: null,
        },
      });
    }

    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId: user.id,
      },
    });

    if (existingRegistration && existingRegistration.status !== "cancelled") {
      const isPendingPayment = (existingRegistration.paymentStatus === "pending" || existingRegistration.paymentStatus === "failed") && Number(event.price) > 0;
      if (isPendingPayment) {
        const activeToken = existingRegistration.paymentToken || crypto.randomBytes(32).toString("hex");
        if (!existingRegistration.paymentToken) {
          await prisma.eventRegistration.update({
            where: { id: existingRegistration.id },
            data: { paymentToken: activeToken },
          });
        }
        return NextResponse.json({
          success: true,
          registration: {
            id: existingRegistration.id,
            status: existingRegistration.status,
            paymentStatus: existingRegistration.paymentStatus,
          },
          requiresPayment: true,
          paymentToken: activeToken,
          message: existingRegistration.paymentStatus === "failed"
            ? "Your previous payment failed. You can try again."
            : "You have a pending payment for this event",
        });
      }
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 400 }
      );
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
            userId: user.id,
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
          userId: user.id,
          action: isFreeEvent ? "event_rsvp" : "event_registration_pending",
          target: `Event #${eventId}: ${event.title}`,
          details: {
            registrationId: reg.id,
            userEmail: email,
            userName: `${firstName} ${lastName}`,
            isFree: isFreeEvent,
            price: event.price,
          },
        },
      });

      return reg;
    });

    if (!isFreeEvent) {
      return NextResponse.json({
        success: true,
        registration: {
          id: registration.id,
          status: registration.status,
          paymentStatus: registration.paymentStatus,
        },
        requiresPayment: true,
        paymentToken,
        message: "Please complete payment to confirm your registration",
      });
    }

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        eventTitle: event.title,
        startDate: event.startDate,
        mode: event.mode,
        ticketCode,
      },
      requiresPayment: false,
      message: "You're registered! Check your email for details.",
    });
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}
