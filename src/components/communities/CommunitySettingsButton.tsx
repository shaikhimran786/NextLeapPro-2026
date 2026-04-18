"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings } from "@/lib/icons";
import { useUserStatus } from "@/hooks/useUserStatus";
import { canManageCommunity } from "@/lib/user-status";
import { buildCommunityUrl } from "@/lib/community-slug";

interface CommunitySettingsButtonProps {
  communityId: number;
  communitySlug?: string | null;
  creatorId: number | null;
}

export function CommunitySettingsButton({ communityId, communitySlug, creatorId }: CommunitySettingsButtonProps) {
  const { userStatus, isLoading } = useUserStatus();
  
  const canEdit = canManageCommunity(userStatus, communityId);

  if (isLoading || !canEdit) return null;

  return (
    <Link href={`${buildCommunityUrl({ id: communityId, slug: communitySlug })}/settings`}>
      <Button 
        variant="outline" 
        className="bg-white/10 text-white border-white/30 hover:bg-white/20 rounded-full backdrop-blur-sm"
        data-testid="button-community-settings"
      >
        <Settings className="mr-2 h-4 w-4" /> Settings
      </Button>
    </Link>
  );
}
