import { useEffect } from "react";

let verticalSwipeOptInCount = 0;

function syncVerticalSwipes(): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) {
    return;
  }

  if (verticalSwipeOptInCount > 0) {
    webApp.enableVerticalSwipes?.();
    return;
  }

  webApp.disableVerticalSwipes?.();
}

export function applyDefaultTelegramStickyBehavior(): void {
  syncVerticalSwipes();
}

export function useTelegramVerticalSwipes(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    verticalSwipeOptInCount += 1;
    syncVerticalSwipes();

    return () => {
      verticalSwipeOptInCount = Math.max(0, verticalSwipeOptInCount - 1);
      syncVerticalSwipes();
    };
  }, [enabled]);
}

