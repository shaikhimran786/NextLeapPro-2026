import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionCookie.value },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await (prisma.user.update as any)({
      where: { id: session.userId },
      data: { hasSeenFeatureDemo: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error dismissing demo:", error);
    return NextResponse.json(
      { error: "Failed to dismiss demo" },
      { status: 500 }
    );
  }
}
