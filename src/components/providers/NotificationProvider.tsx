"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { toast } from "sonner";
import { UserPlus, Crown } from "@/lib/icons";

interface NotificationPayload {
  id: number;
  type: "new_registration" | "new_subscription";
  message: string;
  userName?: string;
  planName?: string;
  createdAt: string;
}

interface NotificationContextType {
  isPolling: boolean;
  lastNotification: NotificationPayload | null;
}

const NotificationContext = createContext<NotificationContextType>({
  isPolling: false,
  lastNotification: null,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

// Lazy-load confetti to reduce initial bundle size
async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: Parameters<typeof confetti>[0]) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ["#FF0099", "#00D4FF", "#00FF94"],
  });

  fire(0.2, {
    spread: 60,
    colors: ["#FF0099", "#FFD700"],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ["#00D4FF", "#00FF94", "#FF0099"],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ["#FFD700", "#FF0099"],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ["#00FF94", "#00D4FF"],
  });
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [isPolling, setIsPolling] = useState(false);
  const [lastNotification, setLastNotification] = useState<NotificationPayload | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);

  const handleNotification = useCallback((payload: NotificationPayload) => {
    if (seenIdsRef.current.has(payload.id)) {
      return;
    }
    
    seenIdsRef.current.add(payload.id);
    setLastNotification(payload);

    if (payload.type === "new_registration") {
      toast.success(payload.message, {
        icon: <UserPlus className="h-5 w-5 text-green-500" />,
        duration: 5000,
      });
      fireConfetti();
    } else if (payload.type === "new_subscription") {
      toast.success(payload.message, {
        icon: <Crown className="h-5 w-5 text-yellow-500" />,
        duration: 6000,
      });
      fireConfetti();
      setTimeout(fireConfetti, 500);
    }
  }, []);

  const pollNotifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications/broadcast?since=${lastTimestampRef.current}`);
      
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      
      if (data.notifications && data.notifications.length > 0) {
        if (isFirstLoadRef.current) {
          data.notifications.forEach((n: NotificationPayload) => {
            seenIdsRef.current.add(n.id);
          });
          isFirstLoadRef.current = false;
        } else {
          const sortedNotifications = [...data.notifications].sort(
            (a: NotificationPayload, b: NotificationPayload) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          sortedNotifications.forEach((notification: NotificationPayload) => {
            handleNotification(notification);
          });
        }
      } else {
        isFirstLoadRef.current = false;
      }

      if (data.timestamp) {
        lastTimestampRef.current = data.timestamp;
      }
    } catch (error) {
      console.error("Failed to poll notifications:", error);
    }
  }, [handleNotification]);

  useEffect(() => {
    lastTimestampRef.current = Date.now();
    setIsPolling(true);

    pollNotifications();

    const interval = setInterval(pollNotifications, 60000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [pollNotifications]);

  return (
    <NotificationContext.Provider value={{ isPolling, lastNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
