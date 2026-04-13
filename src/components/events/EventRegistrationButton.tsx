"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, Loader2, Calendar, Video, Ticket, RotateCcw, LogIn, CreditCard, Clock, ExternalLink, ShieldCheck, AlertTriangle, Bell, XCircle } from "@/lib/icons";
import { formatINR, formatDate } from "@/lib/utils";
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
  eventStartDate?: string;
  eventMode?: string;
  className?: string;
}

export function EventRegistrationButton({
  eventId,
  eventTitle,
  price,
  spotsLeft,
  isFree,
  eventStatus = "upcoming",
  eventStartDate,
  eventMode,
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
  const [successTicketCode, setSuccessTicketCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });

  const isLoggedIn = userStatus.authStatus === "logged_in";
  const registrationInfo = userStatus.eventRegistrations[eventId];
  const registrationStatus = registrationInfo?.status || "not_registered";
  const paymentStatus = registrationInfo?.paymentStatus;
  const isDisabled = spotsLeft === 0;
  const isPaymentFailed = registrationStatus === "pending" && paymentStatus === "failed";

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
      if (registrationStatus === "registered") {
        return {
          label: "View Ticket",
          icon: Ticket,
          variant: "outline" as const,
          action: "view_ticket",
          style: "border-green-500 text-green-600",
        };
      }
      return {
        label: "Event Ended",
        icon: Calendar,
        variant: "outline" as const,
        action: "event_ended",
        style: "opacity-60",
        disabled: true,
      };
    }

    if (isPaymentFailed) {
      return {
        label: "Retry Payment",
        icon: RotateCcw,
        variant: "default" as const,
        action: "retry_payment",
        style: "bg-amber-500 hover:bg-amber-600 text-white",
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
  }, [eventStatus, registrationStatus, isDisabled, isLoggedIn, isFree, price, isPaymentFailed]);

  const buttonConfig = getButtonConfig();
  const IconComponent = buttonConfig.icon;

  async function recordPaymentFailure(regId: number, reason: string, token?: string | null) {
    try {
      await fetch("/api/payments/record-failure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: regId,
          paymentToken: token,
          reason,
        }),
      });
    } catch {
    }
  }

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

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      if (orderData.reconciled) {
        setSuccessTicketCode(orderData.registration?.ticketCode || null);
        setIsSuccess(true);
        setIsPaymentPending(false);
        toast.success(orderData.message || "Payment confirmed! Your ticket is ready.");
        await revalidateUserStatus();
        setIsLoading(false);
        return;
      }

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

            const verifyData = await verifyRes.json();

            if (verifyRes.status === 202) {
              toast.info(verifyData.error || "Payment is still being processed. Please wait and try again.");
              await revalidateUserStatus();
              setIsLoading(false);
              return;
            }

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            setSuccessTicketCode(verifyData.registration?.ticketCode || null);
            setIsSuccess(true);
            setIsPaymentPending(false);
            toast.success("Payment verified! Your ticket is ready.");
            await revalidateUserStatus();
          } catch (error) {
            const msg = error instanceof Error ? error.message : "Payment verification failed";
            toast.error(msg);
            await revalidateUserStatus();
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
      rzp.on("payment.failed", async function (response: any) {
        const desc = response?.error?.description || "Payment failed. Please try again.";
        const reason = response?.error?.reason || "unknown";
        toast.error(desc);
        setIsLoading(false);
        await recordPaymentFailure(regId, `${reason}: ${desc}`, activeToken);
        await revalidateUserStatus();
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

      case "retry_payment":
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
              } else {
                setIsSuccess(true);
                setIsOpen(true);
                toast.success("Registration successful!");
                await revalidateUserStatus();
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
        } else {
          setSuccessTicketCode(data.registration?.ticketCode || null);
          setIsSuccess(true);
          toast.success("Registration successful!");
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

      {isPaymentFailed && (
        <div className="flex items-center gap-2 text-sm text-amber-600 mb-4 px-1" data-testid="text-payment-failed-hint">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Your previous payment didn't go through. Tap above to retry.</span>
        </div>
      )}

      {eventStatus === "finished" && registrationStatus !== "registered" && registrationStatus !== "attended" && (
        <Button
          variant="ghost"
          className="w-full mb-4 text-sm"
          data-testid="button-notify-me"
          onClick={() => {
            toast.success("We'll notify you about similar upcoming events!", {
              description: "Keep an eye on your email for future event announcements.",
              duration: 4000,
            });
          }}
        >
          <Bell className="mr-2 h-4 w-4" />
          Notify Me of Future Events
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          {isSuccess ? (
            <div className="py-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <DialogTitle className="text-2xl mb-2">
                {isFree ? "You're Registered!" : "Payment Verified!"}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-4">
                  <p className="text-slate-600">
                    {isFree 
                      ? "You're all set! Check your email for event details."
                      : "Your ticket is ready."
                    }
                  </p>
                  <div className="p-3 bg-slate-50 rounded-lg text-left text-sm text-slate-700 space-y-1.5">
                    <p className="font-medium text-slate-900">{eventTitle}</p>
                    {eventStartDate && (
                      <p className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {formatDate(eventStartDate)}
                      </p>
                    )}
                    {eventMode && (
                      <p className="flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-slate-500" />
                        {eventMode === "online" ? "Online Event" : eventMode === "hybrid" ? "Hybrid Event" : "In-Person Event"}
                      </p>
                    )}
                    {successTicketCode && (
                      <p className="flex items-center gap-1.5 font-mono text-xs mt-2 pt-2 border-t border-slate-200">
                        <Ticket className="h-3.5 w-3.5 text-slate-500" />
                        Ticket: {successTicketCode}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      className="w-full"
                      data-testid="button-view-ticket-success"
                      onClick={() => {
                        setIsOpen(false);
                        setIsSuccess(false);
                        setSuccessTicketCode(null);
                        setRegistrationId(null);
                        setPaymentToken(null);
                        router.push("/dashboard/tickets");
                        router.refresh();
                      }}
                    >
                      <Ticket className="mr-2 h-4 w-4" />
                      View Ticket
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="button-browse-events-success"
                      onClick={() => {
                        setIsOpen(false);
                        setIsSuccess(false);
                        setSuccessTicketCode(null);
                        router.push("/events");
                      }}
                    >
                      Browse More Events
                    </Button>
                  </div>
                </div>
              </DialogDescription>
            </div>
          ) : isPaymentPending ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  {isPaymentFailed ? "Retry Payment" : "Complete Payment"}
                </DialogTitle>
                <DialogDescription>
                  {eventTitle}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {isPaymentFailed && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2" data-testid="text-payment-failed-banner">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      Your previous payment attempt was unsuccessful. No amount was charged. You can safely try again.
                    </p>
                  </div>
                )}

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
