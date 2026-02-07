import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const { enabled } = await request.json();
    const id = parseInt(idParam);

    const feature = await prisma.featureToggle.update({
      where: { id },
      data: { enabled },
    });

    return NextResponse.json(feature);
  } catch (error) {
    console.error("Error updating feature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
