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

  // Dùng ref để giữ callbacks ổn định, tránh trigger useEffect
  // mỗi lần parent re-render tạo ra inline arrow function mới
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  // Cập nhật refs mỗi render nhưng KHÔNG đưa vào deps của useEffect bên dưới
  onTokenRef.current = onToken;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!siteKey) {
      console.warn(
        "Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY environment variable",
      );
      return;
    }

    const initializeTurnstile = () => {
      const container = document.getElementById(containerId.current);
      if (!container || !window.turnstile) return;

      try {
        widgetId.current = window.turnstile.render(containerId.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token: string) => {
            onTokenRef.current(token);
          },
          "expired-callback": () => {
            onExpireRef.current?.();
          },
          "error-callback": () => {
            onErrorRef.current?.(new Error("Turnstile verification failed"));
          },
        });
      } catch (error) {
        onErrorRef.current?.(
          error instanceof Error ? error : new Error("Turnstile error"),
        );
      }
    };

    // Load Turnstile script nếu chưa có
    if (window.turnstile) {
      initializeTurnstile();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
      );
      if (existing) {
        existing.addEventListener("load", initializeTurnstile, { once: true });
      } else {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.defer = true;
        script.onload = initializeTurnstile;
        script.onerror = () => {
          onErrorRef.current?.(new Error("Failed to load Turnstile script"));
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
          widgetId.current = null;
        } catch {
          // Widget already removed
        }
      }
    };
  // Chỉ chạy lại khi siteKey/theme/size thay đổi — KHÔNG bao gồm callbacks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, theme, size]);

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
