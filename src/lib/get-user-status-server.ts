import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  UserStatus,
  defaultGuestStatus,
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

function isDynamicServerUsageError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const digest = "digest" in error ? error.digest : undefined;
  const description = "description" in error ? error.description : undefined;
  const message = "message" in error ? error.message : undefined;

  return (
    digest === "DYNAMIC_SERVER_USAGE" ||
    (typeof description === "string" && description.includes("Dynamic server usage")) ||
    (typeof message === "string" && message.includes("Dynamic server usage"))
  );
}

function mapMembershipRole(role: string): MembershipStatus {
  switch (role) {
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

  return "none";
}

function getServiceAccess(tier: string, subscriptionStatus: SubscriptionStatus): string[] {
  if (subscriptionStatus !== "active" && subscriptionStatus !== "trial") {
    return ["view_services"];
  }

  const tierLower = tier.toLowerCase();

  if (tierLower.includes("creator")) {
    return [
      "view_services",
      "contact_providers",
      "view_contact_details",
      "book_services",
      "create_services",
      "manage_own_services",
      "view_analytics",
      "featured_listing",
    ];
  }

  if (tierLower.includes("pro")) {
    return [
      "view_services",
      "contact_providers",
      "view_contact_details",
      "book_services",
    ];
  }

  return ["view_services"];
}

function calculateProfileCompleteness(user: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  skills: string[] | null;
  socialLinks: any;
  portfolioLinks: string[] | null;
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

export async function getUserStatusServer(): Promise<UserStatus> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return defaultGuestStatus;
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionCookie.value },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        try {
          await prisma.session.delete({ where: { id: session.id } });
        } catch {
        }
      }
      return defaultGuestStatus;
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
      return defaultGuestStatus;
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

    const serviceAccess = getServiceAccess(user.subscriptionTier, subscriptionStatus);
    
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
      subscriptionTier: user.subscriptionTier,
      subscriptionExpiry: user.subscriptionExpiry?.toISOString() || null,
      subscriptionPlanName: null,
      subscriptionInterval: null,
      subscriptionDaysRemaining: null,
      roles: user.roles.map((r) => r.name),
      communityMemberships,
      eventRegistrations,
      serviceOrders,
      serviceAccess,
      profile,
    };

    return userStatus;
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      return defaultGuestStatus;
    }

    console.error("Error fetching user status server-side:", error);
    return defaultGuestStatus;
  }
}
