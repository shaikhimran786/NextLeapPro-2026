"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Users, Clock, CheckCircle, UserPlus, AlertCircle, Settings, Shield,
  Calendar, Ticket, RotateCcw, Award, Video, PlayCircle, ShoppingCart, RefreshCw,
  Rocket, Zap, LogIn, User, Crown, ArrowRight, LayoutDashboard } from "@/lib/icons";
import { useUserStatus, revalidateUserStatus, performOptimisticAction } from "@/hooks/useUserStatus";
import { getCTAWithAuthGates, getStyleClasses, CTAPresentation, CTAContext, CTAStyle } from "@/lib/cta-engine";
import { UserStatus, MembershipStatus, EventRegistrationStatus } from "@/lib/user-status";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  Users, Clock, CheckCircle, UserPlus, AlertCircle, Settings, Shield,
  Calendar, Ticket, RotateCcw, Award, Video, PlayCircle, ShoppingCart, RefreshCw,
  Rocket, Zap, LogIn, User, Crown, ArrowRight, LayoutDashboard, Loader: Loader2,
};

interface DynamicCTAProps {
  context: CTAContext;
  onAction?: (action: string, targetId?: number) => Promise<void>;
  requiresAuth?: boolean;
  requiresOnboarding?: boolean;
  requiresSubscription?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  fullWidth?: boolean;
  showIcon?: boolean;
  customLabels?: Partial<Record<string, string>>;
}

