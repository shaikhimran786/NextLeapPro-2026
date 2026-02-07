import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({
        user: {
          id: 0,
          firstName: "Guest",
          lastName: "User",
          email: "guest@example.com",
          avatar: null,
          subscriptionTier: "free",
          subscriptionExpiry: null,
        },
        registeredEvents: [],
        joinedCommunities: [],
        offeredServices: [],
        stats: {
          eventsAttended: 0,
          communitiesJoined: 0,
          skillsLearned: 0,
          servicesOffered: 0,
        },
      });
    }
    
    const user = await (prisma.user.findUnique as any)({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        subscriptionTier: true,
        subscriptionExpiry: true,
        hasSeenFeatureDemo: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        user: {
          id: 0,
          firstName: "Guest",
          lastName: "User",
          email: "guest@example.com",
          avatar: null,
          subscriptionTier: "free",
          subscriptionExpiry: null,
        },
        registeredEvents: [],
        joinedCommunities: [],
        offeredServices: [],
        stats: {
          eventsAttended: 0,
          communitiesJoined: 0,
          skillsLearned: 0,
          servicesOffered: 0,
        },
      });
    }

    const registeredEvents = await prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            mode: true,
            coverImage: true,
          },
        },
      },
      orderBy: { event: { startDate: "asc" } },
      take: 5,
    });

    const joinedCommunities = await prisma.communityMember.findMany({
      where: { userId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: true,
          },
        },
      },
      take: 6,
    });

    const offeredServices = await prisma.service.findMany({
      where: { providerId: userId },
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        rating: true,
        reviewCount: true,
        coverImage: true,
        isActive: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const [eventsAttendedCount, communitiesJoinedCount, servicesOfferedCount] = await Promise.all([
      prisma.eventRegistration.count({ where: { userId } }),
      prisma.communityMember.count({ where: { userId } }),
      prisma.service.count({ where: { providerId: userId } }),
    ]);

    const tier = user.subscriptionTier?.toLowerCase();
    const isCreatorTier = tier === "creator" || tier === "creator_monthly" || tier === "creator_annual";
    const isExpired = user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date();
    
    const userRoles = await prisma.role.findMany({
      where: {
        users: { some: { id: userId } }
      },
      select: { name: true }
    });
    const isAdmin = userRoles.some(r => r.name.toLowerCase() === 'admin');
    const isCreator = (isCreatorTier && !isExpired) || isAdmin;

    let createdCommunities: any[] = [];
    let createdEvents: any[] = [];
    
    if (isCreator) {
      createdCommunities = await prisma.community.findMany({
        where: { creatorId: userId },
        include: {
          _count: { select: { members: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      createdEvents = await prisma.event.findMany({
        where: { organizerId: userId, createdByAdmin: false },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          coverImage: true,
          category: true,
          mode: true,
          startDate: true,
          endDate: true,
          status: true,
          featured: true,
          price: true,
          capacity: true,
          _count: { select: { registrations: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({
      user,
      registeredEvents,
      joinedCommunities,
      offeredServices: offeredServices.map(s => ({
        ...s,
        price: Number(s.price),
        rating: Number(s.rating),
      })),
      createdCommunities,
      createdEvents: createdEvents.map(e => ({
        ...e,
        price: Number(e.price),
      })),
      isCreator,
      stats: {
        eventsAttended: eventsAttendedCount,
        communitiesJoined: communitiesJoinedCount,
        skillsLearned: 0,
        servicesOffered: servicesOfferedCount,
        eventsCreated: createdEvents.length,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
