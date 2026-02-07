"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Loader2,
  CreditCard,
  ExternalLink,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Clock
} from "@/lib/icons";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";
import { revalidateUserStatus } from "@/hooks/useUserStatus";

interface TransactionData {
  transaction: {
    id: number;
    status: string;
    amount: number;
    currency: string;
    createdAt: string;
  };
  plan: {
    id: number;
    name: string;
    tier: string;
    price: number;
    currency: string;
    interval: string;
  } | null;
  user: {
    email: string;
    name: string;
  };
  isConfirmed: boolean;
}

function SubscriptionConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [data, setData] = useState<TransactionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");
  const transactionId = searchParams.get("tid");
  const paymentUrl = searchParams.get("paymentUrl");

  useEffect(() => {
    if (transactionId) {
      fetchTransactionData();
    } else {
      setIsLoading(false);
      setError("No transaction found. Please start from the pricing page.");
    }
  }, [transactionId, token]);

  async function fetchTransactionData() {
    try {
      const params = new URLSearchParams();
      params.set("tid", transactionId!);
      if (token) params.set("token", token);

      const res = await fetch(`/api/subscriptions/confirm?${params.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to load transaction");
        return;
      }

      setData(result);
      setIsConfirmed(result.isConfirmed);
    } catch (err) {
      setError("Failed to load transaction details");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmPayment() {
    if (!transactionId) return;

    setIsConfirming(true);

    try {
      const res = await fetch("/api/subscriptions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: parseInt(transactionId),
          checkoutToken: token,
          email: data?.user.email,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to confirm payment");
        return;
      }

      setIsConfirmed(true);
      toast.success(result.message || "Subscription activated successfully!");

      await revalidateUserStatus();

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  }

  function handleOpenPayment() {
    if (paymentUrl) {
      window.open(decodeURIComponent(paymentUrl), "_blank");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
        <Navbar />
        <main className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-slate-600">Loading payment details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
        <Navbar />
        <main className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Link href="/pricing">
                <Button data-testid="button-back-pricing">Go to Pricing</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
        <Navbar />
        <main className="container mx-auto px-4 py-20">
          <Card className="max-w-lg mx-auto border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="pt-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">
                Subscription Activated!
              </h2>
              <p className="text-slate-600 mb-4">
                Your <span className="font-semibold text-primary">{data?.plan?.name}</span> plan is now active.
              </p>
              
              {data?.plan && (
                <div className="bg-white rounded-lg p-4 border mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Plan</span>
                    <Badge className="bg-primary/10 text-primary">{data.plan.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-slate-600">Amount Paid</span>
                    <span className="font-semibold" suppressHydrationWarning>
                      {formatINR(data.plan.price)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Link href="/dashboard">
                  <Button className="w-full bg-gradient-primary" data-testid="button-go-dashboard">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/events">
                  <Button variant="outline" className="w-full" data-testid="button-explore-events">
                    Explore Premium Events
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
              Complete Your Subscription
            </h1>
            <p className="text-slate-600">
              Follow the steps below to activate your plan
            </p>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{data?.plan?.name || "Subscription"}</CardTitle>
                    <CardDescription>
                      {data?.user.email}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-1" suppressHydrationWarning>
                    {data?.plan ? formatINR(data.plan.price) : ""}
                    {data?.plan?.interval && <span className="text-xs ml-1">/{data.plan.interval}</span>}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">Complete Payment</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        Click the button below to pay securely via Cashfree
                      </p>
                      {paymentUrl ? (
                        <Button 
                          onClick={handleOpenPayment}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid="button-pay-cashfree"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Pay with Cashfree
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                          <Clock className="h-4 w-4" />
                          Payment link will be provided
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">Confirm Your Payment</h3>
                        <p className="text-sm text-slate-600 mb-3">
                          After completing payment, click below to activate your subscription
                        </p>
                        <Button
                          onClick={handleConfirmPayment}
                          disabled={isConfirming}
                          className="w-full sm:w-auto"
                          data-testid="button-confirm-payment"
                        >
                          {isConfirming ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              I've Completed Payment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">
                      Secure payment powered by Cashfree. Your payment details are encrypted.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Link href="/pricing" className="text-sm text-slate-500 hover:text-primary">
                Cancel and go back to pricing
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
      <Navbar />
      <main className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-slate-600">Loading payment details...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SubscriptionConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscriptionConfirmContent />
    </Suspense>
  );
}
