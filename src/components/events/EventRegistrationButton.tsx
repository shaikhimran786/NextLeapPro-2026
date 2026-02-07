"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, Loader2, Calendar, Video, Ticket, RotateCcw, LogIn, CreditCard, Clock, ExternalLink } from "@/lib/icons";
import { formatINR } from "@/lib/utils";
import { useUserStatus, revalidateUserStatus } from "@/hooks/useUserStatus";
import { registerForEvent, cancelEventRegistration, getEventJoinLink, confirmEventPayment } from "@/lib/actions/event-actions";
import { cn } from "@/lib/utils";

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
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<number | null>(null);
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
              if (result.requiresPayment && result.paymentUrl) {
                setPaymentUrl(result.paymentUrl);
                setRegistrationId(result.registration.id);
                setIsPaymentPending(true);
                setIsOpen(true);
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
        if (data.requiresPayment && data.paymentUrl) {
          setPaymentUrl(data.paymentUrl);
          setRegistrationId(data.registration.id);
          setIsPaymentPending(true);
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

  async function handlePaymentComplete() {
    if (!registrationId) {
      toast.error("Registration not found");
      return;
    }

    setIsLoading(true);

    try {
      const result = await confirmEventPayment(registrationId);
      if (result.success) {
        setIsSuccess(true);
        toast.success("Payment confirmed! Your ticket is ready.");
        await revalidateUserStatus();
        
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          setIsPaymentPending(false);
          setPaymentUrl(null);
          setRegistrationId(null);
          router.push("/dashboard/tickets");
          router.refresh();
        }, 2000);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to confirm payment. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenPaymentLink() {
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
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
                {isFree ? "You're Registered!" : "Payment Confirmed!"}
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
                    Click the button below to complete your payment
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleOpenPaymentLink}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-open-payment"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Pay with Cashfree
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500">After payment</span>
                    </div>
                  </div>

                  <Button
                    onClick={handlePaymentComplete}
                    disabled={isLoading}
                    className="w-full"
                    variant="default"
                    data-testid="button-confirm-payment"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        I've Completed Payment
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  After completing your payment, click the button above to confirm and receive your ticket.
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsOpen(false);
                    setIsPaymentPending(false);
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
