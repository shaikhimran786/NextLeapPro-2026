import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const communityId = parseInt(id);
    const body = await request.json();
    const { userId, email, firstName, lastName } = body;

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    let user;

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      });
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    } else if (email && firstName && lastName) {
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            passwordHash: null,
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: "Either userId or (email, firstName, lastName) is required" },
        { status: 400 }
      );
    }

    const existingMembership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: user.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Already a member of this community" },
        { status: 400 }
      );
    }

    const memberRole = community.isPublic ? "member" : "pending";

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
        action: community.isPublic ? "community_join" : "community_join_request",
        target: `Community #${communityId}: ${community.name}`,
        details: {
          membershipId: membership.id,
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          status: memberRole,
        },
      },
    });

    return NextResponse.json({
      success: true,
      membership: {
        id: membership.id,
        communityName: membership.community.name,
        role: membership.role,
        isPending: !community.isPublic,
      },
      message: community.isPublic 
        ? `Successfully joined ${community.name}` 
        : `Join request submitted for ${community.name}`,
    });
  } catch (error) {
    console.error("Join community error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
