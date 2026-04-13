"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, Loader2, Calendar, Video, Ticket, RotateCcw, LogIn, CreditCard, Clock, ExternalLink, ShieldCheck } from "@/lib/icons";
import { formatINR } from "@/lib/utils";
import { useUserStatus, revalidateUserStatus } from "@/hooks/useUserStatus";
import { registerForEvent, cancelEventRegistration, getEventJoinLink } from "@/lib/actions/event-actions";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
    if (existing) {
      if (window.Razorpay) { resolve(); return; }
      const onLoad = () => { existing.removeEventListener("load", onLoad); resolve(); };
      existing.addEventListener("load", onLoad);
      setTimeout(() => {
        existing.removeEventListener("load", onLoad);
        if (window.Razorpay) resolve();
        else reject(new Error("Timeout loading Razorpay"));
      }, 10000);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

interface EventRegistrationButtonProps {
  eventId: number;
  eventTitle: string;
  price: number;
  spotsLeft: number | null;
  isFree: boolean;
  eventStatus?: "upcoming" | "live" | "finished";
  className?: string;
}

export function EventRegistrationButton({
  eventId,
  eventTitle,
  price,
  spotsLeft,
  isFree,
  eventStatus = "upcoming",
  className,
}: EventRegistrationButtonProps) {
  const router = useRouter();
  const { userStatus, isLoading: isStatusLoading } = useUserStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });

  const isLoggedIn = userStatus.authStatus === "logged_in";
  const registrationInfo = userStatus.eventRegistrations[eventId];
  const registrationStatus = registrationInfo?.status || "not_registered";
  const isDisabled = spotsLeft === 0;

  const getButtonConfig = useCallback(() => {
    if (eventStatus === "live" && registrationStatus === "registered") {
      return {
        label: "Join Now",
        icon: Video,
        variant: "default" as const,
        action: "join_live",
        style: "bg-green-600 hover:bg-green-700 text-white",
      };
    }

    if (eventStatus === "finished") {
      if (registrationStatus === "attended") {
        return {
          label: "View Certificate",
          icon: CheckCircle,
          variant: "outline" as const,
          action: "certificate",
          style: "",
        };
      }
      return {
        label: "Event Ended",
        icon: Calendar,
        variant: "outline" as const,
        action: "none",
        style: "",
        disabled: true,
      };
    }

    switch (registrationStatus) {
      case "registered":
        return {
          label: "Registered",
          icon: Ticket,
          variant: "outline" as const,
          action: "view_ticket",
          style: "border-green-500 text-green-600",
        };
      case "pending":
        return {
          label: "Complete Payment",
          icon: Clock,
          variant: "default" as const,
          action: "complete_payment",
          style: "bg-amber-500 hover:bg-amber-600 text-white",
        };
      case "cancelled":
        return {
          label: "Register Again",
          icon: RotateCcw,
          variant: "outline" as const,
          action: "register",
          style: "",
        };
      case "waitlisted":
        return {
          label: "On Waitlist",
          icon: Loader2,
          variant: "secondary" as const,
          action: "none",
          style: "",
          disabled: true,
        };
      default:
        if (isDisabled) {
          return {
            label: "Fully Booked",
            icon: Calendar,
            variant: "outline" as const,
            action: "none",
            style: "opacity-50",
            disabled: true,
          };
        }
        return {
          label: isFree ? "RSVP Free" : `Buy Ticket - ${formatINR(price)}`,
          icon: isFree ? Calendar : CreditCard,
          variant: "default" as const,
          action: "register",
          style: "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25",
        };
    }
  }, [eventStatus, registrationStatus, isDisabled, isLoggedIn, isFree, price]);

  const buttonConfig = getButtonConfig();
  const IconComponent = buttonConfig.icon;

  async function openRazorpayCheckout(regId: number, token?: string | null) {
    setIsLoading(true);
    const activeToken = token || paymentToken;
    try {
      await loadRazorpayScript();

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, paymentToken: activeToken }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || "Failed to create payment order");
      }

      const orderData = await orderRes.json();

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Next Leap Pro",
        description: `Event: ${orderData.registration.eventTitle}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.prefill?.name || "",
          email: orderData.prefill?.email || "",
        },
        handler: async function (response: any) {
          try {
            setIsLoading(true);
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registrationId: regId,
                paymentToken: activeToken,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json();
              throw new Error(err.error || "Payment verification failed");
            }

            setIsSuccess(true);
            toast.success("Payment verified! Your ticket is ready.");
            await revalidateUserStatus();

            setTimeout(() => {
              setIsOpen(false);
              setIsSuccess(false);
              setIsPaymentPending(false);
              setRegistrationId(null);
              setPaymentToken(null);
              router.push("/dashboard/tickets");
              router.refresh();
            }, 2000);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Payment verification failed");
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            toast.info("Payment cancelled. You can try again anytime.");
          },
        },
        theme: {
          color: "#0066FF",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        const desc = response?.error?.description || "Payment failed. Please try again.";
        toast.error(desc);
        setIsLoading(false);
      });
      rzp.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to initiate payment");
      setIsLoading(false);
    }
  }

  const handleClick = async () => {
    if (buttonConfig.disabled) return;

    switch (buttonConfig.action) {
      case "join_live":
        try {
          setIsLoading(true);
          const result = await getEventJoinLink(eventId);
          if (result.success && result.joinLink) {
            window.open(result.joinLink, "_blank");
          } else {
            toast.error("Unable to get join link");
          }
        } catch (error) {
          toast.error("Failed to get join link");
        } finally {
          setIsLoading(false);
        }
        break;

      case "view_ticket":
        router.push(`/dashboard/tickets`);
        break;

      case "certificate":
        router.push(`/dashboard/certificates`);
        break;

      case "complete_payment":
        if (registrationInfo?.ticketId) {
          setRegistrationId(registrationInfo.ticketId);
          setIsPaymentPending(true);
          setIsOpen(true);
        }
        break;

      case "register":
        if (isLoggedIn) {
          try {
            setIsLoading(true);
            const result = await registerForEvent(eventId);
            if (result.success) {
              if (result.requiresPayment) {
                setRegistrationId(result.registration.id);
                setPaymentToken(result.paymentToken || null);
                setIsPaymentPending(true);
                setIsOpen(true);
                await openRazorpayCheckout(result.registration.id, result.paymentToken);
              } else {
                toast.success("Registration successful!");
                await revalidateUserStatus();
                router.push("/dashboard/tickets");
                router.refresh();
              }
            }
          } catch (error) {
            if (error instanceof Error) {
              toast.error(error.message);
            } else {
              toast.error("Registration failed. Please try again.");
            }
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsOpen(true);
        }
        break;

      default:
        break;
    }
  };

  async function handleGuestRegister() {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requiresPayment) {
          setRegistrationId(data.registration.id);
          setPaymentToken(data.paymentToken || null);
          setIsPaymentPending(true);
          await openRazorpayCheckout(data.registration.id, data.paymentToken);
        } else {
          setIsSuccess(true);
          toast.success("Registration successful!");
          
          setTimeout(() => {
            setIsOpen(false);
            setIsSuccess(false);
            setFormData({ email: "", firstName: "", lastName: "" });
            router.refresh();
          }, 2000);
        }
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleLoginRedirect = () => {
    router.push(`/auth/login?redirect=/events/${eventId}`);
  };

  return (
    <>
      <Button
        className={cn(
          "w-full h-12 text-lg rounded-full mb-4",
          buttonConfig.style,
          className
        )}
        data-testid="button-register"
        disabled={buttonConfig.disabled || isLoading || isStatusLoading}
        onClick={handleClick}
        variant={buttonConfig.variant}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <IconComponent className="mr-2 h-5 w-5" />
            {buttonConfig.label}
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          {isSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <DialogTitle className="text-2xl mb-2">
                {isFree ? "You're Registered!" : "Payment Verified!"}
              </DialogTitle>
              <DialogDescription>
                {isFree 
                  ? "Check your email for event details and joining instructions."
                  : "Your ticket is ready. Check your dashboard for details."
                }
              </DialogDescription>
            </div>
          ) : isPaymentPending ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Complete Payment
                </DialogTitle>
                <DialogDescription>
                  {eventTitle}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Amount to Pay</span>
                    <span className="text-2xl font-bold text-slate-900" suppressHydrationWarning>
                      {formatINR(price)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Secure payment powered by Razorpay
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => registrationId && openRazorpayCheckout(registrationId)}
                    disabled={isLoading || !registrationId}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    data-testid="button-pay-razorpay"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay {formatINR(price)}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Secured by Razorpay</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsOpen(false);
                    setIsPaymentPending(false);
                    setPaymentToken(null);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isFree ? "RSVP for Event" : "Register for Event"}
                </DialogTitle>
                <DialogDescription>
                  {eventTitle}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="p-4 bg-slate-50 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Registration Fee</span>
                    <span className="text-xl font-bold text-slate-900" suppressHydrationWarning>
                      {isFree ? "Free" : formatINR(price)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Already have an account?{" "}
                    <button
                      onClick={handleLoginRedirect}
                      className="font-semibold underline hover:no-underline"
                    >
                      Log in
                    </button>{" "}
                    for faster registration.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      data-testid="input-registration-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      data-testid="input-registration-lastname"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    data-testid="input-registration-email"
                  />
                  <p className="text-xs text-slate-500">We'll send your registration confirmation here</p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGuestRegister}
                  disabled={isLoading}
                  className="bg-gradient-primary"
                  data-testid="button-confirm-registration"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isFree ? (
                    "Complete RSVP"
                  ) : (
                    `Proceed to Pay ${formatINR(price)}`
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
