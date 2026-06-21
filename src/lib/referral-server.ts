/**
 * Server-only helpers for the Referral Hires + Talent Pool feature:
 * - registered-user prefill resolution (no duplicate data entry)
 * - CV persistence with best-effort private ACL
 * - activity logging
 * - a lightweight in-memory spam/rate guard
 *
 * Do not import this from client components.
 */
import prisma from "@/lib/prisma";
import { objectStorageService } from "@/lib/object-storage";
import { getCurrentUserId } from "@/lib/auth-utils";

export interface ApplicantPrefill {
  userId: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  whatsappNumber: string;
  linkedinUrl: string;
  existingCv: { id: number; fileName: string; uploadedAt: string } | null;
}

/** Pull a LinkedIn URL out of the User.socialLinks JSON in a tolerant way. */
export function extractLinkedIn(socialLinks: unknown): string {
  if (!socialLinks) return "";
  try {
    if (Array.isArray(socialLinks)) {
      const hit = socialLinks.find(
        (s) => typeof s === "string" && s.toLowerCase().includes("linkedin")
      );
      return typeof hit === "string" ? hit : "";
    }
    if (typeof socialLinks === "object") {
      const obj = socialLinks as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        if (key.toLowerCase().includes("linkedin") && typeof obj[key] === "string") {
          return obj[key] as string;
        }
      }
      // also scan values for a linkedin.com URL
      for (const val of Object.values(obj)) {
        if (typeof val === "string" && val.toLowerCase().includes("linkedin.com")) {
          return val;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * Resolve the current registered user's prefill data, or null for guests.
 * Used by the Apply and Talent Pool flows so logged-in users never re-enter
 * profile information.
 */
export async function getApplicantPrefill(): Promise<ApplicantPrefill | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      socialLinks: true,
    },
  });
  if (!user) return null;

  const latestCv = await prisma.uploadedCv.findFirst({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
    select: { id: true, fileName: true, uploadedAt: true },
  });

  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    whatsappNumber: user.phone ?? "",
    linkedinUrl: extractLinkedIn(user.socialLinks),
    existingCv: latestCv
      ? {
          id: latestCv.id,
          fileName: latestCv.fileName,
          uploadedAt: latestCv.uploadedAt.toISOString(),
        }
      : null,
  };
}

/** Persist a CV record from an uploaded object path, best-effort private ACL. */
export async function persistCv(args: {
  objectPath: string;
  fileName: string;
  fileType: string;
  userId?: number | null;
  guestProfileId?: number | null;
}): Promise<{ id: number } | null> {
  const { objectPath, fileName, fileType, userId, guestProfileId } = args;
  if (!objectPath) return null;

  // Best-effort: mark the object private so it isn't broadly accessible.
  // Runs only where object storage is configured; never blocks submission.
  try {
    await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
      owner: userId ? String(userId) : "guest",
      visibility: "private",
    });
  } catch {
    /* storage not configured in this env — ignore */
  }

  const cv = await prisma.uploadedCv.create({
    data: {
      fileUrl: objectPath,
      fileName,
      fileType,
      userId: userId ?? null,
      guestProfileId: guestProfileId ?? null,
    },
    select: { id: true },
  });
  return cv;
}

/** Append a row to the per-application activity log. */
export async function logReferralActivity(args: {
  applicationId: number;
  activityType: string;
  activityBy: string;
  notes?: string | null;
}): Promise<void> {
  try {
    await prisma.referralActivityLog.create({
      data: {
        applicationId: args.applicationId,
        activityType: args.activityType,
        activityBy: args.activityBy,
        notes: args.notes ?? null,
      },
    });
  } catch (e) {
    console.error("Failed to log referral activity:", e);
  }
}

// ---------------------------------------------------------------------------
// Lightweight in-memory spam guard (per-process). Good enough for MVP; swap for
// a shared store (Redis) if the app scales horizontally.
// ---------------------------------------------------------------------------
const RATE_BUCKET = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (RATE_BUCKET.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    RATE_BUCKET.set(key, hits);
    return false; // blocked
  }
  hits.push(now);
  RATE_BUCKET.set(key, hits);
  return true; // allowed
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
