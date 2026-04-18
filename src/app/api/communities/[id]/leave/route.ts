import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const communityId = parseInt(id);
    if (Number.isNaN(communityId)) {
      return NextResponse.json({ error: "Invalid community id" }, { status: 400 });
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const membership = await prisma.communityMember.findFirst({
      where: { communityId, userId },
      include: { community: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this community" },
        { status: 400 }
      );
    }

    if (membership.role === "owner") {
      return NextResponse.json(
        { error: "Cannot leave as the community owner. Transfer ownership first." },
        { status: 400 }
      );
    }

    if (membership.role === "admin") {
      const adminCount = await prisma.communityMember.count({
        where: { communityId, role: { in: ["admin", "owner"] } },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot leave community as the only admin. Transfer ownership first." },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.communityMember.delete({ where: { id: membership.id } });
      await tx.adminAuditLog.create({
        data: {
          userId,
          action: "community_leave",
          target: `Community #${communityId}`,
          details: { previousRole: membership.role },
        },
      });
    });

    revalidatePath(`/communities/${communityId}`);
    revalidatePath("/communities");

    return NextResponse.json({
      success: true,
      message: `Successfully left ${membership.community.name}`,
    });
  } catch (error) {
    console.error("Leave community error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
