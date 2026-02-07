import { Suspense } from "react";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { generateMeta } from "@/lib/metadata";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PricingPlans } from "./pricing-plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMeta({
  title: "Pricing",
  description: "Choose the plan that fits your needs. Start free, upgrade anytime.",
  path: "/pricing",
});

async function getPlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  
  return plans.map((plan) => ({
    ...plan,
    price: Number(plan.price),
    features: plan.features as string[],
  }));
}

export default async function PricingPage() {
  const [plans, navbarPlans] = await Promise.all([
    getPlans(),
    getNavbarPlansData(),
  ]);

  const monthlyPlans = plans.filter(p => p.interval === "month");
  const annualPlans = plans.filter(p => p.interval === "year");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialPlansData={navbarPlans} />
      <main className="flex-grow">
        <div className="bg-gradient-to-br from-primary/10 via-blue-50 to-green-50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the plan that fits your journey. Start free and upgrade as you grow.
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="container mx-auto px-4 py-12"><div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border shadow-md p-8 animate-pulse h-96" />)}</div></div>}>
          <PricingPlans monthlyPlans={monthlyPlans} annualPlans={annualPlans} />
        </Suspense>

        <div className="container mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">
              Need a Custom Plan?
            </h2>
            <p className="text-slate-600 mb-6">
              For enterprises, educational institutions, or large teams, we offer customized solutions.
              Contact us to discuss your specific needs.
            </p>
            <a
              href="mailto:contact@nextleappro.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
