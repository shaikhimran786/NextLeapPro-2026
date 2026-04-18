import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { normalizeSlug, validateSlug } from "@/lib/community-slug";

export type SlugChangePlan =
  | { ok: true; action: "noop" }
  | {
      ok: true;
      action: "set" | "clear";
      newSlug: string | null;
      previousSlug: string | null;
    }
  | { ok: false; status: number; message: string };

interface PrepareSlugChangeOptions {
  /**
   * When true, an existing *alias* collision is treated as overridable:
   * the caller is expected to delete/repoint the conflicting alias inside
   * the same transaction. Live-owner collisions are NEVER bypassed —
   * stealing another community's live slug would silently break that
   * community's URLs, so the admin must reset the other community first.
   */
  allowOverride?: boolean;
}

/**
 * Validate and plan a slug change for a community.
 *
 *  - `undefined` input → `{ action: "noop" }` (caller passed no slug field).
 *  - `null` input → `{ action: "clear" }`, the community's slug becomes
 *    null and the previous slug is preserved so callers can write an alias.
 *  - empty-after-normalize input → `{ action: "noop" }` to avoid silently
 *    clearing the slug on accidental empty strings; admins should pass
 *    explicit `null` to reset.
 *  - unchanged slug → `{ action: "noop" }`.
 *  - 400 for shape / reserved violations.
 *  - 409 when the slug is taken by a different community (live or alias),
 *    unless `allowOverride` is set.
 */
export async function prepareSlugChange(
  communityId: number,
  currentSlug: string | null,
  rawNewSlug: unknown,
  options: PrepareSlugChangeOptions = {},
): Promise<SlugChangePlan> {
  if (rawNewSlug === undefined) {
    return { ok: true, action: "noop" };
  }
  if (rawNewSlug === null) {
    if (currentSlug === null) {
      return { ok: true, action: "noop" };
    }
    return {
      ok: true,
      action: "clear",
      newSlug: null,
      previousSlug: currentSlug,
    };
  }

  const normalized = normalizeSlug(String(rawNewSlug));
  if (!normalized) {
    return { ok: true, action: "noop" };
  }
  if (normalized === currentSlug) {
    return { ok: true, action: "noop" };
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
    // Always reject live-owner collisions; admin must reset that community
    // first. Admin overrides only apply to redirect-alias collisions.
    return {
      ok: false,
      status: 409,
      message:
        "Another community currently uses that URL. Reset that community's URL first, then try again.",
    };
  }
  if (alias && alias.communityId !== communityId && !options.allowOverride) {
    return { ok: false, status: 409, message: "That URL is already taken by a redirect alias." };
  }

  return {
    ok: true,
    action: "set",
    newSlug,
    previousSlug: currentSlug,
  };
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
