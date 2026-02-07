"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth-utils";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  handle?: string;
  bio?: string;
  avatar?: string;
  skills?: string[];
  socialLinks?: Record<string, string>;
  portfolioLinks?: string[];
  isPublished?: boolean;
}

export async function updateProfile(
  payload: ProfileUpdatePayload
): Promise<ActionResult<{ publicUrl: string | null }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Please log in to update your profile" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (payload.handle) {
      const normalizedHandle = payload.handle.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      
      if (normalizedHandle.length < 3) {
        return { success: false, error: "Handle must be at least 3 characters" };
      }
      
      if (normalizedHandle.length > 30) {
        return { success: false, error: "Handle must be 30 characters or less" };
      }

      const existingUser = await prisma.user.findUnique({
        where: { handle: normalizedHandle },
      });

      if (existingUser && existingUser.id !== userId) {
        return { success: false, error: "This handle is already taken" };
      }

      payload.handle = normalizedHandle;
    }

    const updateData: any = {};

    if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
    if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
    if (payload.handle !== undefined) updateData.handle = payload.handle;
    if (payload.bio !== undefined) updateData.bio = payload.bio;
    if (payload.avatar !== undefined) updateData.avatar = payload.avatar;
    if (payload.skills !== undefined) updateData.skills = payload.skills;
    if (payload.socialLinks !== undefined) updateData.socialLinks = payload.socialLinks;
    if (payload.portfolioLinks !== undefined) updateData.portfolioLinks = payload.portfolioLinks;
    if (payload.isPublished !== undefined) {
      updateData.isPublished = payload.isPublished;
      if (payload.isPublished && payload.handle) {
        updateData.publicSlug = payload.handle;
      } else if (!payload.isPublished) {
        updateData.publicSlug = null;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await prisma.adminAuditLog.create({
      data: {
        userId,
        action: "profile_update",
        target: `user:${userId}`,
        details: {
          updatedFields: Object.keys(updateData),
          isPublished: updatedUser.isPublished,
        },
      },
    });

    revalidatePath("/profile");
    revalidatePath("/profile/edit");
    if (updatedUser.handle) {
      revalidatePath(`/u/${updatedUser.handle}`);
    }

    const publicUrl = updatedUser.isPublished && updatedUser.handle 
      ? `/u/${updatedUser.handle}` 
      : null;

    return { 
      success: true, 
      data: { publicUrl } 
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile. Please try again." };
  }
}

export async function getProfile(): Promise<ActionResult<{
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  handle: string | null;
  avatar: string | null;
  bio: string | null;
  skills: string[];
  socialLinks: Record<string, string> | null;
  portfolioLinks: string[];
  isPublished: boolean;
  publicSlug: string | null;
  subscriptionTier: string;
  onboardingStatus: string;
}>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Please log in to view your profile" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        handle: true,
        avatar: true,
        bio: true,
        skills: true,
        socialLinks: true,
        portfolioLinks: true,
        isPublished: true,
        publicSlug: true,
        subscriptionTier: true,
        onboardingStatus: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      data: {
        ...user,
        socialLinks: user.socialLinks as Record<string, string> | null,
      },
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

export async function publishProfile(): Promise<ActionResult<{ publicUrl: string }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Please log in to publish your profile" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.handle) {
      return { success: false, error: "Please set a handle before publishing your profile" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isPublished: true,
        publicSlug: user.handle,
      },
    });

    revalidatePath("/profile");
    revalidatePath(`/u/${user.handle}`);

    return {
      success: true,
      data: { publicUrl: `/u/${user.handle}` },
    };
  } catch (error) {
    console.error("Error publishing profile:", error);
    return { success: false, error: "Failed to publish profile" };
  }
}

export async function unpublishProfile(): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Please log in to unpublish your profile" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isPublished: false,
        publicSlug: null,
      },
    });

    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Error unpublishing profile:", error);
    return { success: false, error: "Failed to unpublish profile" };
  }
}
