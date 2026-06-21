import { Metadata } from "next";
import Link from "next/link";
import { generateMeta } from "@/lib/metadata";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UsersRound, Rocket, Heart } from "@/lib/icons";
import { SubmissionForm } from "@/components/referral-hires/SubmissionForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMeta({
  title: "Join the Talent Network",
  description:
    "Submit your profile and CV to the Next Leap Pro Talent Pool. Get matched with referral openings, startups, consulting and freelance opportunities.",
  path: "/talent-pool",
});

export default async function TalentPoolPage() {
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

        <div className="mb-6 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <UsersRound size={13} /> Next Leap Pro Talent Pool
          </span>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Submit your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Not applying to a specific role? Join the talent network so founders, hiring partners and
            the community can reach you for relevant opportunities. Especially helpful for
            layoff-impacted professionals, returning professionals, freelancers and consultants.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Rocket size={14} className="text-primary" /> Startup & consulting opportunities
            </span>
            <span className="flex items-center gap-1">
              <Heart size={14} className="text-rose-500" /> Layoff & career-transition support
            </span>
          </div>
        </div>

        <SubmissionForm mode="talent" />
      </main>
      <Footer />
    </div>
  );
}
