export type AuthStatus = "guest" | "logged_in";
export type OnboardingStatus = "not_started" | "in_progress" | "completed";
export type SubscriptionStatus = "none" | "trial" | "active" | "expired" | "cancelled";
export type MembershipStatus = "not_member" | "pending" | "member" | "invited" | "blocked" | "admin" | "moderator" | "owner";
export type EventRegistrationStatus = "not_registered" | "pending" | "registered" | "cancelled" | "attended" | "waitlisted";
export type ServiceOrderStatus = "none" | "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export interface CommunityMembershipInfo {
  status: MembershipStatus;
  role?: string;
  joinedAt?: string;
}

export interface EventRegistrationInfo {
  status: EventRegistrationStatus;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  registeredAt?: string;
  ticketId?: number;
  ticketCode?: string;
}

export interface ServiceOrderInfo {
  status: ServiceOrderStatus;
  orderId?: number;
  bookedAt?: string;
}

export interface ProfileInfo {
  id: number;
  name: string;
  handle: string | null;
  publicUrl: string | null;
  isPublished: boolean;
  completenessScore: number;
}

export interface UserStatus {
  authStatus: AuthStatus;
  userId: number | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  onboardingStatus: OnboardingStatus;
  subscriptionStatus: SubscriptionStatus;
  subscriptionTier: string;
  subscriptionExpiry: string | null;
  subscriptionPlanName: string | null;
  subscriptionInterval: string | null;
  subscriptionDaysRemaining: number | null;
  roles: string[];
  communityMemberships: Record<number, CommunityMembershipInfo>;
  eventRegistrations: Record<number, EventRegistrationInfo>;
  serviceOrders: Record<number, ServiceOrderInfo>;
  serviceAccess: string[];
  profile: ProfileInfo | null;
}

export const defaultGuestStatus: UserStatus = {
  authStatus: "guest",
  userId: null,
  email: null,
  firstName: null,
  lastName: null,
  avatar: null,
  onboardingStatus: "not_started",
  subscriptionStatus: "none",
  subscriptionTier: "free",
  subscriptionExpiry: null,
  subscriptionPlanName: null,
  subscriptionInterval: null,
  subscriptionDaysRemaining: null,
  roles: [],
  communityMemberships: {},
  eventRegistrations: {},
  serviceOrders: {},
  serviceAccess: [],
  profile: null,
};

export function isOnboardingComplete(status: UserStatus): boolean {
  return status.onboardingStatus === "completed";
}

export function hasActiveSubscription(status: UserStatus): boolean {
  return status.subscriptionStatus === "active" || status.subscriptionStatus === "trial";
}

export function isAuthenticated(status: UserStatus): boolean {
  return status.authStatus === "logged_in";
}

export function getMembershipStatus(
  status: UserStatus,
  communityId: number
): MembershipStatus {
  return status.communityMemberships[communityId]?.status || "not_member";
}

export function getEventRegistrationStatus(
  status: UserStatus,
  eventId: number
): EventRegistrationStatus {
  return status.eventRegistrations[eventId]?.status || "not_registered";
}

export function getServiceOrderStatus(
  status: UserStatus,
  serviceId: number
): ServiceOrderStatus {
  return status.serviceOrders[serviceId]?.status || "none";
}

export function hasRole(status: UserStatus, roleName: string): boolean {
  return status.roles.some(role => role.toLowerCase() === roleName.toLowerCase());
}

export function hasAnyRole(status: UserStatus, roleNames: string[]): boolean {
  const lowerRoleNames = roleNames.map(r => r.toLowerCase());
  return status.roles.some(role => lowerRoleNames.includes(role.toLowerCase()));
}

export function isAdmin(status: UserStatus): boolean {
  return hasRole(status, "admin");
}

export function isCreator(status: UserStatus): boolean {
  if (hasRole(status, "creator")) return true;
  
  const tier = status.subscriptionTier?.toLowerCase();
  return tier === "creator_monthly" || tier === "creator_annual" || tier === "creator";
}

export function isMember(status: UserStatus): boolean {
  return hasRole(status, "member") || status.authStatus === "logged_in";
}

export function canAccessAdminPanel(status: UserStatus): boolean {
  return isAdmin(status);
}

export function canCreateCommunity(status: UserStatus): boolean {
  return isCreator(status) || isAdmin(status);
}

export function canManageEvents(status: UserStatus): boolean {
  return isCreator(status) || isAdmin(status);
}

export function getPrimaryRole(status: UserStatus): string {
  if (isAdmin(status)) return "admin";
  if (isCreator(status)) return "creator";
  if (status.authStatus === "logged_in") return "member";
  return "guest";
}

export function isCommunityOwner(status: UserStatus, communityId: number): boolean {
  const membership = status.communityMemberships[communityId];
  return membership?.status === "owner" || membership?.role === "owner";
}

export function isCommunityAdmin(status: UserStatus, communityId: number): boolean {
  const membership = status.communityMemberships[communityId];
  return membership?.status === "admin" || membership?.role === "admin";
}

export function canManageCommunity(status: UserStatus, communityId: number): boolean {
  if (isAdmin(status)) return true;
  const membership = status.communityMemberships[communityId];
  if (!membership) return false;
  return membership.status === "owner" || membership.status === "admin" || 
         membership.role === "owner" || membership.role === "admin";
}

export function canModerateCommunity(status: UserStatus, communityId: number): boolean {
  if (canManageCommunity(status, communityId)) return true;
  const membership = status.communityMemberships[communityId];
  return membership?.status === "moderator" || membership?.role === "moderator";
}
