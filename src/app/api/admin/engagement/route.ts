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

    const [topics, polls, schedules] = await Promise.all([
      prisma.engagementTopic.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { polls: true, schedules: true }
          }
        }
      }),
      prisma.poll.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          topic: true,
          options: {
            orderBy: { sortOrder: "asc" },
            include: {
              _count: {
                select: { responses: true }
              }
            }
          },
          _count: {
            select: { responses: true }
          }
        }
      }),
      prisma.dailySurveySchedule.findMany({
        orderBy: { scheduledDate: "desc" },
        include: {
          topic: true
        },
        take: 30
      })
    ]);

    return NextResponse.json({
      topics,
      polls: polls.map(poll => ({
        ...poll,
        responseCount: poll._count.responses,
        options: poll.options.map(opt => ({
          ...opt,
          responseCount: opt._count.responses
        }))
      })),
      schedules
    });
  } catch (error) {
    console.error("Error fetching engagement data:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement data" },
      { status: 500 }
    );
  }
}
