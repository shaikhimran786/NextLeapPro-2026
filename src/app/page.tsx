import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { generateMeta } from "@/lib/metadata";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { HeroSection } from "@/components/sections/HeroSection";
import { MemberStatsSection } from "@/components/sections/MemberStatsSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { EventsSection } from "@/components/sections/EventsSection";
import { CommunitiesSection } from "@/components/sections/CommunitiesSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { DailyPollSection } from "@/components/sections/DailyPollSection";
import { CTASection } from "@/components/sections/CTASection";

export const revalidate = 300;

export const metadata: Metadata = generateMeta({
  title: "Your career is bigger than one company.",
  description:
    "Next Leap Pro is a professional opportunity ecosystem helping professionals connect with communities, mentors, and real opportunities to restart careers, freelance, consult, and grow with resilience.",
  path: "/",
});

async function getHomeData() {
  const [events, communities, siteSettings, navbarPlans] = await Promise.all([
    prisma.event
      .findMany({
        where: { status: "published" },
        include: { organizer: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      })
      .catch(() => []),
    prisma.community
      .findMany({
        include: { members: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      })
      .catch(() => []),
    prisma.siteSettings.findFirst().catch(() => null),
    getNavbarPlansData(),
  ]);

  return {
    events: events.map((e) => ({
      ...e,
      price: e.price.toString(),
      memberCount: 0,
    })),
    communities: communities.map((c) => ({
      ...c,
      memberCount: c.members.length,
    })),
    siteSettings,
    navbarPlans,
  };
}

export default async function HomePage() {
  const { events, communities, siteSettings, navbarPlans } = await getHomeData();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        initialPlansData={navbarPlans}
        initialSiteSettings={siteSettings}
      />
      <main id="main-content" className="flex-grow" role="main">
        <HeroSection siteSettings={siteSettings as any} />
        <MemberStatsSection />
        <FeaturesSection />
        <EventsSection events={events} />
        <DailyPollSection />
        <CommunitiesSection communities={communities} />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
