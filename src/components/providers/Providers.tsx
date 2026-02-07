"use client";

import { ReactNode } from "react";
import { SWRConfig, mutate } from "swr";
import { NotificationProvider } from "./NotificationProvider";
import { UserStatus, defaultGuestStatus } from "@/lib/user-status";

interface ProvidersProps {
  children: ReactNode;
  initialUserStatus?: UserStatus | null;
}

const swrFetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  return res.json();
};

export function Providers({ children, initialUserStatus }: ProvidersProps) {
  // ALWAYS provide fallback - use server data or default guest status
  // This ensures consistent initial render between server and client
  const fallback: Record<string, UserStatus> = {
    "/api/me/status": initialUserStatus ?? defaultGuestStatus,
  };

  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: true,           // CHANGED: Detect stale sessions
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
        refreshInterval: 5 * 60 * 1000,    // NEW: Periodic refresh (5 min)
        fallback,
        onError: (error, key) => {
          // Handle 401 errors for auth endpoint - reset to guest status
          if (key === '/api/me/status' && error?.status === 401) {
            mutate('/api/me/status', defaultGuestStatus, { revalidate: false });
          }
        },
      }}
    >
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </SWRConfig>
  );
}
