import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { normalizeBaseTier } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    // 1. Extract signature header
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing X-Razorpay-Signature header" },
        { status: 400 }
      );
    }

    // 2. Read raw body for signature verification
    const rawBody = await request.text();

    // 3. Verify webhook signature
    try {
      const isValid = verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        console.error("Invalid Razorpay webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    } catch (signatureError) {
      console.error("Razorpay webhook signature verification failed:", signatureError);
      return NextResponse.json(
        { error: "Signature verification error" },
        { status: 400 }
      );
    }

    // 4. Parse event
    const event = JSON.parse(rawBody);
    const eventType = event.event;

    console.log(`Razorpay webhook received: ${eventType}`);

    // 5. Route to handler based on event type
    switch (eventType) {
      case "payment.captured": {
        await handlePaymentCaptured(event.payload);
        break;
      }

      case "payment.failed": {
        await handlePaymentFailed(event.payload);
        break;
      }

      case "subscription.activated": {
        await handleSubscriptionActivated(event.payload);
        break;
      }

      case "subscription.charged": {
        await handleSubscriptionCharged(event.payload);
        break;
      }

      case "subscription.cancelled": {
        await handleSubscriptionCancelled(event.payload);
        break;
      }

      default:
        console.log(`Unhandled Razorpay webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// ─── Event Handlers ──────────────────────────────────────────────────────────

async function handlePaymentCaptured(payload: any) {
  const payment = payload.payment?.entity;
  if (!payment) return;

  const orderId = payment.order_id;
  const paymentId = payment.id;
  const paymentMethod = payment.method;

  if (!orderId) return;

  // Look up transaction by razorpayOrderId
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { razorpayOrderId: orderId },
    include: { subscription: { include: { plan: true } } },
  });

  // Idempotency: skip if already captured or transaction not found
  if (!transaction || transaction.status === "captured") return;

  // Update transaction with payment details
  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      razorpayPaymentId: paymentId,
      status: "captured",
      paymentMethod: paymentMethod || "razorpay",
    },
  });

  // Activate subscription if linked
  if (transaction.subscription) {
    const isAnnual = transaction.subscription.plan.tier.includes("annual");
    const periodDays = isAnnual ? 365 : 30;

    await prisma.userSubscription.update({
      where: { id: transaction.subscription.id },
      data: {
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
      },
    });

    const baseTier = normalizeBaseTier(transaction.subscription.plan.tier);
    await prisma.user.update({
      where: { id: transaction.subscription.userId },
      data: {
        subscriptionTier: baseTier,
        subscriptionExpiry: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
      },
    });

    console.log(
      `Razorpay payment captured: User ${transaction.userId} activated ${baseTier} subscription`
    );
  } else {
    // Fallback: use metadata to find plan and create subscription
    const metadata = transaction.metadata as any;
    if (metadata?.planId && transaction.userId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: metadata.planId },
      });

      if (plan) {
        const isAnnual = plan.tier.includes("annual");
        const periodDays = isAnnual ? 365 : 30;
        const baseTier = normalizeBaseTier(plan.tier);

        const subscription = await prisma.userSubscription.create({
          data: {
            userId: transaction.userId,
            planId: plan.id,
            status: "active",
            paymentGateway: "razorpay",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
          },
        });

        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: { subscriptionId: subscription.id },
        });

        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            subscriptionTier: baseTier,
            subscriptionExpiry: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
          },
        });

        console.log(
          `Razorpay payment captured (fallback): User ${transaction.userId} activated ${baseTier} subscription`
        );
      }
    }
  }
}

async function handlePaymentFailed(payload: any) {
  const payment = payload.payment?.entity;
  if (!payment) return;

  const orderId = payment.order_id;
  const paymentId = payment.id;
  const errorDescription =
    payment.error_description || payment.error_reason || "Payment failed";

  if (!orderId) return;

  const transaction = await prisma.paymentTransaction.findFirst({
    where: { razorpayOrderId: orderId },
  });

  // Don't overwrite a successful capture with a failure
  if (transaction && transaction.status !== "captured") {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        razorpayPaymentId: paymentId,
        status: "failed",
        failureReason: errorDescription,
      },
    });
  }
}

async function handleSubscriptionActivated(payload: any) {
  const subscription = payload.subscription?.entity;
  const payment = payload.payment?.entity;
  if (!subscription) return;

  const razorpaySubId = subscription.id;
  const notes = subscription.notes || {};
  const userId = notes.userId ? parseInt(notes.userId) : null;

  // Try to find by razorpaySubscriptionId first
  let userSubscription = await prisma.userSubscription.findFirst({
    where: { razorpaySubscriptionId: razorpaySubId },
    include: { plan: true },
  });

  // Fallback: find by userId and pending status
  if (!userSubscription && userId) {
    userSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: "pending",
        paymentGateway: "razorpay",
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (userSubscription) {
      await prisma.userSubscription.update({
        where: { id: userSubscription.id },
        data: { razorpaySubscriptionId: razorpaySubId },
      });
    }
  }

  if (userSubscription) {
    const isAnnual = userSubscription.plan.tier.includes("annual");
    const periodDays = isAnnual ? 365 : 30;

    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: {
        status: "active",
        razorpaySubscriptionId: razorpaySubId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
      },
    });

    const baseTier = normalizeBaseTier(userSubscription.plan.tier);
    await prisma.user.update({
      where: { id: userSubscription.userId },
      data: {
        subscriptionTier: baseTier,
        subscriptionExpiry: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
      },
    });

    // Record the associated payment if present
    if (payment) {
      const existingPayment = await prisma.paymentTransaction.findFirst({
        where: { razorpayPaymentId: payment.id },
      });

      if (!existingPayment) {
        await prisma.paymentTransaction.create({
          data: {
            subscriptionId: userSubscription.id,
            userId: userSubscription.userId,
            razorpayPaymentId: payment.id,
            razorpayOrderId: payment.order_id || null,
            amount: Number(userSubscription.plan.price),
            currency: userSubscription.plan.currency || "INR",
            status: "captured",
            paymentMethod: payment.method || "razorpay_subscription",
            paymentGateway: "razorpay",
          },
        });
      }
    }

    console.log(
      `Razorpay subscription activated: User ${userSubscription.userId} with subscription ${razorpaySubId}`
    );
  }
}

async function handleSubscriptionCharged(payload: any) {
  const subscription = payload.subscription?.entity;
  const payment = payload.payment?.entity;
  if (!subscription) return;

  const razorpaySubId = subscription.id;

  const userSubscription = await prisma.userSubscription.findFirst({
    where: { razorpaySubscriptionId: razorpaySubId },
    include: { plan: true },
  });

  if (userSubscription) {
    const isAnnual = userSubscription.plan.tier.includes("annual");
    const periodDays = isAnnual ? 365 : 30;

    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: {
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
      },
    });

    // Record renewal payment (with idempotency check)
    if (payment) {
      const existingPayment = await prisma.paymentTransaction.findFirst({
        where: { razorpayPaymentId: payment.id },
      });

      if (!existingPayment) {
        await prisma.paymentTransaction.create({
          data: {
            subscriptionId: userSubscription.id,
            userId: userSubscription.userId,
            razorpayPaymentId: payment.id,
            razorpayOrderId: payment.order_id || null,
            amount: payment.amount ? Number(payment.amount) / 100 : Number(userSubscription.plan.price),
            currency: payment.currency || "INR",
            status: "captured",
            paymentMethod: payment.method || "razorpay_subscription",
            paymentGateway: "razorpay",
          },
        });
      }
    }

    const baseTier = normalizeBaseTier(userSubscription.plan.tier);
    await prisma.user.update({
      where: { id: userSubscription.userId },
      data: {
        subscriptionTier: baseTier,
        subscriptionExpiry: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
      },
    });
  }
}

async function handleSubscriptionCancelled(payload: any) {
  const subscription = payload.subscription?.entity;
  if (!subscription) return;

  const razorpaySubId = subscription.id;

  const userSubscription = await prisma.userSubscription.findFirst({
    where: { razorpaySubscriptionId: razorpaySubId },
  });

  if (userSubscription) {
    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userSubscription.userId },
      data: { subscriptionTier: "free" },
    });
  }
}
