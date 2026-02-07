import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        registrations: {
          include: { 
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            ticketType: true
          }
        },
        ticketTypes: {
          orderBy: { sortOrder: 'asc' }
        }
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { isAdmin, userId: adminId } = await checkAdminAccess();
    if (!isAdmin || !adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await request.json();

    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        title: data.title,
        shortDescription: data.shortDescription,
        description: data.description,
        coverImage: data.coverImage,
        theme: data.theme,
        category: data.category,
        tags: data.tags,
        level: data.level,
        eventType: data.eventType,
        mode: data.mode,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        timezone: data.timezone,
        capacity: data.capacity,
        price: data.price !== undefined ? data.price : undefined,
        currency: data.currency,
        venue: data.venue,
        venueAddress: data.venueAddress,
        venueMapUrl: data.venueMapUrl,
        onlineLink: data.onlineLink,
        virtualLinkHidden: data.virtualLinkHidden,
        status: data.status,
        featured: data.featured,
        requiresApproval: data.requiresApproval,
        maxTickets: data.maxTickets,
        agenda: data.agenda,
        sponsors: data.sponsors,
        speakers: data.speakers,
        faqs: data.faqs,
        organizerId: data.organizerId,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "update_event",
        target: `Event #${id}: ${event.title}`,
        details: { changes: data },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { isAdmin, userId: adminId } = await checkAdminAccess();
    if (!isAdmin || !adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.event.delete({
      where: { id: parseInt(id) },
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "delete_event",
        target: `Event #${id}: ${event.title}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
