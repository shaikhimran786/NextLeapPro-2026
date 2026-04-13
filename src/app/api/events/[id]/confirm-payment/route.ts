import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    {
      error: "Self-confirmation is no longer supported. Please complete payment through the Razorpay checkout on the event page.",
      code: "DEPRECATED",
    },
    { status: 410 }
  );
}
