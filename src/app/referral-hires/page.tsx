import { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { generateMeta } from "@/lib/metadata";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Share2, Send, UsersRound, BadgeCheck, ShieldCheck } from "@/lib/icons";
import { OpeningsBrowser, PublicOpening } from "@/components/referral-hires/OpeningsBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMeta({
  title: "Referral Hires",
  description:
    "Share verified hiring openings with a point of contact, or apply with your CV in seconds. Community-powered referrals on Next Leap Pro.",
  path: "/referral-hires",
});

async function getInitialOpenings(): Promise<PublicOpening[]> {
  const now = new Date();
  const rows = await prisma.jobReferral.findMany({
    where: { status: "verified", isVerified: true },
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

  return rows
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
      lastDateToApply: o.lastDateToApply ? o.lastDateToApply.toISOString() : null,
      referralSource: o.referralSource,
      isVerified: o.isVerified,
      createdAt: o.createdAt.toISOString(),
      pocName: o.pocName,
      applicationsCount: o._count.applications,
    }));
}

export default async function ReferralHiresPage() {
  const [navbarPlans, openings] = await Promise.all([
    getNavbarPlansData(),
    getInitialOpenings(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar initialPlansData={navbarPlans} />

      <main>
        {/* Hero */}
        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <UsersRound size={13} /> Community-powered referrals
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Referral Hires
              </h1>
              <p className="mt-3 text-muted-foreground">
                Share a hiring opening with a point of contact, or apply to verified roles with your
                CV in seconds. Registered members apply with one tap — no duplicate details.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/referral-hires/share">
                    <Share2 size={18} /> Share an Opening
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link href="#openings">
                    <Send size={18} /> Apply Now
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="gap-2">
                  <Link href="/talent-pool">
                    <UsersRound size={18} /> Join Talent Network
                  </Link>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BadgeCheck size={14} className="text-emerald-600" /> Verified openings
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-primary" /> Contact shared only after you apply
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Listings */}
        <section className="mx-auto max-w-5xl px-4 py-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold">Verified openings</h2>
              <p className="text-sm text-muted-foreground">
                {openings.length} open {openings.length === 1 ? "role" : "roles"} right now
              </p>
            </div>
          </div>
          <OpeningsBrowser initialOpenings={openings} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
