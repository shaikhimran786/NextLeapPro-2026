"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { MegaMenuItem, MegaMenuFeaturedCard, PlanMiniCard } from "@/components/layout/MegaMenuItem";
import {
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  Crown,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  Home,
  GraduationCap,
  Briefcase,
  Users,
  CreditCard,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  PenTool,
  Calendar,
  Laptop,
  Video,
  Handshake,
  Target,
  MessageCircle,
  BookOpen,
  Zap,
  Star,
} from "@/lib/icons";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useUserStatus, performLogout } from "@/hooks/useUserStatus";
import { isAdmin, isCreator } from "@/lib/user-status";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { cn } from "@/lib/utils";

const DEFAULT_LOGO = "/logos/logo-dark.png";
const fetcher = (url: string) => fetch(url).then(res => res.json());

// TypeScript interface for the plans API response
interface PlanApiResponse {
  plans: Array<{
    name: string;
    price: number;
    interval: string;
    features: string[];
    isPopular: boolean;
    active: boolean;
  }>;
}

// Props for Navbar component
export interface NavbarProps {
  initialPlansData?: PlanApiResponse;
  initialSiteSettings?: any;
}

// Mobile navigation links
const mobileNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/services", label: "Services", icon: Briefcase },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/pricing", label: "Plans", icon: CreditCard },
  { href: "/contact", label: "Support", icon: HelpCircle },
];

// Mega menu data
const megaMenuData = {
  learn: {
    items: [
      { icon: Calendar, label: "Events", description: "Browse upcoming events", href: "/events" },
      { icon: GraduationCap, label: "Workshops", description: "Hands-on learning experiences", href: "/events?type=workshop" },
      { icon: Laptop, label: "Bootcamps", description: "Intensive learning programs", href: "/events?type=bootcamp" },
      { icon: Video, label: "Webinars", description: "Live online sessions", href: "/events?type=webinar" },
    ],
    featured: {
      badge: "Featured",
      title: "Next Workshop",
      description: "Join 200+ learners in our upcoming session",
      href: "/events",
    },
  },
  earn: {
    items: [
      { icon: Briefcase, label: "Services Marketplace", description: "Browse available services", href: "/services" },
      { icon: PenTool, label: "Create a Service", description: "Offer your expertise", href: "/services/create" },
      { icon: Handshake, label: "How It Works", description: "Learn the process", href: "/how-it-works" },
    ],
    featured: {
      badge: "Opportunity",
      title: "Start Earning Today",
      description: "Turn your skills into income",
      href: "/services/create",
      gradientFrom: "from-green-500/10",
      gradientTo: "to-emerald-500/10",
    },
  },
  community: {
    items: [
      { icon: Users, label: "Browse Communities", description: "Find your tribe", href: "/communities" },
      { icon: Target, label: "Create Community", description: "Build your own space", href: "/communities/create" },
      { icon: Star, label: "Featured Communities", description: "Popular & trending", href: "/communities?filter=featured" },
    ],
    featured: {
      badge: "Community",
      title: "10k+ Members",
      description: "Join the fastest growing career community",
      href: "/communities",
      gradientFrom: "from-blue-500/10",
      gradientTo: "to-indigo-500/10",
    },
  },
  plans: [
    {
      name: "Free",
      price: "₹0",
      features: ["Browse all events", "Join free community events", "Access public communities"],
      href: "/pricing",
    },
    {
      name: "Pro",
      price: "₹1,499/mo",
      features: ["Everything in Free", "Access premium events", "Event recordings"],
      href: "/pricing",
      highlight: true,
    },
    {
      name: "Creator",
      price: "₹3,999/mo",
      features: ["Everything in Pro", "Host unlimited events", "Create paid workshops"],
      href: "/pricing",
    },
  ],
  support: {
    items: [
      { icon: MessageCircle, label: "Contact Us", description: "Get in touch", href: "/contact" },
      { icon: BookOpen, label: "How It Works", description: "Platform guide", href: "/how-it-works" },
      { icon: HelpCircle, label: "FAQ", description: "Common questions", href: "/faq" },
      { icon: Zap, label: "About", description: "Our story", href: "/about" },
    ],
  },
};

interface MobileNavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

