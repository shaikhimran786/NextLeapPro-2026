import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const planId = parseInt(id);

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      plan: {
        ...plan,
        price: Number(plan.price),
        features: plan.features as string[],
      },
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const planId = parseInt(id);
    const body = await request.json();

    const currentPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!currentPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.trialDays !== undefined) {
      updateData.trialDays = body.trialDays;
    }
    if (body.isPopular !== undefined) {
      updateData.isPopular = body.isPopular;
    }
    if (body.active !== undefined) {
      updateData.active = body.active;
    }
    if (body.features !== undefined) {
      updateData.features = body.features;
    }
    if (body.whatsappUrl !== undefined) {
      updateData.whatsappUrl = body.whatsappUrl;
    }
    if (body.whatsappMessage !== undefined) {
      updateData.whatsappMessage = body.whatsappMessage;
    }
    if (body.customPaymentUrl !== undefined) {
      updateData.customPaymentUrl = body.customPaymentUrl;
    }
    if (body.useCustomPayment !== undefined) {
      updateData.useCustomPayment = body.useCustomPayment;
    }

    if (body.price !== undefined && Number(currentPlan.price) !== body.price) {
      await prisma.subscriptionPriceHistory.create({
        data: {
          planId: planId,
          oldPrice: currentPlan.price,
          newPrice: body.price,
          changedBy: body.changedBy || null,
          reason: body.reason || null,
        },
      });
      updateData.price = body.price;
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      plan: {
        ...updatedPlan,
        price: Number(updatedPlan.price),
        features: updatedPlan.features as string[],
      },
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}
