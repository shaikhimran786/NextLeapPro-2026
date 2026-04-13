import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createOrder, getRazorpayKeyId, isRazorpayConfigured } from "@/lib/razorpay";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Payment gateway is not configured. Please contact support." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { registrationId, paymentToken } = body;

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        user: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const currentUserId = await getCurrentUserId();
    const isOwnerBySession = currentUserId && currentUserId === registration.userId;
    const isOwnerByToken = paymentToken && registration.paymentToken && paymentToken === registration.paymentToken;

    if (!isOwnerBySession && !isOwnerByToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (registration.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Payment already completed for this registration" },
        { status: 400 }
      );
    }

    const amount = Number(registration.event.price);
    if (amount <= 0) {
      return NextResponse.json(
        { error: "This is a free event and does not require payment" },
        { status: 400 }
      );
    }

    const receipt = `evt_${registration.eventId}_reg_${registrationId}`.substring(0, 40);

    const order = await createOrder({
      amount: Math.round(amount * 100),
      currency: registration.event.currency || "INR",
      receipt,
      notes: {
        eventId: registration.eventId.toString(),
        registrationId: registrationId.toString(),
        userId: registration.userId.toString(),
      },
    });

    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        razorpayOrderId: order.id,
        paymentGateway: "razorpay",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: Math.round(amount * 100),
      currency: registration.event.currency || "INR",
      keyId: getRazorpayKeyId(),
      registration: {
        id: registration.id,
        eventId: registration.eventId,
        eventTitle: registration.event.title,
      },
      prefill: {
        name: `${registration.user.firstName || ""} ${registration.user.lastName || ""}`.trim(),
        email: registration.user.email,
      },
    });
  } catch (error: any) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 }
    );
  }
}
