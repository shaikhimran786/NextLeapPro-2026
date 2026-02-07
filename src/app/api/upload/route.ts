import { NextRequest, NextResponse } from "next/server";
import { objectStorageService, EntityType, ImageType } from "@/lib/object-storage";
import { getCurrentUserId, checkAdminAccess, checkCommunityAccess } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

interface UploadRequest {
  entityType: EntityType;
  entityId: number | string;
  imageType: ImageType;
}

async function validateOwnership(
  userId: number,
  entityType: EntityType,
  entityId: number | string,
  isAdmin: boolean
): Promise<{ allowed: boolean; error?: string }> {
  if (isAdmin) {
    return { allowed: true };
  }

  switch (entityType) {
    case "users": {
      if (Number(entityId) !== userId) {
        return { allowed: false, error: "You can only upload images for your own profile" };
      }
      return { allowed: true };
    }

    case "communities": {
      const { canManage } = await checkCommunityAccess(Number(entityId));
      if (!canManage) {
        return { allowed: false, error: "You must be a community owner or admin to upload images" };
      }
      return { allowed: true };
    }

    case "chapters": {
      const chapter = await prisma.chapter.findUnique({
        where: { id: Number(entityId) },
        select: { communityId: true },
      });
      if (!chapter) {
        return { allowed: false, error: "Chapter not found" };
      }
      const { canManage } = await checkCommunityAccess(chapter.communityId);
      if (!canManage) {
        return { allowed: false, error: "You must be a community owner or admin to upload chapter images" };
      }
      return { allowed: true };
    }

    case "events": {
      const event = await prisma.event.findUnique({
        where: { id: Number(entityId) },
        select: { organizerId: true },
      });
      if (!event) {
        return { allowed: false, error: "Event not found" };
      }
      if (event.organizerId !== userId) {
        return { allowed: false, error: "You can only upload images for events you organize" };
      }
      return { allowed: true };
    }

    case "services": {
      const service = await prisma.service.findUnique({
        where: { id: Number(entityId) },
        select: { providerId: true },
      });
      if (!service) {
        return { allowed: false, error: "Service not found" };
      }
      if (service.providerId !== userId) {
        return { allowed: false, error: "You can only upload images for your own services" };
      }
      return { allowed: true };
    }

    case "static": {
      return { allowed: false, error: "Only admins can upload static assets" };
    }

    default:
      return { allowed: false, error: "Invalid entity type" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isAdmin } = await checkAdminAccess();
    const body: UploadRequest = await request.json();
    const { entityType, entityId, imageType } = body;

    if (!entityType || !entityId || !imageType) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, entityId, imageType" },
        { status: 400 }
      );
    }

    const validEntityTypes: EntityType[] = ["users", "communities", "chapters", "events", "services", "static"];
    const validImageTypes: ImageType[] = ["avatar", "logo", "cover", "image"];

    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }
    if (!validImageTypes.includes(imageType)) {
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
    }

    const ownershipResult = await validateOwnership(userId, entityType, entityId, isAdmin);
    if (!ownershipResult.allowed) {
      return NextResponse.json({ error: ownershipResult.error }, { status: 403 });
    }

    const { uploadURL, objectPath } = await objectStorageService.getUploadURL(
      entityType,
      entityId,
      imageType
    );

    return NextResponse.json({ uploadURL, objectPath });
  } catch (error) {
    console.error("Upload URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isAdmin } = await checkAdminAccess();
    const body = await request.json();
    const { entityType, entityId, imageType, objectPath } = body;

    if (!entityType || !entityId || !imageType || !objectPath) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ownershipResult = await validateOwnership(userId, entityType, entityId, isAdmin);
    if (!ownershipResult.allowed) {
      return NextResponse.json({ error: ownershipResult.error }, { status: 403 });
    }

    const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
      objectPath,
      {
        owner: String(userId),
        visibility: "public",
      }
    );

    return NextResponse.json({ 
      objectPath: normalizedPath,
      message: "Image uploaded successfully" 
    });
  } catch (error) {
    console.error("Upload confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isAdmin } = await checkAdminAccess();
    const body = await request.json();
    const { entityType, entityId, objectPath } = body;

    if (!entityType || !entityId || !objectPath) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ownershipResult = await validateOwnership(userId, entityType, entityId, isAdmin);
    if (!ownershipResult.allowed) {
      return NextResponse.json({ error: ownershipResult.error }, { status: 403 });
    }

    const deleted = await objectStorageService.deleteObject(objectPath);

    return NextResponse.json({ 
      success: deleted,
      message: deleted ? "Image deleted successfully" : "Failed to delete image"
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
