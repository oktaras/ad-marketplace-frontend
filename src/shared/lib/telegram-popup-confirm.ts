import { useCallback, useEffect, useRef } from "react";
import { useTma } from "@/app/providers/TmaProvider";

const MAX_TITLE_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 256;
const MAX_BUTTON_LENGTH = 64;

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, maxLength - 1))}…`;
}

export type TelegramPopupConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  cancelIsDestructive?: boolean;
};

export function useTelegramPopupConfirm(): (options: TelegramPopupConfirmOptions) => Promise<boolean> {
  const { isInTelegram, popup } = useTma();
  const popupRef = useRef(popup);
  const isInTelegramRef = useRef(isInTelegram);

  useEffect(() => {
    popupRef.current = popup;
  }, [popup]);

  useEffect(() => {
    isInTelegramRef.current = isInTelegram;
  }, [isInTelegram]);

  return useCallback(async (options: TelegramPopupConfirmOptions) => {
    const title = truncate(options.title, MAX_TITLE_LENGTH);
    const message = truncate(options.message, MAX_MESSAGE_LENGTH);
    const confirmText = truncate(options.confirmText ?? "Confirm", MAX_BUTTON_LENGTH);
    const cancelText = truncate(options.cancelText ?? "Cancel", MAX_BUTTON_LENGTH);

    if (isInTelegramRef.current && popupRef.current) {
      try {
        const pressedButtonId = await popupRef.current.show({
          title,
          message,
          buttons: [
            {
              id: "confirm",
              type: options.isDestructive ? "destructive" : "default",
              text: confirmText,
            },
            {
              id: "cancel",
              type: options.cancelIsDestructive ? "destructive" : "default",
              text: cancelText,
            },
          ],
        });

        return pressedButtonId === "confirm";
      } catch (error) {
        console.warn("Telegram popup confirmation failed:", error);
      }
    }

    return window.confirm(`${title}\n\n${message}`);
  }, []);
}
