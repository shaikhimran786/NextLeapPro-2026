import { REFERRAL_FOOTER } from "@/lib/referral-hires";
import { cn } from "@/lib/utils";

/**
 * Branding footer shown on every referral post and application surface.
 * Renders the Next Leap Pro logo + the required "Referred by Next Leap Pro
 * Platform" attribution.
 */
export function ReferralBrandingFooter({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-xs text-muted-foreground",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/logo-dark.png"
        alt="Next Leap Pro"
        className="h-4 w-auto object-contain opacity-80"
      />
      <span>{REFERRAL_FOOTER}</span>
    </div>
  );
}
