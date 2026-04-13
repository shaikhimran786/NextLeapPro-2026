import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPaymentSignature, fetchPayment } from "@/lib/razorpay";
import { generateTicketCode } from "@/lib/payment-link";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrationId,
      paymentToken,
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

    const currentUserId = await getCurrentUserId();
    const isOwnerBySession = currentUserId && currentUserId === registration.userId;
    const isOwnerByToken = paymentToken && registration.paymentToken && paymentToken === registration.paymentToken;

    if (!isOwnerBySession && !isOwnerByToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (!registration.razorpayOrderId) {
      return NextResponse.json(
        { error: "No payment order found for this registration. Please initiate payment first." },
        { status: 400 }
      );
    }

    if (registration.razorpayOrderId !== razorpay_order_id) {
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

    const payment = await fetchPayment(razorpay_payment_id);
    const expectedAmountPaise = Math.round(Number(registration.event.price) * 100);
    const paymentCurrency = (payment.currency || "INR").toUpperCase();
    const expectedCurrency = (registration.event.currency || "INR").toUpperCase();

    if (
      payment.status !== "captured" ||
      Number(payment.amount) !== expectedAmountPaise ||
      paymentCurrency !== expectedCurrency
    ) {
      console.error("Razorpay payment validation failed", {
        paymentStatus: payment.status,
        paymentAmount: payment.amount,
        expectedAmount: expectedAmountPaise,
        paymentCurrency,
        expectedCurrency,
      });
      return NextResponse.json(
        { error: "Payment amount or status verification failed. Please contact support." },
        { status: 400 }
      );
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
          paymentToken: null,
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
      { error: "Failed to verify payment. Please try again." },
      { status: 500 }
    );
  }
}
