import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/cashfree";
import { normalizeBaseTier } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing signature or timestamp" },
        { status: 400 }
      );
    }

    const rawBody = await request.text();
    
    try {
      const isValid = verifyWebhookSignature(rawBody, signature, timestamp);
      
      if (!isValid) {
        console.error("Invalid Cashfree webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    } catch (signatureError) {
      console.error("Cashfree webhook signature verification failed:", signatureError);
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type;
    const data = event.data;

    console.log(`Cashfree webhook received: ${eventType}`);

    switch (eventType) {
      case "PAYMENT_SUCCESS_WEBHOOK":
      case "PAYMENT_SUCCESS": {
        await handlePaymentSuccess(data);
        break;
      }

      case "PAYMENT_FAILED_WEBHOOK":
      case "PAYMENT_FAILED": {
        await handlePaymentFailed(data);
        break;
      }

      case "PAYMENT_USER_DROPPED_WEBHOOK":
      case "PAYMENT_USER_DROPPED": {
        await handlePaymentDropped(data);
        break;
      }

      case "SUBSCRIPTION_NEW_ACTIVATION":
      case "SUBSCRIPTION_ACTIVATED": {
        await handleSubscriptionActivated(data);
        break;
      }

      case "SUBSCRIPTION_PAYMENT_SUCCESS": {
        await handleSubscriptionPaymentSuccess(data);
        break;
      }

      case "SUBSCRIPTION_PAYMENT_FAILED": {
        await handleSubscriptionPaymentFailed(data);
        break;
      }

      case "SUBSCRIPTION_CANCELLED": {
        await handleSubscriptionCancelled(data);
        break;
      }

      default:
        console.log(`Unhandled Cashfree webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error("Cashfree webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(data: any) {
  const orderId = data.order?.order_id || data.order_id;
  const paymentId = data.payment?.cf_payment_id || data.cf_payment_id;
  
  if (!orderId) return;

  const transaction = await prisma.paymentTransaction.findFirst({
    where: { cashfreeOrderId: orderId },
    include: { subscription: { include: { plan: true } } },
  });

  if (transaction && transaction.status !== "captured") {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        cashfreePaymentId: paymentId?.toString(),
        status: "captured",
        paymentMethod: data.payment?.payment_method || "cashfree",
      },
    });

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
      
      console.log(`Cashfree payment success: User ${transaction.userId} activated ${baseTier} subscription`);
    } else {
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
              paymentGateway: "cashfree",
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
          
          console.log(`Cashfree payment success (fallback): User ${transaction.userId} activated ${baseTier} subscription`);
        }
      }
    }
  }
}

async function handlePaymentFailed(data: any) {
  const orderId = data.order?.order_id || data.order_id;
  const paymentId = data.payment?.cf_payment_id || data.cf_payment_id;
  
  if (!orderId) return;

  const transaction = await prisma.paymentTransaction.findFirst({
    where: { cashfreeOrderId: orderId },
  });

  if (transaction) {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        cashfreePaymentId: paymentId?.toString(),
        status: "failed",
        failureReason: data.payment?.payment_message || data.error_message || "Payment failed",
      },
    });
  }
}

async function handlePaymentDropped(data: any) {
  const orderId = data.order?.order_id || data.order_id;
  
  if (!orderId) return;

  const transaction = await prisma.paymentTransaction.findFirst({
    where: { cashfreeOrderId: orderId },
  });

  if (transaction && transaction.status === "pending") {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "cancelled",
        failureReason: "User dropped the payment",
      },
    });
  }
}

async function handleSubscriptionActivated(data: any) {
  const subscriptionId = data.subscription_id;
  const customerId = data.customer_id;
  
  if (!subscriptionId) return;

  let userSubscription = await prisma.userSubscription.findFirst({
    where: { cashfreeSubscriptionId: subscriptionId },
    include: { plan: true },
  });

  if (!userSubscription && customerId) {
    const userId = parseInt(customerId.replace('customer_', ''));
    if (!isNaN(userId)) {
      userSubscription = await prisma.userSubscription.findFirst({
        where: { 
          userId,
          status: "pending",
          paymentGateway: "cashfree",
        },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });
      
      if (userSubscription) {
        await prisma.userSubscription.update({
          where: { id: userSubscription.id },
          data: { cashfreeSubscriptionId: subscriptionId },
        });
      }
    }
  }

  if (userSubscription) {
    const isAnnual = userSubscription.plan.tier.includes("annual");
    const periodDays = isAnnual ? 365 : 30;
    
    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: {
        status: "active",
        cashfreeSubscriptionId: subscriptionId,
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
    
    console.log(`Cashfree subscription activated: User ${userSubscription.userId} with subscription ${subscriptionId}`);
  }
}

async function handleSubscriptionPaymentSuccess(data: any) {
  const subscriptionId = data.subscription_id;
  const paymentId = data.cf_payment_id;
  
  if (!subscriptionId) return;

  const userSubscription = await prisma.userSubscription.findFirst({
    where: { cashfreeSubscriptionId: subscriptionId },
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

    await prisma.paymentTransaction.create({
      data: {
        subscriptionId: userSubscription.id,
        userId: userSubscription.userId,
        cashfreePaymentId: paymentId?.toString(),
        amount: Number(data.subscription_amount || userSubscription.plan.price),
        currency: data.subscription_currency || "INR",
        status: "captured",
        paymentMethod: "cashfree_subscription",
        paymentGateway: "cashfree",
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
  }
}

async function handleSubscriptionPaymentFailed(data: any) {
  const subscriptionId = data.subscription_id;
  
  if (!subscriptionId) return;

  const userSubscription = await prisma.userSubscription.findFirst({
    where: { cashfreeSubscriptionId: subscriptionId },
  });

  if (userSubscription) {
    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: {
        status: "payment_failed",
      },
    });
  }
}

async function handleSubscriptionCancelled(data: any) {
  const subscriptionId = data.subscription_id;
  
  if (!subscriptionId) return;

  const userSubscription = await prisma.userSubscription.findFirst({
    where: { cashfreeSubscriptionId: subscriptionId },
    include: { plan: true },
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
