import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";
import { rateLimit, getClientIp } from "@/lib/referral-server";
import {
  WORK_MODES,
  REFERRAL_SOURCES,
  sanitizeText,
  isValidEmail,
  isValidWhatsapp,
} from "@/lib/referral-hires";

export const dynamic = "force-dynamic";

const workModeValues = WORK_MODES.map((o) => o.value) as [string, ...string[]];
const referralSourceValues = REFERRAL_SOURCES.map((o) => o.value) as [string, ...string[]];

const createOpeningSchema = z.object({
  jobTitle: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(120),
  workMode: z.enum(workModeValues),
  experienceRange: z.string().trim().min(1).max(60),
  shortDescription: z.string().trim().min(10).max(1000),
  // optional
  salaryRange: z.string().trim().max(60).optional().or(z.literal("")),
  jobLink: z.string().trim().url().max(500).optional().or(z.literal("")),
  lastDateToApply: z.string().trim().optional().or(z.literal("")),
  referralSource: z.enum(referralSourceValues).optional().or(z.literal("")),
  // point of contact (mandatory)
  pocName: z.string().trim().min(1).max(120),
  pocEmail: z.string().trim().email().max(160),
  pocWhatsapp: z.string().trim().min(6).max(20),
});

/**
 * GET /api/referral-hires/openings
 * Public listing of verified, non-expired openings. Point-of-contact contact
 * details are intentionally omitted here — they are revealed only after a
 * candidate applies.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim();
    const workMode = searchParams.get("workMode")?.trim();

    const openings = await prisma.jobReferral.findMany({
      where: {
        status: "verified",
        isVerified: true,
        ...(workMode && workMode !== "all" ? { workMode } : {}),
        ...(search
          ? {
              OR: [
                { jobTitle: { contains: search, mode: "insensitive" } },
                { companyName: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
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
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Drop expired-by-date openings and never leak POC contact fields.
    const now = new Date();
    const data = openings
      .filter((o) => !o.lastDateToApply || new Date(o.lastDateToApply) >= now)
      .map((o) => ({
        id: o.id,
        jobTitle: o.jobTitle,
        companyName: o.companyName,
        location: o.location,
        workMode: o.workMode,
        experienceRange: o.experienceRange,
        shortDescription: o.shortDescription,
        salaryRange: o.salaryRange,
        jobLink: o.jobLink,
        lastDateToApply: o.lastDateToApply,
        referralSource: o.referralSource,
        isVerified: o.isVerified,
        createdAt: o.createdAt,
        pocName: o.pocName, // name only; email/whatsapp revealed after apply
        applicationsCount: o._count.applications,
      }));

    return NextResponse.json({ openings: data });
  } catch (error) {
    console.error("List openings error:", error);
    return NextResponse.json({ error: "Failed to load openings" }, { status: 500 });
  }
}

/**
 * POST /api/referral-hires/openings
 * Create a new opening (registered user or guest). Saved as Pending Review;
 * the verified badge only appears after an admin verifies it.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    if (!rateLimit(`opening:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = createOpeningSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form and try again.", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;

    if (!isValidEmail(d.pocEmail)) {
      return NextResponse.json({ error: "Invalid point of contact email." }, { status: 400 });
    }
    if (!isValidWhatsapp(d.pocWhatsapp)) {
      return NextResponse.json({ error: "Invalid WhatsApp number." }, { status: 400 });
    }

    let lastDate: Date | null = null;
    if (d.lastDateToApply) {
      const parsedDate = new Date(d.lastDateToApply);
      if (!isNaN(parsedDate.getTime())) lastDate = parsedDate;
    }

    const userId = await getCurrentUserId();

    // Guest posters: create a lightweight GuestProfile from the point of contact
    // so the opening retains a traceable poster identity.
    let postedByGuestId: number | null = null;
    if (!userId) {
      const guest = await prisma.guestProfile.create({
        data: {
          name: sanitizeText(d.pocName, 120),
          email: d.pocEmail.trim().toLowerCase(),
          whatsappNumber: d.pocWhatsapp.trim(),
        },
        select: { id: true },
      });
      postedByGuestId = guest.id;
    }

    const opening = await prisma.jobReferral.create({
      data: {
        jobTitle: sanitizeText(d.jobTitle, 120),
        companyName: sanitizeText(d.companyName, 120),
        location: sanitizeText(d.location, 120),
        workMode: d.workMode,
        experienceRange: sanitizeText(d.experienceRange, 60),
        shortDescription: sanitizeText(d.shortDescription, 1000),
        salaryRange: d.salaryRange ? sanitizeText(d.salaryRange, 60) : null,
        jobLink: d.jobLink || null,
        lastDateToApply: lastDate,
        referralSource: d.referralSource || null,
        pocName: sanitizeText(d.pocName, 120),
        pocEmail: d.pocEmail.trim().toLowerCase(),
        pocWhatsapp: d.pocWhatsapp.trim(),
        postedByUserId: userId ?? null,
        postedByGuestId,
        status: "pending_review",
        isVerified: false,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json(
      {
        success: true,
        id: opening.id,
        status: opening.status,
        message:
          "Thanks! Your opening has been submitted and is pending review. It will appear publicly with a Verified badge once our team approves it.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create opening error:", error);
    return NextResponse.json({ error: "Failed to submit opening" }, { status: 500 });
  }
}
