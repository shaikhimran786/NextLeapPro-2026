"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Loader2, CheckCircle, Crown, ArrowUp, AlertCircle, Clock, Calendar, ArrowRight } from "@/lib/icons";
import { formatINR, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useUserStatus, revalidateUserStatus } from "@/hooks/useUserStatus";

declare global {
  interface Window {
    Cashfree: any;
    Razorpay: any;
  }
}

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  intervalCount: number;
  features: string[];
  tier: string;
  planCode: string;
  trialDays: number;
  isPopular: boolean;
}

interface PricingPlansProps {
  monthlyPlans: Plan[];
  annualPlans: Plan[];
}

const TIER_HIERARCHY: Record<string, number> = {
  free: 0,
  pro: 1,
  pro_monthly: 1,
  pro_annual: 1,
  creator: 2,
  creator_monthly: 2,
  creator_annual: 2,
};

function getTierLevel(tier: string): number {
  const normalizedTier = tier.toLowerCase();
  return TIER_HIERARCHY[normalizedTier] ?? 0;
}

function normalizeTierForComparison(tier: string): string {
  const normalizedTier = tier.toLowerCase();
  if (normalizedTier.startsWith("pro")) return "pro";
  if (normalizedTier.startsWith("creator")) return "creator";
  return normalizedTier;
}

const PENDING_PLAN_KEY = "pendingSubscriptionPlan";

