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

    if (registration.status === "cancelled") {
      return NextResponse.json(
        { error: "This registration has been cancelled" },
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

    if (registration.status !== "pending" || (registration.paymentStatus !== "pending" && registration.paymentStatus !== "failed")) {
      return NextResponse.json(
        { error: "Registration is not in a payable state" },
        { status: 400 }
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

    const payment = await fetchPayment(razorpay_payment_id);
    const expectedAmountPaise = Math.round(Number(registration.event.price) * 100);
    const paymentCurrency = (payment.currency || "INR").toUpperCase();
    const expectedCurrency = (registration.event.currency || "INR").toUpperCase();

    if (Number(payment.amount) !== expectedAmountPaise || paymentCurrency !== expectedCurrency) {
      const mismatchReason = `Amount/currency mismatch: got ${payment.amount} ${paymentCurrency}, expected ${expectedAmountPaise} ${expectedCurrency}`;
      console.error("Razorpay payment amount/currency mismatch", {
        paymentAmount: payment.amount,
        expectedAmount: expectedAmountPaise,
        paymentCurrency,
        expectedCurrency,
        registrationId,
      });

      await prisma.$transaction([
        prisma.eventRegistration.update({
          where: { id: registrationId },
          data: {
            paymentStatus: "failed",
            paymentFailureReason: mismatchReason,
          },
        }),
        prisma.adminAuditLog.create({
          data: {
            userId: registration.userId,
            action: "event_payment_amount_mismatch",
            target: `Event #${registration.eventId}: ${registration.event.title}`,
            details: {
              registrationId: registration.id,
              razorpayPaymentId: razorpay_payment_id,
              paymentAmount: payment.amount,
              expectedAmount: expectedAmountPaise,
              paymentCurrency,
              expectedCurrency,
              gateway: "razorpay",
            },
          },
        }),
      ]);

      return NextResponse.json(
        { error: "Payment amount or currency does not match the event price. Please contact support.", code: "amount_mismatch" },
        { status: 400 }
      );
    }

    if (payment.status === "failed") {
      const errorDesc = "error_description" in payment && typeof (payment as { error_description?: string }).error_description === "string"
        ? (payment as { error_description: string }).error_description
        : "unknown error";
      const failReason = `Razorpay payment failed: ${errorDesc}`;
      await prisma.$transaction([
        prisma.eventRegistration.update({
          where: { id: registrationId },
          data: {
            paymentStatus: "failed",
            paymentFailureReason: failReason,
          },
        }),
        prisma.adminAuditLog.create({
          data: {
            userId: registration.userId,
            action: "event_payment_failed",
            target: `Event #${registration.eventId}: ${registration.event.title}`,
            details: {
              registrationId: registration.id,
              razorpayPaymentId: razorpay_payment_id,
              razorpayStatus: payment.status,
              errorDescription: errorDesc,
              gateway: "razorpay",
            },
          },
        }),
      ]);

      return NextResponse.json(
        { error: "Payment failed at the gateway. You can retry the payment.", code: "payment_failed" },
        { status: 400 }
      );
    }

    if (payment.status === "created" || payment.status === "authorized") {
      return NextResponse.json(
        { error: "Payment is still being processed. Please wait a moment and try again.", code: "payment_pending" },
        { status: 202 }
      );
    }

    if (payment.status === "refunded") {
      await prisma.adminAuditLog.create({
        data: {
          userId: registration.userId,
          action: "event_payment_already_refunded",
          target: `Event #${registration.eventId}: ${registration.event.title}`,
          details: {
            registrationId: registration.id,
            razorpayPaymentId: razorpay_payment_id,
            razorpayStatus: payment.status,
            gateway: "razorpay",
          },
        },
      });

      return NextResponse.json(
        { error: "This payment has been refunded. Please initiate a new payment if you wish to register.", code: "payment_refunded" },
        { status: 400 }
      );
    }

    if (payment.status !== "captured") {
      const reason = `Unexpected Razorpay payment status: ${payment.status}`;
      console.error("Razorpay unexpected payment status", {
        paymentStatus: payment.status,
        registrationId,
        razorpayPaymentId: razorpay_payment_id,
      });

      await prisma.adminAuditLog.create({
        data: {
          userId: registration.userId,
          action: "event_payment_unexpected_status",
          target: `Event #${registration.eventId}: ${registration.event.title}`,
          details: {
            registrationId: registration.id,
            razorpayPaymentId: razorpay_payment_id,
            razorpayStatus: payment.status,
            gateway: "razorpay",
          },
        },
      });

      return NextResponse.json(
        { error: "Payment could not be confirmed. Please contact support if amount was deducted.", code: "unexpected_status" },
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
          paymentFailureReason: null,
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
            previousPaymentStatus: registration.paymentStatus,
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
