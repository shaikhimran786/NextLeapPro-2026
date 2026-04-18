import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function resolveJoinRole(membershipType: string, isPublic: boolean): "member" | "pending" | "invite_only" {
  if (membershipType === "invite") return "invite_only";
  if (membershipType === "approval") return "pending";
  if (membershipType === "open") return "member";
  return isPublic ? "member" : "pending";
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const communityId = parseInt(id);
    if (Number.isNaN(communityId)) {
      return NextResponse.json({ error: "Invalid community id" }, { status: 400 });
    }

    const sessionUserId = await getCurrentUserId();
    const body = await request.json().catch(() => ({}));
    const { email, firstName, lastName } = body || {};

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    let user;

    if (sessionUserId) {
      user = await prisma.user.findUnique({ where: { id: sessionUserId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } else if (email && firstName && lastName) {
      user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: String(email).toLowerCase().trim(),
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            passwordHash: null,
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: "You must be logged in or provide email, firstName, and lastName." },
        { status: 401 }
      );
    }

    const existingMembership = await prisma.communityMember.findFirst({
      where: { communityId, userId: user.id },
    });

    if (existingMembership) {
      if (existingMembership.role === "invited") {
        return NextResponse.json(
          { error: "You have a pending invite — accept it instead of joining." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Already a member of this community" },
        { status: 400 }
      );
    }

    const resolved = resolveJoinRole(community.membershipType, community.isPublic);
    if (resolved === "invite_only") {
      return NextResponse.json(
        { error: "This community is invite-only. Please wait for an invitation." },
        { status: 403 }
      );
    }

    const memberRole = resolved;
    const isPending = memberRole === "pending";

    const membership = await prisma.communityMember.create({
      data: {
        communityId,
        userId: user.id,
        role: memberRole,
      },
      include: {
        community: true,
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
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: user.id,
        action: isPending ? "community_join_request" : "community_join",
        target: `Community #${communityId}: ${community.name}`,
        details: {
          membershipId: membership.id,
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          status: memberRole,
        },
      },
    });

    revalidatePath(`/communities/${communityId}`);
    revalidatePath("/communities");

    return NextResponse.json({
      success: true,
      membership: {
        id: membership.id,
        communityName: membership.community.name,
        role: membership.role,
        isPending,
      },
      message: isPending
        ? `Join request submitted for ${community.name}`
        : `Successfully joined ${community.name}`,
    });
  } catch (error) {
    console.error("Join community error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
