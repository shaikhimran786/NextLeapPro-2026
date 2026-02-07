import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(10).max(1000),
});

type RouteParams = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const resolvedParams = await params;
  const serviceId = parseInt(resolvedParams.id, 10);
  
  if (isNaN(serviceId)) {
    return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
  }

  try {
    const reviews = await prisma.serviceReview.findMany({
      where: { serviceId },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const resolvedParams = await params;
  const serviceId = parseInt(resolvedParams.id, 10);
  
  if (isNaN(serviceId)) {
    return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.providerId === userId) {
      return NextResponse.json(
        { error: "You cannot review your own service" },
        { status: 400 }
      );
    }

    const existingReview = await prisma.serviceReview.findUnique({
      where: {
        serviceId_reviewerId: {
          serviceId,
          reviewerId: userId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this service" },
        { status: 400 }
      );
    }

    const review = await prisma.serviceReview.create({
      data: {
        serviceId,
        reviewerId: userId,
        rating: validatedData.rating,
        title: validatedData.title,
        comment: validatedData.comment,
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    const allReviews = await prisma.serviceReview.findMany({
      where: { serviceId },
      select: { rating: true },
    });

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        rating: Math.round(avgRating * 100) / 100,
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
