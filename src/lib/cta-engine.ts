import {
  UserStatus,
  MembershipStatus,
  EventRegistrationStatus,
  ServiceOrderStatus,
  isAuthenticated,
  isOnboardingComplete,
  hasActiveSubscription,
  getMembershipStatus,
  getEventRegistrationStatus,
  getServiceOrderStatus,
} from "./user-status";

export type CTAStyle = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "disabled";

export interface CTAPresentation {
  label: string;
  style: CTAStyle;
  action: string;
  icon?: string;
  isDisabled: boolean;
  tooltip?: string;
  redirectUrl?: string;
}

export type CTATargetType = "community" | "event" | "service" | "subscription" | "hero";

export interface CTAContext {
  targetType: CTATargetType;
  targetId?: number;
  eventStatus?: "upcoming" | "live" | "finished";
  isPublicCommunity?: boolean;
  isFreeEvent?: boolean;
  subscriptionTier?: string;
}

const defaultCTAConfig: Record<CTATargetType, Record<string, CTAPresentation>> = {
  community: {
    not_member: {
      label: "Join Community",
      style: "primary",
      action: "join",
      icon: "Users",
      isDisabled: false,
    },
    pending: {
      label: "Request Pending",
      style: "disabled",
      action: "none",
      icon: "Clock",
      isDisabled: true,
      tooltip: "Your request is being reviewed",
    },
    member: {
      label: "Member",
      style: "outline",
      action: "view",
      icon: "CheckCircle",
      isDisabled: false,
    },
    invited: {
      label: "Accept Invite",
      style: "primary",
      action: "accept",
      icon: "UserPlus",
      isDisabled: false,
    },
    blocked: {
      label: "Contact Support",
      style: "danger",
      action: "support",
      icon: "AlertCircle",
      isDisabled: false,
    },
    admin: {
      label: "Admin",
      style: "secondary",
      action: "manage",
      icon: "Settings",
      isDisabled: false,
    },
    moderator: {
      label: "Moderator",
      style: "secondary",
      action: "moderate",
      icon: "Shield",
      isDisabled: false,
    },
  },
  event: {
    not_registered: {
      label: "Register",
      style: "primary",
      action: "register",
      icon: "Calendar",
      isDisabled: false,
    },
    registered: {
      label: "Registered",
      style: "success",
      action: "view_ticket",
      icon: "Ticket",
      isDisabled: false,
    },
    cancelled: {
      label: "Re-register",
      style: "outline",
      action: "register",
      icon: "RotateCcw",
      isDisabled: false,
    },
    attended: {
      label: "View Certificate",
      style: "outline",
      action: "certificate",
      icon: "Award",
      isDisabled: false,
    },
    waitlisted: {
      label: "On Waitlist",
      style: "secondary",
      action: "none",
      icon: "Clock",
      isDisabled: true,
      tooltip: "You'll be notified when a spot opens",
    },
    live: {
      label: "Join Now",
      style: "primary",
      action: "join_live",
      icon: "Video",
      isDisabled: false,
    },
    finished: {
      label: "View Recording",
      style: "outline",
      action: "recording",
      icon: "PlayCircle",
      isDisabled: false,
    },
  },
  service: {
    none: {
      label: "Book Now",
      style: "primary",
      action: "book",
      icon: "ShoppingCart",
      isDisabled: false,
    },
    pending: {
      label: "Booking Pending",
      style: "secondary",
      action: "view_booking",
      icon: "Clock",
      isDisabled: false,
    },
    confirmed: {
      label: "Booking Confirmed",
      style: "success",
      action: "view_booking",
      icon: "CheckCircle",
      isDisabled: false,
    },
    in_progress: {
      label: "In Progress",
      style: "secondary",
      action: "view_booking",
      icon: "Loader",
      isDisabled: false,
    },
    completed: {
      label: "Book Again",
      style: "outline",
      action: "book",
      icon: "RefreshCw",
      isDisabled: false,
    },
    cancelled: {
      label: "Book Again",
      style: "outline",
      action: "book",
      icon: "RefreshCw",
      isDisabled: false,
    },
  },
  subscription: {
    none: {
      label: "Get Started",
      style: "primary",
      action: "subscribe",
      icon: "Rocket",
      isDisabled: false,
    },
    trial: {
      label: "Upgrade Now",
      style: "primary",
      action: "upgrade",
      icon: "Zap",
      isDisabled: false,
    },
    active: {
      label: "Manage Subscription",
      style: "outline",
      action: "manage",
      icon: "Settings",
      isDisabled: false,
    },
    expired: {
      label: "Renew",
      style: "primary",
      action: "renew",
      icon: "RefreshCw",
      isDisabled: false,
    },
    cancelled: {
      label: "Reactivate",
      style: "primary",
      action: "reactivate",
      icon: "RotateCcw",
      isDisabled: false,
    },
  },
  hero: {
    guest: {
      label: "Get Started",
      style: "primary",
      action: "signup",
      icon: "ArrowRight",
      isDisabled: false,
    },
    logged_in: {
      label: "Go to Dashboard",
      style: "primary",
      action: "dashboard",
      icon: "LayoutDashboard",
      isDisabled: false,
    },
  },
};

