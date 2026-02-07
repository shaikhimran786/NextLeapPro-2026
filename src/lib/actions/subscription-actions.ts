"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function createSubscription(planId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan || !plan.active) {
    throw new Error("Plan not found or inactive");
  }

  const existingSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
  });

  if (existingSubscription) {
    throw new Error("You already have an active subscription");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + plan.intervalCount);

  let trialEnd = null;
  if (plan.trialDays > 0) {
    trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + plan.trialDays);
  }

  const subscription = await prisma.$transaction(async (tx) => {
    const sub = await tx.userSubscription.create({
      data: {
        userId,
        planId,
        status: trialEnd ? "trialing" : "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEnd,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: plan.tier,
        subscriptionExpiry: periodEnd,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        userId,
        action: "subscription_created",
        target: `Plan: ${plan.name}`,
        details: {
          subscriptionId: sub.id,
          planId,
          tier: plan.tier,
          price: plan.price,
          trialDays: plan.trialDays,
        },
      },
    });

    return sub;
  });

  revalidatePath("/dashboard");
  revalidatePath("/pricing");

  return {
    success: true,
    subscription: {
      id: subscription.id,
      status: subscription.status,
      tier: plan.tier,
    },
    whatsappUrl: plan.whatsappUrl,
    whatsappMessage: plan.whatsappMessage,
  };
}

export async function cancelSubscription(reason?: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
    include: { plan: true },
  });

  if (!subscription) {
    throw new Error("No active subscription found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.userSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        userId,
        action: "subscription_cancelled",
        target: `Subscription #${subscription.id}`,
        details: {
          planId: subscription.planId,
          reason,
        },
      },
    });
  });

  revalidatePath("/dashboard");

  return { success: true };
}

export async function reactivateSubscription() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: "cancelled",
    },
    orderBy: { updatedAt: "desc" },
    include: { plan: true },
  });

  if (!subscription) {
    throw new Error("No cancelled subscription found");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + subscription.plan.intervalCount);

  await prisma.$transaction(async (tx) => {
    await tx.userSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "active",
        cancelledAt: null,
        cancelReason: null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: subscription.plan.tier,
        subscriptionExpiry: periodEnd,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        userId,
        action: "subscription_reactivated",
        target: `Subscription #${subscription.id}`,
        details: { planId: subscription.planId },
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/pricing");

  return {
    success: true,
    whatsappUrl: subscription.plan.whatsappUrl,
    whatsappMessage: subscription.plan.whatsappMessage,
  };
}

export async function getSubscriptionWhatsAppRedirect(subscriptionId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const subscription = await prisma.userSubscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });

  if (!subscription || subscription.userId !== userId) {
    throw new Error("Subscription not found");
  }

  if (!subscription.plan.whatsappUrl) {
    return { success: false, message: "No WhatsApp group configured" };
  }

  let whatsappUrl = subscription.plan.whatsappUrl;
  if (subscription.plan.whatsappMessage) {
    const encodedMessage = encodeURIComponent(subscription.plan.whatsappMessage);
    whatsappUrl = `${whatsappUrl}?text=${encodedMessage}`;
  }

  return {
    success: true,
    whatsappUrl,
  };
}
