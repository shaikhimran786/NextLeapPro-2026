import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";
import { sanitizeText, WORK_MODES, isValidEmail, isValidWhatsapp } from "@/lib/referral-hires";

export const dynamic = "force-dynamic";

const workModeValues = WORK_MODES.map((o) => o.value);

/**
 * PATCH /api/admin/referral-hires/openings/[id]
 * Body: { action: "verify" | "reject" | "expire" | "edit", ...fields }
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
    const openingId = Number(id);
    if (!Number.isFinite(openingId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const existing = await prisma.jobReferral.findUnique({ where: { id: openingId } });
    if (!existing) {
      return NextResponse.json({ error: "Opening not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const action: string = body.action;

    let data: Record<string, unknown> = {};

    switch (action) {
      case "verify":
        data = { status: "verified", isVerified: true, verifiedAt: new Date(), rejectionReason: null };
        break;
      case "reject":
        data = {
          status: "rejected",
          isVerified: false,
          rejectionReason: body.reason ? sanitizeText(body.reason, 300) : "Rejected by admin",
        };
        break;
      case "expire":
        data = { status: "expired", isVerified: false };
        break;
      case "edit": {
        const f = body.fields ?? {};
        if (f.jobTitle != null) data.jobTitle = sanitizeText(f.jobTitle, 120);
        if (f.companyName != null) data.companyName = sanitizeText(f.companyName, 120);
        if (f.location != null) data.location = sanitizeText(f.location, 120);
        if (f.workMode != null && workModeValues.includes(f.workMode)) data.workMode = f.workMode;
        if (f.experienceRange != null) data.experienceRange = sanitizeText(f.experienceRange, 60);
        if (f.shortDescription != null) data.shortDescription = sanitizeText(f.shortDescription, 1000);
        if (f.salaryRange != null) data.salaryRange = f.salaryRange ? sanitizeText(f.salaryRange, 60) : null;
        if (f.jobLink != null) data.jobLink = f.jobLink || null;
        if (f.pocName != null) data.pocName = sanitizeText(f.pocName, 120);
        if (f.pocEmail != null) {
          if (f.pocEmail && !isValidEmail(f.pocEmail)) {
            return NextResponse.json({ error: "Invalid POC email" }, { status: 400 });
          }
          data.pocEmail = f.pocEmail.trim().toLowerCase();
        }
        if (f.pocWhatsapp != null) {
          if (f.pocWhatsapp && !isValidWhatsapp(f.pocWhatsapp)) {
            return NextResponse.json({ error: "Invalid POC WhatsApp" }, { status: 400 });
          }
          data.pocWhatsapp = f.pocWhatsapp.trim();
        }
        if (Object.keys(data).length === 0) {
          return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const updated = await prisma.jobReferral.update({
      where: { id: openingId },
      data,
      select: { id: true, status: true, isVerified: true },
    });

    // Audit trail (best-effort) using the existing admin audit log.
    try {
      await prisma.adminAuditLog.create({
        data: {
          userId: userId!,
          action: `referral_opening_${action}`,
          target: `job_referral:${openingId}`,
          details:
            action === "reject"
              ? { reason: typeof data.rejectionReason === "string" ? data.rejectionReason : "" }
              : undefined,
        },
      });
    } catch {
      /* audit schema may differ — never block the action */
    }

    return NextResponse.json({ success: true, opening: updated });
  } catch (error) {
    console.error("Admin update opening error:", error);
    return NextResponse.json({ error: "Failed to update opening" }, { status: 500 });
  }
}

/** DELETE /api/admin/referral-hires/openings/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id } = await params;
    const openingId = Number(id);
    if (!Number.isFinite(openingId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await prisma.jobReferral.delete({ where: { id: openingId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete opening error:", error);
    return NextResponse.json({ error: "Failed to delete opening" }, { status: 500 });
  }
}
