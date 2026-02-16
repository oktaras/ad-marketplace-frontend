import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileFaqSheet } from "@/components/profile/ProfileFaqSheet";

vi.mock("@telegram-tools/ui-kit", () => ({
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
}));

describe("ProfileFaqSheet", () => {
  it("renders FAQ sheet title", () => {
    render(<ProfileFaqSheet open onOpenChange={() => {}} />);

    expect(screen.getByText("FAQ & Documentation")).toBeInTheDocument();
  });

  it("expands an FAQ item and shows Telegram recommendation copy", () => {
    render(<ProfileFaqSheet open onOpenChange={() => {}} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Why should I connect my Telegram account in Profile?",
      }),
    );

    expect(
      screen.getByText(/strongly recommended for smooth marketplace use/i),
    ).toBeVisible();
  });
});
