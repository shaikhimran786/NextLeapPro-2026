import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkCommunityAccess, checkAdminAccess, getCurrentUserId } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const community = await prisma.community.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
        },
        chapters: true,
        creator: {
          select: { id: true, firstName: true, lastName: true }
        },
        _count: { select: { members: true } }
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (!community.isPublic) {
      const { isAdmin } = await checkAdminAccess();
      if (!isAdmin) {
        const userId = await getCurrentUserId();
        if (!userId) {
          return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }
        const membership = await prisma.communityMember.findFirst({
          where: { communityId: community.id, userId },
        });
        const allowedRoles = new Set(["owner", "admin", "moderator", "member"]);
        if (!membership || !allowedRoles.has(membership.role)) {
          return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }
      }
    }

    return NextResponse.json(community);
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const communityId = parseInt(id);
    
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const { canManage, userId } = await checkCommunityAccess(communityId);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManage) {
      return NextResponse.json(
        { error: "You must be a community owner or admin to edit this community" },
        { status: 403 }
      );
    }

    const data = await request.json();

    if (data.name && String(data.name).trim().length > 100) {
      return NextResponse.json({ error: "Community name must be 100 characters or less" }, { status: 400 });
    }
    if (data.description && String(data.description).trim().length > 2000) {
      return NextResponse.json({ error: "Description must be 2000 characters or less" }, { status: 400 });
    }

    const validModes = ["online", "hybrid", "in_person"];
    const validMembershipTypes = ["open", "approval", "invite"];

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = String(data.name).trim();
    if (data.description !== undefined) updateData.description = String(data.description).trim();
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription ? String(data.shortDescription).trim().slice(0, 200) : null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.website !== undefined) updateData.website = data.website || null;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.mode !== undefined && validModes.includes(data.mode)) updateData.mode = data.mode;
    if (data.membershipType !== undefined && validMembershipTypes.includes(data.membershipType)) updateData.membershipType = data.membershipType;
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor || null;
    if (data.maxMembers !== undefined) updateData.maxMembers = data.maxMembers ? parseInt(data.maxMembers) : null;
    if (data.meetupFrequency !== undefined) updateData.meetupFrequency = data.meetupFrequency || null;

    const updatedCommunity = await prisma.community.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(updatedCommunity);
  } catch (error) {
    console.error("Error updating community:", error);
    return NextResponse.json({ error: "Failed to update community" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const communityId = parseInt(id);
    
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const { canManage, role, userId } = await checkCommunityAccess(communityId);
    const { isAdmin } = await checkAdminAccess();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = role === "owner";
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Only community owners and platform admins can delete communities" },
        { status: 403 }
      );
    }

    await prisma.community.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: "Community deleted successfully" });
  } catch (error) {
    console.error("Error deleting community:", error);
    return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
  }
}
