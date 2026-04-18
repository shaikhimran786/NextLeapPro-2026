import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { normalizeSlug, validateSlug } from "@/lib/community-slug";

export type SlugChangePlan =
  | { ok: true; newSlug: string | null; previousSlug: string | null }
  | { ok: false; status: number; message: string };

/**
 * Validate and plan a slug change for a community.
 *
 *  - Returns `{ newSlug: null }` when the requested slug is unchanged or empty
 *    after normalization (no-op).
 *  - Returns 400 for shape / reserved violations.
 *  - Returns 409 when the slug is taken by a different community (live or alias).
 *  - On success, returns the normalized new slug and the previous slug to alias.
 */
export async function prepareSlugChange(
  communityId: number,
  currentSlug: string,
  rawNewSlug: unknown,
): Promise<SlugChangePlan> {
  if (rawNewSlug === null || rawNewSlug === undefined) {
    return { ok: true, newSlug: null, previousSlug: null };
  }

  const normalized = normalizeSlug(String(rawNewSlug));
  if (!normalized || normalized === currentSlug) {
    return { ok: true, newSlug: null, previousSlug: null };
  }

  const validation = validateSlug(normalized, { assumeNormalized: true });
  if (!validation.ok) {
    return { ok: false, status: 400, message: validation.message };
  }

  const newSlug = validation.slug;

  const [liveOwner, alias] = await Promise.all([
    prisma.community.findUnique({ where: { slug: newSlug }, select: { id: true } }),
    prisma.communitySlugAlias.findUnique({
      where: { oldSlug: newSlug },
      select: { communityId: true },
    }),
  ]);

  if (liveOwner && liveOwner.id !== communityId) {
    return { ok: false, status: 409, message: "That URL is already taken." };
  }
  if (alias && alias.communityId !== communityId) {
    return { ok: false, status: 409, message: "That URL is already taken." };
  }

  return { ok: true, newSlug, previousSlug: currentSlug };
}

/**
 * Revalidate every cached path that may render a community whose slug just
 * changed: the numeric route, the new canonical slug route, the previous slug
 * route, and the listing page.
 */
export function revalidateCommunityPaths(
  communityId: number,
  currentSlug: string | null,
  previousSlug: string | null,
): void {
  revalidatePath(`/communities/${communityId}`);
  if (currentSlug) revalidatePath(`/communities/${currentSlug}`);
  if (previousSlug && previousSlug !== currentSlug) {
    revalidatePath(`/communities/${previousSlug}`);
  }
  revalidatePath("/communities");
}
