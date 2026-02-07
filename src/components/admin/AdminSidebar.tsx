"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { useState } from "react";
import {
  LayoutDashboard,
  Settings,
  FileText,
  Globe,
  ToggleLeft,
  Calendar,
  Users,
  Briefcase,
  CreditCard,
  ScrollText,
  LogOut,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/settings", icon: Settings, label: "Site Settings" },
  { href: "/admin/content", icon: FileText, label: "Content Blocks" },
  { href: "/admin/seo", icon: Globe, label: "Page SEO" },
  { href: "/admin/features", icon: ToggleLeft, label: "Feature Toggles" },
  { href: "/admin/events", icon: Calendar, label: "Events" },
  { href: "/admin/communities", icon: Users, label: "Communities" },
  { href: "/admin/services", icon: Briefcase, label: "Services" },
  { href: "/admin/plans", icon: CreditCard, label: "Plans & Pricing" },
  { href: "/admin/subscribers", icon: Users, label: "Subscribers" },
  { href: "/admin/audit-log", icon: ScrollText, label: "Audit Log" },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { data: siteSettings } = useSWR("/api/admin/settings", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    suspense: false,
  });

  const adminLogo = siteSettings?.adminLogo || siteSettings?.logoDark;
  const siteName = siteSettings?.siteName || "Next Leap Pro";

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/admin/auth/logout", { 
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        router.push("/admin/login");
        router.refresh();
      } else {
        console.error("Logout failed:", await response.text());
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-3">
          {adminLogo ? (
            <img
              src={adminLogo}
              alt={siteName}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
              NL
            </div>
          )}
          <div>
            <span className="font-heading font-bold">{siteName}</span>
            <span className="block text-xs text-slate-400">Admin Panel</span>
          </div>
        </Link>
      </div>

      <nav className="p-4 space-y-1">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || 
            (link.href !== "/admin" && pathname?.startsWith(link.href));
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <link.icon size={18} />
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Back to Site
        </Link>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors w-full text-left disabled:opacity-50"
          data-testid="button-admin-logout"
        >
          <LogOut size={16} />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}
