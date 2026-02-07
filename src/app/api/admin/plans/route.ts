import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      plans: plans.map((plan) => ({
        ...plan,
        price: Number(plan.price),
        features: plan.features as string[],
      })),
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const {
      name,
      description,
      price,
      currency = "INR",
      interval = "month",
      intervalCount = 1,
      features = [],
      tier,
      planCode,
      trialDays = 0,
      sortOrder = 0,
      isPopular = false,
      active = true,
      whatsappUrl,
      whatsappMessage,
      customPaymentUrl,
      useCustomPayment = false,
    } = body;

    if (!name || !description || price === undefined || !tier || !planCode) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, price, tier, planCode" },
        { status: 400 }
      );
    }

    const existingTier = await prisma.subscriptionPlan.findFirst({
      where: { tier },
    });
    if (existingTier) {
      return NextResponse.json(
        { error: `A plan with tier '${tier}' already exists` },
        { status: 400 }
      );
    }

    const existingPlanCode = await prisma.subscriptionPlan.findFirst({
      where: { planCode },
    });
    if (existingPlanCode) {
      return NextResponse.json(
        { error: `A plan with planCode '${planCode}' already exists` },
        { status: 400 }
      );
    }

    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price,
        currency,
        interval,
        intervalCount,
        features,
        tier,
        planCode,
        trialDays,
        sortOrder,
        isPopular,
        active,
        whatsappUrl: whatsappUrl || null,
        whatsappMessage: whatsappMessage || null,
        customPaymentUrl: customPaymentUrl || null,
        useCustomPayment,
      },
    });

    return NextResponse.json({
      success: true,
      plan: {
        ...newPlan,
        price: Number(newPlan.price),
        features: newPlan.features as string[],
      },
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Failed to create subscription plan" },
      { status: 500 }
    );
  }
}
