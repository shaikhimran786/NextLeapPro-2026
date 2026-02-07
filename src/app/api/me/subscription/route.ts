import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = await prisma.session.findFirst({
      where: {
        token: sessionToken,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            subscriptions: {
              where: { status: { in: ["active", "trial", "past_due"] } },
              include: {
                plan: true,
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const user = session.user;
    const subscription = user.subscriptions[0];

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        tier: "free",
        plan: null,
        startDate: null,
        endDate: null,
        daysRemaining: null,
        status: "none",
        isExpired: false,
      });
    }

    const now = new Date();
    const endDate = subscription.currentPeriodEnd;
    const isExpired = endDate ? endDate < now : false;
    
    let daysRemaining = 0;
    if (endDate && !isExpired) {
      daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (isExpired && subscription.status === "active") {
      await prisma.$transaction([
        prisma.userSubscription.update({
          where: { id: subscription.id },
          data: { status: "expired" },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { subscriptionTier: "free" },
        }),
      ]);

      return NextResponse.json({
        hasSubscription: false,
        tier: "free",
        plan: subscription.plan,
        startDate: subscription.currentPeriodStart,
        endDate: subscription.currentPeriodEnd,
        daysRemaining: 0,
        status: "expired",
        isExpired: true,
        expiredPlanName: subscription.plan.name,
      });
    }

    return NextResponse.json({
      hasSubscription: true,
      tier: subscription.plan.tier,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        tier: subscription.plan.tier,
        price: Number(subscription.plan.price),
        currency: subscription.plan.currency,
        interval: subscription.plan.interval,
      },
      startDate: subscription.currentPeriodStart,
      endDate: subscription.currentPeriodEnd,
      daysRemaining,
      status: subscription.status,
      isExpired: false,
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
