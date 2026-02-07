import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkCreatorAccess, checkAdminAccess } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const mode = searchParams.get("mode");
    const status = searchParams.get("status") || "published";
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};
    
    if (status === "published") {
      where.status = "published";
    }
    
    if (category) {
      where.category = category;
    }
    
    if (mode) {
      where.mode = mode;
    }
    
    if (featured === "true") {
      where.featured = true;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        _count: { select: { registrations: true } },
      },
      orderBy: [
        { featured: 'desc' },
        { startDate: 'asc' },
      ],
      take: limit,
      skip: offset,
    });

    const total = await prisma.event.count({ where });

    return NextResponse.json({ events, total, limit, offset });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isAdmin, userId: adminUserId } = await checkAdminAccess();
    const { hasAccess: isCreator, userId: creatorUserId } = await checkCreatorAccess();
    
    const userId = isAdmin ? adminUserId : creatorUserId;
    const canCreate = isAdmin || isCreator;
    
    if (!canCreate || !userId) {
      return NextResponse.json({ 
        error: "Creator subscription required to create events",
        requiresUpgrade: true 
      }, { status: 403 });
    }

    const data = await request.json();

    if (!data.title || !data.description || !data.category || !data.eventType || !data.startDate || !data.endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseSlug = generateSlug(data.title);
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.event.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        shortDescription: data.shortDescription || null,
        description: data.description,
        coverImage: data.coverImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
        theme: data.theme || "default",
        category: data.category,
        tags: data.tags || [],
        level: data.level || "beginner",
        eventType: data.eventType,
        mode: data.mode || "online",
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        timezone: data.timezone || "IST",
        capacity: data.capacity || null,
        price: data.price || 0,
        currency: data.currency || "INR",
        venue: data.venue || null,
        venueAddress: data.venueAddress || null,
        venueMapUrl: data.venueMapUrl || null,
        onlineLink: data.onlineLink || null,
        virtualLinkHidden: data.virtualLinkHidden ?? true,
        status: "draft",
        featured: false,
        requiresApproval: data.requiresApproval || false,
        maxTickets: data.maxTickets || null,
        agenda: data.agenda || null,
        sponsors: data.sponsors || null,
        speakers: data.speakers || null,
        faqs: data.faqs || null,
        organizerId: userId,
        createdByAdmin: isAdmin,
      },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
