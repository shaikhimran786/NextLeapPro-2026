import { checkCreatorAccess, checkAdminAccess, getCurrentUser, MAX_CREATOR_COMMUNITIES } from "./auth-utils";
import prisma from "./prisma";

export interface UserPermissions {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  isLearnerOrPro: boolean;
  userId: number | null;
  tier: string | null;
  canCreateEvents: boolean;
  canCreateCommunities: boolean;
  canViewContent: boolean;
  canRegisterForEvents: boolean;
}

export async function getUserPermissions(): Promise<UserPermissions> {
  const user = await getCurrentUser();
  
  if (!user) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      isCreator: false,
      isLearnerOrPro: false,
      userId: null,
      tier: null,
      canCreateEvents: false,
      canCreateCommunities: false,
      canViewContent: true,
      canRegisterForEvents: false,
    };
  }

  const { isAdmin } = await checkAdminAccess();
  const { hasAccess: isCreator, tier } = await checkCreatorAccess();
  
  const isLearnerOrPro = !isAdmin && !isCreator;
  
  return {
    isAuthenticated: true,
    isAdmin,
    isCreator,
    isLearnerOrPro,
    userId: user.id,
    tier,
    canCreateEvents: isAdmin || isCreator,
    canCreateCommunities: isAdmin || isCreator,
    canViewContent: true,
    canRegisterForEvents: true,
  };
}

export async function canEditEvent(eventId: number): Promise<{ allowed: boolean; reason?: string }> {
  const permissions = await getUserPermissions();
  
  if (!permissions.isAuthenticated) {
    return { allowed: false, reason: "Authentication required" };
  }
  
  if (permissions.isAdmin) {
    return { allowed: true };
  }
  
  if (!permissions.isCreator) {
    return { allowed: false, reason: "Creator subscription required" };
  }
  
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true }
  });
  
  if (!event) {
    return { allowed: false, reason: "Event not found" };
  }
  
  if (event.organizerId !== permissions.userId) {
    return { allowed: false, reason: "You can only edit events you created" };
  }
  
  return { allowed: true };
}

export async function canDeleteEvent(eventId: number): Promise<{ allowed: boolean; reason?: string }> {
  return canEditEvent(eventId);
}

export async function canEditCommunity(communityId: number): Promise<{ allowed: boolean; reason?: string }> {
  const permissions = await getUserPermissions();
  
  if (!permissions.isAuthenticated) {
    return { allowed: false, reason: "Authentication required" };
  }
  
  if (permissions.isAdmin) {
    return { allowed: true };
  }
  
  if (!permissions.isCreator) {
    return { allowed: false, reason: "Creator subscription required" };
  }
  
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { creatorId: true }
  });
  
  if (!community) {
    return { allowed: false, reason: "Community not found" };
  }
  
  if (community.creatorId !== permissions.userId) {
    return { allowed: false, reason: "You can only edit communities you created" };
  }
  
  return { allowed: true };
}

export async function canDeleteCommunity(communityId: number): Promise<{ allowed: boolean; reason?: string }> {
  return canEditCommunity(communityId);
}

export async function canCreateCommunity(): Promise<{ allowed: boolean; reason?: string; currentCount?: number; maxCount?: number }> {
  const permissions = await getUserPermissions();
  
  if (!permissions.isAuthenticated) {
    return { allowed: false, reason: "Authentication required" };
  }
  
  if (permissions.isAdmin) {
    return { allowed: true };
  }
  
  if (!permissions.isCreator) {
    return { allowed: false, reason: "Creator subscription required to create communities" };
  }
  
  const communityCount = await prisma.community.count({
    where: { creatorId: permissions.userId! }
  });
  
  if (communityCount >= MAX_CREATOR_COMMUNITIES) {
    return { 
      allowed: false, 
      reason: `You have reached the maximum limit of ${MAX_CREATOR_COMMUNITIES} communities`,
      currentCount: communityCount,
      maxCount: MAX_CREATOR_COMMUNITIES
    };
  }
  
  return { allowed: true, currentCount: communityCount, maxCount: MAX_CREATOR_COMMUNITIES };
}

export async function canCreateEvent(): Promise<{ allowed: boolean; reason?: string }> {
  const permissions = await getUserPermissions();
  
  if (!permissions.isAuthenticated) {
    return { allowed: false, reason: "Authentication required" };
  }
  
  if (permissions.isAdmin) {
    return { allowed: true };
  }
  
  if (!permissions.isCreator) {
    return { allowed: false, reason: "Creator subscription required to create events" };
  }
  
  return { allowed: true };
}

export { MAX_CREATOR_COMMUNITIES };
