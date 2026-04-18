"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth-utils";
import { resolveJoinRole } from "@/lib/community-membership";

export async function joinCommunity(communityId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
  });

  if (!community) {
    throw new Error("Community not found");
  }

  const existingMembership = await prisma.communityMember.findFirst({
    where: { communityId, userId },
  });

  if (existingMembership) {
    if (existingMembership.role === "invited") {
      throw new Error("You have an invite — accept it instead of joining.");
    }
    throw new Error("You are already a member of this community");
  }

  const resolved = resolveJoinRole(community.membershipType, community.isPublic);
  if (resolved === "invite_only") {
    throw new Error("This community is invite-only. Please wait for an invitation.");
  }
  const role = resolved;
  const isPending = role === "pending";

  const membership = await prisma.$transaction(async (tx) => {
    const member = await tx.communityMember.create({
      data: {
        communityId,
        userId,
        role,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        userId,
        action: isPending ? "community_join_request" : "community_join",
        target: `Community #${communityId}: ${community.name}`,
        details: { membershipId: member.id, role },
      },
    });

    return member;
  });

  revalidatePath(`/communities/${communityId}`);
  revalidatePath("/communities");

  return {
    success: true,
    membership: {
      id: membership.id,
      role: membership.role,
      isPending,
    },
  };
}

export async function leaveCommunity(communityId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const membership = await prisma.communityMember.findFirst({
    where: { communityId, userId },
  });

  if (!membership) {
    throw new Error("Not a member of this community");
  }

  if (membership.role === "owner") {
    throw new Error("Cannot leave as the community owner. Transfer ownership first.");
  }

  if (membership.role === "admin") {
    const adminCount = await prisma.communityMember.count({
      where: { communityId, role: { in: ["admin", "owner"] } },
    });
    if (adminCount <= 1) {
      throw new Error("Cannot leave as the only admin. Transfer ownership first.");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.communityMember.delete({
      where: { id: membership.id },
    });

    await tx.adminAuditLog.create({
      data: {
        userId,
        action: "community_leave",
        target: `Community #${communityId}`,
        details: { previousRole: membership.role },
      },
    });
  });

  revalidatePath(`/communities/${communityId}`);
  revalidatePath("/communities");

  return { success: true };
}

export async function acceptCommunityInvite(communityId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const membership = await prisma.communityMember.findFirst({
    where: { communityId, userId, role: "invited" },
  });

  if (!membership) {
    throw new Error("No pending invite found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.communityMember.update({
      where: { id: membership.id },
      data: { role: "member" },
    });

    await tx.adminAuditLog.create({
      data: {
        userId,
        action: "community_invite_accepted",
        target: `Community #${communityId}`,
        details: { membershipId: membership.id },
      },
    });
  });

  revalidatePath(`/communities/${communityId}`);
  revalidatePath("/communities");

  return { success: true };
}
