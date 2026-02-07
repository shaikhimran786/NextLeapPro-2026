import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const communityId = parseInt(id);
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: parseInt(userId),
      },
      include: {
        community: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this community" },
        { status: 400 }
      );
    }

    if (membership.role === "admin" || membership.role === "owner") {
      const adminCount = await prisma.communityMember.count({
        where: {
          communityId,
          role: { in: ["admin", "owner"] },
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot leave community as the only admin. Transfer ownership first." },
          { status: 400 }
        );
      }
    }

    await prisma.communityMember.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({
      message: `Successfully left ${membership.community.name}`,
    });
  } catch (error) {
    console.error("Leave community error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
