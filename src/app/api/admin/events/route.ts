import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export async function GET() {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        _count: { select: { registrations: true, ticketTypes: true } },
        ticketTypes: {
          select: { id: true, name: true, price: true, quantity: true, soldCount: true }
        },
        communityEvents: {
          include: {
            community: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isAdmin, userId: adminId } = await checkAdminAccess();
    if (!isAdmin || !adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
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
        status: data.status || "draft",
        featured: data.featured || false,
        requiresApproval: data.requiresApproval || false,
        maxTickets: data.maxTickets || null,
        agenda: data.agenda || null,
        sponsors: data.sponsors || null,
        speakers: data.speakers || null,
        faqs: data.faqs || null,
        organizerId: adminId,
        createdByAdmin: true,
      },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "create_event",
        target: `Event #${event.id}: ${event.title}`,
        details: { eventId: event.id, title: event.title },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
