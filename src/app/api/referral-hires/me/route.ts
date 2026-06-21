import { NextResponse } from "next/server";
import { getApplicantPrefill } from "@/lib/referral-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/referral-hires/me
 * Returns prefill data for the Apply / Talent Pool flows so registered users
 * never re-enter their profile information. Guests get { authenticated: false }.
 */
export async function GET() {
  try {
    const prefill = await getApplicantPrefill();
    return NextResponse.json({
      authenticated: Boolean(prefill),
      prefill,
    });
  } catch (error) {
    console.error("Referral prefill error:", error);
    return NextResponse.json({ authenticated: false, prefill: null });
  }
}
