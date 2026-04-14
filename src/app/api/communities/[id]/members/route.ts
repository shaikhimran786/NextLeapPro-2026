import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, checkAdminAccess } from "@/lib/auth-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const communityId = parseInt(id);
    if (isNaN(communityId)) {
      return NextResponse.json({ error: "Invalid community ID" }, { status: 400 });
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { isPublic: true },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const userId = await getCurrentUserId();
    const isAdmin = await checkAdminAccess();

    if (!community.isPublic && !isAdmin) {
      if (!userId) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      const membership = await prisma.communityMember.findFirst({
        where: { communityId, userId },
      });
      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const members = await prisma.communityMember.findMany({
      where: { communityId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { joinedAt: "asc" },
      ],
    });

    const sanitized = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      user: {
        id: m.user.id,
        name: `${m.user.firstName} ${m.user.lastName}`.trim(),
        avatar: m.user.avatar,
        ...(isAdmin ? { email: m.user.email } : {}),
      },
    }));

    return NextResponse.json(sanitized);
  } catch (error: unknown) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;
    const communityId = parseInt(id);
    if (isNaN(communityId)) {
      return NextResponse.json({ error: "Invalid community ID" }, { status: 400 });
    }

    const requester = await prisma.communityMember.findFirst({
      where: { communityId, userId },
    });

    const isAdmin = await checkAdminAccess();

    if (!isAdmin && (!requester || !["owner", "admin"].includes(requester.role))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, action, role } = body;

    if (!memberId || !action) {
      return NextResponse.json({ error: "memberId and action are required" }, { status: 400 });
    }

    const member = await prisma.communityMember.findFirst({
      where: { id: parseInt(memberId), communityId },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.role === "owner") {
      return NextResponse.json({ error: "Cannot modify the community owner" }, { status: 403 });
    }

    if (action === "remove") {
      await prisma.communityMember.delete({ where: { id: member.id } });
      return NextResponse.json({ success: true, message: "Member removed" });
    }

    if (action === "approve") {
      if (member.role !== "pending") {
        return NextResponse.json({ error: "Member is not pending" }, { status: 400 });
      }
      const updated = await prisma.communityMember.update({
        where: { id: member.id },
        data: { role: "member" },
      });
      return NextResponse.json(updated);
    }

    if (action === "reject") {
      if (member.role !== "pending") {
        return NextResponse.json({ error: "Member is not pending" }, { status: 400 });
      }
      await prisma.communityMember.delete({ where: { id: member.id } });
      return NextResponse.json({ success: true, message: "Request rejected" });
    }

    if (action === "update_role") {
      const validRoles = ["member", "moderator", "admin"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      if (role === "admin" && requester?.role !== "owner" && !isAdmin) {
        return NextResponse.json({ error: "Only the owner can promote to admin" }, { status: 403 });
      }
      const updated = await prisma.communityMember.update({
        where: { id: member.id },
        data: { role },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Error managing member:", error);
    return NextResponse.json({ error: "Failed to manage member" }, { status: 500 });
  }
}
