import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/referral-hires/openings
 * Admin list of all posted openings with poster + point of contact + counts.
 */
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const status = request.nextUrl.searchParams.get("status")?.trim();

    const rows = await prisma.jobReferral.findMany({
      where: status && status !== "all" ? { status } : {},
      include: {
        postedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        postedByGuest: { select: { id: true, name: true, email: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const openings = rows.map((o) => ({
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
      pocName: o.pocName,
      pocEmail: o.pocEmail,
      pocWhatsapp: o.pocWhatsapp,
      status: o.status,
      isVerified: o.isVerified,
      verifiedAt: o.verifiedAt,
      rejectionReason: o.rejectionReason,
      createdAt: o.createdAt,
      applicationsCount: o._count.applications,
      postedBy: o.postedByUser
        ? {
            type: "user" as const,
            name: `${o.postedByUser.firstName} ${o.postedByUser.lastName}`.trim(),
            email: o.postedByUser.email,
          }
        : o.postedByGuest
        ? { type: "guest" as const, name: o.postedByGuest.name, email: o.postedByGuest.email }
        : { type: "unknown" as const, name: "Guest", email: "" },
    }));

    return NextResponse.json({ openings });
  } catch (error) {
    console.error("Admin list openings error:", error);
    return NextResponse.json({ error: "Failed to load openings" }, { status: 500 });
  }
}
