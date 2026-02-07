import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, normalizeBaseTier } from "@/lib/auth-utils";

async function broadcastNewSubscription(userName: string, planName: string) {
  try {
    await prisma.broadcastNotification.create({
      data: {
        type: "new_subscription",
        message: `${userName} just subscribed to ${planName}!`,
        userName,
        planName,
      },
    });
  } catch (error) {
    console.error("Failed to broadcast subscription notification:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to confirm your subscription." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactionId, checkoutToken, email } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    if (!checkoutToken) {
      return NextResponse.json(
        { error: "Checkout token is required for payment confirmation" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required for payment confirmation" },
        { status: 400 }
      );
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: parseInt(transactionId) },
      include: {
        user: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.userId !== currentUserId) {
      return NextResponse.json(
        { error: "You are not authorized to confirm this subscription." },
        { status: 403 }
      );
    }

    const metadata = transaction.metadata as any;
    
    if (metadata?.checkoutToken !== checkoutToken) {
      return NextResponse.json(
        { error: "Invalid checkout token. Please start a new checkout." },
        { status: 403 }
      );
    }

    if (transaction.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email does not match. Please use the email used during checkout." },
        { status: 403 }
      );
    }

    if (transaction.status === "captured" || transaction.status === "completed") {
      const existingSubscription = await prisma.userSubscription.findFirst({
        where: { 
          userId: transaction.userId,
          status: "active",
        },
      });

      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        message: "Payment already confirmed",
        subscription: existingSubscription,
      });
    }

    const planId = metadata?.planId;
    if (!planId) {
      return NextResponse.json(
        { error: "Plan information not found in transaction" },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    const intervalDays = plan.interval === "year" 
      ? 365 * plan.intervalCount 
      : 30 * plan.intervalCount;

    const result = await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "captured",
          metadata: {
            ...metadata,
            confirmedAt: new Date().toISOString(),
            confirmationMethod: "manual",
          },
        },
      });

      const existingSub = await tx.userSubscription.findFirst({
        where: { userId: transaction.userId, status: "active" },
      });

      let subscription;
      if (existingSub) {
        subscription = await tx.userSubscription.update({
          where: { id: existingSub.id },
          data: {
            planId: plan.id,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        });
      } else {
        subscription = await tx.userSubscription.create({
          data: {
            userId: transaction.userId,
            planId: plan.id,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000),
          },
        });
      }

      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          subscriptionTier: normalizeBaseTier(plan.tier),
          subscriptionExpiry: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          userId: transaction.userId,
          action: "subscription_activated",
          target: `Plan: ${plan.name}`,
          details: {
            transactionId: transaction.id,
            planId: plan.id,
            planName: plan.name,
            amount: transaction.amount,
            currency: transaction.currency,
          },
        },
      });

      return subscription;
    });

    const userName = `${transaction.user.firstName} ${transaction.user.lastName}`;
    broadcastNewSubscription(userName, plan.name);

    return NextResponse.json({
      success: true,
      message: `Your ${plan.name} subscription is now active!`,
      subscription: {
        id: result.id,
        planName: plan.name,
        tier: plan.tier,
        validUntil: result.currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error("Subscription confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm subscription. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("tid");
  const token = searchParams.get("token");

  if (!transactionId) {
    return NextResponse.json(
      { error: "Transaction ID is required" },
      { status: 400 }
    );
  }

  if (!token) {
    return NextResponse.json(
      { error: "Token is required to view transaction details" },
      { status: 400 }
    );
  }

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: parseInt(transactionId) },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  const metadata = transaction.metadata as any;
  
  if (metadata?.checkoutToken !== token) {
    return NextResponse.json(
      { error: "Invalid token. Please start a new checkout." },
      { status: 403 }
    );
  }

  const plan = metadata?.planId ? await prisma.subscriptionPlan.findUnique({
    where: { id: metadata.planId },
    select: {
      id: true,
      name: true,
      tier: true,
      price: true,
      currency: true,
      interval: true,
    },
  }) : null;

  return NextResponse.json({
    transaction: {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      createdAt: transaction.createdAt,
    },
    plan,
    user: {
      email: transaction.user.email,
      name: `${transaction.user.firstName} ${transaction.user.lastName}`,
    },
    isConfirmed: transaction.status === "captured" || transaction.status === "completed",
  });
}
