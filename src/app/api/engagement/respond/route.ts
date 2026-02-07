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

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    
    const body = await request.json();
    const { pollId, optionId, responseText, ratingValue } = body;

    if (!pollId) {
      return NextResponse.json(
        { error: "Poll ID is required" },
        { status: 400 }
      );
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    });

    if (!poll) {
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      );
    }

    if (poll.status !== "published" || !poll.isActive) {
      return NextResponse.json(
        { error: "This poll is no longer accepting responses" },
        { status: 400 }
      );
    }

    if (poll.endDate && new Date(poll.endDate) < new Date()) {
      return NextResponse.json(
        { error: "This poll has ended" },
        { status: 400 }
      );
    }

    if (poll.pollType === "single" || poll.pollType === "multi") {
      if (!optionId) {
        return NextResponse.json(
          { error: "Please select an option" },
          { status: 400 }
        );
      }

      const validOption = poll.options.find(opt => opt.id === optionId);
      if (!validOption) {
        return NextResponse.json(
          { error: "Invalid option selected" },
          { status: 400 }
        );
      }
    }

    if (poll.pollType === "scale" && (ratingValue === undefined || ratingValue === null)) {
      return NextResponse.json(
        { error: "Please provide a rating" },
        { status: 400 }
      );
    }

    if (poll.pollType === "open" && !responseText?.trim()) {
      return NextResponse.json(
        { error: "Please provide a response" },
        { status: 400 }
      );
    }

    if (userId) {
      const existingResponse = await prisma.pollResponse.findUnique({
        where: {
          pollId_userId: {
            pollId,
            userId
          }
        }
      });

      if (existingResponse) {
        return NextResponse.json(
          { error: "You have already responded to this poll" },
          { status: 400 }
        );
      }
    }

    const response = await prisma.pollResponse.create({
      data: {
        pollId,
        optionId: optionId || null,
        userId: poll.isAnonymous ? null : userId,
        responseText: responseText || null,
        ratingValue: ratingValue ?? null,
        metadata: userId ? undefined : { anonymous: true }
      }
    });

    const updatedPoll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
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

    const totalResponses = updatedPoll?._count.responses || 0;

    return NextResponse.json({
      success: true,
      response: {
        id: response.id,
        optionId: response.optionId
      },
      results: poll.showResults ? {
        totalResponses,
        options: updatedPoll?.options.map(opt => ({
          id: opt.id,
          label: opt.label,
          responseCount: opt._count.responses,
          percentage: totalResponses > 0 
            ? Math.round((opt._count.responses / totalResponses) * 100) 
            : 0
        }))
      } : undefined
    });
  } catch (error) {
    console.error("Error submitting poll response:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
