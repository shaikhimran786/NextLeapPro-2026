import prisma from "@/lib/prisma";

export interface NavbarPlansData {
  plans: Array<{
    name: string;
    price: number;
    interval: string;
    features: string[];
    isPopular: boolean;
    active: boolean;
  }>;
}

/**
 * Server-side data fetcher for Navbar plans
 * Fetches subscription plans from database and returns formatted data
 *
 * This is used to eliminate hydration mismatches by providing
 * server-rendered data to the Navbar component via props
 */
export async function getNavbarPlansData(): Promise<NavbarPlansData> {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        name: true,
        price: true,
        interval: true,
        features: true,
        isPopular: true,
        active: true,
      },
    });

    return {
      plans: plans.map((plan) => ({
        name: plan.name,
        price: Number(plan.price),
        interval: plan.interval,
        features: Array.isArray(plan.features)
          ? plan.features
          : typeof plan.features === "string"
            ? JSON.parse(plan.features)
            : [],
        isPopular: plan.isPopular,
        active: plan.active,
      })),
    };
  } catch (error) {
    console.error("Error fetching navbar plans data:", error);
    // Return empty plans array to fallback to hardcoded data
    // This prevents the page from breaking if database is unavailable
    return { plans: [] };
  }
}
