import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin, userId } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const topicId = parseInt(id);
    const body = await request.json();

    const topic = await prisma.engagementTopic.update({
      where: { id: topicId },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        visibility: body.visibility,
        targetAudience: body.targetAudience,
        isActive: body.isActive
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: userId!,
        action: "update_engagement_topic",
        target: `EngagementTopic:${topicId}`,
        details: body
      }
    });

    return NextResponse.json({ success: true, topic });
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json(
      { error: "Failed to update topic" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin, userId } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const topicId = parseInt(id);

    await prisma.engagementTopic.delete({
      where: { id: topicId }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: userId!,
        action: "delete_engagement_topic",
        target: `EngagementTopic:${topicId}`,
        details: {}
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 }
    );
  }
}
