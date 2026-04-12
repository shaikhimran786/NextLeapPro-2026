import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? error.message : undefined;
  const code = "errorCode" in error ? error.errorCode : undefined;
  const name = "name" in error ? error.name : undefined;

  return (
    code === "P1001" ||
    name === "PrismaClientInitializationError" ||
    (typeof message === "string" && message.includes("Can't reach database server"))
  );
}

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
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({
        notifications: [],
        timestamp: Date.now(),
      });
    }

    console.error("Broadcast notifications fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
