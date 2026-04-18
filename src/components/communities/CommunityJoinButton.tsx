"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle,
  Users,
  Loader2,
  Lock,
  UserPlus,
  Clock,
  Settings,
  Shield,
  AlertCircle,
  LogOut,
} from "@/lib/icons";
import { useUserStatus, performOptimisticAction, revalidateUserStatus } from "@/hooks/useUserStatus";
import { leaveCommunity, acceptCommunityInvite, joinCommunity } from "@/lib/actions/community-actions";
import { cn } from "@/lib/utils";
import { CommunityGuestJoinDialog } from "@/components/communities/CommunityGuestJoinDialog";

interface CommunityJoinButtonProps {
  communityId: number;
  communityName: string;
  isPublic: boolean;
  membershipType?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  isMobile?: boolean;
}

function resolveJoinIntent(membershipType: string | undefined, isPublic: boolean): "open" | "approval" | "invite" {
  if (membershipType === "invite") return "invite";
  if (membershipType === "approval") return "approval";
  if (membershipType === "open") return "open";
  return isPublic ? "open" : "approval";
}

export function CommunityJoinButton({
  communityId,
  communityName,
  isPublic,
  membershipType,
  className = "",
  variant = "default",
  isMobile = false,
}: CommunityJoinButtonProps) {
  const router = useRouter();
  const { userStatus, isLoading: isStatusLoading } = useUserStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isLoggedIn = userStatus.authStatus === "logged_in";
  const membershipInfo = userStatus.communityMemberships[communityId];
  const membershipStatus = membershipInfo?.status || "not_member";
  const joinIntent = resolveJoinIntent(membershipType, isPublic);

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
          label: "Open Community",
          icon: CheckCircle,
          variant: "outline" as const,
          action: "view",
          style: "border-green-500 text-green-700 bg-green-50 hover:bg-green-100",
        };
      case "pending":
        return {
          label: "Request Pending",
          icon: Clock,
          variant: "outline" as const,
          action: "none",
          style: "opacity-60",
          disabled: true,
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
        if (joinIntent === "invite") {
          return {
            label: "Invite Only",
            icon: Lock,
            variant: "outline" as const,
            action: "none",
            style: "border-amber-400 text-amber-700 bg-amber-50",
            disabled: true,
          };
        }
        return {
          label: joinIntent === "approval" ? "Request to Join" : "Join Community",
          icon: Users,
          variant: variant === "outline" ? ("outline" as const) : ("default" as const),
          action: "join",
          style:
            variant === "outline"
              ? "bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
              : "bg-white text-primary hover:bg-white/90 shadow-lg",
        };
    }
  }, [membershipStatus, variant, joinIntent]);

  const buttonConfig = getButtonConfig();
  const IconComponent = buttonConfig.icon ?? Users;

  // Owner/admin already get a dedicated CommunitySettingsButton on the detail page,
  // so suppress this CTA for those roles to avoid duplicate "Manage" buttons.
  if (membershipStatus === "owner" || membershipStatus === "admin") {
    return null;
  }

  const handleClick = async () => {
    if (buttonConfig.disabled) return;

    switch (buttonConfig.action) {
      case "manage":
        router.push(`/communities/${communityId}/settings`);
        break;

      case "moderate":
        // Moderation page does not exist as a dedicated route; send to detail.
        router.push(`/communities/${communityId}`);
        break;

      case "view":
        // Open the community detail page (members already there will simply re-fetch).
        router.push(`/communities/${communityId}`);
        break;

      case "support":
        router.push("/contact?subject=Community+Access");
        break;

      case "accept":
        try {
          setIsLoading(true);
          await performOptimisticAction(
            (current) => ({
              ...current,
              communityMemberships: {
                ...current.communityMemberships,
                [communityId]: {
                  status: "member",
                  role: "member",
                  joinedAt: new Date().toISOString(),
                },
              },
            }),
            async () => acceptCommunityInvite(communityId),
            () => toast.success("Welcome to the community!"),
            (error) => toast.error(error.message || "Failed to accept invite. Please try again."),
          );
          await revalidateUserStatus();
        } finally {
          setIsLoading(false);
        }
        break;

      case "join":
        if (isLoggedIn) {
          try {
            setIsLoading(true);
            const optimisticRole = joinIntent === "approval" ? "pending" : "member";

            await performOptimisticAction(
              (current) => ({
                ...current,
                communityMemberships: {
                  ...current.communityMemberships,
                  [communityId]: {
                    status: optimisticRole,
                    role: optimisticRole,
                    joinedAt: new Date().toISOString(),
                  },
                },
              }),
              async () => {
                const result = await joinCommunity(communityId);
                if (!result.success) throw new Error("Failed to join");
                return result;
              },
              (result) => {
                if (result.membership.isPending) {
                  toast.success("Join request submitted! You'll be notified when approved.");
                } else {
                  toast.success("Welcome to the community!");
                }
              },
              (error) => {
                toast.error(error.message || "Failed to join community. Please try again.");
              },
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

  // Members & moderators can leave; owners/admins cannot via this control.
  const showLeaveButton = membershipStatus === "member" || membershipStatus === "moderator";

  async function handleLeave() {
    if (isLeaving) return;
    if (!confirm(`Leave ${communityName}? You can re-join later.`)) return;
    try {
      setIsLeaving(true);
      await performOptimisticAction(
        (current) => {
          const next = { ...current.communityMemberships };
          delete next[communityId];
          return { ...current, communityMemberships: next };
        },
        async () => leaveCommunity(communityId),
        () => toast.success(`You left ${communityName}.`),
        (err) => toast.error(err.message || "Failed to leave community"),
      );
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <>
      <div className={cn("flex items-center gap-2", isMobile && "flex-col w-full")}>
        <Button
          className={cn(buttonConfig.style, "rounded-full", isMobile && "w-full", className)}
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

        {showLeaveButton && (
          <Button
            variant="outline"
            className={cn(
              "rounded-full bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm",
              isMobile && "w-full",
            )}
            disabled={isLeaving}
            onClick={handleLeave}
            data-testid={isMobile ? "button-leave-community-mobile" : "button-leave-community"}
          >
            {isLeaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Leaving…
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Leave
              </>
            )}
          </Button>
        )}
      </div>

      <CommunityGuestJoinDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        communityId={communityId}
        communityName={communityName}
        membershipType={membershipType}
        isPublic={isPublic}
      />
    </>
  );
}
