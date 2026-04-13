import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createOrder, getRazorpayKeyId, fetchOrder, getRazorpayInstance } from "@/lib/razorpay";
import { generateTicketCode } from "@/lib/payment-link";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getPaymentProvider, isEventPaymentEnabled } from "@/lib/payment-config";
import { isEventExpired } from "@/lib/event-utils";

export async function POST(request: NextRequest) {
  try {
    const provider = getPaymentProvider();
    if (provider !== "razorpay") {
      return NextResponse.json(
        { error: `Event payments are only supported via Razorpay. Current provider: ${provider}` },
        { status: 400 }
      );
    }

    if (!isEventPaymentEnabled()) {
      return NextResponse.json(
        { error: "Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { registrationId, paymentToken } = body;

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required" },
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

    if (isEventExpired(registration.event)) {
      return NextResponse.json(
        { error: "This event has already ended. Registration is no longer available." },
        { status: 400 }
      );
    }

    if (registration.status === "cancelled") {
      return NextResponse.json(
        { error: "This registration has been cancelled" },
        { status: 400 }
      );
    }

    if (registration.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Payment already completed for this registration" },
        { status: 400 }
      );
    }

    if (registration.status !== "pending") {
      return NextResponse.json(
        { error: "Registration is not in a payable state" },
        { status: 400 }
      );
    }

    const amount = Number(registration.event.price);
    if (amount <= 0) {
      return NextResponse.json(
        { error: "This is a free event and does not require payment" },
        { status: 400 }
      );
    }

    const expectedAmountPaise = Math.round(amount * 100);
    const expectedCurrency = registration.event.currency || "INR";

    if (registration.razorpayOrderId) {
      try {
        const existingOrder = await fetchOrder(registration.razorpayOrderId);

        if (existingOrder && existingOrder.status === "paid") {
          try {
            const payments = await getRazorpayInstance().orders.fetchPayments(registration.razorpayOrderId);
            const capturedPayment = Array.isArray(payments?.items)
              ? payments.items.find((p: { status: string }) => p.status === "captured")
              : null;

            if (capturedPayment) {
              const ticketCode = generateTicketCode();
              await prisma.$transaction(async (tx) => {
                await tx.eventRegistration.update({
                  where: { id: registrationId },
                  data: {
                    status: "registered",
                    paymentStatus: "paid",
                    paymentGateway: "razorpay",
                    razorpayPaymentId: String(capturedPayment.id),
                    paidAmount: registration.event.price,
                    qrCode: ticketCode,
                    paymentToken: null,
                    paymentFailureReason: null,
                  },
                });
                await tx.adminAuditLog.create({
                  data: {
                    userId: registration.userId,
                    action: "event_payment_reconciled",
                    target: `Event #${registration.eventId}: ${registration.event.title}`,
                    details: {
                      registrationId: registration.id,
                      orderId: registration.razorpayOrderId,
                      paymentId: capturedPayment.id,
                      ticketCode,
                      gateway: "razorpay",
                    },
                  },
                });
              });

              return NextResponse.json({
                success: true,
                reconciled: true,
                message: "Payment was already captured. Your registration has been confirmed.",
                registration: {
                  id: registration.id,
                  status: "registered",
                  paymentStatus: "paid",
                  ticketCode,
                },
              });
            }
          } catch (reconcileErr) {
            console.error("Failed to reconcile paid order:", reconcileErr);
          }

          return NextResponse.json(
            { error: "A payment has already been processed for this registration. Please contact support if your ticket is not showing." },
            { status: 400 }
          );
        }

        if (
          existingOrder &&
          existingOrder.status === "created" &&
          Number(existingOrder.amount) === expectedAmountPaise &&
          (existingOrder.currency || "INR").toUpperCase() === expectedCurrency.toUpperCase()
        ) {
          await prisma.adminAuditLog.create({
            data: {
              userId: registration.userId,
              action: "event_payment_order_reused",
              target: `Event #${registration.eventId}: ${registration.event.title}`,
              details: {
                registrationId: registration.id,
                orderId: existingOrder.id,
                amount,
                gateway: "razorpay",
              },
            },
          });

          await prisma.eventRegistration.update({
            where: { id: registrationId },
            data: {
              paymentStatus: "pending",
              paymentFailureReason: null,
            },
          });

          return NextResponse.json({
            success: true,
            orderId: existingOrder.id,
            amount: expectedAmountPaise,
            currency: expectedCurrency,
            keyId: getRazorpayKeyId(),
            registration: {
              id: registration.id,
              eventId: registration.eventId,
              eventTitle: registration.event.title,
            },
            prefill: {
              name: `${registration.user.firstName || ""} ${registration.user.lastName || ""}`.trim(),
              email: registration.user.email,
            },
            reused: true,
          });
        }
      } catch (err) {
        console.warn("Could not fetch existing Razorpay order, creating new one:", err);
      }
    }

    const receipt = `evt_${registration.eventId}_reg_${registrationId}`.substring(0, 40);

    const order = await createOrder({
      amount: expectedAmountPaise,
      currency: expectedCurrency,
      receipt,
      notes: {
        eventId: registration.eventId.toString(),
        registrationId: registrationId.toString(),
        userId: registration.userId.toString(),
      },
    });

    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        razorpayOrderId: order.id,
        paymentGateway: "razorpay",
        paymentStatus: "pending",
        paymentFailureReason: null,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: registration.userId,
        action: "event_payment_order_created",
        target: `Event #${registration.eventId}: ${registration.event.title}`,
        details: {
          registrationId: registration.id,
          orderId: order.id,
          amount,
          currency: expectedCurrency,
          gateway: "razorpay",
        },
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: expectedAmountPaise,
      currency: expectedCurrency,
      keyId: getRazorpayKeyId(),
      registration: {
        id: registration.id,
        eventId: registration.eventId,
        eventTitle: registration.event.title,
      },
      prefill: {
        name: `${registration.user.firstName || ""} ${registration.user.lastName || ""}`.trim(),
        email: registration.user.email,
      },
    });
  } catch (error: any) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 }
    );
  }
}
