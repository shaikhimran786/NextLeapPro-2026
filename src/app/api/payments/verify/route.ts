import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { generateTicketCode } from "@/lib/payment-link";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrationId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registrationId) {
      return NextResponse.json(
        { error: "Missing required payment verification fields" },
        { status: 400 }
      );
    }

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.error("Razorpay payment signature verification failed", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        registrationId,
      });
      return NextResponse.json(
        { error: "Payment verification failed. Signature mismatch." },
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

    if (registration.razorpayOrderId && registration.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { error: "Order ID mismatch" },
        { status: 400 }
      );
    }

    if (registration.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        message: "Payment already verified",
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
          paymentGateway: "razorpay",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAmount: registration.event.price,
          qrCode: ticketCode,
          updatedAt: new Date(),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          userId: registration.userId,
          action: "event_payment_verified",
          target: `Event #${registration.eventId}: ${registration.event.title}`,
          details: {
            registrationId: registration.id,
            ticketCode,
            amount: Number(registration.event.price),
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            gateway: "razorpay",
          },
        },
      });

      return reg;
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified! Your ticket is ready.",
      registration: {
        id: updated.id,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        ticketCode,
      },
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
