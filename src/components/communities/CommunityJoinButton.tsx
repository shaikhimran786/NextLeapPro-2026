"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, Users, Loader2, Lock, Globe, UserPlus, Clock, Settings, Shield, AlertCircle } from "@/lib/icons";
import { useUserStatus, revalidateUserStatus, performOptimisticAction } from "@/hooks/useUserStatus";
import { joinCommunity, leaveCommunity, acceptCommunityInvite } from "@/lib/actions/community-actions";
import { cn } from "@/lib/utils";

interface CommunityJoinButtonProps {
  communityId: number;
  communityName: string;
  isPublic: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  isMobile?: boolean;
}

export function CommunityJoinButton({
  communityId,
  communityName,
  isPublic,
  className = "",
  variant = "default",
  isMobile = false,
}: CommunityJoinButtonProps) {
  const router = useRouter();
  const { userStatus, isLoading: isStatusLoading } = useUserStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });

  const isLoggedIn = userStatus.authStatus === "logged_in";
  const membershipInfo = userStatus.communityMemberships[communityId];
  const membershipStatus = membershipInfo?.status || "not_member";

  const getButtonConfig = useCallback(() => {
    switch (membershipStatus) {
      case "owner":
        return {
          label: "Manage Community",
          icon: Settings,
          variant: "secondary" as const,
          action: "manage",
          style: "bg-gradient-to-r from-primary/90 to-blue-600/90 text-white hover:from-primary hover:to-blue-600",
        };
      case "admin":
        return {
          label: "Admin",
          icon: Settings,
          variant: "secondary" as const,
          action: "manage",
          style: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        };
      case "moderator":
        return {
          label: "Moderator",
          icon: Shield,
          variant: "secondary" as const,
          action: "moderate",
          style: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        };
      case "member":
        return {
          label: "Member",
          icon: CheckCircle,
          variant: "outline" as const,
          action: "view",
          style: "border-green-500 text-green-600",
        };
      case "pending":
        return {
          label: "Request Pending",
          icon: Clock,
          variant: "outline" as const,
          action: "none",
          style: "opacity-60",
          disabled: true,
          tooltip: "Your join request is being reviewed",
        };
      case "invited":
        return {
          label: "Accept Invite",
          icon: UserPlus,
          variant: "default" as const,
          action: "accept",
          style: "bg-green-600 hover:bg-green-700 text-white",
        };
      case "blocked":
        return {
          label: "Contact Support",
          icon: AlertCircle,
          variant: "outline" as const,
          action: "support",
          style: "border-red-500 text-red-600",
        };
      default:
        return {
          label: "Join Community",
          icon: Users,
          variant: variant === "outline" ? "outline" as const : "default" as const,
          action: "join",
          style: variant === "outline" 
            ? "bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
            : "bg-white text-primary hover:bg-white/90 shadow-lg",
        };
    }
  }, [membershipStatus, variant]);

  const buttonConfig = getButtonConfig();
  const IconComponent = buttonConfig.icon;

  const handleClick = async () => {
    if (buttonConfig.disabled) return;

    switch (buttonConfig.action) {
      case "manage":
        router.push(`/communities/${communityId}/settings`);
        break;

      case "moderate":
        router.push(`/communities/${communityId}/moderate`);
        break;

      case "view":
        router.push(`/communities/${communityId}/discussions`);
        break;

      case "support":
        router.push("/contact?subject=Community+Access");
        break;

      case "accept":
        try {
          setIsLoading(true);
          await acceptCommunityInvite(communityId);
          toast.success("Welcome to the community!");
          await revalidateUserStatus();
        } catch (error) {
          if (error instanceof Error) {
            toast.error(error.message);
          } else {
            toast.error("Failed to accept invite. Please try again.");
          }
        } finally {
          setIsLoading(false);
        }
        break;

      case "join":
        if (isLoggedIn) {
          try {
            setIsLoading(true);

            // Use performOptimisticAction for immediate UI feedback
            await performOptimisticAction(
              // Optimistic update: immediately show as member/pending
              (current) => ({
                ...current,
                communityMemberships: {
                  ...current.communityMemberships,
                  [communityId]: {
                    status: isPublic ? 'member' : 'pending',
                    role: isPublic ? 'member' : 'pending',
                    joinedAt: new Date().toISOString(),
                  },
                },
              }),
              // Server action
              async () => {
                const result = await joinCommunity(communityId);
                if (!result.success) throw new Error('Failed to join');
                return result;
              },
              // onSuccess
              (result) => {
                if (result.membership.isPending) {
                  toast.success("Join request submitted! You'll be notified when approved.");
                } else {
                  toast.success("Welcome to the community!");
                }
              },
              // onError (rollback happens automatically)
              (error) => {
                toast.error(error.message || "Failed to join community. Please try again.");
              }
            );
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

  async function handleGuestJoin() {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/communities/${communityId}/join`, {
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
        setIsSuccess(true);
        toast.success(isPublic ? "Welcome to the community!" : "Join request submitted!");

        setTimeout(async () => {
          setIsOpen(false);
          setIsSuccess(false);
          setFormData({ email: "", firstName: "", lastName: "" });
          // Revalidate user status before router refresh to ensure button updates
          await revalidateUserStatus();
          router.refresh();
        }, 2000);
      } else {
        toast.error(data.error || "Failed to join community");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleLoginRedirect = () => {
    router.push(`/auth/login?redirect=/communities/${communityId}`);
  };

  return (
    <>
      <Button
        className={cn(buttonConfig.style, "rounded-full", className)}
        data-testid={isMobile ? "button-join-community-mobile" : "button-join-community"}
        disabled={buttonConfig.disabled || isLoading || isStatusLoading}
        onClick={handleClick}
        variant={buttonConfig.variant}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <IconComponent className="mr-2 h-4 w-4" />
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
                {isPublic ? "Welcome!" : "Request Submitted!"}
              </DialogTitle>
              <DialogDescription>
                {isPublic 
                  ? `You're now a member of ${communityName}!`
                  : "We'll notify you once your request is approved."
                }
              </DialogDescription>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  {isPublic ? "Join Community" : "Request to Join"}
                </DialogTitle>
                <DialogDescription>
                  {communityName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {!isPublic && (
                  <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
                    <Lock className="h-4 w-4 inline mr-2" />
                    This is a private community. Your request will be reviewed by the community admins.
                  </div>
                )}

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
                      data-testid="input-join-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      data-testid="input-join-lastname"
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
                    data-testid="input-join-email"
                  />
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
                  onClick={handleGuestJoin}
                  disabled={isLoading}
                  className="bg-gradient-primary"
                  data-testid="button-confirm-join"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isPublic ? (
                    "Join Now"
                  ) : (
                    "Submit Request"
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
