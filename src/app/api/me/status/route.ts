import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  UserStatus,
  defaultGuestStatus,
  AuthStatus,
  OnboardingStatus,
  SubscriptionStatus,
  MembershipStatus,
  EventRegistrationStatus,
  ServiceOrderStatus,
  CommunityMembershipInfo,
  EventRegistrationInfo,
  ServiceOrderInfo,
  ProfileInfo,
} from "@/lib/user-status";
import { normalizeBaseTier } from "@/lib/auth-utils";

function mapMembershipRole(role: string): MembershipStatus {
  switch (role) {
    case "owner":
      return "owner";
    case "admin":
      return "admin";
    case "moderator":
      return "moderator";
    case "member":
      return "member";
    case "pending":
      return "pending";
    case "invited":
      return "invited";
    case "blocked":
      return "blocked";
    default:
      return "member";
  }
}

function mapRegistrationStatus(status: string): EventRegistrationStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "registered":
      return "registered";
    case "cancelled":
      return "cancelled";
    case "attended":
      return "attended";
    case "waitlisted":
      return "waitlisted";
    default:
      return "registered";
  }
}

function mapServiceOrderStatus(status: string): ServiceOrderStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

function getSubscriptionStatus(
  tier: string,
  expiry: Date | null,
  subscriptions: { status: string; trialEnd: Date | null }[]
): SubscriptionStatus {
  if (tier === "free") {
    return "none";
  }

  if (subscriptions.length > 0) {
    const activeSubscription = subscriptions.find(
      (s) => s.status === "active" || s.status === "trialing"
    );

    if (!activeSubscription) {
      const cancelledSubscription = subscriptions.find((s) => s.status === "cancelled");
      if (cancelledSubscription) return "cancelled";
      return "expired";
    }

    if (activeSubscription.trialEnd && new Date(activeSubscription.trialEnd) > new Date()) {
      return "trial";
    }

    if (expiry && new Date(expiry) < new Date()) {
      return "expired";
    }

    return "active";
  }

  if (tier && tier !== "free" && expiry) {
    if (new Date(expiry) < new Date()) {
      return "expired";
    }
    return "active";
  }

  if (tier && tier !== "free") {
    return "active";
  }

  return "none";
}

function getServiceAccess(tier: string, subscriptionStatus: SubscriptionStatus): string[] {
  const baseAccess = ["view_events", "view_communities", "view_services"];
  const normalizedTier = normalizeBaseTier(tier);

  if (subscriptionStatus === "none" || normalizedTier === "free") {
    return baseAccess;
  }

  const proAccess = [
    ...baseAccess,
    "premium_events",
    "event_recordings",
    "certificates",
    "priority_support",
    "exclusive_content",
  ];

  if (normalizedTier === "pro") {
    return proAccess;
  }

  const creatorAccess = [
    ...proAccess,
    "host_events",
    "create_community",
    "offer_services",
    "analytics_dashboard",
    "custom_branding",
    "payment_integration",
  ];

  if (normalizedTier === "creator" || tier === "organizer" || tier === "enterprise") {
    return creatorAccess;
  }

  return proAccess;
}

