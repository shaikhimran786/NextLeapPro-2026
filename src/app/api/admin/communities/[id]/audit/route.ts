import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
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

    // Inline view caps at 50; the dedicated audit page passes ?all=1 to
    // request the full history (capped at 1000 to bound payload size).
    const all = request.nextUrl.searchParams.get("all") === "1";
    const PAGE_SIZE = all ? 1000 : 50;
    const [entries, total] = await Promise.all([
      prisma.communityAuditLog.findMany({
        where: { communityId },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.communityAuditLog.count({ where: { communityId } }),
    ]);

    return NextResponse.json({ entries, total, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error("Error fetching community audit log:", error);
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
  }
}
