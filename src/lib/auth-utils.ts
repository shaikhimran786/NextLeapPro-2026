import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export function normalizeBaseTier(tier: string | null): string {
  if (!tier) return "free";
  const t = tier.toLowerCase();
  if (t.includes("creator")) return "creator";
  if (t.includes("pro")) return "pro";
  return "free";
}

export type UserRole = "admin" | "creator" | "member" | "user";

export interface CurrentUserWithRoles {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  handle: string | null;
  avatar: string | null;
  subscriptionTier: string;
  subscriptionExpiry: Date | null;
  roles: { id: number; name: string }[];
}

export async function getCurrentUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  
  if (!sessionCookie?.value) return null;
  
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
    return null;
  }
  
  return session.userId;
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function getCurrentUserWithRoles(): Promise<CurrentUserWithRoles | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        select: { id: true, name: true }
      }
    }
  });
}

export async function hasRole(roleName: string): Promise<boolean> {
  const user = await getCurrentUserWithRoles();
  if (!user) return false;
  return user.roles.some(role => role.name.toLowerCase() === roleName.toLowerCase());
}

export async function hasAnyRole(roleNames: string[]): Promise<boolean> {
  const user = await getCurrentUserWithRoles();
  if (!user) return false;
  const lowerRoleNames = roleNames.map(r => r.toLowerCase());
  return user.roles.some(role => lowerRoleNames.includes(role.name.toLowerCase()));
}

export async function isUserAdmin(): Promise<boolean> {
  return hasRole("admin");
}

export async function isUserCreator(): Promise<boolean> {
  const user = await getCurrentUserWithRoles();
  if (!user) return false;
  
  const hasCreatorRole = user.roles.some(role => role.name.toLowerCase() === "creator");
  if (hasCreatorRole) return true;
  
  const tier = user.subscriptionTier?.toLowerCase();
  return tier === "creator_monthly" || tier === "creator_annual" || tier === "creator";
}

export async function getUserRoles(): Promise<string[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];
  return user.roles.map(role => role.name);
}

export async function checkPremiumStatus(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const tier = user.subscriptionTier?.toLowerCase();
  if (!tier || tier === "free") return false;
  
  if (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date()) {
    return false;
  }
  
  return true;
}

export async function checkCreatorAccess(): Promise<{ hasAccess: boolean; tier: string | null; userId: number | null }> {
  const user = await getCurrentUser();
  if (!user) return { hasAccess: false, tier: null, userId: null };
  
  const tier = user.subscriptionTier?.toLowerCase();
  
  // Check if user has creator tier subscription
  const isCreatorTier = normalizeBaseTier(tier) === "creator";

  if (!isCreatorTier) {
    return { hasAccess: false, tier: tier || null, userId: user.id };
  }
  
  // Check if subscription is still valid
  if (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date()) {
    return { hasAccess: false, tier: tier, userId: user.id };
  }
  
  return { hasAccess: true, tier: tier, userId: user.id };
}

export async function getCreatorCommunityCount(userId: number): Promise<number> {
  const count = await prisma.community.count({
    where: { creatorId: userId }
  });
  return count;
}

export const MAX_CREATOR_COMMUNITIES = 3;
export const MAX_PRO_COMMUNITIES = 1;
export const MAX_FREE_COMMUNITIES = 0;

export type SubscriptionTierType = "free" | "pro" | "creator" | "admin";

export function getSubscriptionTierType(tier: string | null): SubscriptionTierType {
  if (!tier) return "free";
  const lowerTier = tier.toLowerCase();
  if (lowerTier.includes("creator")) return "creator";
  if (lowerTier.includes("pro")) return "pro";
  return "free";
}

export function getMaxCommunitiesForTier(tierType: SubscriptionTierType): number {
  switch (tierType) {
    case "admin":
      return Infinity;
    case "creator":
      return Infinity;
    case "pro":
      return MAX_PRO_COMMUNITIES;
    default:
      return MAX_FREE_COMMUNITIES;
  }
}

