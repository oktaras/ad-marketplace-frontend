import type { StatusBadgeVariant } from "@/components/common/StatusBadge";

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export const APPLICATION_STATUS_BADGE: Record<ApplicationStatus, { label: string; variant: StatusBadgeVariant; icon?: string }> = {
  pending: { label: "Pending", variant: "warning", icon: "⏳" },
  accepted: { label: "Accepted", variant: "success", icon: "✅" },
  rejected: { label: "Declined", variant: "error", icon: "❌" },
};

export type TelegramAuthState =
  | "not_connected"
  | "pending_phone"
  | "pending_code"
  | "pending_2fa"
  | "authorized"
  | "failed";

export const TELEGRAM_AUTH_BADGE: Record<TelegramAuthState, { label: string; variant: StatusBadgeVariant }> = {
  not_connected: { label: "Not connected", variant: "muted" },
  pending_phone: { label: "Awaiting phone", variant: "warning" },
  pending_code: { label: "Pending code", variant: "warning" },
  pending_2fa: { label: "2FA required", variant: "warning" },
  authorized: { label: "Authorized", variant: "success" },
  failed: { label: "Failed", variant: "error" },
};

export type WalletNetworkKind = "mainnet" | "testnet" | "unknown";

export const WALLET_NETWORK_BADGE: Record<WalletNetworkKind, { label: string; variant: StatusBadgeVariant }> = {
  mainnet: { label: "Mainnet", variant: "success" },
  testnet: { label: "Testnet", variant: "warning" },
  unknown: { label: "Unknown", variant: "muted" },
};
