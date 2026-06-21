import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { generateMeta } from "@/lib/metadata";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@/lib/icons";
import { SubmissionForm, OpeningContext } from "@/components/referral-hires/SubmissionForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMeta({
  title: "Apply",
  description: "Apply to a verified referral opening on Next Leap Pro.",
  path: "/referral-hires/apply",
  noIndex: true,
});

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const openingId = Number(id);
  if (!Number.isFinite(openingId)) notFound();

  const opening = await prisma.jobReferral.findFirst({
    where: { id: openingId, status: "verified", isVerified: true },
    select: {
      id: true,
      jobTitle: true,
      companyName: true,
      location: true,
      workMode: true,
      experienceRange: true,
      salaryRange: true,
      pocName: true,
    },
  });

  const navbarPlans = await getNavbarPlansData();

  return (
    <div className="min-h-screen bg-background">
      <Navbar initialPlansData={navbarPlans} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4 gap-1">
          <Link href="/referral-hires">
            <ArrowLeft size={16} /> Back to Referral Hires
          </Link>
        </Button>

        {opening ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Apply to this opening</h1>
              <p className="text-sm text-muted-foreground">
                Confirm your profile, attach your CV, and send it to the hiring contact.
              </p>
            </div>
            <SubmissionForm mode="referral" opening={opening as OpeningContext} />
          </>
        ) : (
          <div className="mx-auto max-w-xl rounded-lg border bg-muted/30 p-8 text-center">
            <h1 className="text-xl font-bold">Opening not available</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This opening may have expired or is awaiting verification. Browse other verified
              openings instead.
            </p>
            <Button asChild className="mt-4">
              <Link href="/referral-hires">View openings</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
