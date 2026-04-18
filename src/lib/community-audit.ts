import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Fields whose changes are persisted to CommunityAuditLog. Anything not in
 * this list is treated as cosmetic and not logged. Keep this list in sync
 * with the admin/owner edit forms.
 */
export const AUDITED_COMMUNITY_FIELDS = [
  "slug",
  "isPublic",
  "featured",
  "verified",
  "name",
  "shortDescription",
  "description",
  "logo",
  "coverImage",
  "profileImage",
  "primaryColor",
  "category",
  "creatorId",
  "website",
  "socialLinks",
  "tags",
  "location",
  "city",
  "country",
  "timezone",
  "language",
  "mode",
  "membershipType",
  "maxMembers",
  "meetupFrequency",
] as const;

export type AuditedField = (typeof AUDITED_COMMUNITY_FIELDS)[number];

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

function stringifyAuditValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

interface FieldChange {
  field: AuditedField;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Compute the set of audited field changes between `before` and `after`.
 * Returns only fields present in `after` whose value actually changed.
 */
export function diffCommunityFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of AUDITED_COMMUNITY_FIELDS) {
    if (!(field in after)) continue;
    const oldValue = before[field] ?? null;
    const newValue = after[field] ?? null;
    if (stringifyAuditValue(oldValue) !== stringifyAuditValue(newValue)) {
      changes.push({ field, oldValue, newValue });
    }
  }
  return changes;
}

interface CommunitySnapshot {
  name: string;
  slug: string | null;
}

/**
 * Write a per-field audit row inside the active transaction. Callers MUST
 * pass the `tx` from `prisma.$transaction` so the audit insert and the
 * underlying mutation succeed or fail together. Snapshot of the community
 * name/slug is denormalized so the row stays meaningful after the FK is
 * nulled by community deletion.
 */
export async function writeCommunityFieldAudits(
  tx: Prisma.TransactionClient,
  params: {
    communityId: number;
    snapshot: CommunitySnapshot;
    actorUserId: number;
    changes: FieldChange[];
  },
): Promise<void> {
  if (params.changes.length === 0) return;
  await tx.communityAuditLog.createMany({
    data: params.changes.map((c) => ({
      communityId: params.communityId,
      communityName: params.snapshot.name,
      communitySlug: params.snapshot.slug,
      actorUserId: params.actorUserId,
      action: "update",
      field: c.field,
      oldValue: stringifyAuditValue(c.oldValue),
      newValue: stringifyAuditValue(c.newValue),
    })),
  });
}

/**
 * Write a single non-field action (create / delete / reset_url /
 * override_slug) inside the active transaction. The community FK is set
 * null on cascade delete, so the row carries a name/slug snapshot.
 */
export async function writeCommunityActionAudit(
  tx: Prisma.TransactionClient,
  params: {
    communityId: number;
    snapshot: CommunitySnapshot;
    actorUserId: number;
    action: "create" | "delete" | "reset_url" | "override_slug";
    note?: string | null;
  },
): Promise<void> {
  await tx.communityAuditLog.create({
    data: {
      communityId: params.communityId,
      communityName: params.snapshot.name,
      communitySlug: params.snapshot.slug,
      actorUserId: params.actorUserId,
      action: params.action,
      field: null,
      oldValue: null,
      newValue: params.note ?? null,
    },
  });
}

// Re-exported to silence "unused" warnings for the local TxClient alias.
export type { TxClient };
