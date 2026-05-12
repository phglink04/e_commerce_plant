import { useCallback } from "react";

/**
 * Custom hook for managing Turnstile CAPTCHA token
 * Handles token state and expiry logic
 */
export function useTurnstile() {
  const handleToken = useCallback((token: string) => {
    // Token is returned directly from component callback
    return token;
  }, []);

  const resetTurnstile = useCallback(() => {
    // Reset would be handled by parent component
    return null;
  }, []);

  return {
    handleToken,
    resetTurnstile,
  };
}
