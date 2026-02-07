import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrder as createCashfreeOrder, isCashfreeConfigured, getCashfreeAppId } from "@/lib/cashfree";
import { createOrder as createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from "@/lib/razorpay";
import { getCurrentUserId } from "@/lib/auth-utils";
import crypto from "crypto";

function generateCheckoutToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, email, name, phone } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: parseInt(planId) },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    if (!plan.active) {
      return NextResponse.json(
        { error: "This plan is no longer available" },
        { status: 400 }
      );
    }

    if (plan.useCustomPayment && plan.customPaymentUrl) {
      return NextResponse.json({
        success: true,
        useCustomPayment: true,
        customPaymentUrl: plan.customPaymentUrl,
        plan: {
          id: plan.id,
          name: plan.name,
          tier: plan.tier,
        },
      });
    }

    const siteSettings = await prisma.siteSettings.findFirst();
    const paymentEnabled = siteSettings?.paymentEnabled ?? true;
    
    if (!paymentEnabled && Number(plan.price) > 0) {
      return NextResponse.json(
        { error: "Payment processing is currently disabled. Please contact support for assistance." },
        { status: 503 }
      );
    }

    // REQUIRE AUTHENTICATION - server-side session check
    const authenticatedUserId = await getCurrentUserId();
    if (!authenticatedUserId) {
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in to continue with your subscription.",
          code: "AUTH_REQUIRED"
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authenticatedUserId },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found. Please sign in again.",
          code: "USER_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    if (!user.firstName || !user.email) {
      return NextResponse.json(
        { error: "Please complete your profile with name and email before subscribing." },
        { status: 400 }
      );
    }

    if (plan.tier === "free") {
      const existingSubscription = await prisma.userSubscription.findFirst({
        where: { userId: user.id, status: "active" },
      });

      if (existingSubscription) {
        return NextResponse.json({
          success: true,
          method: "free_plan",
          subscription: existingSubscription,
          message: "You already have an active subscription",
        });
      }

      const subscription = await prisma.userSubscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionTier: plan.tier },
      });

      return NextResponse.json({
        success: true,
        method: "free_plan",
        subscription,
        message: "Free plan activated",
      });
    }

    const existingActiveSubscription = await prisma.userSubscription.findFirst({
      where: { userId: user.id, status: "active" },
    });
    if (existingActiveSubscription) {
      return NextResponse.json({
        error: "You already have an active subscription. Please cancel it first or contact support to upgrade.",
        code: "ACTIVE_SUBSCRIPTION_EXISTS"
      }, { status: 400 });
    }

    const activeGateway = siteSettings?.activePaymentGateway || "cashfree";
    console.log("Payment gateway selection:", { activeGateway, razorpayConfigured: isRazorpayConfigured(), cashfreeConfigured: isCashfreeConfigured() });

    const isAnnual = plan.billingCycle === "yearly" || plan.tier.includes("annual");
    const periodDays = isAnnual ? 365 : 30;
    const checkoutToken = generateCheckoutToken();

    // ─── Razorpay Checkout ─────────────────────────────────────────────
    if (activeGateway === "razorpay") {
      if (!isRazorpayConfigured()) {
        console.error("Payment gateway selection: Razorpay not configured");
        return NextResponse.json(
          {
            error: "Payment gateway is not configured. Please contact support.",
            code: "PAYMENT_GATEWAY_NOT_CONFIGURED"
          },
          { status: 503 }
        );
      }

      const receipt = `rz_${Date.now()}_${user.id}_${plan.id}`.substring(0, 40);

      const subscription = await prisma.userSubscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: "pending",
          paymentGateway: "razorpay",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
        },
      });

      const transaction = await prisma.paymentTransaction.create({
        data: {
          userId: user.id,
          subscriptionId: subscription.id,
          amount: Number(plan.price),
          currency: plan.currency,
          status: "pending",
          paymentGateway: "razorpay",
          metadata: {
            planId: plan.id,
            planCode: plan.planCode,
            planName: plan.name,
            planTier: plan.tier,
            checkoutToken,
            receipt,
            userEmail: user.email,
            userName: `${user.firstName} ${user.lastName}`,
            userPhone: user.phone || phone || "",
          },
        },
      });

      try {
        const order = await createRazorpayOrder({
          amount: Math.round(Number(plan.price) * 100), // Convert to paise
          currency: plan.currency,
          receipt,
          notes: {
            userId: user.id.toString(),
            planId: plan.id.toString(),
            planCode: plan.planCode,
            subscriptionId: subscription.id.toString(),
            transactionId: transaction.id.toString(),
          },
        });

        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            razorpayOrderId: order.id,
            status: "created",
          },
        });

        return NextResponse.json({
          success: true,
          method: "razorpay_checkout",
          orderId: order.id,
          amount: Math.round(Number(plan.price) * 100),
          currency: plan.currency,
          keyId: getRazorpayKeyId(),
          transactionId: transaction.id,
          subscriptionId: subscription.id,
          checkoutToken,
          plan: {
            id: plan.id,
            name: plan.name,
            tier: plan.tier,
          },
          user: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
          },
          notes: {
            userId: user.id.toString(),
            planId: plan.id.toString(),
          },
        });
      } catch (razorpayError: any) {
        console.error("Razorpay order creation failed:", razorpayError?.message || razorpayError);

        await prisma.userSubscription.update({
          where: { id: subscription.id },
          data: { status: "cancelled" },
        });

        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "failed",
            failureReason: razorpayError?.message || "Payment gateway error",
          },
        });

        return NextResponse.json(
          { error: "Failed to initialize payment. Please try again." },
          { status: 500 }
        );
      }
    }

    // ─── Cashfree Checkout (default) ───────────────────────────────────
    if (!isCashfreeConfigured()) {
      console.error("Payment gateway selection: Cashfree not configured");
      return NextResponse.json(
        {
          error: "Payment gateway is not configured. Please contact support.",
          code: "PAYMENT_GATEWAY_NOT_CONFIGURED"
        },
        { status: 503 }
      );
    }

    const orderId = `cf_${Date.now()}_${user.id}_${plan.id}`;

    const subscription = await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "pending",
        paymentGateway: "cashfree",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
      },
    });

    const transaction = await prisma.paymentTransaction.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        amount: Number(plan.price),
        currency: plan.currency,
        status: "pending",
        paymentGateway: "cashfree",
        metadata: {
          planId: plan.id,
          planCode: plan.planCode,
          planName: plan.name,
          planTier: plan.tier,
          checkoutToken,
          orderId,
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          userPhone: user.phone || phone || "",
        },
      },
    });

    try {
      const customerPhone = user.phone || phone || "9999999999";

      const order = await createCashfreeOrder({
        orderId,
        orderAmount: Number(plan.price),
        orderCurrency: plan.currency,
        customerId: `customer_${user.id}`,
        customerEmail: user.email,
        customerPhone: customerPhone,
        customerName: `${user.firstName} ${user.lastName}`.trim(),
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/subscription/confirm?token=${checkoutToken}&tid=${transaction.id}`,
        orderNote: `Subscription: ${plan.name}`,
      });

      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          cashfreeOrderId: orderId,
          status: "created",
        },
      });

      return NextResponse.json({
        success: true,
        method: "cashfree_checkout",
        orderId: orderId,
        paymentSessionId: order.payment_session_id,
        amount: Number(plan.price),
        currency: plan.currency,
        appId: getCashfreeAppId(),
        transactionId: transaction.id,
        subscriptionId: subscription.id,
        checkoutToken,
        plan: {
          id: plan.id,
          name: plan.name,
          tier: plan.tier,
        },
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
      });
    } catch (cashfreeError: any) {
      console.error("Cashfree order creation failed:", cashfreeError?.message || cashfreeError);

      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: { status: "cancelled" },
      });

      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "failed",
          failureReason: cashfreeError?.message || "Payment gateway error",
        },
      });

      return NextResponse.json(
        { error: "Failed to initialize payment. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    );
  }
}
