import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const pollId = parseInt(id);

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
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

    if (!poll) {
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      poll: {
        ...poll,
        responseCount: poll._count.responses,
        options: poll.options.map(opt => ({
          ...opt,
          responseCount: opt._count.responses
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
    return NextResponse.json(
      { error: "Failed to fetch poll" },
      { status: 500 }
    );
  }
}

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
    const pollId = parseInt(id);
    const body = await request.json();

    const updateData: any = {};
    
    if (body.question !== undefined) updateData.question = body.question;
    if (body.pollType !== undefined) updateData.pollType = body.pollType;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.isAnonymous !== undefined) updateData.isAnonymous = body.isAnonymous;
    if (body.showResults !== undefined) updateData.showResults = body.showResults;
    if (body.resultsVisibility !== undefined) updateData.resultsVisibility = body.resultsVisibility;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const poll = await prisma.poll.update({
      where: { id: pollId },
      data: updateData,
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
        action: "update_poll",
        target: `Poll:${pollId}`,
        details: updateData
      }
    });

    return NextResponse.json({ success: true, poll });
  } catch (error) {
    console.error("Error updating poll:", error);
    return NextResponse.json(
      { error: "Failed to update poll" },
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
    const pollId = parseInt(id);

    await prisma.poll.delete({
      where: { id: pollId }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: userId!,
        action: "delete_poll",
        target: `Poll:${pollId}`,
        details: {}
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting poll:", error);
    return NextResponse.json(
      { error: "Failed to delete poll" },
      { status: 500 }
    );
  }
}
