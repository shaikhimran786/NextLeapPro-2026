"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR, { mutate, useSWRConfig } from "swr";
import { UserStatus, defaultGuestStatus } from "@/lib/user-status";

const USER_STATUS_KEY = "/api/me/status";

async function fetcher(url: string): Promise<UserStatus> {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    return defaultGuestStatus;
  }
  return res.json();
}

export function useUserStatus() {
  const { fallback } = useSWRConfig();
  const fallbackData = fallback?.[USER_STATUS_KEY] as UserStatus | undefined;

  // Track if we're mounted (client-side) to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  const { data, error, isLoading, isValidating, mutate: boundMutate } = useSWR<UserStatus>(
    USER_STATUS_KEY,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 1000,
      fallbackData,
      refreshInterval: 5 * 60 * 1000,
      keepPreviousData: true,
    }
  );

  // Set mounted state after hydration completes
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute effective status - only do client-side date checks after mount
  const effectiveStatus = useMemo(() => {
    const status = data ?? defaultGuestStatus;

    // Only perform client-side expiry check AFTER hydration is complete
    // This prevents hydration mismatch from Date differences between server/client
    if (isMounted && status.subscriptionExpiry && status.subscriptionStatus === 'active') {
      const expiryDate = new Date(status.subscriptionExpiry);
      const now = new Date();
      if (expiryDate < now) {
        return { ...status, subscriptionStatus: 'expired' as const };
      }
    }

    return status;
  }, [data, isMounted]);

  return {
    userStatus: effectiveStatus,
    isLoading: fallbackData ? false : isLoading,
    isValidating,
    error,
    refresh: boundMutate,
  };
}

export function revalidateUserStatus() {
  return mutate(USER_STATUS_KEY);
}

export async function clearUserStatus(): Promise<void> {
  await mutate(USER_STATUS_KEY, defaultGuestStatus, { revalidate: false });
}

export async function clearAndRevalidateUserStatus(): Promise<UserStatus> {
  await mutate(USER_STATUS_KEY, defaultGuestStatus, { revalidate: false });
  const result = await mutate(USER_STATUS_KEY);
  return result ?? defaultGuestStatus;
}

export function setUserStatus(userStatus: UserStatus) {
  return mutate(USER_STATUS_KEY, userStatus, { revalidate: false });
}

export async function fetchAndSetUserStatus(): Promise<UserStatus> {
  const res = await fetch("/api/me/status", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    await mutate(USER_STATUS_KEY, defaultGuestStatus, { revalidate: false });
    return defaultGuestStatus;
  }
  const userStatus = await res.json();
  await mutate(USER_STATUS_KEY, userStatus, { revalidate: false });
  return userStatus;
}

export async function performLogin(email: string, password: string): Promise<{ success: boolean; error?: string; userStatus?: UserStatus }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || "Login failed" };
    }

    const userStatus = await fetchAndSetUserStatus();
    return { success: true, userStatus };
  } catch (error) {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function performLogout(): Promise<{ success: boolean; error?: string }> {
  try {
    // CRITICAL: Call server FIRST before clearing client state
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      // Only clear client state AFTER server succeeds
      await Promise.all([
        mutate(USER_STATUS_KEY, defaultGuestStatus, { revalidate: false }),
        mutate('/api/me/subscription', null, { revalidate: false }),
        mutate('/api/me/tickets', null, { revalidate: false }),
      ]);
      return { success: true };
    }

    // Server failed - revalidate to get correct state
    await mutate(USER_STATUS_KEY);
    return { success: false, error: 'Logout failed on server' };

  } catch (error) {
    // Network error - revalidate to check actual state
    await mutate(USER_STATUS_KEY);
    return { success: false, error: "Failed to log out. Please try again." };
  }
}

export function optimisticUpdateUserStatus(
  updater: (current: UserStatus) => UserStatus
) {
  return mutate(
    USER_STATUS_KEY,
    async (current: UserStatus | undefined) => {
      return updater(current || defaultGuestStatus);
    },
    {
      revalidate: false,
    }
  );
}

export async function performOptimisticAction<T>(
  optimisticUpdate: (current: UserStatus) => UserStatus,
  serverAction: () => Promise<T>,
  onSuccess?: (result: T) => void,
  onError?: (error: Error) => void
): Promise<T | null> {
  let previousData: UserStatus | undefined;

  try {
    await mutate(
      USER_STATUS_KEY,
      async (current: UserStatus | undefined) => {
        previousData = current;
        return optimisticUpdate(current || defaultGuestStatus);
      },
      { revalidate: false }
    );

    const result = await serverAction();

    await mutate(USER_STATUS_KEY);

    onSuccess?.(result);
    return result;
  } catch (error) {
    if (previousData) {
      await mutate(USER_STATUS_KEY, previousData, { revalidate: false });
    }

    onError?.(error instanceof Error ? error : new Error("Action failed"));
    return null;
  }
}
