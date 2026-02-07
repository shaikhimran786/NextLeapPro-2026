import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkCommunityAccess } from "@/lib/auth-utils";

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

    const communityEvents = await prisma.communityEvent.findMany({
      where: { communityId },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            registrations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ events: communityEvents });
  } catch (error) {
    console.error("Get community events error:", error);
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
    const { eventId, isFeatured } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

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
        { error: "You must be a community owner or admin to associate events" },
        { status: 403 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const existingAssociation = await prisma.communityEvent.findFirst({
      where: {
        communityId,
        eventId: parseInt(eventId),
      },
    });

    if (existingAssociation) {
      return NextResponse.json(
        { error: "Event is already associated with this community" },
        { status: 400 }
      );
    }

    const communityEvent = await prisma.communityEvent.create({
      data: {
        communityId,
        eventId: parseInt(eventId),
        isFeatured: isFeatured || false,
      },
      include: {
        event: true,
        community: true,
      },
    });

    return NextResponse.json({
      communityEvent,
      message: `Event "${event.title}" associated with ${community.name}`,
    });
  } catch (error) {
    console.error("Associate event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
