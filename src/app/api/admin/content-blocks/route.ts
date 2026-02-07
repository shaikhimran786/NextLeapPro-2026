import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");

    const whereClause = page ? { page } : {};

    const blocks = await prisma.contentBlock.findMany({
      where: whereClause,
      orderBy: [{ page: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(blocks);
  } catch (error) {
    console.error("Error fetching content blocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch content blocks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, slug, title, body: content, sortOrder, visible, meta, imageUrl } = body;

    if (!page || !slug || !title || !content) {
      return NextResponse.json(
        { error: "Page, slug, title, and body are required" },
        { status: 400 }
      );
    }

    const existingBlock = await prisma.contentBlock.findUnique({
      where: { slug },
    });

    if (existingBlock) {
      return NextResponse.json(
        { error: "A content block with this slug already exists" },
        { status: 409 }
      );
    }

    const block = await prisma.contentBlock.create({
      data: {
        page,
        slug,
        title,
        body: content,
        sortOrder: sortOrder ?? 0,
        visible: visible ?? true,
        meta: meta ?? null,
        imageUrl: imageUrl ?? null,
      },
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error("Error creating content block:", error);
    return NextResponse.json(
      { error: "Failed to create content block" },
      { status: 500 }
    );
  }
}
