import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get("since");
    
    const since = sinceParam 
      ? new Date(parseInt(sinceParam)) 
      : new Date(Date.now() - 60000);

    const notifications = await prisma.broadcastNotification.findMany({
      where: {
        createdAt: { gt: since },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    await prisma.broadcastNotification.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
      },
    });

    return NextResponse.json({
      notifications,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Broadcast notifications fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
