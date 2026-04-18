import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSlug, normalizeSlug } from "@/lib/community-slug";

export const dynamic = "force-dynamic";

/**
 * Public availability check for a candidate community slug.
 *
 *   GET /api/communities/check-slug?slug=foo&excludeCommunityId=42
 *
 * Returns `{ available, reason?, message?, normalized }`. A slug is considered
 * unavailable if it fails validation, is currently used by a different
 * community, or is registered as an alias pointing at a different community.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("slug") ?? "";
  const excludeRaw = searchParams.get("excludeCommunityId");
  const excludeCommunityId = excludeRaw ? parseInt(excludeRaw) : null;

  const normalized = normalizeSlug(raw);
  const validation = validateSlug(normalized, { assumeNormalized: true });

  if (!validation.ok) {
    return NextResponse.json({
      available: false,
      reason: validation.reason,
      message: validation.message,
      normalized,
    });
  }

  const slug = validation.slug;

  const [liveOwner, alias] = await Promise.all([
    prisma.community.findUnique({ where: { slug }, select: { id: true } }),
    prisma.communitySlugAlias.findUnique({
      where: { oldSlug: slug },
      select: { communityId: true },
    }),
  ]);

  const liveOwnerId = liveOwner?.id ?? null;
  const aliasOwnerId = alias?.communityId ?? null;

  // The slug is "ours" only when both pointers (if present) belong to the
  // excluded community. Otherwise some other community owns it.
  const ownedByExcluded =
    excludeCommunityId !== null &&
    (liveOwnerId === null || liveOwnerId === excludeCommunityId) &&
    (aliasOwnerId === null || aliasOwnerId === excludeCommunityId);

  if ((liveOwnerId !== null || aliasOwnerId !== null) && !ownedByExcluded) {
    return NextResponse.json({
      available: false,
      reason: "taken",
      message: "That URL is already taken.",
      normalized: slug,
    });
  }

  return NextResponse.json({ available: true, normalized: slug });
}
