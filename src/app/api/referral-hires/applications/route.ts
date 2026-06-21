import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";
import {
  persistCv,
  logReferralActivity,
  rateLimit,
  getClientIp,
} from "@/lib/referral-server";
import {
  EMPLOYMENT_STATUSES,
  JOINING_AVAILABILITY,
  OPPORTUNITY_PREFERENCES,
  APPLICATION_SOURCES,
  sanitizeText,
  isValidEmail,
  isValidWhatsapp,
  isAllowedCvFile,
  buildReferralMessage,
  buildWhatsappLink,
  buildMailtoLink,
} from "@/lib/referral-hires";

export const dynamic = "force-dynamic";

const employmentValues = EMPLOYMENT_STATUSES.map((o) => o.value) as [string, ...string[]];
const availabilityValues = JOINING_AVAILABILITY.map((o) => o.value) as [string, ...string[]];
const sourceValues = APPLICATION_SOURCES.map((o) => o.value) as [string, ...string[]];
const prefValues = OPPORTUNITY_PREFERENCES.map((o) => o.value);

const cvSchema = z.object({
  objectPath: z.string().trim().min(1),
  fileName: z.string().trim().min(1).max(200),
  fileType: z.string().trim().max(120).optional().default(""),
});

const submitSchema = z.object({
  jobReferralId: z.number().int().positive().optional(),
  applicationSource: z.enum(sourceValues).optional(),
  // guest identity (ignored for logged-in users)
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().max(160).optional(),
  whatsappNumber: z.string().trim().max(20).optional(),
  location: z.string().trim().max(120).optional(),
  linkedinUrl: z.string().trim().max(500).optional(),
  portfolioUrl: z.string().trim().max(500).optional(),
  // CV: a freshly uploaded object OR an existing CV to reuse
  cv: cvSchema.optional(),
  existingCvId: z.number().int().positive().optional(),
  // candidate intelligence
  employmentStatus: z.enum(employmentValues).optional(),
  joiningAvailability: z.enum(availabilityValues).optional(),
  layoffImpacted: z.boolean().optional(),
  layoffLastWorkingMonth: z.string().trim().max(40).optional(),
  opportunityPreference: z.array(z.string()).optional(),
  professionalSummary: z.string().trim().max(300).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    if (!rateLimit(`apply:${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = submitSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form and try again.", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const userId = await getCurrentUserId();
    const isReferral = Boolean(d.jobReferralId);
    const applicationType = isReferral ? "referral" : "talent_pool";
    const source = userId ? "registered" : "guest";

    // --- Resolve the opening (referral flow) ---
    let opening:
      | {
          id: number;
          jobTitle: string;
          companyName: string;
          pocName: string;
          pocEmail: string;
          pocWhatsapp: string;
        }
      | null = null;
    if (isReferral) {
      opening = await prisma.jobReferral.findFirst({
        where: { id: d.jobReferralId!, status: "verified", isVerified: true },
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          pocName: true,
          pocEmail: true,
          pocWhatsapp: true,
        },
      });
      if (!opening) {
        return NextResponse.json(
          { error: "This opening is no longer available." },
          { status: 404 }
        );
      }
    }

    // --- Validate CV input early ---
    if (d.cv && !isAllowedCvFile(d.cv.fileName, d.cv.fileType)) {
      return NextResponse.json(
        { error: "Only PDF, DOC, and DOCX CVs are allowed." },
        { status: 400 }
      );
    }

    // --- Resolve candidate identity (guest profile vs registered user) ---
    let guestProfileId: number | null = null;
    if (!userId) {
      const name = sanitizeText(d.name, 120);
      const email = (d.email ?? "").trim().toLowerCase();
      const whatsapp = (d.whatsappNumber ?? "").trim();
      if (!name || !email || !whatsapp) {
        return NextResponse.json(
          { error: "Name, email and WhatsApp number are required." },
          { status: 400 }
        );
      }
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
      }
      if (!isValidWhatsapp(whatsapp)) {
        return NextResponse.json({ error: "Invalid WhatsApp number." }, { status: 400 });
      }
      // Talent pool requires a location; referral apply does not.
      if (!isReferral && !sanitizeText(d.location, 120)) {
        return NextResponse.json({ error: "Current location is required." }, { status: 400 });
      }
      const guest = await prisma.guestProfile.create({
        data: {
          name,
          email,
          whatsappNumber: whatsapp,
          linkedinUrl: d.linkedinUrl ? sanitizeText(d.linkedinUrl, 500) : null,
          portfolioUrl: d.portfolioUrl ? sanitizeText(d.portfolioUrl, 500) : null,
          location: sanitizeText(d.location, 120) || null,
        },
        select: { id: true },
      });
      guestProfileId = guest.id;
    }

    // --- Resolve CV (new upload, reuse, or latest existing for registered) ---
    let cvId: number | null = null;
    let cvReused = false;
    if (d.existingCvId && userId) {
      const existing = await prisma.uploadedCv.findFirst({
        where: { id: d.existingCvId, userId },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Selected CV not found." }, { status: 400 });
      }
      cvId = existing.id;
      cvReused = true;
    } else if (d.cv) {
      const created = await persistCv({
        objectPath: d.cv.objectPath,
        fileName: d.cv.fileName,
        fileType: d.cv.fileType || "",
        userId: userId ?? null,
        guestProfileId,
      });
      cvId = created?.id ?? null;
    } else if (userId) {
      // Registered user with no new CV: reuse their latest if present.
      const latest = await prisma.uploadedCv.findFirst({
        where: { userId },
        orderBy: { uploadedAt: "desc" },
        select: { id: true },
      });
      if (latest) {
        cvId = latest.id;
        cvReused = true;
      }
    }

    if (!cvId) {
      return NextResponse.json(
        { error: "Please upload your CV (PDF, DOC, or DOCX)." },
        { status: 400 }
      );
    }

    // --- Create the application / talent submission ---
    const opportunityPreference = (d.opportunityPreference ?? []).filter((v) =>
      prefValues.includes(v)
    );

    const application = await prisma.application.create({
      data: {
        jobReferralId: opening?.id ?? null,
        userId: userId ?? null,
        guestProfileId,
        cvId,
        source,
        applicationType,
        status: "applied",
        applicationSource:
          d.applicationSource || (isReferral ? "referral_opening" : "direct_submission"),
        talentStatus: "new",
        employmentStatus: d.employmentStatus || null,
        joiningAvailability: d.joiningAvailability || null,
        layoffImpacted: typeof d.layoffImpacted === "boolean" ? d.layoffImpacted : null,
        layoffLastWorkingMonth: d.layoffLastWorkingMonth
          ? sanitizeText(d.layoffLastWorkingMonth, 40)
          : null,
        opportunityPreference,
        professionalSummary: d.professionalSummary
          ? sanitizeText(d.professionalSummary, 300)
          : null,
      },
      select: { id: true },
    });

    const actor = userId ? `user:${userId}` : `guest:${guestProfileId}`;
    await logReferralActivity({
      applicationId: application.id,
      activityType: "created",
      activityBy: actor,
      notes: isReferral ? "Applied to referral opening" : "Direct talent pool submission",
    });
    await logReferralActivity({
      applicationId: application.id,
      activityType: cvReused ? "cv_reused" : "cv_uploaded",
      activityBy: actor,
    });

    // --- Build response (referral flow returns POC + send links) ---
    if (isReferral && opening) {
      const message = buildReferralMessage(opening.jobTitle, opening.companyName);
      return NextResponse.json(
        {
          success: true,
          applicationId: application.id,
          type: applicationType,
          message,
          poc: {
            name: opening.pocName,
            email: opening.pocEmail,
            whatsapp: opening.pocWhatsapp,
          },
          whatsappLink: buildWhatsappLink(opening.pocWhatsapp, message),
          mailtoLink: buildMailtoLink(
            opening.pocEmail,
            opening.jobTitle,
            opening.companyName,
            message
          ),
          successMessage:
            "Application saved. Send it to the hiring contact via WhatsApp or email below.",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        applicationId: application.id,
        type: applicationType,
        successMessage:
          "You're in the Next Leap Pro Talent Pool. We'll reach out as relevant opportunities come up.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit application error:", error);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}
