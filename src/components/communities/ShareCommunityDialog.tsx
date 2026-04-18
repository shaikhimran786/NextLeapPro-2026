"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Check, Share2, MessageCircle, Linkedin } from "@/lib/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ShareMode = "full" | "limited";

interface ShareCommunityDialogProps {
  mode: ShareMode;
  communityName: string;
  shortDescription?: string | null;
  shareUrl: string;
  isMobile?: boolean;
  className?: string;
}

export function ShareCommunityDialog({
  mode,
  communityName,
  shortDescription,
  shareUrl,
  isMobile = false,
  className,
}: ShareCommunityDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareMessage = shortDescription
    ? `${communityName} — ${shortDescription}`
    : `Check out ${communityName} on Next Leap Pro`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link. Please copy it manually.");
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareMessage}\n${shareUrl}`)}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const triggerClasses = isMobile
    ? "w-full rounded-full"
    : "bg-white/10 text-white border-white/30 hover:bg-white/20 rounded-full backdrop-blur-sm";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(triggerClasses, className)}
          data-testid={isMobile ? "button-share-community-mobile" : "button-share-community"}
        >
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="dialog-share-community">
        <DialogHeader>
          <DialogTitle>Share {communityName}</DialogTitle>
          <DialogDescription>
            {mode === "full"
              ? "Send this community to friends, classmates, or colleagues."
              : "This community doesn't have a custom URL yet, so only Copy Link is available."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <span
              className="flex-1 truncate text-sm text-muted-foreground"
              data-testid="text-share-url"
              title={shareUrl}
            >
              {shareUrl}
            </span>
            <Button
              type="button"
              size="sm"
              variant={copied ? "secondary" : "default"}
              onClick={handleCopy}
              data-testid="button-share-copy"
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-4 w-4" /> Copy
                </>
              )}
            </Button>
          </div>

          {mode === "full" && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                asChild
                variant="outline"
                className="justify-center"
                data-testid="button-share-whatsapp"
              >
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" />
                  WhatsApp
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-center"
                data-testid="button-share-linkedin"
              >
                <a
                  href={linkedinHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  <Linkedin className="mr-2 h-4 w-4 text-[#0A66C2]" />
                  LinkedIn
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
