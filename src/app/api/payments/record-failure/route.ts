import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registrationId, paymentToken, reason } = body;

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID is required" }, { status: 400 });
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const currentUserId = await getCurrentUserId();
    const isOwnerBySession = currentUserId && currentUserId === registration.userId;
    const isOwnerByToken = paymentToken && registration.paymentToken && paymentToken === registration.paymentToken;

    if (!isOwnerBySession && !isOwnerByToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (registration.paymentStatus === "paid") {
      return NextResponse.json({ success: true, message: "Payment already completed" });
    }

    const failureReason = (reason || "Payment failed").substring(0, 500);

    await prisma.$transaction([
      prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: "failed",
          paymentFailureReason: failureReason,
        },
      }),
      prisma.adminAuditLog.create({
        data: {
          userId: registration.userId,
          action: "event_payment_client_failure",
          target: `Registration #${registrationId}`,
          details: {
            registrationId,
            reason: failureReason,
            gateway: "razorpay",
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error recording payment failure:", error);
    return NextResponse.json({ error: "Failed to record payment failure" }, { status: 500 });
  }
}
