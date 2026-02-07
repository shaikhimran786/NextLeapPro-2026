import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const communities = await prisma.community.findMany({
      include: {
        _count: { select: { members: true } },
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(communities);
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isAdmin, userId: adminId } = await checkAdminAccess();
    if (!isAdmin || !adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await request.json();

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Check if slug already exists
    const existingCommunity = await prisma.community.findUnique({
      where: { slug },
    });

    if (existingCommunity) {
      return NextResponse.json(
        { error: "A community with this name already exists" },
        { status: 400 }
      );
    }

    const community = await prisma.community.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        shortDescription: data.shortDescription || null,
        logo: data.logo || "",
        coverImage: data.coverImage || null,
        category: data.category,
        tags: data.tags || [],
        location: data.location || null,
        city: data.city || null,
        country: data.country || null,
        timezone: data.timezone || "Asia/Kolkata",
        language: data.language || "English",
        website: data.website || null,
        mode: data.mode || "hybrid",
        membershipType: data.membershipType || "open",
        meetupFrequency: data.meetupFrequency || null,
        maxMembers: data.maxMembers || null,
        primaryColor: data.primaryColor || null,
        featured: data.featured ?? false,
        verified: data.verified ?? false,
        isPublic: data.isPublic ?? true,
        createdByAdmin: true,
        creatorId: null,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "create_community",
        target: `Community #${community.id}: ${community.name}`,
        details: { data },
      },
    });

    return NextResponse.json(community, { status: 201 });
  } catch (error) {
    console.error("Error creating community:", error);
    return NextResponse.json({ error: "Failed to create community" }, { status: 500 });
  }
}
