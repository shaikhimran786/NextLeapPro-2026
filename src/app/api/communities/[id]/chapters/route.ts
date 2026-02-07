import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkCommunityAccess, checkAdminAccess } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const communityId = parseInt(id);

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const chapters = await prisma.chapter.findMany({
      where: {
        communityId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error("Get chapters error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const communityId = parseInt(id);

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const { canManage, userId } = await checkCommunityAccess(communityId);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!canManage) {
      return NextResponse.json(
        { error: "You must be a community owner or admin to create chapters" },
        { status: 403 }
      );
    }

    const { name, slug, description, location, leaderId, logo } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const existingChapter = await prisma.chapter.findFirst({
      where: {
        communityId,
        slug,
      },
    });

    if (existingChapter) {
      return NextResponse.json(
        { error: "A chapter with this slug already exists in this community" },
        { status: 400 }
      );
    }

    const chapter = await prisma.chapter.create({
      data: {
        communityId,
        name,
        slug,
        description,
        location,
        logo,
        leaderId: leaderId ? parseInt(leaderId) : null,
        isActive: true,
      },
    });

    return NextResponse.json({
      chapter,
      message: `Chapter "${name}" created successfully`,
    });
  } catch (error) {
    console.error("Create chapter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
