import { UsersService } from "@/shared/api/generated";

export type BackendTelegramAuthStatus =
  | "NOT_CONNECTED"
  | "PENDING_CODE"
  | "PENDING_PASSWORD"
  | "AUTHORIZED"
  | "FAILED"
  | "DISCONNECTED";

export type TelegramAuthPayload = {
  enabled: boolean;
  status: BackendTelegramAuthStatus;
  isAuthorized: boolean;
  phoneNumberMasked: string | null;
  lastAuthorizedAt: string | null;
  lastError: string | null;
  updatedAt: string | null;
};

export const DEFAULT_TELEGRAM_AUTH: TelegramAuthPayload = {
  enabled: false,
  status: "NOT_CONNECTED",
  isAuthorized: false,
  phoneNumberMasked: null,
  lastAuthorizedAt: null,
  lastError: null,
  updatedAt: null,
};

export function parseBackendStatus(raw: unknown): BackendTelegramAuthStatus {
  const value = typeof raw === "string" ? raw.toUpperCase() : "NOT_CONNECTED";
  if (
    value === "NOT_CONNECTED"
    || value === "PENDING_CODE"
    || value === "PENDING_PASSWORD"
    || value === "AUTHORIZED"
    || value === "FAILED"
    || value === "DISCONNECTED"
  ) {
    return value;
  }
  return "NOT_CONNECTED";
}

export function parseTelegramAuthPayload(raw: unknown): TelegramAuthPayload {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_TELEGRAM_AUTH;
  }

  const payload = raw as Record<string, unknown>;
  return {
    enabled: Boolean(payload.enabled),
    status: parseBackendStatus(payload.status),
    isAuthorized: Boolean(payload.isAuthorized),
    phoneNumberMasked: typeof payload.phoneNumberMasked === "string" ? payload.phoneNumberMasked : null,
    lastAuthorizedAt: typeof payload.lastAuthorizedAt === "string" ? payload.lastAuthorizedAt : null,
    lastError: typeof payload.lastError === "string" ? payload.lastError : null,
    updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : null,
  };
}

export async function getTelegramAuthStatus(): Promise<TelegramAuthPayload> {
  const response = await UsersService.getApiUsersTelegramAuthStatus();
  return parseTelegramAuthPayload(response.telegramAuth);
}

export function isTelegramDetailedAnalyticsConnected(payload: TelegramAuthPayload | null | undefined): boolean {
  if (!payload?.enabled) {
    return false;
  }

  return payload.status === "AUTHORIZED" && payload.isAuthorized;
}

