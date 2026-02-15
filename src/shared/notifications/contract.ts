import catalogEn from "@/shared/notifications/catalog.en.json";

export type NotificationSeverity = "success" | "info" | "warning" | "error";

export type NotificationSeedEntry = {
  titleKey: string;
  messageKey: string;
  title: string;
  message: string;
  primaryActionKey: string;
  secondaryActionKey: string;
};

export type NotificationSeedCatalog = {
  notifications: {
    in_app: Record<string, NotificationSeedEntry>;
    in_chat: Record<string, NotificationSeedEntry>;
    actions: Record<string, string>;
  };
};

export const notificationCatalogEn = catalogEn as NotificationSeedCatalog;

export const IN_APP_NOTIFICATION_IDS = Object.keys(notificationCatalogEn.notifications.in_app).sort();
export const IN_CHAT_NOTIFICATION_IDS = Object.keys(notificationCatalogEn.notifications.in_chat).sort();
export const NOTIFICATION_ACTION_LABELS = notificationCatalogEn.notifications.actions;

export type InAppNotificationId = keyof typeof notificationCatalogEn.notifications.in_app;
export type InChatNotificationId = keyof typeof notificationCatalogEn.notifications.in_chat;
export type NotificationActionKey = keyof typeof notificationCatalogEn.notifications.actions;

export function getNotificationActionLabel(actionKey: string): string {
  return NOTIFICATION_ACTION_LABELS[actionKey as NotificationActionKey] ?? actionKey;
}

export function buildExpectedNotificationIds(prefix: "A" | "B", count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(2, "0")}`);
}
