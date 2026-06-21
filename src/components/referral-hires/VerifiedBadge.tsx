import { Badge } from "@/components/ui/badge";
import { BadgeCheck } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** Verified badge — only shown for admin-verified openings. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge
      className={cn(
        "gap-1 border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
        className
      )}
    >
      <BadgeCheck size={14} />
      Verified
    </Badge>
  );
}
