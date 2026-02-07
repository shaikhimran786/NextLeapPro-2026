import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkCreatorAccess, checkAdminAccess, getCurrentUserId } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const eventId = parseInt(id);
    
    if (isNaN(eventId)) {
      const event = await prisma.event.findUnique({
        where: { slug: id },
        include: {
          organizer: {
            select: { id: true, firstName: true, lastName: true, avatar: true, bio: true }
          },
          ticketTypes: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          },
          _count: { select: { registrations: true } },
        },
      });

      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      if (event.status !== "published") {
        const userId = await getCurrentUserId();
        const { isAdmin } = await checkAdminAccess();
        if (!isAdmin && event.organizerId !== userId) {
          return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }
      }

      await prisma.event.update({
        where: { id: event.id },
        data: { viewCount: { increment: 1 } }
      });

      const currentUserId = await getCurrentUserId();
      let userRegistration = null;
      if (currentUserId) {
        userRegistration = await prisma.eventRegistration.findFirst({
          where: { eventId: event.id, userId: currentUserId },
          include: { ticketType: true }
        });
      }

      const showVirtualLink = !event.virtualLinkHidden || 
        (userRegistration && userRegistration.status === "approved");

      return NextResponse.json({
        ...event,
        onlineLink: showVirtualLink ? event.onlineLink : null,
        userRegistration,
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, avatar: true, bio: true }
        },
        ticketTypes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "published") {
      const userId = await getCurrentUserId();
      const { isAdmin } = await checkAdminAccess();
      if (!isAdmin && event.organizerId !== userId) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
    }

    await prisma.event.update({
      where: { id: event.id },
      data: { viewCount: { increment: 1 } }
    });

    const currentUserId = await getCurrentUserId();
    let userRegistration = null;
    if (currentUserId) {
      userRegistration = await prisma.eventRegistration.findFirst({
        where: { eventId: event.id, userId: currentUserId },
        include: { ticketType: true }
      });
    }

    const showVirtualLink = !event.virtualLinkHidden || 
      (userRegistration && userRegistration.status === "approved");

    return NextResponse.json({
      ...event,
      onlineLink: showVirtualLink ? event.onlineLink : null,
      userRegistration,
    });
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
    const { isAdmin, userId: adminUserId } = await checkAdminAccess();
    const { hasAccess: isCreator, userId: creatorUserId } = await checkCreatorAccess();
    
    const userId = isAdmin ? adminUserId : creatorUserId;
    const canEdit = isAdmin || isCreator;
    
    if (!canEdit || !userId) {
      return NextResponse.json({ error: "Creator subscription required" }, { status: 403 });
    }

    const eventId = parseInt(id);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!isAdmin && event.organizerId !== userId) {
      return NextResponse.json({ error: "You can only edit your own events" }, { status: 403 });
    }

    const data = await request.json();

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
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
        status: data.status === "published" || data.status === "draft" ? data.status : undefined,
        requiresApproval: data.requiresApproval,
        maxTickets: data.maxTickets,
        agenda: data.agenda,
        sponsors: data.sponsors,
        speakers: data.speakers,
        faqs: data.faqs,
      },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
      },
    });

    return NextResponse.json(updatedEvent);
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
    const { isAdmin, userId: adminUserId } = await checkAdminAccess();
    const { hasAccess: isCreator, userId: creatorUserId } = await checkCreatorAccess();
    
    const userId = isAdmin ? adminUserId : creatorUserId;
    const canDelete = isAdmin || isCreator;
    
    if (!canDelete || !userId) {
      return NextResponse.json({ error: "Creator subscription required" }, { status: 403 });
    }

    const eventId = parseInt(id);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!isAdmin && event.organizerId !== userId) {
      return NextResponse.json({ error: "You can only delete your own events" }, { status: 403 });
    }

    if (event._count.registrations > 0 && event.status === "published") {
      return NextResponse.json({ 
        error: "Cannot delete a published event with registrations. Please cancel the event first and notify attendees.",
        hasRegistrations: true
      }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
