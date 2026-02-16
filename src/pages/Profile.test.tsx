import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Profile from "@/pages/Profile";

vi.mock("@/contexts/RoleContext", () => ({
  useRole: () => ({ role: "publisher" as const }),
}));

vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/common/PageContainer", () => ({
  PageContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/profile/WalletCard", () => ({
  WalletCard: () => <div>Wallet card</div>,
}));

vi.mock("@/components/profile/TelegramAuthCard", () => ({
  TelegramAuthCard: () => <div>Telegram auth card</div>,
}));

vi.mock("@/components/profile/UserInfoCard", () => ({
  UserInfoCard: () => <div>User info card</div>,
}));

vi.mock("@/components/profile/SettingsSheet", () => ({
  SettingsSheet: () => null,
}));

vi.mock("@/components/profile/NotificationsSheet", () => ({
  NotificationsSheet: () => null,
}));

vi.mock("@/components/layout/RoleSwitcher", () => ({
  RoleSwitcher: () => <div>Role switcher</div>,
}));

vi.mock("@/app/router/profileSettingsSheetState", () => ({
  subscribeProfileSettingsSheetOpen: () => () => {},
}));

vi.mock("@/app/config/env", () => ({
  env: {
    telegramSupportUrl: "https://t.me/example_support",
  },
}));

vi.mock("@telegram-tools/ui-kit", () => ({
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  Group: ({ children, header }: { children?: ReactNode; header?: string }) => (
    <section>
      {header ? <h2>{header}</h2> : null}
      {children}
    </section>
  ),
  GroupItem: ({
    text,
    description,
    onClick,
    disabled,
  }: {
    text: string;
    description?: string;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {text}
      {description ? ` ${description}` : ""}
    </button>
  ),
}));

describe("Profile FAQ integration", () => {
  it("opens FAQ sheet when user clicks View FAQ & Documentation", () => {
    render(<Profile />);

    expect(
      screen.queryByText("What is the difference between a brief and a listing?"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /View FAQ & Documentation/i }));

    expect(
      screen.getByText("What is the difference between a brief and a listing?"),
    ).toBeInTheDocument();
  });
});
