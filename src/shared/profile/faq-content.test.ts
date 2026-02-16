import { describe, expect, it } from "vitest";
import { PROFILE_FAQ_ITEMS } from "@/shared/profile/faq-content";

describe("PROFILE_FAQ_ITEMS", () => {
  it("has unique ids", () => {
    const ids = PROFILE_FAQ_ITEMS.map((item) => item.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it("has non-empty questions and answers", () => {
    PROFILE_FAQ_ITEMS.forEach((item) => {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    });
  });

  it("covers required core topics", () => {
    const fullText = PROFILE_FAQ_ITEMS
      .map((item) => `${item.question} ${item.answer}`.toLowerCase())
      .join(" ");

    expect(fullText).toContain("brief");
    expect(fullText).toContain("listing");
    expect(fullText).toContain("deal");
    expect(fullText).toContain("telegram");
  });
});
