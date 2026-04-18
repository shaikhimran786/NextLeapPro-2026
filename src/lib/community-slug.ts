/**
 * Shared community slug utilities.
 *
 * Single source of truth for:
 *  - reserved keywords that must never become a community slug
 *  - format validation (length, charset, shape)
 *  - normalization (trim + lowercase, collapse separators)
 *  - canonical URL building from a community-shaped object
 *
 * Used by API endpoints, server actions, route resolvers and link-rendering
 * components so that slug rules stay consistent across the codebase.
 */

export const RESERVED_COMMUNITY_SLUGS: ReadonlySet<string> = new Set([
  "admin",
  "login",
  "signup",
  "logout",
  "auth",
  "api",
  "communities",
  "community",
  "events",
  "event",
  "create",
  "new",
  "settings",
  "chapters",
  "members",
  "join",
  "leave",
  "invite",
  "search",
  "explore",
  "edit",
  "delete",
  "manage",
  "dashboard",
  "u",
  "user",
  "users",
  "me",
  "static",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export type SlugValidationError =
  | "empty"
  | "too_short"
  | "too_long"
  | "invalid_chars"
  | "leading_or_trailing_hyphen"
  | "numeric_only"
  | "reserved";

export type SlugValidationResult =
  | { ok: true; slug: string }
  | { ok: false; reason: SlugValidationError; message: string };

const MIN_LEN = 3;
const MAX_LEN = 50;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Normalize a candidate slug: trim, lowercase, collapse runs of non-alphanum
 * into a single hyphen, strip leading/trailing hyphens. Does NOT validate.
 */
export function normalizeSlug(input: string): string {
  return String(input ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Validate a slug. Pass `{ assumeNormalized: true }` if the caller has already
 * normalized; otherwise normalization is applied before validating.
 */
export function validateSlug(
  input: string,
  options: { assumeNormalized?: boolean } = {},
): SlugValidationResult {
  const slug = options.assumeNormalized ? String(input ?? "") : normalizeSlug(input);

  if (!slug) {
    return { ok: false, reason: "empty", message: "Slug is required." };
  }
  if (slug.length < MIN_LEN) {
    return { ok: false, reason: "too_short", message: `Slug must be at least ${MIN_LEN} characters.` };
  }
  if (slug.length > MAX_LEN) {
    return { ok: false, reason: "too_long", message: `Slug must be ${MAX_LEN} characters or fewer.` };
  }
  if (!SLUG_RE.test(slug)) {
    if (slug.startsWith("-") || slug.endsWith("-")) {
      return {
        ok: false,
        reason: "leading_or_trailing_hyphen",
        message: "Slug cannot start or end with a hyphen.",
      };
    }
    return {
      ok: false,
      reason: "invalid_chars",
      message: "Slug can only contain lowercase letters, numbers, and hyphens.",
    };
  }
  if (/^\d+$/.test(slug)) {
    // Numeric-only slugs would collide with the numeric-id route resolver.
    return { ok: false, reason: "numeric_only", message: "Slug cannot be all digits." };
  }
  if (RESERVED_COMMUNITY_SLUGS.has(slug)) {
    return { ok: false, reason: "reserved", message: `"${slug}" is reserved and cannot be used.` };
  }
  return { ok: true, slug };
}

/**
 * Returns true when the given path segment looks like a numeric community id
 * rather than a slug. Used by the route resolver to short-circuit the
 * common case without an alias-table lookup.
 */
export function isNumericCommunityId(segment: string): boolean {
  return /^\d+$/.test(segment);
}

interface CommunityUrlInput {
  id: number;
  slug?: string | null;
}

/**
 * Build the canonical /communities/<x> URL for a community. Prefers the slug
 * when present; falls back to the numeric id otherwise.
 */
export function buildCommunityUrl(community: CommunityUrlInput): string {
  const slug = community.slug?.trim();
  if (slug) {
    return `/communities/${slug}`;
  }
  return `/communities/${community.id}`;
}
