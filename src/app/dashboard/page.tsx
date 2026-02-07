import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { requireAuthOrRedirect } from "@/components/auth/RequireAuth";
import DashboardPageContent from "./dashboard-page-content";

export const metadata = {
  title: "Dashboard | Next Leap Pro",
  description: "Your personalized dashboard - track events, communities, and subscription status"
};

export default async function DashboardPage() {
  await requireAuthOrRedirect("/dashboard");
  const navbarPlans = await getNavbarPlansData();

  return <DashboardPageContent navbarPlans={navbarPlans} />;
}
