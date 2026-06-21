import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";
import { logReferralActivity } from "@/lib/referral-server";
import {
  APPLICATION_STATUSES,
  TALENT_STATUSES,
  sanitizeText,
} from "@/lib/referral-hires";

export const dynamic = "force-dynamic";

const appStatusValues = APPLICATION_STATUSES.map((o) => o.value);
const talentStatusValues = TALENT_STATUSES.map((o) => o.value);

/**
 * PATCH /api/admin/referral-hires/applications/[id]
 * Body: { status?, talentStatus?, note? }
 * Used by Submitted CVs (Shortlist/Refer/Close), Referral Connections (status),
 * and the Talent Pool dashboard (candidate workflow status).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin, userId } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const applicationId = Number(id);
    if (!Number.isFinite(applicationId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const existing = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    const notes: string[] = [];

    if (body.status != null) {
      if (!appStatusValues.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = body.status;
      notes.push(`status → ${body.status}`);
    }

    if (body.talentStatus != null) {
      if (!talentStatusValues.includes(body.talentStatus)) {
        return NextResponse.json({ error: "Invalid talent status" }, { status: 400 });
      }
      data.talentStatus = body.talentStatus;
      notes.push(`talent status → ${body.talentStatus}`);
    }

    const note = body.note ? sanitizeText(body.note, 300) : "";

    if (Object.keys(data).length === 0 && !note) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    if (Object.keys(data).length > 0) {
      await prisma.application.update({ where: { id: applicationId }, data });
    }

    await logReferralActivity({
      applicationId,
      activityType: note && Object.keys(data).length === 0 ? "note" : "status_changed",
      activityBy: `admin:${userId}`,
      notes: [note, notes.join(", ")].filter(Boolean).join(" — ") || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin update application error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