export function DynamicCTA({
  context,
  onAction,
  requiresAuth = true,
  requiresOnboarding = false,
  requiresSubscription,
  className,
  size = "default",
  fullWidth = false,
  showIcon = true,
  customLabels,
}: DynamicCTAProps) {
  const router = useRouter();
  const { userStatus, isLoading: isStatusLoading } = useUserStatus();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  const ctaPresentation = useMemo(() => {
    const cta = getCTAWithAuthGates(userStatus, context, {
      requiresAuth,
      requiresOnboarding,
      requiresSubscription,
    });

    if (customLabels && customLabels[cta.action]) {
      return { ...cta, label: customLabels[cta.action]! };
    }

    return cta;
  }, [userStatus, context, requiresAuth, requiresOnboarding, requiresSubscription, customLabels]);

  const handleClick = useCallback(async () => {
    if (ctaPresentation.isDisabled || isActionLoading) return;

    if (ctaPresentation.redirectUrl) {
      router.push(ctaPresentation.redirectUrl);
      return;
    }

    const action = ctaPresentation.action;

    if (action === "signup") {
      router.push("/auth/register");
      return;
    }

    if (action === "onboarding") {
      router.push("/onboarding");
      return;
    }

    if (action === "dashboard") {
      router.push("/dashboard");
      return;
    }

    if (action === "upgrade" || action === "subscribe") {
      router.push("/pricing");
      return;
    }

    if (onAction) {
      setIsActionLoading(true);
      try {
        await onAction(action, context.targetId);
        setActionSuccess(true);
        await revalidateUserStatus();
        setTimeout(() => setActionSuccess(false), 2000);
      } catch (error) {
        toast.error("Action failed. Please try again.");
      } finally {
        setIsActionLoading(false);
      }
    }
  }, [ctaPresentation, isActionLoading, router, onAction, context.targetId]);

  const Icon = ctaPresentation.icon ? iconMap[ctaPresentation.icon] : null;
  const isLoading = isStatusLoading || isActionLoading;

  const buttonClasses = cn(
    "relative transition-all duration-200 rounded-full font-medium",
    getStyleClasses(ctaPresentation.style),
    fullWidth && "w-full",
    size === "sm" && "h-9 px-4 text-sm",
    size === "default" && "h-11 px-6",
    size === "lg" && "h-14 px-8 text-lg",
    className
  );

  const buttonContent = (
    <motion.span
      className="flex items-center justify-center gap-2"
      initial={false}
      animate={actionSuccess ? { scale: [1, 1.05, 1] } : {}}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </motion.span>
        ) : actionSuccess ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Done!</span>
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            {showIcon && Icon && <Icon className="h-4 w-4" />}
            <span>{ctaPresentation.label}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );

  const button = (
    <Button
      onClick={handleClick}
      disabled={ctaPresentation.isDisabled || isLoading}
      className={buttonClasses}
      aria-disabled={ctaPresentation.isDisabled}
      data-testid={`cta-${context.targetType}${context.targetId ? `-${context.targetId}` : ""}`}
    >
      {buttonContent}
    </Button>
  );

  if (ctaPresentation.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{ctaPresentation.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

export function CommunityCTA({
  communityId,
  isPublic = true,
  onJoin,
  onLeave,
  onAcceptInvite,
  className,
  size,
  fullWidth,
}: {
  communityId: number;
  isPublic?: boolean;
  onJoin?: () => Promise<void>;
  onLeave?: () => Promise<void>;
  onAcceptInvite?: () => Promise<void>;
  className?: string;
  size?: "sm" | "default" | "lg";
  fullWidth?: boolean;
}) {
  const handleAction = async (action: string) => {
    switch (action) {
      case "join":
        await onJoin?.();
        break;
      case "leave":
        await onLeave?.();
        break;
      case "accept":
        await onAcceptInvite?.();
        break;
    }
  };

  return (
    <DynamicCTA
      context={{
        targetType: "community",
        targetId: communityId,
        isPublicCommunity: isPublic,
      }}
      onAction={handleAction}
      className={className}
      size={size}
      fullWidth={fullWidth}
    />
  );
}

export function EventCTA({
  eventId,
  eventStatus = "upcoming",
  isFree = false,
  onRegister,
  onCancel,
  onJoinLive,
  className,
  size,
  fullWidth,
}: {
  eventId: number;
  eventStatus?: "upcoming" | "live" | "finished";
  isFree?: boolean;
  onRegister?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  onJoinLive?: () => Promise<void>;
  className?: string;
  size?: "sm" | "default" | "lg";
  fullWidth?: boolean;
}) {
  const handleAction = async (action: string) => {
    switch (action) {
      case "register":
        await onRegister?.();
        break;
      case "cancel":
        await onCancel?.();
        break;
      case "join_live":
        await onJoinLive?.();
        break;
    }
  };

  return (
    <DynamicCTA
      context={{
        targetType: "event",
        targetId: eventId,
        eventStatus,
        isFreeEvent: isFree,
      }}
      onAction={handleAction}
      className={className}
      size={size}
      fullWidth={fullWidth}
    />
  );
}

export function ServiceCTA({
  serviceId,
  onBook,
  onViewBooking,
  className,
  size,
  fullWidth,
}: {
  serviceId: number;
  onBook?: () => Promise<void>;
  onViewBooking?: () => Promise<void>;
  className?: string;
  size?: "sm" | "default" | "lg";
  fullWidth?: boolean;
}) {
  const handleAction = async (action: string) => {
    switch (action) {
      case "book":
        await onBook?.();
        break;
      case "view_booking":
        await onViewBooking?.();
        break;
    }
  };

  return (
    <DynamicCTA
      context={{
        targetType: "service",
        targetId: serviceId,
      }}
      onAction={handleAction}
      className={className}
      size={size}
      fullWidth={fullWidth}
    />
  );
}

export function HeroCTA({
  className,
  size = "lg",
}: {
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  return (
    <DynamicCTA
      context={{ targetType: "hero" }}
      requiresAuth={false}
      className={className}
      size={size}
    />
  );
}

export function SubscriptionCTA({
  tier,
  className,
  size,
  fullWidth,
  onSubscribe,
}: {
  tier?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  fullWidth?: boolean;
  onSubscribe?: () => Promise<void>;
}) {
  const handleAction = async (action: string) => {
    if (action === "subscribe" || action === "upgrade" || action === "renew" || action === "reactivate") {
      await onSubscribe?.();
    }
  };

  return (
    <DynamicCTA
      context={{
        targetType: "subscription",
        subscriptionTier: tier,
      }}
      onAction={handleAction}
      requiresAuth={true}
      className={className}
      size={size}
      fullWidth={fullWidth}
    />
  );
}
