import { Metadata } from "next";
import Link from "next/link";
import { generateMeta } from "@/lib/metadata";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@/lib/icons";
import { ShareOpeningForm } from "@/components/referral-hires/ShareOpeningForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMeta({
  title: "Share an Opening",
  description: "Post a hiring opening with a point of contact on Next Leap Pro Referral Hires.",
  path: "/referral-hires/share",
});

export default async function ShareOpeningPage() {
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Share an Opening</h1>
          <p className="text-sm text-muted-foreground">
            New openings are reviewed before they appear publicly with a Verified badge.
          </p>
        </div>
        <ShareOpeningForm />
      </main>
      <Footer />
    </div>
  );
}
