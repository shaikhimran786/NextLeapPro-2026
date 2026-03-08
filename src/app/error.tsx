"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const isHydrationError =
      error.message?.includes("Hydration") ||
      error.message?.includes("hydrat") ||
      error.message?.includes("Invalid hook call") ||
      error.message?.includes("server rendered HTML didn't match");

    if (isHydrationError) {
      const timer = setTimeout(() => {
        reset();
      }, 500);
      return () => clearTimeout(timer);
    }

    console.error("Unhandled error:", error);
  }, [error, reset]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
        Something went wrong
      </h2>
      <p className="mt-2 text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        data-testid="button-error-retry"
      >
        Try again
      </button>
    </div>
  );
}
