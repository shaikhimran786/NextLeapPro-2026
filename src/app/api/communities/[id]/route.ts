import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkCommunityAccess, checkAdminAccess } from "@/lib/auth-utils";

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
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        _count: { select: { members: true } }
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
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

    const updatedCommunity = await prisma.community.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        location: data.location,
        logo: data.logo,
        coverImage: data.coverImage,
        tags: data.tags,
        website: data.website,
        socialLinks: data.socialLinks,
        isPublic: data.isPublic,
      },
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
