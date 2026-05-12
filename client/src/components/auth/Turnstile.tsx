"use client";

import { useEffect, useRef } from "react";

interface TurnstileProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: Error) => void;
  theme?: "light" | "dark";
  size?: "normal" | "compact";
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        elementId: string,
        options: {
          sitekey: string;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
      getResponse: (id: string) => string | undefined;
    };
  }
}

let turnstileId = 0;

export default function Turnstile({
  onToken,
  onExpire,
  onError,
  theme = "light",
  size = "normal",
}: TurnstileProps) {
  const containerId = useRef(`turnstile-${turnstileId++}`);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.warn(
        "Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY environment variable",
      );
      return;
    }

    // Load Turnstile script if not already loaded
    const loadTurnstile = async () => {
      if (window.turnstile) {
        initializeTurnstile();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = initializeTurnstile;
      script.onerror = () => {
        onError?.(new Error("Failed to load Turnstile script"));
      };
      document.head.appendChild(script);
    };

    const initializeTurnstile = () => {
      const container = document.getElementById(containerId.current);
      if (!container || !window.turnstile) return;

      try {
        widgetId.current = window.turnstile.render(containerId.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token: string) => {
            onToken(token);
          },
          "expired-callback": () => {
            onExpire?.();
          },
          "error-callback": () => {
            onError?.(new Error("Turnstile verification failed"));
          },
        });
      } catch (error) {
        onError?.(
          error instanceof Error ? error : new Error("Turnstile error"),
        );
      }
    };

    loadTurnstile();

    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          // Widget already removed
        }
      }
    };
  }, [siteKey, theme, size, onToken, onExpire, onError]);

  return (
    <div
      id={containerId.current}
      style={{
        display: "flex",
        justifyContent: "center",
        margin: "1rem 0",
      }}
    />
  );
}
