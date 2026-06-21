import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

type WhereClause = Record<string, unknown>;

/**
 * GET /api/admin/referral-hires/applications
 * Enriched list backing the Submitted CVs, Referral Connections and Talent Pool
 * admin views. Supports filtering for the talent-pool smart filters.
 *
 * Query params: type, status, talentStatus, employmentStatus, availability,
 * quick (immediate_joiners | layoff_impacted | notice_period | freelancers |
 * consultants | startup_interested), location, search.
 */
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const sp = request.nextUrl.searchParams;
    const and: WhereClause[] = [];

    const type = sp.get("type");
    if (type && type !== "all") and.push({ applicationType: type });

    const status = sp.get("status");
    if (status && status !== "all") and.push({ status });

    const talentStatus = sp.get("talentStatus");
    if (talentStatus && talentStatus !== "all") and.push({ talentStatus });

    const employmentStatus = sp.get("employmentStatus");
    if (employmentStatus && employmentStatus !== "all") and.push({ employmentStatus });

    const availability = sp.get("availability");
    if (availability && availability !== "all") and.push({ joiningAvailability: availability });

    const quick = sp.get("quick");
    switch (quick) {
      case "immediate_joiners":
        and.push({ joiningAvailability: "immediate" });
        break;
      case "layoff_impacted":
        and.push({ layoffImpacted: true });
        break;
      case "notice_period":
        and.push({ employmentStatus: "serving_notice" });
        break;
      case "freelancers":
        and.push({
          OR: [{ employmentStatus: "freelancer" }, { opportunityPreference: { has: "freelance" } }],
        });
        break;
      case "consultants":
        and.push({ opportunityPreference: { has: "consulting" } });
        break;
      case "startup_interested":
        and.push({ opportunityPreference: { has: "startup" } });
        break;
    }

    const location = sp.get("location")?.trim();
    if (location) {
      and.push({ guestProfile: { location: { contains: location, mode: "insensitive" } } });
    }

    const search = sp.get("search")?.trim();
    if (search) {
      and.push({
        OR: [
          { user: { firstName: { contains: search, mode: "insensitive" } } },
          { user: { lastName: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { guestProfile: { name: { contains: search, mode: "insensitive" } } },
          { guestProfile: { email: { contains: search, mode: "insensitive" } } },
          { jobReferral: { jobTitle: { contains: search, mode: "insensitive" } } },
          { jobReferral: { companyName: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    const rows = await prisma.application.findMany({
      where: and.length ? { AND: and } : {},
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            skills: true,
            socialLinks: true,
          },
        },
        guestProfile: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsappNumber: true,
            linkedinUrl: true,
            portfolioUrl: true,
            location: true,
          },
        },
        cv: { select: { id: true, fileName: true, fileType: true, uploadedAt: true } },
        jobReferral: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            pocName: true,
            pocEmail: true,
            pocWhatsapp: true,
            postedByUser: { select: { firstName: true, lastName: true, email: true } },
            postedByGuest: { select: { name: true, email: true } },
          },
        },
        activityLogs: {
          select: { activityType: true, activityBy: true, notes: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const applications = rows.map((a) => {
      const candidate = a.user
        ? {
            type: "registered" as const,
            name: `${a.user.firstName} ${a.user.lastName}`.trim(),
            email: a.user.email,
            whatsapp: a.user.phone ?? "",
            linkedin: extractLinkedIn(a.user.socialLinks),
            location: "",
            skills: a.user.skills ?? [],
          }
        : a.guestProfile
        ? {
            type: "guest" as const,
            name: a.guestProfile.name,
            email: a.guestProfile.email,
            whatsapp: a.guestProfile.whatsappNumber,
            linkedin: a.guestProfile.linkedinUrl ?? "",
            location: a.guestProfile.location ?? "",
            skills: [] as string[],
          }
        : {
            type: "unknown" as const,
            name: "Unknown",
            email: "",
            whatsapp: "",
            linkedin: "",
            location: "",
            skills: [] as string[],
          };

      const opening = a.jobReferral
        ? {
            id: a.jobReferral.id,
            jobTitle: a.jobReferral.jobTitle,
            companyName: a.jobReferral.companyName,
            pocName: a.jobReferral.pocName,
            pocEmail: a.jobReferral.pocEmail,
            pocWhatsapp: a.jobReferral.pocWhatsapp,
            postedBy: a.jobReferral.postedByUser
              ? `${a.jobReferral.postedByUser.firstName} ${a.jobReferral.postedByUser.lastName}`.trim()
              : a.jobReferral.postedByGuest?.name || "Guest",
          }
        : null;

      const cvReused = a.activityLogs.some((l) => l.activityType === "cv_reused");

      return {
        id: a.id,
        source: a.source,
        applicationType: a.applicationType,
        applicationSource: a.applicationSource,
        status: a.status,
        talentStatus: a.talentStatus,
        whatsappClicked: a.whatsappClicked,
        emailClicked: a.emailClicked,
        createdAt: a.createdAt,
        employmentStatus: a.employmentStatus,
        joiningAvailability: a.joiningAvailability,
        layoffImpacted: a.layoffImpacted,
        layoffLastWorkingMonth: a.layoffLastWorkingMonth,
        opportunityPreference: a.opportunityPreference,
        professionalSummary: a.professionalSummary,
        candidate,
        cv: a.cv
          ? { id: a.cv.id, fileName: a.cv.fileName, fileType: a.cv.fileType, reused: cvReused }
          : null,
        opening,
        referralId: a.jobReferralId,
        activity: a.activityLogs,
      };
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Admin list applications error:", error);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}

function extractLinkedIn(socialLinks: unknown): string {
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
    }
  } catch {
    /* ignore */
  }
  return "";
}
