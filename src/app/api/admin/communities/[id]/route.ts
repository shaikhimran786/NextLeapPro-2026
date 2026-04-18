import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";
import { prepareSlugChange, revalidateCommunityPaths } from "@/lib/community-slug-write";

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
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage || null;

    const communityId = parseInt(id);
    const existing = await prisma.community.findUnique({ where: { id: communityId } });
    if (!existing) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    let previousSlugForAlias: string | null = null;
    if (data.slug !== undefined) {
      const slugChange = await prepareSlugChange(communityId, existing.slug, data.slug);
      if (!slugChange.ok) {
        return NextResponse.json({ error: slugChange.message }, { status: slugChange.status });
      }
      if (slugChange.newSlug) {
        updateData.slug = slugChange.newSlug;
        previousSlugForAlias = slugChange.previousSlug;
      }
    }

    const community = await prisma.$transaction(async (tx) => {
      const updated = await tx.community.update({
        where: { id: communityId },
        data: updateData,
      });
      if (previousSlugForAlias) {
        await tx.communitySlugAlias.upsert({
          where: { oldSlug: previousSlugForAlias },
          create: { oldSlug: previousSlugForAlias, communityId },
          update: { communityId },
        });
        await tx.communitySlugAlias.deleteMany({ where: { oldSlug: updated.slug } });
      }
      await tx.adminAuditLog.create({
        data: {
          userId: adminId,
          action: "update_community",
          target: `Community #${communityId}: ${updated.name}`,
          details: { changes: data },
        },
      });
      return updated;
    });

    revalidateCommunityPaths(community.id, community.slug, existing.slug);

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

    revalidateCommunityPaths(community.id, community.slug, null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting community:", error);
    return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
  }
}
