import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const search = searchParams.get("search") || "";

    const where: any = {};
    
    if (communityId) {
      where.communityId = parseInt(communityId);
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const chapters = await prisma.chapter.findMany({
      where,
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isAdmin, userId: adminId } = await checkAdminAccess();
    if (!isAdmin || !adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { communityId, name, slug, description, location, leaderId, logo, isActive } = body;

    if (!communityId || !name || !slug) {
      return NextResponse.json(
        { error: "Community ID, name, and slug are required" },
        { status: 400 }
      );
    }

    const community = await prisma.community.findUnique({
      where: { id: parseInt(communityId) },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const existingChapter = await prisma.chapter.findFirst({
      where: {
        communityId: parseInt(communityId),
        slug: slug,
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
        communityId: parseInt(communityId),
        name,
        slug,
        description: description || null,
        location: location || null,
        leaderId: leaderId ? parseInt(leaderId) : null,
        logo: logo || null,
        isActive: isActive !== false,
      },
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

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
  }
}
