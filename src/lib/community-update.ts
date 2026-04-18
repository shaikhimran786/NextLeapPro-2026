/**
 * Shared validation + normalization for community update payloads.
 * Used by both the owner PATCH (`/api/communities/[id]`) and the admin
 * PATCH (`/api/admin/communities/[id]`) so constraints (length limits,
 * enum normalization, null coercion) are identical across both surfaces.
 *
 * Slug, audit, and admin-only fields (featured/verified/creatorId/forceSlug)
 * are intentionally NOT handled here — callers layer those on top.
 */

const VALID_MODES = ["online", "hybrid", "in_person", "offline"] as const;
const VALID_MEMBERSHIP_TYPES = ["open", "approval", "invite"] as const;

export type CommunityUpdateValidation =
  | { ok: true; updateData: Record<string, unknown> }
  | { ok: false; status: number; message: string };

export function buildCommunityUpdateData(
  data: Record<string, unknown>,
): CommunityUpdateValidation {
  if (data.name !== undefined && String(data.name).trim().length > 100) {
    return { ok: false, status: 400, message: "Community name must be 100 characters or less" };
  }
  if (data.description !== undefined && String(data.description).trim().length > 2000) {
    return { ok: false, status: 400, message: "Description must be 2000 characters or less" };
  }
  if (
    data.mode !== undefined &&
    !VALID_MODES.includes(String(data.mode) as (typeof VALID_MODES)[number])
  ) {
    return { ok: false, status: 400, message: "Invalid mode" };
  }
  if (
    data.membershipType !== undefined &&
    !VALID_MEMBERSHIP_TYPES.includes(
      String(data.membershipType) as (typeof VALID_MEMBERSHIP_TYPES)[number],
    )
  ) {
    return { ok: false, status: 400, message: "Invalid membership type" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = String(data.name).trim();
  if (data.description !== undefined) updateData.description = String(data.description).trim();
  if (data.shortDescription !== undefined) {
    updateData.shortDescription = data.shortDescription
      ? String(data.shortDescription).trim().slice(0, 200)
      : null;
  }
  if (data.category !== undefined) updateData.category = data.category;
  if (data.location !== undefined) updateData.location = data.location || null;
  if (data.city !== undefined) updateData.city = data.city || null;
  if (data.country !== undefined) updateData.country = data.country || null;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.logo !== undefined) updateData.logo = data.logo;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null;
  if (data.profileImage !== undefined) updateData.profileImage = data.profileImage || null;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.website !== undefined) updateData.website = data.website || null;
  if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
  if (data.mode !== undefined) updateData.mode = data.mode;
  if (data.membershipType !== undefined) updateData.membershipType = data.membershipType;
  if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor || null;
  if (data.maxMembers !== undefined) {
    updateData.maxMembers = data.maxMembers
      ? parseInt(String(data.maxMembers), 10)
      : null;
  }
  if (data.meetupFrequency !== undefined) {
    updateData.meetupFrequency = data.meetupFrequency || null;
  }

  return { ok: true, updateData };
}
