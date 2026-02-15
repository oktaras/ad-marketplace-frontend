import { describe, expect, it } from "vitest";
import {
  buildExpectedNotificationIds,
  notificationCatalogEn,
} from "@/shared/notifications/contract";

type SeedEntry = {
  titleKey: string;
  messageKey: string;
  title: string;
  message: string;
  primaryActionKey: string;
  secondaryActionKey: string;
};

type Seed = {
  notifications: {
    in_app: Record<string, SeedEntry>;
    in_chat: Record<string, SeedEntry>;
    actions: Record<string, string>;
  };
};

describe("notification message contract (audit rows)", () => {
  const seed = notificationCatalogEn as Seed;
  const expectedInAppIds = buildExpectedNotificationIds("A", 28);
  const expectedInChatIds = buildExpectedNotificationIds("B", 33);

  it("covers all in-app audit rows A01..A28", () => {
    const actual = Object.keys(seed.notifications.in_app).sort();
    expect(actual).toEqual(expectedInAppIds);
  });

  it("covers all in-chat audit rows B01..B33", () => {
    const actual = Object.keys(seed.notifications.in_chat).sort();
    expect(actual).toEqual(expectedInChatIds);
  });

  it("has non-empty key refs and copy for every row", () => {
    const entries = [
      ...Object.entries(seed.notifications.in_app),
      ...Object.entries(seed.notifications.in_chat),
    ];

    for (const [id, row] of entries) {
      expect(row.titleKey, `${id} titleKey`).toMatch(/^notifications\.(in_app|in_chat)\.[AB]\d{2}\.title$/);
      expect(row.messageKey, `${id} messageKey`).toMatch(/^notifications\.(in_app|in_chat)\.[AB]\d{2}\.message$/);

      expect(row.title.trim().length, `${id} title`).toBeGreaterThan(0);
      expect(row.message.trim().length, `${id} message`).toBeGreaterThan(0);

      expect(row.title.length, `${id} title length`).toBeLessThanOrEqual(80);
      expect(row.message.length, `${id} message length`).toBeLessThanOrEqual(320);
    }
  });

  it("keeps action references valid and capped to two per row", () => {
    const entries = [
      ...Object.entries(seed.notifications.in_app),
      ...Object.entries(seed.notifications.in_chat),
    ];

    for (const [id, row] of entries) {
      const actionKeys = [row.primaryActionKey, row.secondaryActionKey].filter(Boolean);
      expect(actionKeys.length, `${id} action count`).toBeLessThanOrEqual(2);

      for (const actionKey of actionKeys) {
        expect(actionKey, `${id} action key prefix`).toMatch(/^notifications\.actions\.[a-z0-9_]+$/);
      }
    }
  });

  it("does not use unresolved TODO placeholders", () => {
    const entries = [
      ...Object.values(seed.notifications.in_app),
      ...Object.values(seed.notifications.in_chat),
    ];

    for (const row of entries) {
      expect(row.title.toLowerCase()).not.toContain("todo");
      expect(row.message.toLowerCase()).not.toContain("todo");
    }
  });
});
