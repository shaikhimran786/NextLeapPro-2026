import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const features = await prisma.featureToggle.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(features);
  } catch (error) {
    console.error("Error fetching features:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
