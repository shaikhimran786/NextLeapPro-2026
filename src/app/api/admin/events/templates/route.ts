import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export async function GET() {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const templates = await prisma.eventTemplate.findMany({
      orderBy: [
        { usageCount: "desc" },
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin, userId } = await checkAdminAccess();
    if (!isAdmin || !userId) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      targetPersona,
      category,
      eventType,
      mode = "online",
      duration,
      agendaJson,
      speakersJson,
      assetsJson,
      tags = [],
      visibility = "public"
    } = body;

    if (!title || !description || !targetPersona || !category || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const template = await prisma.eventTemplate.create({
      data: {
        title,
        description,
        targetPersona,
        category,
        eventType,
        mode,
        duration,
        agendaJson,
        speakersJson,
        assetsJson,
        tags,
        visibility,
        status: "active"
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId,
        action: "create_event_template",
        target: `EventTemplate:${template.id}`,
        details: { title, category }
      }
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