function calculateProfileCompleteness(user: {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  skills: string[];
  socialLinks: any;
  portfolioLinks: string[];
  handle: string | null;
}): number {
  let score = 0;
  const weights = {
    firstName: 10,
    lastName: 10,
    email: 10,
    avatar: 15,
    bio: 20,
    skills: 15,
    socialLinks: 10,
    portfolioLinks: 5,
    handle: 5,
  };
  
  if (user.firstName) score += weights.firstName;
  if (user.lastName) score += weights.lastName;
  if (user.email) score += weights.email;
  if (user.avatar) score += weights.avatar;
  if (user.bio && user.bio.length > 20) score += weights.bio;
  if (user.skills && user.skills.length > 0) score += weights.skills;
  if (user.socialLinks && typeof user.socialLinks === 'object' && !Array.isArray(user.socialLinks) && Object.keys(user.socialLinks).length > 0) score += weights.socialLinks;
  if (user.portfolioLinks && user.portfolioLinks.length > 0) score += weights.portfolioLinks;
  if (user.handle) score += weights.handle;
  
  return score;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    
    if (!sessionCookie?.value) {
      return NextResponse.json(defaultGuestStatus);
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionCookie.value },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return NextResponse.json(defaultGuestStatus);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        roles: true,
        communityMemberships: {
          include: {
            community: {
              select: { id: true, name: true },
            },
          },
        },
        eventRegistrations: {
          include: {
            event: {
              select: { id: true, title: true },
            },
          },
        },
        serviceBookings: {
          include: {
            service: {
              select: { id: true, title: true },
            },
          },
        },
        subscriptions: {
          where: {
            status: { in: ["active", "trialing", "cancelled", "past_due"] },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(defaultGuestStatus);
    }

    const communityMemberships: Record<number, CommunityMembershipInfo> = {};
    for (const membership of user.communityMemberships) {
      communityMemberships[membership.communityId] = {
        status: mapMembershipRole(membership.role),
        role: membership.role,
        joinedAt: membership.joinedAt.toISOString(),
      };
    }

    const eventRegistrations: Record<number, EventRegistrationInfo> = {};
    for (const registration of user.eventRegistrations) {
      eventRegistrations[registration.eventId] = {
        status: mapRegistrationStatus(registration.status),
        paymentStatus: registration.paymentStatus as "pending" | "paid" | "failed" | "refunded",
        registeredAt: registration.registeredAt.toISOString(),
        ticketId: registration.id,
        ticketCode: registration.qrCode || undefined,
      };
    }

    const serviceOrders: Record<number, ServiceOrderInfo> = {};
    for (const booking of user.serviceBookings) {
      serviceOrders[booking.serviceId] = {
        status: mapServiceOrderStatus(booking.status),
        orderId: booking.id,
        bookedAt: booking.bookedAt.toISOString(),
      };
    }

    const subscriptionStatus = getSubscriptionStatus(
      user.subscriptionTier,
      user.subscriptionExpiry,
      user.subscriptions.map((s) => ({
        status: s.status,
        trialEnd: s.trialEnd,
      }))
    );

    // Auto-downgrade if subscription is expired
    let effectiveTier = user.subscriptionTier;
    if (subscriptionStatus === 'expired' && user.subscriptionTier !== 'free') {
      try {
        await prisma.$transaction([
          prisma.userSubscription.updateMany({
            where: { userId: user.id, status: 'active' },
            data: { status: 'expired' },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { subscriptionTier: 'free' },
          }),
        ]);
      } catch (err) {
        console.error('Auto-downgrade failed:', err);
      }
      effectiveTier = 'free';
    }

    const serviceAccess = getServiceAccess(effectiveTier, subscriptionStatus);
    
    const profileCompleteness = calculateProfileCompleteness({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      skills: user.skills,
      socialLinks: user.socialLinks,
      portfolioLinks: user.portfolioLinks,
      handle: user.handle,
    });
    
    const profile: ProfileInfo = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      handle: user.handle,
      publicUrl: user.isPublished && user.handle ? `/u/${user.handle}` : null,
      isPublished: user.isPublished,
      completenessScore: profileCompleteness,
    };

    const userStatus: UserStatus = {
      authStatus: "logged_in",
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      onboardingStatus: user.onboardingStatus as OnboardingStatus,
      subscriptionStatus,
      subscriptionTier: effectiveTier,
      subscriptionExpiry: user.subscriptionExpiry?.toISOString() || null,
      roles: user.roles.map((r) => r.name),
      communityMemberships,
      eventRegistrations,
      serviceOrders,
      serviceAccess,
      profile,
    };

    return NextResponse.json(userStatus);
  } catch (error) {
    console.error("Error fetching user status:", error);
    return NextResponse.json(defaultGuestStatus);
  }
}
