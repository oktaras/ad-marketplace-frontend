import { useCallback, useEffect, useRef, useState } from 'react';
import { useTma } from '@/app/providers/TmaProvider';
import {
  getActiveSheetBackHandler,
  subscribeSheetBackButton,
} from '@/app/router/sheetBackButtonState';

/**
 * Controls Telegram BackButton visibility and behavior for overlay stacks:
 * 1. Show BackButton only when an overlay/sheet back handler is active.
 * 2. On click, close top-most overlay.
 * 3. Defensive fallback: close Mini App when no overlay handler exists.
 */
export function TelegramBackButton() {
  const { isInTelegram, miniApp, backButton } = useTma();
  const [sheetBackStackVersion, setSheetBackStackVersion] = useState(0);
  const activeSheetBackHandlerRef = useRef<(() => void) | null>(getActiveSheetBackHandler());
  const miniAppRef = useRef(miniApp);

  useEffect(() => {
    return subscribeSheetBackButton(() => {
      activeSheetBackHandlerRef.current = getActiveSheetBackHandler();
      setSheetBackStackVersion((version) => version + 1);
    });
  }, []);

  useEffect(() => {
    miniAppRef.current = miniApp;
  }, [miniApp]);

  const shouldShowBackButton = sheetBackStackVersion >= 0 && Boolean(getActiveSheetBackHandler());

  const handleBackButtonClick = useCallback(() => {
    const activeSheetBackHandler = activeSheetBackHandlerRef.current;
    if (activeSheetBackHandler) {
      activeSheetBackHandler();
      return;
    }

    miniAppRef.current?.close();
  }, []);

  useEffect(() => {
    if (!isInTelegram || !backButton) {
      return;
    }

    // onClick returns an unsubscribe function
    const unsubscribe = backButton.onClick(handleBackButtonClick);
    return () => {
      unsubscribe();
    };
  }, [backButton, handleBackButtonClick, isInTelegram]);

  useEffect(() => {
    if (!isInTelegram || !backButton) {
      return;
    }

    try {
      if (shouldShowBackButton) {
        backButton.show();
        return;
      }

      backButton.hide();
    } catch (error) {
      console.warn('Failed to update Telegram BackButton visibility:', error);
    }
  }, [backButton, isInTelegram, shouldShowBackButton]);

  useEffect(() => {
    if (!isInTelegram || !backButton) {
      return;
    }

    return () => {
      try {
        backButton.hide();
      } catch (error) {
        console.warn('Failed to hide Telegram BackButton on cleanup:', error);
      }
    };
  }, [backButton, isInTelegram]);

  return null;
}
