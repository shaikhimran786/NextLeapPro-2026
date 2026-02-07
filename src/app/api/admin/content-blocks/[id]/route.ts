import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const block = await prisma.contentBlock.findUnique({
      where: { id: parseInt(id) },
    });

    if (!block) {
      return NextResponse.json(
        { error: "Content block not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(block);
  } catch (error) {
    console.error("Error fetching content block:", error);
    return NextResponse.json(
      { error: "Failed to fetch content block" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { page, slug, title, body: content, sortOrder, visible, meta, imageUrl } = body;

    const existingBlock = await prisma.contentBlock.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingBlock) {
      return NextResponse.json(
        { error: "Content block not found" },
        { status: 404 }
      );
    }

    if (slug && slug !== existingBlock.slug) {
      const slugExists = await prisma.contentBlock.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A content block with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const block = await prisma.contentBlock.update({
      where: { id: parseInt(id) },
      data: {
        ...(page !== undefined && { page }),
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { body: content }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(visible !== undefined && { visible }),
        ...(meta !== undefined && { meta }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return NextResponse.json(block);
  } catch (error) {
    console.error("Error updating content block:", error);
    return NextResponse.json(
      { error: "Failed to update content block" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const block = await prisma.contentBlock.findUnique({
      where: { id: parseInt(id) },
    });

    if (!block) {
      return NextResponse.json(
        { error: "Content block not found" },
        { status: 404 }
      );
    }

    await prisma.contentBlock.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: "Content block deleted" });
  } catch (error) {
    console.error("Error deleting content block:", error);
    return NextResponse.json(
      { error: "Failed to delete content block" },
      { status: 500 }
    );
  }
}
