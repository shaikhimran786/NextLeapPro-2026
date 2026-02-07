import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchOrder } from "@/lib/cashfree";
import { verifyPaymentSignature as verifyRazorpayPayment } from "@/lib/razorpay";
import { normalizeBaseTier } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, transactionId, razorpayPaymentId, razorpayOrderId, razorpaySignature, gateway } = body;

    // ─── Razorpay Verification ───────────────────────────────────────
    if (gateway === "razorpay") {
      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        return NextResponse.json(
          { error: "Missing Razorpay payment details" },
          { status: 400 }
        );
      }

      const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid payment signature" },
          { status: 400 }
        );
      }

      const transaction = await prisma.paymentTransaction.findFirst({
        where: { razorpayOrderId: razorpayOrderId },
      });

      if (!transaction) {
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }

      // Store the signature
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { razorpaySignature: razorpaySignature },
      });

      // If already captured (e.g. by webhook), return success
      if (transaction.status === "captured") {
        return NextResponse.json({
          success: true,
          verified: true,
          message: "Payment already processed",
        });
      }

      // Activate subscription
      const metadata = transaction.metadata as { planId: number; planCode: string } | null;
      const planId = metadata?.planId;

      if (!planId) {
        return NextResponse.json(
          { error: "Plan information not found in transaction" },
          { status: 400 }
        );
      }

      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return NextResponse.json(
          { error: "Subscription plan not found" },
          { status: 404 }
        );
      }

      const now = new Date();
      const isAnnual = plan.billingCycle === "yearly" || plan.tier.includes("annual");
      const periodDays = isAnnual ? 365 : 30;
      const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

      let subscription = await prisma.userSubscription.findFirst({
        where: {
          userId: transaction.userId,
          planId: plan.id,
          status: "pending",
        },
      });

      if (subscription) {
        subscription = await prisma.userSubscription.update({
          where: { id: subscription.id },
          data: {
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      } else {
        subscription = await prisma.userSubscription.create({
          data: {
            userId: transaction.userId,
            planId: plan.id,
            status: "active",
            paymentGateway: "razorpay",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      }

      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          razorpayPaymentId: razorpayPaymentId,
          status: "captured",
          subscriptionId: subscription.id,
        },
      });

      const baseTier = normalizeBaseTier(plan.tier);
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          subscriptionTier: baseTier,
          subscriptionExpiry: periodEnd,
        },
      });

      return NextResponse.json({
        success: true,
        verified: true,
        subscription: {
          id: subscription.id,
          planName: plan.name,
          tier: plan.tier,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
        message: "Payment verified and subscription activated successfully",
      });
    }

    // ─── Cashfree Verification (default) ─────────────────────────────
    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    const order = await fetchOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const transaction = await prisma.paymentTransaction.findFirst({
      where: { cashfreeOrderId: orderId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (order.order_status === "PAID") {
      if (transaction.status !== "captured") {
        const metadata = transaction.metadata as { planId: number; planCode: string } | null;
        const planId = metadata?.planId;

        if (!planId) {
          return NextResponse.json(
            { error: "Plan information not found in transaction" },
            { status: 400 }
          );
        }

        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: planId },
        });

        if (!plan) {
          return NextResponse.json(
            { error: "Subscription plan not found" },
            { status: 404 }
          );
        }

        const now = new Date();
        const isAnnual = plan.billingCycle === "yearly" || plan.tier.includes("annual");
        const periodDays = isAnnual ? 365 : 30;
        const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

        let subscription = await prisma.userSubscription.findFirst({
          where: {
            userId: transaction.userId,
            planId: plan.id,
            status: "pending",
          },
        });

        if (subscription) {
          subscription = await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
              status: "active",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });
        } else {
          subscription = await prisma.userSubscription.create({
            data: {
              userId: transaction.userId,
              planId: plan.id,
              status: "active",
              paymentGateway: "cashfree",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });
        }

        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "captured",
            subscriptionId: subscription.id,
          },
        });

        const baseTier = normalizeBaseTier(plan.tier);
        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            subscriptionTier: baseTier,
            subscriptionExpiry: periodEnd,
          },
        });

        return NextResponse.json({
          success: true,
          verified: true,
          subscription: {
            id: subscription.id,
            planName: plan.name,
            tier: plan.tier,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          },
          message: "Payment verified and subscription activated successfully",
        });
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: "Payment already processed",
      });
    } else if (order.order_status === "ACTIVE") {
      return NextResponse.json({
        success: false,
        verified: false,
        status: "pending",
        message: "Payment is still being processed",
      });
    } else {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "failed",
          failureReason: `Order status: ${order.order_status}`,
        },
      });

      return NextResponse.json({
        success: false,
        verified: false,
        status: order.order_status,
        message: "Payment failed or cancelled",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify payment" },
      { status: 500 }
    );
  }
}
