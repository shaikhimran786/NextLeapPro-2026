import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pageMeta = await prisma.pageMeta.findUnique({
      where: { id: parseInt(id) },
    });

    if (!pageMeta) {
      return NextResponse.json(
        { error: "Page meta not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(pageMeta);
  } catch (error) {
    console.error("Error fetching page meta:", error);
    return NextResponse.json(
      { error: "Failed to fetch page meta" },
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
    const { page, title, description, ogImage, structuredData } = body;

    const existingMeta = await prisma.pageMeta.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingMeta) {
      return NextResponse.json(
        { error: "Page meta not found" },
        { status: 404 }
      );
    }

    if (page && page !== existingMeta.page) {
      const pageExists = await prisma.pageMeta.findUnique({
        where: { page },
      });
      if (pageExists) {
        return NextResponse.json(
          { error: "Page meta for this page already exists" },
          { status: 409 }
        );
      }
    }

    const pageMeta = await prisma.pageMeta.update({
      where: { id: parseInt(id) },
      data: {
        ...(page !== undefined && { page }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(ogImage !== undefined && { ogImage }),
        ...(structuredData !== undefined && { structuredData }),
      },
    });

    return NextResponse.json(pageMeta);
  } catch (error) {
    console.error("Error updating page meta:", error);
    return NextResponse.json(
      { error: "Failed to update page meta" },
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
    const pageMeta = await prisma.pageMeta.findUnique({
      where: { id: parseInt(id) },
    });

    if (!pageMeta) {
      return NextResponse.json(
        { error: "Page meta not found" },
        { status: 404 }
      );
    }

    await prisma.pageMeta.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: "Page meta deleted" });
  } catch (error) {
    console.error("Error deleting page meta:", error);
    return NextResponse.json(
      { error: "Failed to delete page meta" },
      { status: 500 }
    );
  }
}
