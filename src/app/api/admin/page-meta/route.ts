import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const pageMetas = await prisma.pageMeta.findMany({
      orderBy: { page: "asc" },
    });

    return NextResponse.json(pageMetas);
  } catch (error) {
    console.error("Error fetching page meta:", error);
    return NextResponse.json(
      { error: "Failed to fetch page meta" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, title, description, ogImage, structuredData } = body;

    if (!page || !title || !description) {
      return NextResponse.json(
        { error: "Page, title, and description are required" },
        { status: 400 }
      );
    }

    const existingMeta = await prisma.pageMeta.findUnique({
      where: { page },
    });

    if (existingMeta) {
      return NextResponse.json(
        { error: "Page meta for this page already exists" },
        { status: 409 }
      );
    }

    const pageMeta = await prisma.pageMeta.create({
      data: {
        page,
        title,
        description,
        ogImage: ogImage ?? null,
        structuredData: structuredData ?? null,
      },
    });

    return NextResponse.json(pageMeta, { status: 201 });
  } catch (error) {
    console.error("Error creating page meta:", error);
    return NextResponse.json(
      { error: "Failed to create page meta" },
      { status: 500 }
    );
  }
}
