"use client";

import { useEffect } from "react";

export default function GlobalError({
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
  }, [error, reset]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b" }}>
            Something went wrong
          </h2>
          <p style={{ marginTop: "0.5rem", color: "#64748b" }}>
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            data-testid="button-global-error-retry"
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#fff",
              backgroundColor: "#5b4cdb",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
