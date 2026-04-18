import prisma from "@/lib/prisma";
import { isNumericCommunityId } from "@/lib/community-slug";

export type CommunityResolution =
  | { kind: "found"; communityId: number }
  | { kind: "redirect"; communityId: number; canonicalSlug: string | null }
  | { kind: "not_found" };

/**
 * Resolve a /communities/<segment> route param to a community.
 *
 *  - Numeric segments are resolved by primary key in a single query and
 *    NEVER touch the alias table (the common case must stay cheap).
 *  - Non-numeric segments are first looked up against the live `slug`
 *    column. On miss, the alias table is consulted; an alias hit returns
 *    `{ kind: "redirect" }` carrying the current canonical slug so callers
 *    can issue a 308 redirect.
 */
export async function resolveCommunitySegment(
  rawSegment: string,
): Promise<CommunityResolution> {
  if (!rawSegment) return { kind: "not_found" };

  if (isNumericCommunityId(rawSegment)) {
    const id = parseInt(rawSegment);
    if (Number.isNaN(id)) return { kind: "not_found" };
    const community = await prisma.community.findUnique({
      where: { id },
      select: { id: true },
    });
    return community
      ? { kind: "found", communityId: community.id }
      : { kind: "not_found" };
  }

  // Use a verbatim (lower-cased) lookup against the slug column. We do not
  // run the full normalizer here — historical slugs may contain characters
  // that today's validator rejects, and we still want those URLs to resolve.
  const lookup = decodeURIComponent(rawSegment).toLowerCase();
  if (!lookup) return { kind: "not_found" };

  const live = await prisma.community.findUnique({
    where: { slug: lookup },
    select: { id: true },
  });
  if (live) {
    return { kind: "found", communityId: live.id };
  }

  const alias = await prisma.communitySlugAlias.findUnique({
    where: { oldSlug: lookup },
    select: { community: { select: { id: true, slug: true } } },
  });
  if (alias?.community) {
    return {
      kind: "redirect",
      communityId: alias.community.id,
      canonicalSlug: alias.community.slug,
    };
  }

  return { kind: "not_found" };
}
