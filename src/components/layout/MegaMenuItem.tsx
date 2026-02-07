"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "@/lib/icons";

interface MegaMenuItemProps {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  className?: string;
}

export function MegaMenuItem({ icon: Icon, label, description, href, className }: MegaMenuItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors",
        className
      )}
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-slate-900 group-hover:text-primary transition-colors">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

interface MegaMenuFeaturedCardProps {
  badge?: string;
  title: string;
  description: string;
  href?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function MegaMenuFeaturedCard({
  badge,
  title,
  description,
  href,
  gradientFrom = "from-primary/10",
  gradientTo = "to-pink-500/10"
}: MegaMenuFeaturedCardProps) {
  const content = (
    <div className={cn(
      "bg-gradient-to-br rounded-xl p-4 h-full",
      gradientFrom,
      gradientTo,
      href && "hover:opacity-90 transition-opacity cursor-pointer"
    )}>
      {badge && (
        <span className="text-xs font-semibold text-primary">{badge}</span>
      )}
      <h4 className="font-semibold mt-1 text-slate-900">{title}</h4>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

interface PlanMiniCardProps {
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
  href: string;
}

export function PlanMiniCard({ name, price, features, highlight, href }: PlanMiniCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "block p-4 rounded-xl border transition-all hover:shadow-md",
        highlight
          ? "border-primary bg-primary/5 hover:bg-primary/10"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className={cn(
          "font-semibold",
          highlight ? "text-primary" : "text-slate-900"
        )}>{name}</h4>
        <span className="text-sm font-bold text-slate-900">{price}</span>
      </div>
      <ul className="space-y-1">
        {features.slice(0, 3).map((feature, i) => (
          <li key={i} className="text-xs text-slate-500 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            {feature}
          </li>
        ))}
      </ul>
    </Link>
  );
}