function MobileNavLink({ href, label, isActive, onClick, icon: Icon }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center gap-4 px-4 py-4 rounded-2xl font-medium text-base",
        "transition-all duration-200 ease-out active:scale-[0.98]",
        isActive
          ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
      )}
      data-testid={`mobile-nav-link-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {Icon && (
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
          isActive ? "bg-primary/10" : "bg-slate-100 group-hover:bg-slate-200"
        )}>
          <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-500")} />
        </div>
      )}
      <span className="flex-1">{label}</span>
      {isActive && (
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}
    </Link>
  );
}

// Mobile accordion section for mega menu items
interface MobileAccordionSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function MobileAccordionSection({ title, icon: Icon, children, defaultOpen = false }: MobileAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100">
            <Icon className="h-5 w-5 text-slate-500" />
          </div>
          <span className="font-medium text-slate-900">{title}</span>
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 text-slate-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-4 pb-4 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function AuthLoadingSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
    </div>
  );
}

function GuestButtons({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  if (variant === "mobile") {
    return (
      <div className="space-y-3 p-4">
        <Link href="/auth/register" className="block">
          <Button
            className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary via-primary to-blue-600 hover:opacity-90 shadow-lg shadow-primary/20 transition-all duration-200"
            data-testid="mobile-button-register"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Join Now
          </Button>
        </Link>
        <Link href="/auth/login" className="block">
          <Button
            variant="outline"
            className="w-full h-14 text-base font-medium rounded-2xl border-2 hover:bg-slate-50"
            data-testid="mobile-button-login"
          >
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login">
        <Button
          variant="ghost"
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium px-5 h-11 rounded-full transition-all duration-200"
          data-testid="button-login"
        >
          Sign In
        </Button>
      </Link>
      <Link href="/auth/register">
        <Button
          className="bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 text-white font-semibold px-6 h-11 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
          data-testid="button-register"
        >
          Join Now
        </Button>
      </Link>
    </div>
  );
}

interface UserMenuProps {
  userStatus: ReturnType<typeof useUserStatus>["userStatus"];
  hasActiveSubscription: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
  getInitials: () => string;
}

function UserMenu({ userStatus, hasActiveSubscription, isLoggingOut, onLogout, getInitials }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 gap-2 pl-2 pr-3 rounded-full hover:bg-slate-100 transition-all duration-200 group"
          data-testid="user-menu-trigger"
        >
          <Avatar className="h-9 w-9 ring-2 ring-white shadow-md transition-transform group-hover:scale-105">
            <AvatarImage src={userStatus.avatar || undefined} alt={`${userStatus.firstName || "User"}'s profile photo`} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-medium text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {hasActiveSubscription && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-md ring-2 ring-white">
              <Crown className="h-2.5 w-2.5 text-white" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-2 rounded-2xl shadow-xl border-slate-200/80" align="end" sideOffset={8}>
        <DropdownMenuLabel className="font-normal p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl mb-2">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
              <AvatarImage src={userStatus.avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {userStatus.firstName} {userStatus.lastName}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {userStatus.email}
              </p>
              {hasActiveSubscription && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 mt-2 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Crown className="h-3 w-3" />
                  {userStatus.subscriptionTier}
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuItem asChild className="rounded-xl focus:bg-blue-50 cursor-pointer">
          <Link href="/dashboard" className="flex items-center gap-3 p-3" data-testid="menu-dashboard">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
              <LayoutDashboard className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-slate-900">Dashboard</span>
              <p className="text-xs text-slate-500">View your activity</p>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="rounded-xl focus:bg-purple-50 cursor-pointer">
          <Link href="/profile" className="flex items-center gap-3 p-3" data-testid="menu-profile">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
              <User className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-slate-900">Profile</span>
              <p className="text-xs text-slate-500">Manage your profile</p>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="rounded-xl focus:bg-slate-100 cursor-pointer">
          <Link href="/settings" className="flex items-center gap-3 p-3" data-testid="menu-settings">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <Settings className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-slate-900">Settings</span>
              <p className="text-xs text-slate-500">Account preferences</p>
            </div>
          </Link>
        </DropdownMenuItem>

        {isCreator(userStatus) && (
          <>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem asChild className="rounded-xl focus:bg-orange-50 cursor-pointer">
              <Link href="/communities/create" className="flex items-center gap-3 p-3" data-testid="menu-create-community">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-slate-900">Create Community</span>
                  <p className="text-xs text-slate-500">Build your community</p>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl focus:bg-cyan-50 cursor-pointer">
              <Link href="/events/create" className="flex items-center gap-3 p-3" data-testid="menu-create-event">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100">
                  <Calendar className="h-4 w-4 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-slate-900">Create Event</span>
                  <p className="text-xs text-slate-500">Host workshops & events</p>
                </div>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {isAdmin(userStatus) && (
          <>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem asChild className="rounded-xl focus:bg-emerald-50 cursor-pointer">
              <Link href="/admin" className="flex items-center gap-3 p-3" data-testid="menu-admin">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-slate-900">Admin Panel</span>
                  <p className="text-xs text-slate-500">Manage platform</p>
                </div>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          onClick={onLogout}
          disabled={isLoggingOut}
          className="rounded-xl text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
          data-testid="menu-logout"
        >
          <div className="flex items-center gap-3 p-3 w-full">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
              <LogOut className="h-4 w-4 text-red-600" />
            </div>
            <span className="font-medium">{isLoggingOut ? "Logging out..." : "Log out"}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MobileUserSectionProps {
  userStatus: ReturnType<typeof useUserStatus>["userStatus"];
  hasActiveSubscription: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
  getInitials: () => string;
  onClose: () => void;
}

function MobileUserSection({ userStatus, hasActiveSubscription, isLoggingOut, onLogout, getInitials, onClose }: MobileUserSectionProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl border border-slate-100">
        <Avatar className="h-14 w-14 ring-2 ring-white shadow-lg">
          <AvatarImage src={userStatus.avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-semibold text-lg">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate text-lg">
            {userStatus.firstName} {userStatus.lastName}
          </p>
          <p className="text-sm text-slate-500 truncate">{userStatus.email}</p>
          {hasActiveSubscription && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 mt-2 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 rounded-full border border-amber-200/50">
              <Crown className="h-3.5 w-3.5" />
              {userStatus.subscriptionTier} Member
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard" onClick={onClose} className="block">
          <Button variant="outline" className="w-full h-14 rounded-2xl border-2 gap-2 font-medium hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Button>
        </Link>
        <Link href="/profile" onClick={onClose} className="block">
          <Button variant="outline" className="w-full h-14 rounded-2xl border-2 gap-2 font-medium hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors">
            <User className="h-5 w-5" />
            Profile
          </Button>
        </Link>
      </div>

      {isCreator(userStatus) && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/communities/create" onClick={onClose} className="block">
            <Button variant="outline" className="w-full h-14 rounded-2xl border-2 gap-2 font-medium hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors" data-testid="mobile-create-community">
              <Users className="h-5 w-5" />
              Community
            </Button>
          </Link>
          <Link href="/events/create" onClick={onClose} className="block">
            <Button variant="outline" className="w-full h-14 rounded-2xl border-2 gap-2 font-medium hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-700 transition-colors" data-testid="mobile-create-event">
              <Calendar className="h-5 w-5" />
              Event
            </Button>
          </Link>
        </div>
      )}

      {isAdmin(userStatus) && (
        <Link href="/admin" onClick={onClose} className="block">
          <Button variant="outline" className="w-full h-14 rounded-2xl border-2 gap-2 font-medium hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors" data-testid="mobile-admin">
            <ShieldCheck className="h-5 w-5" />
            Admin Panel
          </Button>
        </Link>
      )}

      <Button
        variant="ghost"
        className="w-full h-14 rounded-2xl gap-2 font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
        onClick={onLogout}
        disabled={isLoggingOut}
        data-testid="mobile-logout"
      >
        <LogOut className="h-5 w-5" />
        {isLoggingOut ? "Logging out..." : "Log out"}
      </Button>
    </div>
  );
}

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative w-6 h-5 flex flex-col justify-between">
      <span
        className={cn(
          "block h-0.5 w-6 bg-slate-700 rounded-full transition-all duration-300 origin-center",
          isOpen && "rotate-45 translate-y-[9px]"
        )}
      />
      <span
        className={cn(
          "block h-0.5 w-6 bg-slate-700 rounded-full transition-all duration-300",
          isOpen ? "opacity-0 scale-0" : "opacity-100"
        )}
      />
      <span
        className={cn(
          "block h-0.5 w-6 bg-slate-700 rounded-full transition-all duration-300 origin-center",
          isOpen && "-rotate-45 -translate-y-[9px]"
        )}
      />
    </div>
  );
}

function MobileAuthLoadingSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
        <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function Navbar({
  initialPlansData,
  initialSiteSettings
}: NavbarProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { userStatus, isLoading } = useUserStatus();
  const router = useRouter();
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  const { data: siteSettings } = useSWR("/api/admin/settings", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    fallbackData: initialSiteSettings,
    suspense: false,
  });

  const { data: plansData } = useSWR<PlanApiResponse>("/api/subscriptions/plans", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    fallbackData: initialPlansData,
    suspense: false,
  });

  // Transform API data to navigation format
  const navigationPlans = useMemo(() => {
    const dataSource = plansData?.plans || [];

    if (dataSource.length === 0) {
      // Only fallback to hardcoded if no data at all
      return megaMenuData.plans;
    }

    // Filter for monthly plans only (navigation shows monthly pricing)
    const monthlyPlans = dataSource.filter((plan) => plan.interval === "month");

    // Transform to navigation format
    return monthlyPlans.map((plan) => ({
      name: plan.name,
      price: plan.price === 0 ? "₹0" : `₹${plan.price.toLocaleString()}/mo`,
      features: plan.features.slice(0, 3), // First 3 features for navigation preview
      href: "/pricing",
      highlight: plan.isPopular,
    }));
  }, [plansData]);

  // Create a local version of megaMenuData with dynamic plans
  const dynamicMegaMenuData = useMemo(() => {
    return {
      learn: megaMenuData.learn || { items: [] },
      earn: megaMenuData.earn || { items: [] },
      community: megaMenuData.community || { items: [] },
      support: megaMenuData.support || { items: [] },
      plans: navigationPlans && navigationPlans.length > 0 ? navigationPlans : megaMenuData.plans,
    };
  }, [navigationPlans]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      menuToggleRef.current?.focus();
    }, 0);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeMenu]);

  const logoSrc = siteSettings?.logoDark || DEFAULT_LOGO;

  const isActiveLink = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) || false;
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    closeMenu();
    
    const result = await performLogout();
    
    if (result.success) {
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to log out. Please try again.");
    }
    
    setIsLoggingOut(false);
  }, [router, closeMenu]);

  const getInitials = useCallback(() => {
    if (userStatus.firstName && userStatus.lastName) {
      return `${userStatus.firstName[0]}${userStatus.lastName[0]}`.toUpperCase();
    }
    if (userStatus.email) {
      return userStatus.email[0].toUpperCase();
    }
    return "U";
  }, [userStatus]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeMenu();
    }
  }, [closeMenu]);

  const renderDesktopAuth = () => {
    if (isLoading) {
      return <AuthLoadingSkeleton />;
    }

    if (userStatus.authStatus === "logged_in") {
      const hasActiveSubscription = userStatus.subscriptionStatus === "active" || userStatus.subscriptionStatus === "trial";
      return (
        <UserMenu
          userStatus={userStatus}
          hasActiveSubscription={hasActiveSubscription}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
          getInitials={getInitials}
        />
      );
    }

    return <GuestButtons />;
  };

  const renderMobileAuth = () => {
    if (isLoading) {
      return <MobileAuthLoadingSkeleton />;
    }

    if (userStatus.authStatus === "logged_in") {
      const hasActiveSubscription = userStatus.subscriptionStatus === "active" || userStatus.subscriptionStatus === "trial";
      return (
        <MobileUserSection
          userStatus={userStatus}
          hasActiveSubscription={hasActiveSubscription}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
          getInitials={getInitials}
          onClose={closeMenu}
        />
      );
    }

    return <GuestButtons variant="mobile" />;
  };

  return (
    <>
    <header
      className="sticky top-0 z-[9998] w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/80"
      role="banner"
    >
      <nav
        className="container mx-auto flex h-16 md:h-18 lg:h-20 items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link href="/" className="flex items-center shrink-0 group relative z-10">
          <Image
            src={DEFAULT_LOGO}
            alt="Next Leap Pro - Learn, Earn, and Grow"
            width={180}
            height={56}
            priority
            className="h-11 md:h-12 lg:h-14 w-auto object-contain transition-all duration-200 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Mega Menu Navigation */}
        <div className="hidden lg:flex items-center justify-center flex-1 px-8" data-testid="desktop-nav">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {/* Learn Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[500px] grid-cols-[1fr_1fr]">
                    <div className="space-y-1">
                      {dynamicMegaMenuData.learn.items.map((item) => (
                        <MegaMenuItem
                          key={item.href}
                          icon={item.icon}
                          label={item.label}
                          description={item.description}
                          href={item.href}
                        />
                      ))}
                    </div>
                    <MegaMenuFeaturedCard {...dynamicMegaMenuData.learn.featured} />
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Earn Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Earn</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[500px] grid-cols-[1fr_1fr]">
                    <div className="space-y-1">
                      {dynamicMegaMenuData.earn.items.map((item) => (
                        <MegaMenuItem
                          key={item.href}
                          icon={item.icon}
                          label={item.label}
                          description={item.description}
                          href={item.href}
                        />
                      ))}
                    </div>
                    <MegaMenuFeaturedCard {...dynamicMegaMenuData.earn.featured} />
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Community Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Community</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[500px] grid-cols-[1fr_1fr]">
                    <div className="space-y-1">
                      {dynamicMegaMenuData.community.items.map((item) => (
                        <MegaMenuItem
                          key={item.href}
                          icon={item.icon}
                          label={item.label}
                          description={item.description}
                          href={item.href}
                        />
                      ))}
                    </div>
                    <MegaMenuFeaturedCard {...dynamicMegaMenuData.community.featured} />
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Plans Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Plans</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-6 w-[600px]">
                    <div className="grid grid-cols-3 gap-3">
                      {dynamicMegaMenuData.plans.map((plan) => (
                        <PlanMiniCard key={plan.name} {...plan} />
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                      <Link
                        href="/pricing"
                        className="text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center gap-1"
                      >
                        Compare all plans <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Support Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Support</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-6 w-[400px]">
                    <div className="space-y-1">
                      {dynamicMegaMenuData.support.items.map((item) => (
                        <MegaMenuItem
                          key={item.href}
                          icon={item.icon}
                          label={item.label}
                          description={item.description}
                          href={item.href}
                        />
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden lg:flex items-center gap-3 shrink-0" data-testid="desktop-cta">
          {renderDesktopAuth()}
        </div>

        <button
          ref={menuToggleRef}
          type="button"
          className={cn(
            "flex lg:hidden items-center justify-center h-12 w-12 rounded-xl transition-all duration-200",
            isOpen
              ? "bg-slate-200"
              : "bg-slate-100 hover:bg-slate-200 active:scale-95"
          )}
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          data-testid="mobile-menu-toggle"
        >
          <HamburgerIcon isOpen={isOpen} />
        </button>
      </nav>
    </header>

    <div
      id="mobile-menu"
      className={cn(
        "fixed inset-0 z-[10000] lg:hidden transition-all duration-300 pointer-events-none",
        isOpen && "visible pointer-events-auto"
      )}
      data-testid="mobile-menu-container"
    >
      <div
        className={cn(
          "absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={handleOverlayClick}
        aria-hidden="true"
        data-testid="mobile-menu-overlay"
      />

      <div
        className={cn(
          "absolute top-0 right-0 h-full w-[85vw] max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <Link href="/" onClick={closeMenu} className="flex items-center">
            <Image
              src={logoSrc}
              alt={siteSettings?.siteName || "Next Leap Pro"}
              width={160}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            className="flex items-center justify-center h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={closeMenu}
            aria-label="Close menu"
            data-testid="mobile-menu-close"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-73px)] overflow-y-auto overscroll-contain">
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-3">Quick Links</p>
            <Link
              href="/"
              onClick={closeMenu}
              className={cn(
                "group flex items-center gap-4 px-4 py-4 rounded-2xl font-medium text-base",
                "transition-all duration-200 ease-out active:scale-[0.98]",
                isActiveLink("/")
                  ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                isActiveLink("/") ? "bg-primary/10" : "bg-slate-100 group-hover:bg-slate-200"
              )}>
                <Home className={cn("h-5 w-5", isActiveLink("/") ? "text-primary" : "text-slate-500")} />
              </div>
              <span className="flex-1">Home</span>
            </Link>
          </div>

          <div className="flex-1">
            <MobileAccordionSection title="Learn" icon={GraduationCap}>
              {dynamicMegaMenuData.learn.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </MobileAccordionSection>

            <MobileAccordionSection title="Earn" icon={Briefcase}>
              {dynamicMegaMenuData.earn.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </MobileAccordionSection>

            <MobileAccordionSection title="Community" icon={Users}>
              {dynamicMegaMenuData.community.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </MobileAccordionSection>

            <MobileAccordionSection title="Plans" icon={CreditCard}>
              {dynamicMegaMenuData.plans.map((plan) => (
                <Link
                  key={plan.name}
                  href={plan.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                    plan.highlight
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span>{plan.name}</span>
                  <span className="font-semibold">{plan.price}</span>
                </Link>
              ))}
            </MobileAccordionSection>

            <MobileAccordionSection title="Support" icon={HelpCircle}>
              {dynamicMegaMenuData.support.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </MobileAccordionSection>
          </div>

          <div className="mt-auto border-t border-slate-100 bg-slate-50/50">
            {renderMobileAuth()}
          </div>
        </div>
      </div>
    </div>

    </>
  );
}
