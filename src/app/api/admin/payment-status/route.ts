import { NextRequest, NextResponse } from "next/server";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const cashfreeAppId = process.env.CASHFREE_APP_ID;
    const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;

    const host = request.headers.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const cashfreeWebhookUrl = `${protocol}://${host}/api/payments/cashfree/webhook`;
    const razorpayWebhookUrl = `${protocol}://${host}/api/webhooks/razorpay`;

    const siteSettings = await prisma.siteSettings.findFirst();

    return NextResponse.json({
      cashfreeConfigured: !!(cashfreeAppId && cashfreeSecretKey),
      cashfreeEnabled: siteSettings?.cashfreeEnabled ?? false,
      cashfreeAppId: cashfreeAppId ? `${cashfreeAppId.substring(0, 8)}...` : null,
      cashfreeWebhookUrl,
      razorpayConfigured: isRazorpayConfigured(),
      razorpayKeyId: razorpayKeyId ? `${razorpayKeyId.substring(0, 8)}...` : null,
      razorpayWebhookUrl,
      activeGateway: siteSettings?.activePaymentGateway || "cashfree",
      paymentEnabled: siteSettings?.paymentEnabled ?? true,
      paymentTestMode: siteSettings?.paymentTestMode ?? true,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment status" },
      { status: 500 }
    );
  }
}
