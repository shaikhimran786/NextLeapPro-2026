import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const subscriptionId = parseInt(id);

    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.status === "active") {
      return NextResponse.json(
        { error: "Subscription is already active" },
        { status: 400 }
      );
    }

    const now = new Date();
    let periodEnd: Date;
    
    if (subscription.plan.interval === "year") {
      periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else {
      periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    await prisma.userSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: "active",
        cancelledAt: null,
        cancelReason: null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    const baseTier = subscription.plan.tier.replace("_annual", "");
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        subscriptionTier: baseTier,
        subscriptionExpiry: periodEnd,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated successfully",
    });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
