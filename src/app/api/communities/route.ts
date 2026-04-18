import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserId, checkCommunityCreationAccess, checkAdminAccess } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const owned = searchParams.get("owned");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    if (owned === "true" && userId) {
      const communities = await prisma.community.findMany({
        where: { creatorId: userId },
        include: {
          _count: { select: { members: true } }
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ communities, total: communities.length });
    }

    const where: Record<string, unknown> = {
      isPublic: true,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where: where as any,
        include: {
          members: true,
          chapters: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.community.count({ where: where as any }),
    ]);

    const communitiesWithCounts = communities.map((c: any) => ({
      ...c,
      memberCount: c.members?.length || 0,
      chapterCount: c.chapters?.filter((ch: any) => ch.isActive)?.length || 0,
    }));

    return NextResponse.json({
      communities: communitiesWithCounts,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Get communities error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isAdmin, userId: adminUserId } = await checkAdminAccess();
    
    let userId: number | null = adminUserId;
    let canCreate = isAdmin;
    let errorMessage: string | undefined;
    
    if (!isAdmin) {
      const accessResult = await checkCommunityCreationAccess();
      userId = accessResult.userId;
      canCreate = accessResult.canCreate;
      errorMessage = accessResult.reason;
    }
    
    if (!userId) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }
    
    if (!canCreate) {
      return NextResponse.json(
        { error: errorMessage || "You cannot create communities with your current subscription" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, logo, coverImage, category, tags, location, website, isPublic, shortDescription, mode, membershipType, primaryColor } = body;

    if (!name || !description || !category) {
      return NextResponse.json(
        { error: "Name, description, and category are required" },
        { status: 400 }
      );
    }

    const trimmedName = String(name).trim();
    const trimmedDesc = String(description).trim();

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: "Community name must be 100 characters or less" }, { status: 400 });
    }
    if (trimmedDesc.length > 2000) {
      return NextResponse.json({ error: "Description must be 2000 characters or less" }, { status: 400 });
    }

    const { normalizeSlug, RESERVED_COMMUNITY_SLUGS, isNumericCommunityId } = await import("@/lib/community-slug");
    let slug = normalizeSlug(trimmedName);
    if (!slug || RESERVED_COMMUNITY_SLUGS.has(slug) || isNumericCommunityId(slug)) {
      slug = `community-${Date.now().toString(36)}`;
    }

    const isSlugTaken = async (candidate: string) => {
      const [live, alias] = await Promise.all([
        prisma.community.findFirst({ where: { slug: candidate }, select: { id: true } }),
        prisma.communitySlugAlias.findUnique({ where: { oldSlug: candidate }, select: { id: true } }),
      ]);
      return Boolean(live || alias);
    };

    if (await isSlugTaken(slug)) {
      let suffix = 2;
      while (await isSlugTaken(`${slug}-${suffix}`)) {
        suffix++;
      }
      slug = `${slug}-${suffix}`;
    }

    const validModes = ["online", "hybrid", "in_person"];
    const validMembershipTypes = ["open", "approval", "invite"];

    const community = await prisma.community.create({
      data: {
        name: trimmedName,
        slug,
        description: trimmedDesc,
        shortDescription: shortDescription ? String(shortDescription).trim().slice(0, 200) : null,
        logo: logo || "",
        coverImage: coverImage || null,
        category,
        tags: tags || [],
        location: location || null,
        website: website || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        mode: validModes.includes(mode) ? mode : "hybrid",
        membershipType: validMembershipTypes.includes(membershipType) ? membershipType : "open",
        primaryColor: primaryColor || null,
        creatorId: userId,
        createdByAdmin: isAdmin,
      },
    });

    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: userId,
        role: "owner",
      },
    });

    return NextResponse.json({
      community,
      message: `Community "${name}" created successfully`,
    });
  } catch (error) {
    console.error("Create community error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
