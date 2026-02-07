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
    const {
      topicId,
      question,
      pollType = "single",
      description,
      imageUrl,
      isAnonymous = false,
      showResults = true,
      resultsVisibility = "after_vote",
      startDate,
      endDate,
      status = "draft",
      options = []
    } = body;

    if (!topicId || !question) {
      return NextResponse.json(
        { error: "Topic ID and question are required" },
        { status: 400 }
      );
    }

    if (options.length < 2) {
      return NextResponse.json(
        { error: "At least 2 options are required" },
        { status: 400 }
      );
    }

    const poll = await prisma.poll.create({
      data: {
        topicId,
        question,
        pollType,
        description,
        imageUrl,
        isAnonymous,
        showResults,
        resultsVisibility,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status,
        isActive: true,
        options: {
          create: options.map((opt: any, index: number) => ({
            label: opt.label,
            description: opt.description || null,
            imageUrl: opt.imageUrl || null,
            sortOrder: index
          }))
        }
      },
      include: {
        topic: true,
        options: {
          orderBy: { sortOrder: "asc" }
        }
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: userId!,
        action: "create_poll",
        target: `Poll:${poll.id}`,
        details: { question, optionsCount: options.length }
      }
    });

    return NextResponse.json({ success: true, poll });
  } catch (error) {
    console.error("Error creating poll:", error);
    return NextResponse.json(
      { error: "Failed to create poll" },
      { status: 500 }
    );
  }
}
