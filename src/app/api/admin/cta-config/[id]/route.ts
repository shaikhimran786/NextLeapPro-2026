import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const configId = parseInt(id);

    const config = await prisma.cTAConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      return NextResponse.json({ error: "CTA config not found" }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching CTA config:", error);
    return NextResponse.json(
      { error: "Failed to fetch CTA configuration" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const configId = parseInt(id);
    const body = await request.json();

    const existing = await prisma.cTAConfig.findUnique({
      where: { id: configId },
    });

    if (!existing) {
      return NextResponse.json({ error: "CTA config not found" }, { status: 404 });
    }

    const config = await prisma.cTAConfig.update({
      where: { id: configId },
      data: {
        label: body.label ?? existing.label,
        style: body.style ?? existing.style,
        urlTemplate: body.urlTemplate ?? existing.urlTemplate,
        icon: body.icon ?? existing.icon,
        isDisabled: body.isDisabled ?? existing.isDisabled,
        requiresAuth: body.requiresAuth ?? existing.requiresAuth,
        requiresOnboarding: body.requiresOnboarding ?? existing.requiresOnboarding,
        requiresSubscription: body.requiresSubscription ?? existing.requiresSubscription,
        sortOrder: body.sortOrder ?? existing.sortOrder,
        isActive: body.isActive ?? existing.isActive,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error updating CTA config:", error);
    return NextResponse.json(
      { error: "Failed to update CTA configuration" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const configId = parseInt(id);

    await prisma.cTAConfig.delete({
      where: { id: configId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting CTA config:", error);
    return NextResponse.json(
      { error: "Failed to delete CTA configuration" },
      { status: 500 }
    );
  }
}
