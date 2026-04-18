import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const communityId = parseInt(id, 10);
    if (!Number.isFinite(communityId)) {
      return NextResponse.json({ error: "Invalid community id" }, { status: 400 });
    }

    const entries = await prisma.communityAuditLog.findMany({
      where: { communityId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching community audit log:", error);
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
  }
}
