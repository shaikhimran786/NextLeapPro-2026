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
    const { scheduledDate, topicId, status = "scheduled" } = body;

    if (!scheduledDate || !topicId) {
      return NextResponse.json(
        { error: "Scheduled date and topic ID are required" },
        { status: 400 }
      );
    }

    const existingSchedule = await prisma.dailySurveySchedule.findFirst({
      where: {
        scheduledDate: new Date(scheduledDate)
      }
    });

    if (existingSchedule) {
      return NextResponse.json(
        { error: "A survey is already scheduled for this date" },
        { status: 400 }
      );
    }

    const schedule = await prisma.dailySurveySchedule.create({
      data: {
        scheduledDate: new Date(scheduledDate),
        topicId,
        publishedById: userId,
        status
      },
      include: {
        topic: true
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: userId!,
        action: "create_survey_schedule",
        target: `DailySurveySchedule:${schedule.id}`,
        details: { scheduledDate, topicId }
      }
    });

    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { isAdmin, userId } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    await prisma.dailySurveySchedule.delete({
      where: { id: parseInt(id) }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: userId!,
        action: "delete_survey_schedule",
        target: `DailySurveySchedule:${id}`,
        details: {}
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
