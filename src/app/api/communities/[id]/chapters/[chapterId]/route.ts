import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkCommunityAccess } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{ id: string; chapterId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, chapterId } = await params;
    const communityId = parseInt(id);
    const chapterIdNum = parseInt(chapterId);

    if (isNaN(communityId) || isNaN(chapterIdNum)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterIdNum,
        communityId,
      },
      include: {
        community: {
          select: { id: true, name: true, slug: true },
        },
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Get chapter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, chapterId } = await params;
    const communityId = parseInt(id);
    const chapterIdNum = parseInt(chapterId);

    if (isNaN(communityId) || isNaN(chapterIdNum)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const { canManage, userId } = await checkCommunityAccess(communityId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManage) {
      return NextResponse.json(
        { error: "You must be a community owner or admin to edit chapters" },
        { status: 403 }
      );
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterIdNum,
        communityId,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const data = await request.json();
    const { name, slug, description, location, leaderId, logo, isActive } = data;

    if (slug && slug !== chapter.slug) {
      const existingChapter = await prisma.chapter.findFirst({
        where: {
          communityId,
          slug,
          NOT: { id: chapterIdNum },
        },
      });

      if (existingChapter) {
        return NextResponse.json(
          { error: "A chapter with this slug already exists in this community" },
          { status: 400 }
        );
      }
    }

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterIdNum },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(logo !== undefined && { logo }),
        ...(leaderId !== undefined && { leaderId: leaderId ? parseInt(leaderId) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      chapter: updatedChapter,
      message: `Chapter "${updatedChapter.name}" updated successfully`,
    });
  } catch (error) {
    console.error("Update chapter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, chapterId } = await params;
    const communityId = parseInt(id);
    const chapterIdNum = parseInt(chapterId);

    if (isNaN(communityId) || isNaN(chapterIdNum)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const { canManage, userId } = await checkCommunityAccess(communityId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManage) {
      return NextResponse.json(
        { error: "You must be a community owner or admin to delete chapters" },
        { status: 403 }
      );
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterIdNum,
        communityId,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    await prisma.chapter.delete({
      where: { id: chapterIdNum },
    });

    return NextResponse.json({
      message: `Chapter "${chapter.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Delete chapter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
