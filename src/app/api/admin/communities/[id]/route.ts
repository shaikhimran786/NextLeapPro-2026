import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";
import { prepareSlugChange, revalidateCommunityPaths } from "@/lib/community-slug-write";
import {
  diffCommunityFields,
  writeCommunityFieldAudits,
  writeCommunityActionAudit,
} from "@/lib/community-audit";

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

    // Admin override: when `forceSlug` is true, slug-collision (live or
    // alias) is bypassed and a separate audit row records the override.
    const forceSlug = data.forceSlug === true;
    let previousSlugForAlias: string | null = null;
    let slugWasReset = false;
    let slugWasOverridden = false;
    if (data.slug !== undefined) {
      const slugChange = await prepareSlugChange(
        communityId,
        existing.slug,
        data.slug,
        { allowOverride: forceSlug },
      );
      if (!slugChange.ok) {
        return NextResponse.json({ error: slugChange.message }, { status: slugChange.status });
      }
      if (slugChange.action === "set" || slugChange.action === "clear") {
        updateData.slug = slugChange.newSlug;
        previousSlugForAlias = slugChange.previousSlug;
        slugWasReset = slugChange.action === "clear";
        slugWasOverridden = forceSlug && slugChange.action === "set";
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
        if (updated.slug) {
          await tx.communitySlugAlias.deleteMany({ where: { oldSlug: updated.slug } });
        }
      }
      // Per-field audit (slug, isPublic, featured/verified, branding, etc.)
      const changes = diffCommunityFields(
        existing as unknown as Record<string, unknown>,
        updateData,
      );
      const snapshot = { name: updated.name, slug: updated.slug };
      await writeCommunityFieldAudits(tx, {
        communityId,
        snapshot,
        actorUserId: adminId,
        changes,
      });
      if (slugWasReset) {
        await writeCommunityActionAudit(tx, {
          communityId,
          snapshot,
          actorUserId: adminId,
          action: "reset_url",
          note: previousSlugForAlias,
        });
      }
      if (slugWasOverridden) {
        // Repoint or remove the stale alias inside this transaction so the
        // unique constraint stays consistent with the new live slug.
        if (typeof updateData.slug === "string") {
          await tx.communitySlugAlias.deleteMany({ where: { oldSlug: updateData.slug } });
        }
        await writeCommunityActionAudit(tx, {
          communityId,
          snapshot,
          actorUserId: adminId,
          action: "override_slug",
          note: typeof updateData.slug === "string" ? updateData.slug : null,
        });
      }
      // Keep the legacy global admin audit row so existing reporting still
      // captures admin community edits.
      await tx.adminAuditLog.create({
        data: {
          userId: adminId,
          action: "update_community",
          target: `Community #${communityId}: ${updated.name}`,
          details: { changes: data, forceSlug },
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

    // Audit must be written BEFORE the delete (otherwise the FK to the
    // community row would be dangling). Both sit inside the same
    // transaction so a delete failure rolls the audit row back too.
    await prisma.$transaction(async (tx) => {
      await writeCommunityActionAudit(tx, {
        communityId: community.id,
        snapshot: { name: community.name, slug: community.slug },
        actorUserId: adminId,
        action: "delete",
        note: `${community.name} (slug=${community.slug ?? "—"})`,
      });
      await tx.community.delete({ where: { id: community.id } });
      await tx.adminAuditLog.create({
        data: {
          userId: adminId,
          action: "delete_community",
          target: `Community #${id}: ${community.name}`,
        },
      });
    });

    revalidateCommunityPaths(community.id, community.slug, null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting community:", error);
    return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
  }
}
