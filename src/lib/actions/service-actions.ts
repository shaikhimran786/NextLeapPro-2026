"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function bookService(serviceId: number, notes?: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { provider: true },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  if (service.providerId === userId) {
    throw new Error("Cannot book your own service");
  }

  const existingBooking = await prisma.serviceBooking.findFirst({
    where: {
      serviceId,
      clientId: userId,
      status: { in: ["pending", "confirmed", "in_progress"] },
    },
  });

  if (existingBooking) {
    throw new Error("You already have an active booking for this service");
  }

  const booking = await prisma.$transaction(async (tx) => {
    const newBooking = await tx.serviceBooking.create({
      data: {
        serviceId,
        clientId: userId,
        status: "pending",
        paidAmount: service.price,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        userId,
        action: "service_booking",
        target: `Service #${serviceId}: ${service.title}`,
        details: {
          bookingId: newBooking.id,
          providerId: service.providerId,
          price: service.price,
          notes,
        },
      },
    });

    return newBooking;
  });

  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/services");
  revalidatePath("/dashboard");

  return {
    success: true,
    booking: {
      id: booking.id,
      status: booking.status,
    },
  };
}

export async function cancelServiceBooking(bookingId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.clientId !== userId) {
    throw new Error("Not authorized to cancel this booking");
  }

  if (booking.status === "completed" || booking.status === "cancelled") {
    throw new Error("Cannot cancel this booking");
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceBooking.update({
      where: { id: bookingId },
      data: { status: "cancelled" },
    });

    await tx.adminAuditLog.create({
      data: {
        userId,
        action: "service_booking_cancelled",
        target: `Booking #${bookingId}`,
        details: {
          serviceId: booking.serviceId,
          previousStatus: booking.status,
        },
      },
    });
  });

  revalidatePath(`/services/${booking.serviceId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function getServiceBookingDetails(bookingId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: {
      service: {
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.clientId !== userId && booking.service.providerId !== userId) {
    throw new Error("Not authorized to view this booking");
  }

  return {
    success: true,
    booking: {
      id: booking.id,
      status: booking.status,
      paidAmount: booking.paidAmount,
      bookedAt: booking.bookedAt,
      service: {
        id: booking.service.id,
        title: booking.service.title,
        description: booking.service.description,
        provider: booking.service.provider,
      },
    },
  };
}
