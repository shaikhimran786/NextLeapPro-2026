import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const { isAdmin, userId } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, category, visibility, targetAudience } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const topic = await prisma.engagementTopic.create({
      data: {
        title,
        description: description || null,
        category: category || "general",
        visibility: visibility || "public",
        targetAudience: targetAudience || [],
        isActive: true
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: userId!,
        action: "create_engagement_topic",
        target: `EngagementTopic:${topic.id}`,
        details: { title }
      }
    });

    return NextResponse.json({ success: true, topic });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
