import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) return null;
    return session.user.id;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedule = await prisma.dailySurveySchedule.findFirst({
      where: {
        scheduledDate: today,
        status: "published"
      },
      include: {
        topic: {
          include: {
            polls: {
              where: {
                status: "published",
                isActive: true
              },
              include: {
                options: {
                  orderBy: { sortOrder: "asc" }
                }
              },
              take: 1
            }
          }
        }
      }
    });

    const activePoll = await prisma.poll.findFirst({
      where: {
        status: "published",
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      },
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
    });

    if (!activePoll && !schedule?.topic?.polls?.[0]) {
      return NextResponse.json({ poll: null, hasVoted: false });
    }

    const poll = activePoll || schedule?.topic?.polls?.[0];
    if (!poll) {
      return NextResponse.json({ poll: null, hasVoted: false });
    }

    let hasVoted = false;
    let userResponse = null;

    if (userId) {
      const existingResponse = await prisma.pollResponse.findUnique({
        where: {
          pollId_userId: {
            pollId: poll.id,
            userId: userId
          }
        }
      });
      hasVoted = !!existingResponse;
      userResponse = existingResponse;
    }

    const totalResponses = (poll as any)._count?.responses ?? 
      await prisma.pollResponse.count({ where: { pollId: poll.id } });

    const pollWithStats = {
      id: poll.id,
      question: poll.question,
      pollType: poll.pollType,
      description: poll.description,
      imageUrl: poll.imageUrl,
      isAnonymous: poll.isAnonymous,
      showResults: poll.showResults,
      resultsVisibility: poll.resultsVisibility,
      topic: (poll as any).topic?.title ? { title: (poll as any).topic.title, category: (poll as any).topic.category } : (poll as any).topic,
      options: poll.options.map((opt: any) => ({
        id: opt.id,
        label: opt.label,
        description: opt.description,
        imageUrl: opt.imageUrl,
        responseCount: hasVoted || poll.resultsVisibility === "always" 
          ? (opt._count?.responses || 0)
          : undefined,
        percentage: hasVoted || poll.resultsVisibility === "always"
          ? (totalResponses > 0 ? Math.round(((opt._count?.responses || 0) / totalResponses) * 100) : 0)
          : undefined
      })),
      totalResponses: hasVoted || poll.resultsVisibility === "always" ? totalResponses : undefined,
      createdAt: poll.createdAt
    };

    return NextResponse.json({
      poll: pollWithStats,
      hasVoted,
      userResponse: userResponse ? {
        optionId: userResponse.optionId,
        responseText: userResponse.responseText,
        ratingValue: userResponse.ratingValue
      } : null
    });
  } catch (error) {
    console.error("Error fetching today's poll:", error);
    return NextResponse.json(
      { error: "Failed to fetch poll" },
      { status: 500 }
    );
  }
}
