"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/referral-hires", label: "Posted Openings" },
  { href: "/admin/referral-hires/cvs", label: "Submitted CVs" },
  { href: "/admin/referral-hires/connections", label: "Referral Connections" },
  { href: "/admin/referral-hires/talent", label: "Talent Pool" },
];

export function ReferralAdminTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
