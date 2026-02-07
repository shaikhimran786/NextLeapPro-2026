"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "@/lib/icons";

export function CreateEventButton() {
  const [canCreate, setCanCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPermissions() {
      try {
        const res = await fetch("/api/me/status");
        if (res.ok) {
          const data = await res.json();
          const tier = data.subscriptionTier?.toLowerCase();
          const isCreatorTier = tier === "creator" || tier === "creator_monthly" || tier === "creator_annual";
          const isNotExpired = !data.subscriptionExpiry || new Date(data.subscriptionExpiry) > new Date();
          const isCreator = isCreatorTier && isNotExpired;
          
          const isAdmin = data.roles?.some((role: string) => role.toLowerCase() === "admin") || false;
          
          setCanCreate(isCreator || isAdmin);
        }
      } catch (error) {
        console.error("Failed to check permissions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkPermissions();
  }, []);

  if (isLoading || !canCreate) return null;

  return (
    <Link href="/events/create">
      <Button 
        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
        data-testid="button-create-event"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Event
      </Button>
    </Link>
  );
}
