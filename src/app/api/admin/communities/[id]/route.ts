import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";
import { prepareSlugChange, revalidateCommunityPaths } from "@/lib/community-slug-write";
import {
  diffCommunityFields,
  writeCommunityFieldAudits,
  writeCommunityActionAudit,
} from "@/lib/community-audit";
import { buildCommunityUpdateData } from "@/lib/community-update";

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

    // Shared owner-side validation (length, enum normalization, null
    // coercion). Admin-only fields (featured/verified/creatorId) are
    // layered on top below.
    const validation = buildCommunityUpdateData(data);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message }, { status: validation.status });
    }
    const updateData = validation.updateData;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.verified !== undefined) updateData.verified = data.verified;
    if (data.creatorId !== undefined) updateData.creatorId = data.creatorId;

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
      // True admin override: if forceSlug and a *different* community
      // currently owns the new slug, move its slug into the alias table
      // and null its slug so the unique constraint frees up.
      if (slugWasOverridden && typeof updateData.slug === "string") {
        const newSlugStr = updateData.slug;
        const conflictingOwner = await tx.community.findUnique({
          where: { slug: newSlugStr },
          select: { id: true, name: true, slug: true },
        });
        if (conflictingOwner && conflictingOwner.id !== communityId) {
          await tx.community.update({
            where: { id: conflictingOwner.id },
            data: { slug: null },
          });
          await tx.communitySlugAlias.upsert({
            where: { oldSlug: newSlugStr },
            create: { oldSlug: newSlugStr, communityId: conflictingOwner.id },
            update: { communityId: conflictingOwner.id },
          });
          await writeCommunityActionAudit(tx, {
            communityId: conflictingOwner.id,
            snapshot: {
              name: conflictingOwner.name,
              slug: conflictingOwner.slug,
            },
            actorUserId: adminId,
            action: "reset_url",
            note: `Reset by admin override (URL transferred to community #${communityId})`,
          });
        }
      }
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
        // The conflicting alias / live owner has already been migrated
        // above; remove any stale alias that would now collide with the
        // newly-claimed live slug, and record the override.
        if (typeof updateData.slug === "string") {
          await tx.communitySlugAlias.deleteMany({
            where: { oldSlug: updateData.slug, communityId: { not: communityId } },
          });
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
