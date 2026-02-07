import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const targetType = searchParams.get("targetType");

    const where: { page?: string; targetType?: string } = {};
    if (page) where.page = page;
    if (targetType) where.targetType = targetType;

    const configs = await prisma.cTAConfig.findMany({
      where,
      orderBy: [{ page: "asc" }, { targetType: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Error fetching CTA configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch CTA configurations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      page,
      targetType,
      state,
      label,
      style = "primary",
      urlTemplate,
      icon,
      isDisabled = false,
      requiresAuth = false,
      requiresOnboarding = false,
      requiresSubscription,
      sortOrder = 0,
      isActive = true,
    } = body;

    if (!page || !targetType || !state || !label) {
      return NextResponse.json(
        { error: "page, targetType, state, and label are required" },
        { status: 400 }
      );
    }

    const config = await prisma.cTAConfig.create({
      data: {
        page,
        targetType,
        state,
        label,
        style,
        urlTemplate,
        icon,
        isDisabled,
        requiresAuth,
        requiresOnboarding,
        requiresSubscription,
        sortOrder,
        isActive,
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating CTA config:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A CTA configuration for this page/targetType/state already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create CTA configuration" },
      { status: 500 }
    );
  }
}