const authRequiredCTA: CTAPresentation = {
  label: "Sign up to continue",
  style: "primary",
  action: "signup",
  icon: "LogIn",
  isDisabled: false,
  redirectUrl: "/auth/register",
};

const onboardingRequiredCTA: CTAPresentation = {
  label: "Complete Profile",
  style: "secondary",
  action: "onboarding",
  icon: "User",
  isDisabled: false,
  redirectUrl: "/onboarding",
};

const subscriptionRequiredCTA = (tier: string): CTAPresentation => ({
  label: `Upgrade to ${tier}`,
  style: "primary",
  action: "upgrade",
  icon: "Crown",
  isDisabled: false,
  redirectUrl: "/pricing",
});

export function getCTAPresentation(
  userStatus: UserStatus,
  context: CTAContext,
  customConfig?: Record<string, CTAPresentation>
): CTAPresentation {
  const config = customConfig || defaultCTAConfig[context.targetType];
  
  let state: string;

  switch (context.targetType) {
    case "community":
      state = context.targetId 
        ? getMembershipStatus(userStatus, context.targetId)
        : "not_member";
      break;
    
    case "event":
      if (context.eventStatus === "live") {
        const regStatus = context.targetId 
          ? getEventRegistrationStatus(userStatus, context.targetId)
          : "not_registered";
        state = regStatus === "registered" ? "live" : regStatus;
      } else if (context.eventStatus === "finished") {
        state = "finished";
      } else {
        state = context.targetId 
          ? getEventRegistrationStatus(userStatus, context.targetId)
          : "not_registered";
      }
      break;
    
    case "service":
      state = context.targetId 
        ? getServiceOrderStatus(userStatus, context.targetId)
        : "none";
      break;
    
    case "subscription":
      state = userStatus.subscriptionStatus;
      break;
    
    case "hero":
      state = isAuthenticated(userStatus) ? "logged_in" : "guest";
      break;
    
    default:
      state = "default";
  }

  const baseCTA = config[state] || config["not_member"] || config["none"] || {
    label: "Continue",
    style: "primary" as CTAStyle,
    action: "default",
    isDisabled: false,
  };

  return baseCTA;
}

export function getCTAWithAuthGates(
  userStatus: UserStatus,
  context: CTAContext,
  options: {
    requiresAuth?: boolean;
    requiresOnboarding?: boolean;
    requiresSubscription?: string;
    customConfig?: Record<string, CTAPresentation>;
  } = {}
): CTAPresentation {
  const { requiresAuth = true, requiresOnboarding = false, requiresSubscription } = options;

  if (requiresAuth && !isAuthenticated(userStatus)) {
    return {
      ...authRequiredCTA,
      label: `Sign up to ${getActionLabel(context.targetType)}`,
    };
  }

  if (requiresOnboarding && !isOnboardingComplete(userStatus)) {
    return {
      ...onboardingRequiredCTA,
      label: `Complete Profile to ${getActionLabel(context.targetType)}`,
    };
  }

  if (requiresSubscription && !hasActiveSubscription(userStatus)) {
    if (
      requiresSubscription === "pro" &&
      !["pro", "creator", "organizer", "enterprise"].includes(userStatus.subscriptionTier)
    ) {
      return subscriptionRequiredCTA("Pro");
    }
    if (
      requiresSubscription === "creator" &&
      !["creator", "organizer", "enterprise"].includes(userStatus.subscriptionTier)
    ) {
      return subscriptionRequiredCTA("Creator");
    }
  }

  return getCTAPresentation(userStatus, context, options.customConfig);
}

function getActionLabel(targetType: CTATargetType): string {
  switch (targetType) {
    case "community":
      return "join";
    case "event":
      return "register";
    case "service":
      return "book";
    case "subscription":
      return "subscribe";
    default:
      return "continue";
  }
}

export function getStyleClasses(style: CTAStyle): string {
  switch (style) {
    case "primary":
      return "bg-gradient-to-r from-primary via-blue-600 to-green-500 text-white hover:opacity-90 shadow-lg shadow-primary/25";
    case "secondary":
      return "bg-slate-100 text-slate-900 hover:bg-slate-200";
    case "outline":
      return "border border-slate-300 bg-transparent hover:bg-slate-50";
    case "ghost":
      return "bg-transparent hover:bg-slate-100";
    case "danger":
      return "bg-red-600 text-white hover:bg-red-700";
    case "success":
      return "bg-green-600 text-white hover:bg-green-700";
    case "disabled":
      return "bg-slate-200 text-slate-500 cursor-not-allowed opacity-60";
    default:
      return "bg-primary text-white hover:bg-primary/90";
  }
}
