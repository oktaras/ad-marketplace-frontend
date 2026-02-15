import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { openProfileSettingsSheet } from "@/app/router/profileSettingsSheetState";
import { useTma } from "@/app/providers/TmaProvider";

function isProfilePath(pathname: string): boolean {
  return pathname === "/profile";
}

export function TelegramSettingsButton() {
  const { isInTelegram, settingsButton } = useTma();
  const location = useLocation();
  const isProfileRoute = isProfilePath(location.pathname);
  const isProfileRouteRef = useRef(isProfileRoute);

  useEffect(() => {
    isProfileRouteRef.current = isProfileRoute;
  }, [isProfileRoute]);

  const handleSettingsClick = useCallback(() => {
    if (!isProfileRouteRef.current) {
      return;
    }

    openProfileSettingsSheet();
  }, []);

  useEffect(() => {
    if (!isInTelegram || !settingsButton) {
      return;
    }

    try {
      if (isProfileRoute) {
        settingsButton.show();
      } else {
        settingsButton.hide();
      }
    } catch (error) {
      console.warn("Failed to update settings button visibility:", error);
    }

    return () => {
      try {
        settingsButton.hide();
      } catch (error) {
        console.warn("Failed to hide settings button:", error);
      }
    };
  }, [isInTelegram, isProfileRoute, settingsButton]);

  useEffect(() => {
    if (!isInTelegram || !settingsButton) {
      return;
    }

    try {
      // onClick returns an unsubscribe function
      const unsubscribe = settingsButton.onClick(handleSettingsClick);
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.warn("Failed to bind settings button click:", error);
    }
  }, [handleSettingsClick, isInTelegram, settingsButton]);

  return null;
}
