import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const chapterId = parseInt(id);

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const chapterId = parseInt(id);
    const body = await req.json();

    const existingChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const { name, slug, description, location, leaderId, logo, isActive, communityId } = body;

    if (slug && slug !== existingChapter.slug) {
      const targetCommunityId = communityId ? parseInt(communityId) : existingChapter.communityId;
      const duplicateSlug = await prisma.chapter.findFirst({
        where: {
          communityId: targetCommunityId,
          slug: slug,
          id: { not: chapterId },
        },
      });

      if (duplicateSlug) {
        return NextResponse.json(
          { error: "A chapter with this slug already exists in this community" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description || null;
    if (location !== undefined) updateData.location = location || null;
    if (leaderId !== undefined) updateData.leaderId = leaderId ? parseInt(leaderId) : null;
    if (logo !== undefined) updateData.logo = logo || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (communityId !== undefined) updateData.communityId = parseInt(communityId);

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const chapterId = parseInt(id);

    const existingChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json({ success: true, message: "Chapter deleted successfully" });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 });
  }
}
