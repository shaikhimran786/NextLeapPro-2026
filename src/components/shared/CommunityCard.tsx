"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MapPin, ArrowUpRight, Video, Lock, CheckCircle, Clock, Settings, Shield, UserPlus, Loader2 } from "@/lib/icons";
import { SmartImage } from "@/components/ui/smart-image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useUserStatus, performOptimisticAction, revalidateUserStatus } from "@/hooks/useUserStatus";
import { joinCommunity, acceptCommunityInvite } from "@/lib/actions/community-actions";
import { cn } from "@/lib/utils";
import { CommunityGuestJoinDialog } from "@/components/communities/CommunityGuestJoinDialog";
import { resolveJoinIntent } from "@/lib/community-membership";

interface CommunityCardProps {
  id: number;
  name: string;
  description: string;
  logo: string;
  category: string;
  memberCount: number;
  location?: string | null;
  tags?: string[];
  mode?: string;
  membershipType?: string;
  isPublic?: boolean;
  index?: number;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Technology: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Design: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Business: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  Marketing: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Education: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  "Career Growth": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  Finance: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Health: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  default: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

const categoryGradients: Record<string, string> = {
  Technology: "from-blue-500 to-cyan-500",
  Design: "from-purple-500 to-pink-500",
  Business: "from-green-500 to-emerald-500",
  Marketing: "from-orange-500 to-amber-500",
  Education: "from-cyan-500 to-teal-500",
  "Career Growth": "from-indigo-500 to-violet-500",
  Finance: "from-emerald-500 to-green-500",
  Health: "from-rose-500 to-pink-500",
  default: "from-primary to-blue-600",
};

function CommunityCardComponent({
  id,
  name,
  description,
  logo,
  category,
  memberCount,
  location,
  tags = [],
  mode,
  membershipType,
  isPublic = true,
}: CommunityCardProps) {
  const router = useRouter();
  const { userStatus, isLoading: isStatusLoading } = useUserStatus();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const colorScheme = categoryColors[category] || categoryColors.default;
  const gradient = categoryGradients[category] || categoryGradients.default;

  const isLoggedIn = userStatus.authStatus === "logged_in";
  const membershipInfo = userStatus.communityMemberships[id];
  const membershipStatus = membershipInfo?.status || "not_member";
  const joinIntent = resolveJoinIntent(membershipType, isPublic);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const detailHref = `/communities/${id}`;

  // Membership badge shown near the top
  const membershipBadge = (() => {
    switch (membershipStatus) {
      case "owner":
        return { label: "Owner", icon: Settings, className: "bg-primary/10 text-primary border-primary/20" };
      case "admin":
        return { label: "Admin", icon: Settings, className: "bg-slate-100 text-slate-700 border-slate-200" };
      case "moderator":
        return { label: "Moderator", icon: Shield, className: "bg-slate-100 text-slate-700 border-slate-200" };
      case "member":
        return { label: "Joined", icon: CheckCircle, className: "bg-green-50 text-green-700 border-green-200" };
      case "pending":
        return { label: "Pending", icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200" };
      case "invited":
        return { label: "Invited", icon: UserPlus, className: "bg-blue-50 text-blue-700 border-blue-200" };
      default:
        return null;
    }
  })();

  // CTA button config
  const ctaConfig = (() => {
    if (isStatusLoading) {
      return { label: "Loading…", href: detailHref, variant: "outline" as const, disabled: true };
    }
    switch (membershipStatus) {
      case "owner":
      case "admin":
        return {
          label: "Manage",
          href: `/communities/${id}/settings`,
          variant: "default" as const,
          icon: Settings,
        };
      case "moderator":
      case "member":
        return {
          label: "Open Community",
          href: detailHref,
          variant: "outline" as const,
          icon: ArrowUpRight,
        };
      case "pending":
        return {
          label: "Request Pending",
          href: detailHref,
          variant: "outline" as const,
          disabled: true,
          icon: Clock,
        };
      case "invited":
        return {
          label: "Accept Invite",
          variant: "default" as const,
          icon: UserPlus,
          action: "accept" as const,
        };
      case "blocked":
        return {
          label: "View",
          href: detailHref,
          variant: "outline" as const,
          icon: ArrowUpRight,
        };
      default: {
        if (joinIntent === "invite") {
          return {
            label: "Invite Only",
            href: detailHref,
            variant: "outline" as const,
            disabled: true,
            icon: Lock,
          };
        }
        return {
          label: joinIntent === "approval" ? "Request to Join" : "Join Community",
          variant: "default" as const,
          icon: UserPlus,
          action: (isLoggedIn ? "join" : "guest_join") as "join" | "guest_join",
        };
      }
    }
  })();

  async function handleCtaClick(e: React.MouseEvent) {
    stop(e);
    if (ctaConfig.disabled || isActionLoading) return;

    if ("href" in ctaConfig && ctaConfig.href) {
      router.push(ctaConfig.href);
      return;
    }

    if ("action" in ctaConfig && ctaConfig.action === "accept") {
      try {
        setIsActionLoading(true);
        await performOptimisticAction(
          (current) => ({
            ...current,
            communityMemberships: {
              ...current.communityMemberships,
              [id]: {
                status: "member",
                role: "member",
                joinedAt: new Date().toISOString(),
              },
            },
          }),
          async () => acceptCommunityInvite(id),
          () => toast.success(`Welcome to ${name}!`),
          (err) => toast.error(err.message || "Failed to accept invite"),
        );
        await revalidateUserStatus();
      } finally {
        setIsActionLoading(false);
      }
      return;
    }

    if ("action" in ctaConfig && ctaConfig.action === "guest_join") {
      setIsGuestDialogOpen(true);
      return;
    }

    if ("action" in ctaConfig && ctaConfig.action === "join") {
      try {
        setIsActionLoading(true);
        const optimisticRole = joinIntent === "approval" ? "pending" : "member";
        await performOptimisticAction(
          (current) => ({
            ...current,
            communityMemberships: {
              ...current.communityMemberships,
              [id]: {
                status: optimisticRole,
                role: optimisticRole,
                joinedAt: new Date().toISOString(),
              },
            },
          }),
          async () => {
            const result = await joinCommunity(id);
            if (!result.success) throw new Error("Failed to join");
            return result;
          },
          (result) => {
            if (result.membership.isPending) {
              toast.success("Join request submitted! You'll be notified when approved.");
            } else {
              toast.success(`Welcome to ${name}!`);
            }
          },
          (err) => {
            toast.error(err.message || "Failed to join community");
          },
        );
      } finally {
        setIsActionLoading(false);
      }
    }
  }

  const CtaIcon = "icon" in ctaConfig ? ctaConfig.icon : ArrowUpRight;

  return (
    <motion.div
      className="relative h-full group"
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      <motion.div
        className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none`}
        variants={{ rest: { opacity: 0 }, hover: { opacity: 0.4 } }}
      />

      <Card
        className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-none shadow-md hover:shadow-xl transition-all duration-500 h-full rounded-2xl flex flex-col"
        data-testid={`community-card-${id}`}
      >
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-bl-full pointer-events-none`} />

        {/* Stretched link overlay so the entire card (except CTA) is clickable */}
        <Link
          href={detailHref}
          aria-label={`View ${name} community`}
          className="absolute inset-0 z-10"
          data-testid={`link-community-${id}`}
        />

        <CardContent className="p-6 relative flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <motion.div
              className="relative"
              variants={{ rest: { scale: 1, rotate: 0 }, hover: { scale: 1.05, rotate: 3 } }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-xl blur-sm opacity-30`} />
              <div className="relative h-16 w-16 rounded-xl overflow-hidden ring-2 ring-white shadow-md">
                <SmartImage
                  src={logo}
                  alt={`${name} community logo - ${category}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  fallbackType="logo"
                />
              </div>
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.h3
                className="font-heading font-bold text-lg line-clamp-1 text-slate-900"
                variants={{ rest: { color: "#0f172a" }, hover: { color: "#FF0099" } }}
                transition={{ duration: 0.3 }}
              >
                {name}
              </motion.h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge className={`${colorScheme.bg} ${colorScheme.text} ${colorScheme.border} border font-medium`}>
                  {category}
                </Badge>
                {membershipBadge && (
                  <Badge
                    className={cn("border font-medium flex items-center gap-1", membershipBadge.className)}
                    data-testid={`badge-membership-${id}`}
                  >
                    <membershipBadge.icon className="w-3 h-3" />
                    {membershipBadge.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 bg-slate-100 rounded-full text-slate-600"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs px-2.5 py-1 text-slate-400">
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Mode & Membership type badges */}
          {(mode || membershipType) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {mode && mode !== "hybrid" && (
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1">
                  {mode === "online" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                  {mode === "online" ? "Online" : "In Person"}
                </span>
              )}
              {membershipType && membershipType !== "open" && (
                <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {membershipType === "approval" ? "Approval" : "Invite Only"}
                </span>
              )}
            </div>
          )}

          {/* Footer Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-7 h-7 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center`}>
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-slate-700 font-medium" suppressHydrationWarning>
                {memberCount.toLocaleString("en-IN")}
              </span>
              <span className="text-slate-400 text-xs">members</span>
            </div>

            {location && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin size={14} className="text-slate-400" />
                <span className="truncate max-w-[100px]">{location}</span>
              </div>
            )}
          </div>

          {/* CTA - sits above the stretched link via z-index */}
          <div className="relative z-20 mt-4">
            {!isMounted ? (
              <div
                className="h-9 w-full rounded-full bg-slate-100 animate-pulse"
                aria-hidden="true"
              />
            ) : (
              <Button
                type="button"
                size="sm"
                variant={ctaConfig.variant}
                disabled={ctaConfig.disabled || isActionLoading}
                onClick={handleCtaClick}
                className="w-full rounded-full"
                data-testid={`cta-community-${id}`}
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Working…
                  </>
                ) : (
                  <>
                    <CtaIcon className="mr-2 h-4 w-4" />
                    {ctaConfig.label}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <CommunityGuestJoinDialog
        open={isGuestDialogOpen}
        onOpenChange={setIsGuestDialogOpen}
        communityId={id}
        communityName={name}
        membershipType={membershipType}
        isPublic={isPublic}
      />
    </motion.div>
  );
}

export const CommunityCard = memo(CommunityCardComponent);
