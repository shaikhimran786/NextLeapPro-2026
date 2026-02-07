import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateTicketCode } from "@/lib/payment-link";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventId = parseInt(id);

  try {
    const body = await request.json();
    const { registrationId, email } = body;

    if (!registrationId || !email) {
      return NextResponse.json(
        { error: "Registration ID and email are required" },
        { status: 400 }
      );
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        user: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    if (registration.eventId !== eventId) {
      return NextResponse.json(
        { error: "Registration does not match event" },
        { status: 400 }
      );
    }

    if (registration.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email does not match registration" },
        { status: 403 }
      );
    }

    if (registration.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        message: "Payment already confirmed",
        registration: {
          id: registration.id,
          status: registration.status,
          paymentStatus: registration.paymentStatus,
          ticketCode: registration.qrCode,
        },
      });
    }

    const ticketCode = generateTicketCode();

    const updated = await prisma.$transaction(async (tx) => {
      const reg = await tx.eventRegistration.update({
        where: { id: registrationId },
        data: {
          status: "registered",
          paymentStatus: "paid",
          paidAmount: registration.event.price,
          qrCode: ticketCode,
          updatedAt: new Date(),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          userId: registration.userId,
          action: "event_payment_confirmed",
          target: `Event #${eventId}: ${registration.event.title}`,
          details: {
            registrationId: registration.id,
            ticketCode,
            amount: registration.event.price,
            confirmedVia: "api",
          },
        },
      });

      return reg;
    });

    return NextResponse.json({
      success: true,
      message: "Payment confirmed! Your ticket is ready.",
      registration: {
        id: updated.id,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        ticketCode,
      },
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
