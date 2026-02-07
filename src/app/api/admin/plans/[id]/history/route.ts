import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const planId = parseInt(id);

    const history = await prisma.subscriptionPriceHistory.findMany({
      where: { planId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      history: history.map((entry) => ({
        ...entry,
        oldPrice: Number(entry.oldPrice),
        newPrice: Number(entry.newPrice),
      })),
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 }
    );
  }
}