export async function checkCommunityCreationAccess(): Promise<{ 
  canCreate: boolean; 
  tier: SubscriptionTierType;
  maxCommunities: number;
  currentCount: number;
  userId: number | null;
  reason?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { canCreate: false, tier: "free", maxCommunities: 0, currentCount: 0, userId: null, reason: "Not logged in" };
  
  const tierType = getSubscriptionTierType(user.subscriptionTier);
  
  if (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date()) {
    return { 
      canCreate: false, 
      tier: "free", 
      maxCommunities: 0, 
      currentCount: 0, 
      userId: user.id, 
      reason: "Subscription has expired" 
    };
  }
  
  const maxCommunities = getMaxCommunitiesForTier(tierType);
  const currentCount = await getCreatorCommunityCount(user.id);
  
  if (maxCommunities === 0) {
    return { 
      canCreate: false, 
      tier: tierType, 
      maxCommunities, 
      currentCount, 
      userId: user.id, 
      reason: "Free tier users cannot create communities. Upgrade to Pro or Creator." 
    };
  }
  
  if (currentCount >= maxCommunities && maxCommunities !== Infinity) {
    return { 
      canCreate: false, 
      tier: tierType, 
      maxCommunities, 
      currentCount, 
      userId: user.id, 
      reason: tierType === "pro" 
        ? "Pro tier allows 1 community. Upgrade to Creator for unlimited communities." 
        : `You have reached the maximum of ${maxCommunities} communities.`
    };
  }
  
  return { canCreate: true, tier: tierType, maxCommunities, currentCount, userId: user.id };
}

export async function checkProAccess(): Promise<{ hasAccess: boolean; tier: string | null; userId: number | null }> {
  const user = await getCurrentUser();
  if (!user) return { hasAccess: false, tier: null, userId: null };
  
  const tier = user.subscriptionTier?.toLowerCase();
  
  const isProOrHigher = tier?.includes("pro") || tier?.includes("creator");
  
  if (!isProOrHigher) {
    return { hasAccess: false, tier: tier || null, userId: user.id };
  }
  
  if (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date()) {
    return { hasAccess: false, tier: tier, userId: user.id };
  }
  
  return { hasAccess: true, tier: tier, userId: user.id };
}

export async function checkAdminAccess(): Promise<{ isAdmin: boolean; userId: number | null }> {
  const cookieStore = await cookies();
  const adminSessionCookie = cookieStore.get("admin_session");
  
  if (!adminSessionCookie?.value) {
    return { isAdmin: false, userId: null };
  }
  
  const session = await prisma.session.findUnique({
    where: { token: adminSessionCookie.value },
    include: {
      user: {
        include: {
          roles: {
            select: { name: true }
          }
        }
      }
    }
  });
  
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      try {
        await prisma.session.delete({ where: { id: session.id } });
      } catch {
      }
    }
    return { isAdmin: false, userId: null };
  }
  
  const isAdmin = session.user.roles.some(role => role.name.toLowerCase() === "admin");
  return { isAdmin, userId: session.userId };
}

export async function checkCommunityOwnership(communityId: number): Promise<{ 
  isOwner: boolean; 
  isAdmin: boolean;
  canManage: boolean;
  userId: number | null;
  membership: { role: string } | null;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { isOwner: false, isAdmin: false, canManage: false, userId: null, membership: null };
  }

  const { isAdmin } = await checkAdminAccess();
  
  const membership = await prisma.communityMember.findFirst({
    where: { communityId, userId },
    select: { role: true }
  });

  const isOwner = membership?.role === "owner";
  const isCommunityAdmin = membership?.role === "admin";
  const canManage = isOwner || isCommunityAdmin || isAdmin;

  return { isOwner, isAdmin, canManage, userId, membership };
}

export async function checkCommunityAccess(communityId: number): Promise<{
  canManage: boolean;
  canModerate: boolean;
  isMember: boolean;
  role: string | null;
  userId: number | null;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { canManage: false, canModerate: false, isMember: false, role: null, userId: null };
  }

  const { isAdmin } = await checkAdminAccess();
  
  const membership = await prisma.communityMember.findFirst({
    where: { communityId, userId },
    select: { role: true }
  });

  if (!membership) {
    return { 
      canManage: isAdmin, 
      canModerate: isAdmin, 
      isMember: false, 
      role: null, 
      userId 
    };
  }

  const role = membership.role;
  const canManage = role === "owner" || role === "admin" || isAdmin;
  const canModerate = canManage || role === "moderator";
  const isMember = role !== "pending" && role !== "blocked";

  return { canManage, canModerate, isMember, role, userId };
}