function loadScript(src: string, globalCheck: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any)[globalCheck]) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((window as any)[globalCheck]) {
        resolve();
        return;
      }
      const onLoad = () => { existing.removeEventListener("load", onLoad); resolve(); };
      existing.addEventListener("load", onLoad);
      const timeout = setTimeout(() => {
        existing.removeEventListener("load", onLoad);
        if ((window as any)[globalCheck]) resolve();
        else reject(new Error(`Timeout loading ${src}`));
      }, 10000);
      existing.addEventListener("load", () => clearTimeout(timeout));
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function PricingPlans({ monthlyPlans, annualPlans }: PricingPlansProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userStatus, isLoading: isUserLoading } = useUserStatus();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<number | null>(null);
  const [paymentGatewayStatus, setPaymentGatewayStatus] = useState<{
    configured: boolean;
    error?: string;
  } | null>(null);

  const isLoggedIn = userStatus.authStatus === "logged_in";
  const plans = billingInterval === "month" ? monthlyPlans : annualPlans;
  const isAnyLoading = loadingPlan !== null;

  const currentUserTier = userStatus.subscriptionTier?.toLowerCase() || "free";
  const currentUserTierLevel = getTierLevel(currentUserTier);
  const hasActiveSubscription = userStatus.subscriptionStatus === "active" || userStatus.subscriptionStatus === "trial";
  const isExpiredSubscription = userStatus.subscriptionStatus === "expired";
  const subscriptionPlanName = userStatus.subscriptionPlanName;
  const subscriptionInterval = userStatus.subscriptionInterval;
  const subscriptionDaysRemaining = userStatus.subscriptionDaysRemaining;
  const subscriptionExpiry = userStatus.subscriptionExpiry;

  // Check payment gateway status on mount
  useEffect(() => {
    async function checkPaymentGateway() {
      try {
        const response = await fetch("/api/admin/payment-status");
        if (response.ok) {
          const data = await response.json();
          const configured = data.cashfreeConfigured || data.razorpayConfigured;
          setPaymentGatewayStatus({ configured });
        }
      } catch (error) {
        console.error("Failed to check payment gateway status:", error);
      }
    }
    checkPaymentGateway();
  }, []);

  useEffect(() => {
    if (isUserLoading) return;

    const planFromUrl = searchParams.get("plan");
    const autoCheckout = searchParams.get("checkout") === "true";

    if (isLoggedIn && planFromUrl && autoCheckout) {
      const planId = parseInt(planFromUrl);
      const plan = [...monthlyPlans, ...annualPlans].find(p => p.id === planId);
      if (plan) {
        clearPendingPlan();
        router.replace("/pricing");
        toast.success(`Welcome back! Completing your ${plan.name} subscription...`);
        proceedToCheckoutWithUser(plan, userStatus.email || "",
          [userStatus.firstName, userStatus.lastName].filter(Boolean).join(" "));
        return;
      }
    }

    if (isLoggedIn) {
      const pendingPlan = getPendingPlan();
      if (pendingPlan && Date.now() - pendingPlan.timestamp < 30 * 60 * 1000) {
        const plan = [...monthlyPlans, ...annualPlans].find(p => p.id === pendingPlan.planId);
        if (plan) {
          clearPendingPlan();
          toast.success(`Welcome back! Completing your ${plan.name} subscription...`);
          proceedToCheckoutWithUser(plan, userStatus.email || "",
            [userStatus.firstName, userStatus.lastName].filter(Boolean).join(" "));
        }
      }
    }
  }, [isLoggedIn, isUserLoading, searchParams, monthlyPlans, annualPlans]);

  function savePendingPlan(plan: Plan) {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(PENDING_PLAN_KEY, JSON.stringify({
        planId: plan.id,
        planTier: plan.tier,
        planName: plan.name,
        interval: plan.interval,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error("Failed to save pending plan:", e);
    }
  }

  function getPendingPlan(): { planId: number; planTier: string; planName: string; timestamp: number } | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem(PENDING_PLAN_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Failed to get pending plan:", e);
      return null;
    }
  }

  function clearPendingPlan() {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(PENDING_PLAN_KEY);
    } catch (e) {
      console.error("Failed to clear pending plan:", e);
    }
  }

  function getPlanStatus(plan: Plan) {
    const planTierLevel = getTierLevel(plan.tier);
    const normalizedPlanTier = normalizeTierForComparison(plan.tier);
    const normalizedUserTier = normalizeTierForComparison(currentUserTier);
    
    const isSameTierLevel = normalizedPlanTier === normalizedUserTier;

    const userInterval = subscriptionInterval || (currentUserTier.includes("annual") ? "year" : "month");
    const isSameBillingInterval = plan.interval === userInterval;
    
    const isCurrentPlan = hasActiveSubscription && isSameTierLevel && isSameBillingInterval;
    const isBillingSwitch = hasActiveSubscription && isSameTierLevel && !isSameBillingInterval;
    const isUpgrade = hasActiveSubscription && planTierLevel > currentUserTierLevel;
    const isDowngrade = hasActiveSubscription && planTierLevel < currentUserTierLevel;
    const isFreeAndHasPaid = plan.tier === "free" && hasActiveSubscription && currentUserTierLevel > 0;

    const isExpiredSameTier = isExpiredSubscription && subscriptionPlanName
      ? normalizedPlanTier === normalizeTierForComparison(subscriptionPlanName)
      : false;
    
    return { isCurrentPlan, isUpgrade, isDowngrade, isFreeAndHasPaid, isBillingSwitch, isExpiredSameTier };
  }

  function handleBillingSwitch(plan: Plan) {
    const switchType = plan.interval === "year" ? "annual billing (save 20%)" : "monthly billing";
    toast.info(`To switch to ${switchType}, please contact support. Your billing will be adjusted at the next renewal.`);
  }

  async function handleSubscribe(plan: Plan) {
    if (isAnyLoading) return;

    const { isCurrentPlan, isDowngrade, isFreeAndHasPaid } = getPlanStatus(plan);

    if (isCurrentPlan) {
      router.push("/profile");
      return;
    }

    if (isDowngrade || isFreeAndHasPaid) {
      toast.info("To downgrade your plan, please contact support. Your current subscription will remain active until its expiry date.");
      return;
    }

    if (plan.tier === "free") {
      window.location.href = "/auth/register";
      return;
    }

    // Check payment gateway status for paid plans
    if (!paymentGatewayStatus?.configured && plan.price > 0) {
      toast.error("Payment gateway is not configured. Please contact support.");
      return;
    }

    if (isLoggedIn && userStatus.userId) {
      await proceedToCheckoutWithUser(plan, userStatus.email || "",
        [userStatus.firstName, userStatus.lastName].filter(Boolean).join(" "));
    } else {
      savePendingPlan(plan);
      toast.info(`Please sign in to continue with your ${plan.name} subscription`);

      const authUrl = new URL("/auth/login", window.location.origin);
      authUrl.searchParams.set("plan", plan.id.toString());
      authUrl.searchParams.set("planName", plan.name);
      authUrl.searchParams.set("redirect", `/pricing?plan=${plan.id}&checkout=true`);
      router.push(authUrl.toString());
    }
  }

  async function proceedToCheckoutWithUser(plan: Plan, userEmail: string, userName: string) {
    setLoadingPlan(plan.id);

    try {
      const checkoutResponse = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: plan.id,
          email: userEmail,
          name: userName,
        }),
      });

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.json();
        const errorMessage = error.error || "Failed to create checkout session";

        // Add specific handling for common error codes
        if (error.code === "PAYMENT_GATEWAY_NOT_CONFIGURED") {
          toast.error("Payment gateway is not configured. Please contact support.");
        } else if (error.code === "AUTH_REQUIRED") {
          toast.error("Please sign in to continue.");
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const checkoutData = await checkoutResponse.json();
      await handleCheckoutResponse(checkoutData, plan, userName, userEmail);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setLoadingPlan(null);
    }
  }


  async function handleCheckoutResponse(checkoutData: any, plan: Plan, userName: string, userEmail: string) {
    // Log for debugging
    console.log("Checkout response:", { method: checkoutData.method, success: checkoutData.success, price: plan.price });

    // Handle free plans first
    if (plan.price === 0 || plan.tier === "free") {
      if (checkoutData.success && checkoutData.subscription) {
        toast.success("Free plan activated successfully!");
        await revalidateUserStatus();
        window.location.href = "/dashboard";
        return;
      }
    }

    // Validate response structure for paid plans
    if (plan.price > 0 && !checkoutData.useCustomPayment && !checkoutData.method) {
      console.error("Invalid checkout response: missing method field", checkoutData);
      toast.error("Invalid response from payment gateway. Please contact support.");
      setLoadingPlan(null);
      return;
    }

    if (checkoutData.useCustomPayment && checkoutData.customPaymentUrl) {
      toast.success("Redirecting to payment page...");
      window.location.href = checkoutData.customPaymentUrl;
      return;
    }

    if (checkoutData.method === "payment_link") {
      const confirmUrl = new URL("/subscription/confirm", window.location.origin);
      confirmUrl.searchParams.set("token", checkoutData.checkoutToken);
      confirmUrl.searchParams.set("tid", checkoutData.transactionId.toString());
      confirmUrl.searchParams.set("paymentUrl", encodeURIComponent(checkoutData.paymentUrl));
      
      router.push(confirmUrl.toString());
      return;
    }

    if (checkoutData.method === "razorpay_checkout") {
      try {
        await loadScript("https://checkout.razorpay.com/v1/checkout.js", "Razorpay");
      } catch {
        toast.error("Failed to load payment gateway. Please try again.");
        setLoadingPlan(null);
        return;
      }

      try {
        const options = {
          key: checkoutData.keyId,
          amount: checkoutData.amount,
          currency: checkoutData.currency,
          name: "Next Leap Pro",
          description: `Subscription: ${plan.name}`,
          image: "/logos/logo-icon.png",
          order_id: checkoutData.orderId,
          prefill: {
            name: userName,
            email: userEmail,
          },
          notes: checkoutData.notes,
          handler: async function (response: any) {
            try {
              const verifyResponse = await fetch("/api/subscriptions/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                  transactionId: checkoutData.transactionId,
                  gateway: "razorpay",
                }),
              });

              if (!verifyResponse.ok) {
                const error = await verifyResponse.json();
                throw new Error(error.error || "Payment verification failed");
              }

              toast.success(`Payment Successful! Your ${plan.name} subscription is now active.`);
              await revalidateUserStatus();
              window.location.href = "/dashboard";
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Payment verification failed");
            } finally {
              setLoadingPlan(null);
            }
          },
          modal: {
            ondismiss: function () {
              setLoadingPlan(null);
            },
          },
          theme: {
            color: "#0066FF",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          const desc = response?.error?.description || "Payment failed. Please try again.";
          toast.error(desc);
          setLoadingPlan(null);
        });
        rzp.open();
      } catch (error) {
        toast.error("Failed to initialize payment. Please try again.");
        setLoadingPlan(null);
      }
      return;
    }

    if (checkoutData.method === "cashfree_checkout") {
      try {
        await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js", "Cashfree");
      } catch {
        toast.error("Failed to load payment gateway. Please try again.");
        setLoadingPlan(null);
        return;
      }

      try {
        const cashfree = await (window as any).Cashfree({
          mode: process.env.NEXT_PUBLIC_CASHFREE_MODE || "production",
        });

        const checkoutOptions = {
          paymentSessionId: checkoutData.paymentSessionId,
          redirectTarget: "_modal",
        };

        cashfree.checkout(checkoutOptions).then(async (result: any) => {
          if (result.error) {
            toast.error(result.error.message || "Payment failed");
            setLoadingPlan(null);
            return;
          }

          if (result.redirect) {
            return;
          }

          if (result.paymentDetails) {
            try {
              const verifyResponse = await fetch("/api/subscriptions/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: checkoutData.orderId,
                  transactionId: checkoutData.transactionId,
                }),
              });

              if (!verifyResponse.ok) {
                const error = await verifyResponse.json();
                throw new Error(error.error || "Payment verification failed");
              }

              toast.success(`Payment Successful! Your ${plan.name} subscription is now active.`);
              await revalidateUserStatus();
              window.location.href = "/dashboard";
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Payment verification failed");
            } finally {
              setLoadingPlan(null);
            }
          }
        });
      } catch (error) {
        toast.error("Failed to initialize payment. Please try again.");
        setLoadingPlan(null);
      }
      return;
    }

    toast.error("Unknown payment method. Please try again.");
    setLoadingPlan(null);
  }

  function renderButton(plan: Plan) {
    const { isCurrentPlan, isUpgrade, isDowngrade, isFreeAndHasPaid, isBillingSwitch, isExpiredSameTier } = getPlanStatus(plan);
    const isLoading = loadingPlan === plan.id;
    const isPopular = plan.isPopular || plan.tier === "pro";

    if (isLoading) {
      return (
        <Button disabled className="w-full rounded-full" data-testid={`button-select-${plan.tier}`}>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </Button>
      );
    }

    if (isExpiredSameTier) {
      return (
        <Button
          onClick={() => handleSubscribe(plan)}
          variant="gradient"
          className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          disabled={isAnyLoading}
          data-testid={`button-renew-${plan.tier}`}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Renew Now
        </Button>
      );
    }

    if (isCurrentPlan) {
      return (
        <Button 
          variant="outline"
          className="w-full rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-700 cursor-default opacity-90"
          disabled
          data-testid={`button-current-${plan.tier}`}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Your Current Plan
        </Button>
      );
    }

    if (isBillingSwitch) {
      const switchLabel = plan.interval === "year" ? "Switch to Annual" : "Switch to Monthly";
      return (
        <Button 
          variant="outline"
          className="w-full rounded-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all"
          onClick={() => handleBillingSwitch(plan)}
          disabled={isAnyLoading}
          data-testid={`button-switch-${plan.tier}`}
        >
          {switchLabel}
        </Button>
      );
    }

    if (isDowngrade || isFreeAndHasPaid) {
      return (
        <Button 
          variant="outline"
          className="w-full rounded-full border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all"
          onClick={() => handleSubscribe(plan)}
          disabled={isAnyLoading}
          data-testid={`button-downgrade-${plan.tier}`}
        >
          Downgrade
        </Button>
      );
    }

    if (isUpgrade) {
      return (
        <Button
          onClick={() => handleSubscribe(plan)}
          variant="gradient"
          className="w-full rounded-full"
          disabled={isAnyLoading}
          data-testid={`button-upgrade-${plan.tier}`}
        >
          <ArrowUp className="h-4 w-4 mr-2" />
          Upgrade Now
        </Button>
      );
    }

    if (plan.price === 0) {
      return (
        <Button
          onClick={() => handleSubscribe(plan)}
          variant={isPopular ? "gradient" : "default"}
          className={`w-full rounded-full ${!isPopular ? "bg-slate-900 text-white hover:bg-slate-800" : ""}`}
          disabled={isAnyLoading}
          data-testid={`button-select-${plan.tier}`}
        >
          Get Started Free
        </Button>
      );
    }

    return (
      <Button
        onClick={() => handleSubscribe(plan)}
        variant={isPopular ? "gradient" : "default"}
        className={`w-full rounded-full ${!isPopular ? "bg-slate-900 text-white hover:bg-slate-800" : ""}`}
        disabled={isAnyLoading}
        data-testid={`button-select-${plan.tier}`}
      >
        Subscribe Now
      </Button>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {isLoggedIn && hasActiveSubscription && (
        <div className="max-w-lg mx-auto mb-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl" data-testid="banner-active-subscription">
          <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
            <Crown className="h-5 w-5" />
            <span className="font-semibold text-lg">
              {subscriptionPlanName || currentUserTier.replace("_", " ")}
            </span>
            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">Active</Badge>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-green-600" suppressHydrationWarning>
            {subscriptionInterval && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {subscriptionInterval === "year" ? "Annual" : "Monthly"} billing
              </span>
            )}
            {subscriptionDaysRemaining !== null && subscriptionDaysRemaining > 0 && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {subscriptionDaysRemaining} {subscriptionDaysRemaining === 1 ? "day" : "days"} remaining
              </span>
            )}
          </div>
          {subscriptionExpiry && (
            <p className="text-xs text-green-500 text-center mt-2" suppressHydrationWarning>
              Renews on {formatDate(subscriptionExpiry)}
            </p>
          )}
        </div>
      )}

      {isLoggedIn && isExpiredSubscription && subscriptionPlanName && (
        <div className="max-w-lg mx-auto mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl" data-testid="banner-expired-subscription">
          <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">
              Your {subscriptionPlanName} subscription expired{subscriptionExpiry ? ` on ${formatDate(subscriptionExpiry)}` : ""}
            </span>
          </div>
          <p className="text-sm text-amber-600 text-center mb-3">
            Renew your subscription to restore premium features and continue your learning journey.
          </p>
          <div className="flex justify-center">
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-6"
              onClick={() => {
                const card = document.querySelector('[data-testid^="pricing-card-"]');
                card?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              data-testid="button-renew-from-banner"
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              Renew Now
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-12">
        <div className="bg-white rounded-full p-1 shadow-sm border inline-flex">
          <button
            onClick={() => setBillingInterval("month")}
            disabled={isAnyLoading}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingInterval === "month"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            data-testid="button-monthly-billing"
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("year")}
            disabled={isAnyLoading}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingInterval === "year"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            data-testid="button-annual-billing"
          >
            Annual
            <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isPopular = plan.isPopular || plan.tier === "pro";
          const { isCurrentPlan, isExpiredSameTier } = getPlanStatus(plan);
          const hasTopBanner = isCurrentPlan || isExpiredSameTier || (!isCurrentPlan && !isExpiredSameTier && isPopular);

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-xl ${
                isCurrentPlan 
                  ? "border-green-500 ring-2 ring-green-500 shadow-lg"
                  : isExpiredSameTier
                    ? "border-amber-400 ring-2 ring-amber-400 shadow-lg"
                    : isPopular 
                      ? "border-primary ring-2 ring-primary shadow-lg" 
                      : "shadow-md"
              }`}
              data-testid={`pricing-card-${plan.tier}`}
            >
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Current Plan
                </div>
              )}
              {isExpiredSameTier && !isCurrentPlan && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Expired
                </div>
              )}
              {!isCurrentPlan && !isExpiredSameTier && isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-blue-600 text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-current" />
                  Most Popular
                </div>
              )}
              <div className={`p-8 ${hasTopBanner ? "pt-14" : ""}`}>
                <h3 className="text-2xl font-heading font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{plan.description}</p>

                {isCurrentPlan && subscriptionExpiry && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg" data-testid={`status-active-${plan.tier}`}>
                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      <span suppressHydrationWarning>Active till {formatDate(subscriptionExpiry)}</span>
                    </div>
                    {subscriptionDaysRemaining !== null && subscriptionDaysRemaining > 0 && (
                      <p className="text-xs text-green-600 mt-1 ml-5.5" suppressHydrationWarning>
                        {subscriptionDaysRemaining} {subscriptionDaysRemaining === 1 ? "day" : "days"} remaining
                      </p>
                    )}
                  </div>
                )}

                {isExpiredSameTier && subscriptionExpiry && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid={`status-expired-${plan.tier}`}>
                    <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span suppressHydrationWarning>Expired on {formatDate(subscriptionExpiry)}</span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1 ml-5.5">
                      Renew to restore your premium features
                    </p>
                  </div>
                )}

                <div className="mb-8">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold text-slate-900">Free</span>
                  ) : (
                    <>
                      <span
                        className="text-4xl font-bold text-slate-900"
                        data-testid={`price-${plan.tier}`}
                        suppressHydrationWarning
                      >
                        {formatINR(plan.price)}
                      </span>
                      <span className="text-slate-500 ml-2">
                        /{plan.interval === "year" ? "year" : "month"}
                      </span>
                    </>
                  )}
                  {plan.trialDays > 0 && plan.price > 0 && !isCurrentPlan && (
                    <p className="text-sm text-green-600 mt-2">
                      {plan.trialDays}-day free trial
                    </p>
                  )}
                </div>

                {renderButton(plan)}

                <div className="mt-8 pt-8 border-t">
                  <ul className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12 pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500" data-testid="text-powered-by-pricing">
          Next Leap Pro is powered by{" "}
          <a
            href="https://uixpertslabs.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            data-testid="link-uixperts-pricing"
          >
            UIXPERTS LABS™
          </a>
        </p>
      </div>
    </div>
  );
}
