import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export async function POST(
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
    const { communityId } = data;

    if (!communityId) {
      return NextResponse.json({ error: "Community ID required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, title: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const community = await prisma.community.findUnique({
      where: { id: parseInt(communityId) },
      select: { id: true, name: true }
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const existing = await prisma.communityEvent.findUnique({
      where: {
        communityId_eventId: {
          communityId: parseInt(communityId),
          eventId: parseInt(id)
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Event already assigned to this community" }, { status: 400 });
    }

    await prisma.communityEvent.create({
      data: {
        communityId: parseInt(communityId),
        eventId: parseInt(id),
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "assign_event_to_community",
        target: `Event #${id}: ${event.title} → Community: ${community.name}`,
        details: { eventId: parseInt(id), communityId: parseInt(communityId) },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning event to community:", error);
    return NextResponse.json({ error: "Failed to assign event to community" }, { status: 500 });
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

    const data = await request.json();
    const { communityId } = data;

    if (!communityId) {
      return NextResponse.json({ error: "Community ID required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, title: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const community = await prisma.community.findUnique({
      where: { id: parseInt(communityId) },
      select: { id: true, name: true }
    });

    await prisma.communityEvent.delete({
      where: {
        communityId_eventId: {
          communityId: parseInt(communityId),
          eventId: parseInt(id)
        }
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "remove_event_from_community",
        target: `Event #${id}: ${event.title} removed from Community: ${community?.name || communityId}`,
        details: { eventId: parseInt(id), communityId: parseInt(communityId) },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing event from community:", error);
    return NextResponse.json({ error: "Failed to remove event from community" }, { status: 500 });
  }
}
