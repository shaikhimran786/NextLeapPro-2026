"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Globe, Lock, Loader2 } from "@/lib/icons";
import { toast } from "sonner";
import { useUserStatus, revalidateUserStatus } from "@/hooks/useUserStatus";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: number;
  communityName: string;
  membershipType?: string;
  isPublic: boolean;
}

function resolveIntent(membershipType: string | undefined, isPublic: boolean) {
  if (membershipType === "invite") return "invite" as const;
  if (membershipType === "approval") return "approval" as const;
  if (membershipType === "open") return "open" as const;
  return isPublic ? "open" : "approval";
}

export function CommunityGuestJoinDialog({
  open,
  onOpenChange,
  communityId,
  communityName,
  membershipType,
  isPublic,
}: Props) {
  const router = useRouter();
  const { userStatus } = useUserStatus();
  const isLoggedIn = userStatus.authStatus === "logged_in";

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ email: "", firstName: "", lastName: "" });

  // Prefill / lock fields for logged-in users.
  useEffect(() => {
    if (!open) return;
    if (isLoggedIn) {
      setFormData({
        email: userStatus.email || "",
        firstName: userStatus.firstName || "",
        lastName: userStatus.lastName || "",
      });
    }
  }, [open, isLoggedIn, userStatus.email, userStatus.firstName, userStatus.lastName]);

  const intent = resolveIntent(membershipType, isPublic);
  const isApproval = intent === "approval";

  async function handleSubmit() {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        toast.success(
          isApproval
            ? "Join request submitted!"
            : `Welcome to ${communityName}!`
        );
        setTimeout(async () => {
          onOpenChange(false);
          setIsSuccess(false);
          if (!isLoggedIn) {
            setFormData({ email: "", firstName: "", lastName: "" });
          }
          await revalidateUserStatus();
          router.refresh();
        }, 1800);
      } else {
        toast.error(data.error || "Failed to join community");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogin() {
    router.push(`/auth/login?redirect=/communities/${communityId}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <DialogTitle className="text-2xl mb-2">
              {isApproval ? "Request Submitted!" : "Welcome!"}
            </DialogTitle>
            <DialogDescription>
              {isApproval
                ? "We'll notify you once your request is approved."
                : `You're now a member of ${communityName}!`}
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isApproval ? <Lock className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                {isApproval ? "Request to Join" : "Join Community"}
              </DialogTitle>
              <DialogDescription>{communityName}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {isApproval && (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
                  <Lock className="h-4 w-4 inline mr-2" />
                  This community requires approval. Your request will be reviewed by the community admins.
                </div>
              )}

              {!isLoggedIn && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={handleLogin}
                      className="font-semibold underline hover:no-underline"
                      data-testid="link-guest-join-login"
                    >
                      Log in
                    </button>{" "}
                    for faster registration.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    readOnly={isLoggedIn}
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
                    readOnly={isLoggedIn}
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
                  readOnly={isLoggedIn}
                  data-testid="input-join-email"
                />
                {isLoggedIn && (
                  <p className="text-xs text-slate-500">
                    Joining as your signed-in account.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-primary"
                data-testid="button-confirm-join"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isApproval ? (
                  "Submit Request"
                ) : (
                  "Join Now"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
