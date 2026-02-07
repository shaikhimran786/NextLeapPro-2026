import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 300;

let cachedStats: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    
    if (cachedStats && (now - cachedStats.timestamp) < CACHE_TTL) {
      return NextResponse.json(cachedStats.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      });
    }

    const [totalMembers, activeSubscribers, totalEvents, totalCommunities] = await Promise.all([
      prisma.user.count(),
      prisma.userSubscription.count({
        where: {
          status: "active",
          currentPeriodEnd: { gt: new Date() },
          plan: {
            tier: { not: "free" },
          },
        },
      }),
      prisma.event.count({
        where: {
          status: "published",
        },
      }),
      prisma.community.count(),
    ]);

    const responseData = {
      totalMembers,
      activeSubscribers,
      totalEvents,
      totalCommunities,
      timestamp: new Date().toISOString(),
    };

    cachedStats = { data: responseData, timestamp: now };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
