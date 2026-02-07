"use client";

import DashboardContent from "./DashboardContent";

interface NavbarPlansData {
  plans: Array<{
    name: string;
    price: number;
    interval: string;
    features: string[];
    isPopular: boolean;
    active: boolean;
  }>;
}

interface DashboardPageContentProps {
  navbarPlans: NavbarPlansData;
}

export default function DashboardPageContent({ navbarPlans }: DashboardPageContentProps) {
  return <DashboardContent initialPlansData={navbarPlans} />;
}
