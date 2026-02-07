import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const community = await prisma.community.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          include: { user: true }
        },
        chapters: true,
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
    const { isAdmin, userId: adminId } = await checkAdminAccess();
    if (!isAdmin || !adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await request.json();

    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.mode !== undefined) updateData.mode = data.mode;
    if (data.membershipType !== undefined) updateData.membershipType = data.membershipType;
    if (data.meetupFrequency !== undefined) updateData.meetupFrequency = data.meetupFrequency;
    if (data.maxMembers !== undefined) updateData.maxMembers = data.maxMembers;
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.verified !== undefined) updateData.verified = data.verified;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.creatorId !== undefined) updateData.creatorId = data.creatorId;

    const community = await prisma.community.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "update_community",
        target: `Community #${id}: ${community.name}`,
        details: { changes: data },
      },
    });

    return NextResponse.json(community);
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
    const { isAdmin, userId: adminId } = await checkAdminAccess();
    if (!isAdmin || !adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const community = await prisma.community.findUnique({
      where: { id: parseInt(id) },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    await prisma.community.delete({
      where: { id: parseInt(id) },
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "delete_community",
        target: `Community #${id}: ${community.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting community:", error);
    return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
  }
}
