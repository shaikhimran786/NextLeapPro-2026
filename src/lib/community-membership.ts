export type CommunityJoinIntent = "open" | "approval" | "invite";

export function resolveJoinIntent(
  membershipType: string | null | undefined,
  isPublic: boolean,
): CommunityJoinIntent {
  if (membershipType === "invite") return "invite";
  if (membershipType === "approval") return "approval";
  if (membershipType === "open") return "open";
  return isPublic ? "open" : "approval";
}

export type CommunityJoinRole = "member" | "pending" | "invite_only";

const INTENT_TO_ROLE: Record<CommunityJoinIntent, CommunityJoinRole> = {
  open: "member",
  approval: "pending",
  invite: "invite_only",
};

export function resolveJoinRole(
  membershipType: string | null | undefined,
  isPublic: boolean,
): CommunityJoinRole {
  return INTENT_TO_ROLE[resolveJoinIntent(membershipType, isPublic)];
}
