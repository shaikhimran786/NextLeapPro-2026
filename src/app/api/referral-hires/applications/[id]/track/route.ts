import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logReferralActivity } from "@/lib/referral-server";

export const dynamic = "force-dynamic";

const trackSchema = z.object({
  channel: z.enum(["whatsapp", "email"]),
});

/**
 * POST /api/referral-hires/applications/[id]/track
 * Records that the candidate clicked the WhatsApp or Email send option for
 * their application, and advances the referral status to "sent_to_contact".
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const applicationId = Number(id);
    if (!Number.isFinite(applicationId)) {
      return NextResponse.json({ error: "Invalid application id" }, { status: 400 });
    }

    const json = await request.json().catch(() => null);
    const parsed = trackSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const existing = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const channel = parsed.data.channel;
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        ...(channel === "whatsapp" ? { whatsappClicked: true } : { emailClicked: true }),
        // Once the candidate sends it onward, reflect that in the referral status
        // (don't downgrade a status that has already progressed past "applied").
        ...(existing.status === "applied" ? { status: "sent_to_contact" } : {}),
      },
    });

    await logReferralActivity({
      applicationId,
      activityType: channel === "whatsapp" ? "whatsapp_clicked" : "email_clicked",
      activityBy: "candidate",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track click error:", error);
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }
}
