import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/referral-hires/openings/[id]
 * Public detail for a verified opening (used to prefill the Apply flow).
 * Point-of-contact contact details are not returned here.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const openingId = Number(id);
    if (!Number.isFinite(openingId)) {
      return NextResponse.json({ error: "Invalid opening id" }, { status: 400 });
    }

    const o = await prisma.jobReferral.findFirst({
      where: { id: openingId, status: "verified", isVerified: true },
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        location: true,
        workMode: true,
        experienceRange: true,
        shortDescription: true,
        salaryRange: true,
        jobLink: true,
        lastDateToApply: true,
        referralSource: true,
        isVerified: true,
        createdAt: true,
        pocName: true,
      },
    });

    if (!o) {
      return NextResponse.json({ error: "Opening not found or not yet verified" }, { status: 404 });
    }

    return NextResponse.json({ opening: o });
  } catch (error) {
    console.error("Get opening error:", error);
    return NextResponse.json({ error: "Failed to load opening" }, { status: 500 });
  }
}
