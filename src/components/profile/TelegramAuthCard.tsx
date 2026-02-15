import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSheet } from "@/components/common/AppSheet";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TELEGRAM_AUTH_BADGE, type TelegramAuthState } from "@/shared/notifications/status-maps";
import { requestTelegramContact } from "@/shared/lib/telegram";
import { UsersService } from "@/shared/api/generated";
import { getApiErrorMessage } from "@/shared/api/error";
import { useAuthStore } from "@/features/auth/model/auth.store";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "@/hooks/use-toast";
import { analyticsMessages } from "@/shared/analytics/messages";
import { useTelegramPopupConfirm } from "@/shared/lib/telegram-popup-confirm";
import {
  DEFAULT_TELEGRAM_AUTH,
  type BackendTelegramAuthStatus,
  getTelegramAuthStatus,
  parseTelegramAuthPayload,
} from "@/shared/telegram-auth/status";
import {
  CheckCircle2, AlertCircle, Loader2, Shield, Smartphone,
  ChevronRight, BarChart3, Lock, Unlink, Phone,
} from "lucide-react";

const STATE_CONFIG: Record<TelegramAuthState, {
  icon: React.ReactNode;
  title: string;
  description: string;
}> = {
  not_connected: {
    icon: <Smartphone className="h-5 w-5 text-muted-foreground" />,
    title: "Telegram",
    description: "Not connected — basic analytics only",
  },
  pending_phone: {
    icon: <Phone className="h-5 w-5 text-warning animate-pulse" />,
    title: "Telegram",
    description: "Share your phone number to continue",
  },
  pending_code: {
    icon: <Loader2 className="h-5 w-5 text-warning animate-spin" />,
    title: "Telegram",
    description: "Check Telegram for the confirmation code",
  },
  pending_2fa: {
    icon: <Shield className="h-5 w-5 text-warning" />,
    title: "Telegram",
    description: "Enter your 2FA password to complete",
  },
  authorized: {
    icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
    title: "Telegram",
    description: "Connected — full channel analytics enabled",
  },
  failed: {
    icon: <AlertCircle className="h-5 w-5 text-destructive" />,
    title: "Telegram",
    description: "Authorization failed. Please try again.",
  },
};

const FLOW_STEPS = [
  {
    step: "1",
    label: "Share phone number",
    desc: "Telegram bot will ask to share your phone number",
    state: "pending_phone" as const,
  },
  {
    step: "2",
    label: "Verify code",
    desc: "Telegram sends a confirmation code to your account (chat 777000)",
    state: "pending_code" as const,
  },
  {
    step: "3",
    label: "2FA (if enabled)",
    desc: "Enter your two-factor password if set up",
    state: "pending_2fa" as const,
  },
  {
    step: "4",
    label: "Connected",
    desc: "Full channel analytics via Telegram API unlocked",
    state: "authorized" as const,
  },
];

function mapBackendStatusToUiStatus(
  status: BackendTelegramAuthStatus,
  pendingPhone: boolean,
): TelegramAuthState {
  if (pendingPhone) {
    return "pending_phone";
  }

  if (status === "PENDING_CODE") {
    return "pending_code";
  }

  if (status === "PENDING_PASSWORD") {
    return "pending_2fa";
  }

  if (status === "AUTHORIZED") {
    return "authorized";
  }

  if (status === "FAILED") {
    return "failed";
  }

  return "not_connected";
}

export function TelegramAuthCard() {
  const queryClient = useQueryClient();
  const { role } = useRole();
  const confirmWithPopup = useTelegramPopupConfirm();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showSheet, setShowSheet] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [isRequestingPhone, setIsRequestingPhone] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [statusHint, setStatusHint] = useState<string | null>(null);

  const telegramAuthQuery = useQuery({
    queryKey: ["telegram-auth-status"],
    enabled: isAuthenticated && role === "publisher",
    queryFn: getTelegramAuthStatus,
    refetchInterval: 15_000,
  });

  const telegramAuth = telegramAuthQuery.data ?? DEFAULT_TELEGRAM_AUTH;

  const startAuthMutation = useMutation({
    mutationFn: async (params: { phoneNumber: string; forceSms?: boolean }) => {
      const response = await UsersService.postApiUsersTelegramAuthStart({
        requestBody: {
          phoneNumber: params.phoneNumber,
          forceSms: params.forceSms ?? false,
        },
      });
      return {
        message: typeof response.message === "string" ? response.message : null,
        status: parseTelegramAuthPayload(response.telegramAuth),
      };
    },
    onSuccess: async (result) => {
      setInlineError(null);
      setStatusHint(result.message);
      setVerificationCode("");
      await queryClient.invalidateQueries({ queryKey: ["telegram-auth-status"] });
      toast({ title: "Verification started", description: result.message || "Check your Telegram app for the code." });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, "Failed to start Telegram authentication.");
      setInlineError(message);
      toast({ title: "Telegram connection failed", description: message, variant: "destructive" });
    },
  });

  const submitCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await UsersService.postApiUsersTelegramAuthCode({
        requestBody: { code },
      });
      return {
        message: typeof response.message === "string" ? response.message : null,
        status: parseTelegramAuthPayload(response.telegramAuth),
      };
    },
    onSuccess: async (result) => {
      setInlineError(null);
      setStatusHint(result.message);
      if (result.status.status !== "PENDING_PASSWORD") {
        setVerificationCode("");
      }
      await queryClient.invalidateQueries({ queryKey: ["telegram-auth-status"] });
      toast({ title: "Code accepted", description: result.message || "Telegram account status updated." });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, "Failed to verify code.");
      setInlineError(message);
      toast({ title: "Code verification failed", description: message, variant: "destructive" });
    },
  });

  const submitPasswordMutation = useMutation({
    mutationFn: async (nextPassword: string) => {
      const response = await UsersService.postApiUsersTelegramAuthPassword({
        requestBody: { password: nextPassword },
      });
      return {
        message: typeof response.message === "string" ? response.message : null,
        status: parseTelegramAuthPayload(response.telegramAuth),
      };
    },
    onSuccess: async (result) => {
      setInlineError(null);
      setStatusHint(result.message);
      setPassword("");
      await queryClient.invalidateQueries({ queryKey: ["telegram-auth-status"] });
      toast({ title: "Telegram connected", description: result.message || "Your Telegram account is now connected." });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, "Failed to verify 2FA password.");
      setInlineError(message);
      toast({ title: "2FA verification failed", description: message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await UsersService.postApiUsersTelegramAuthDisconnect();
    },
    onSuccess: async () => {
      setInlineError(null);
      setStatusHint("Telegram account disconnected.");
      setVerificationCode("");
      setPassword("");
      await queryClient.invalidateQueries({ queryKey: ["telegram-auth-status"] });
      toast({ title: "Telegram disconnected" });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, "Failed to disconnect Telegram account.");
      setInlineError(message);
      toast({ title: "Disconnect failed", description: message, variant: "destructive" });
    },
  });

  const authState = mapBackendStatusToUiStatus(
    telegramAuth.status,
    isRequestingPhone || startAuthMutation.isPending,
  );
  const config = STATE_CONFIG[authState];
  const statusBadge = TELEGRAM_AUTH_BADGE[authState];
  const currentStepIndex = FLOW_STEPS.findIndex((step) => step.state === authState);
  const isConnected = telegramAuth.status === "AUTHORIZED";
  const isBusy = telegramAuthQuery.isFetching
    || startAuthMutation.isPending
    || submitCodeMutation.isPending
    || submitPasswordMutation.isPending
    || disconnectMutation.isPending;

  const displayUsername = user?.username ? `@${user.username}` : (user?.firstName || "Telegram User");
  const displayTelegramId = user?.telegramId ? `ID: ${user.telegramId}` : "ID is not available";

  const statusError = inlineError || telegramAuth.lastError;
  const canSubmitCode = verificationCode.trim().length >= 3;
  const canSubmitPassword = password.trim().length > 0;
  const telegramUnavailable = !telegramAuth.enabled && telegramAuth.status === "NOT_CONNECTED";

  const statusLine = useMemo(() => {
    if (isConnected) {
      return `${displayUsername} • ${displayTelegramId}`;
    }

    if (telegramUnavailable) {
      return "Telegram API integration is disabled on backend";
    }

    return config.description;
  }, [isConnected, displayUsername, displayTelegramId, telegramUnavailable, config.description]);

  const handleRequestPhoneAndStart = async () => {
    setInlineError(null);
    setStatusHint(null);
    setIsRequestingPhone(true);

    try {
      const shared = await requestTelegramContact();
      await startAuthMutation.mutateAsync({ phoneNumber: shared.phoneNumber });
    } catch (error) {
      const message = getApiErrorMessage(error, "Phone share was declined.");
      setInlineError(message);
    } finally {
      setIsRequestingPhone(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!canSubmitCode) {
      setInlineError("Enter the verification code.");
      return;
    }

    setInlineError(null);
    setStatusHint(null);
    await submitCodeMutation.mutateAsync(verificationCode.trim());
  };

  const handleSubmitPassword = async () => {
    if (!canSubmitPassword) {
      setInlineError("Enter your 2FA password.");
      return;
    }

    setInlineError(null);
    setStatusHint(null);
    await submitPasswordMutation.mutateAsync(password);
  };

  const handleDisconnectRequest = async () => {
    const confirmed = await confirmWithPopup({
      title: "Disconnect Telegram",
      message: "This will revoke API access. You'll lose detailed channel analytics until reconnect.",
      confirmText: "Disconnect",
      cancelText: "Keep Connected",
      isDestructive: true,
    });

    if (!confirmed) {
      return;
    }

    disconnectMutation.mutate();
  };

  if (role !== "publisher") {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowSheet(true)}
        className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
          isConnected
            ? "bg-gradient-to-r from-primary/5 to-primary/0 border-primary/10 hover:from-primary/10"
            : "bg-card border-border hover:bg-secondary/50"
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isConnected ? "bg-primary/20" : "bg-secondary"
        }`}>
          {config.icon}
        </div>
        <div className="flex-1 text-left min-w-0">
          <Text type="subheadline1" weight="medium">{config.title}</Text>
          <Text type="caption1" color="secondary" className="truncate">{statusLine}</Text>
        </div>
        <StatusBadge label={statusBadge.label} variant={statusBadge.variant} dot={false} />
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>

      <AppSheet open={showSheet} onOpenChange={setShowSheet} title="Telegram Account" icon={<Smartphone className="h-5 w-5" />}>
        <div className="space-y-5">
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
            isConnected
              ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
              : "bg-secondary/50 border-border"
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isConnected ? "bg-primary/20" : "bg-secondary"
            }`}>
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <Text type="subheadline1" weight="medium">
                {isConnected ? displayUsername : statusBadge.label}
              </Text>
              <Text type="caption1" color="secondary">
                {isConnected ? displayTelegramId : config.description}
              </Text>
            </div>
            <StatusBadge label={statusBadge.label} variant={statusBadge.variant} dot={false} />
          </div>

          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            isConnected ? "bg-primary/5 border border-primary/10" : "bg-secondary/50"
          }`}>
            {isConnected ? (
              <BarChart3 className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <Text type="caption2" color={isConnected ? undefined : "secondary"}>
              {telegramUnavailable
                ? "Backend Telegram API credentials are not configured."
                : isConnected
                  ? "Full analytics: subscribers, views, growth, demographics"
                  : analyticsMessages.ownerConnectRequired}
            </Text>
          </div>

          {!isConnected && (
            <div className="space-y-3">
              <Text type="subheadline2" weight="medium">How connection works</Text>
              <div className="space-y-0 pl-1">
                {FLOW_STEPS.map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isDone = index < currentStepIndex;
                  return (
                    <div key={step.step} className="flex gap-3 relative">
                      {index < FLOW_STEPS.length - 1 ? (
                        <div className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${isDone ? "bg-primary/40" : "bg-border"}`} />
                      ) : null}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 z-10 ${
                        isDone ? "bg-primary text-primary-foreground" :
                        isActive ? "bg-primary/20 text-primary ring-2 ring-primary/30" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {isDone ? "✓" : step.step}
                      </div>
                      <div className="pb-4 min-w-0">
                        <Text type="caption1" weight={isActive ? "medium" : "regular"}>{step.label}</Text>
                        <Text type="caption2" color="secondary">{step.desc}</Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(authState === "not_connected" || authState === "failed" || authState === "pending_phone") && !telegramUnavailable ? (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <Text type="caption1" color="secondary">
                Continue via bot prompt. Telegram will request your phone number securely.
              </Text>
              <Button
                className="w-full"
                onClick={() => void handleRequestPhoneAndStart()}
                disabled={isBusy}
              >
                <Phone className="h-4 w-4" />
                Share Phone in Bot
              </Button>
            </div>
          ) : null}

          {authState === "pending_code" ? (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <Text type="caption1" weight="medium">Verification Code</Text>
              <Input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="Enter code from Telegram"
                inputMode="numeric"
                disabled={isBusy}
              />
              <Button
                className="w-full"
                onClick={() => void handleSubmitCode()}
                disabled={isBusy || !canSubmitCode}
              >
                Verify Code
              </Button>
            </div>
          ) : null}

          {authState === "pending_2fa" ? (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <Text type="caption1" weight="medium">2FA Password</Text>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your Telegram 2FA password"
                type="password"
                disabled={isBusy}
              />
              <Button
                className="w-full"
                onClick={() => void handleSubmitPassword()}
                disabled={isBusy || !canSubmitPassword}
              >
                Verify Password
              </Button>
            </div>
          ) : null}

          {statusHint ? (
            <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Text type="caption2" color="secondary">{statusHint}</Text>
            </div>
          ) : null}

          {statusError ? (
            <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <Text type="caption2" className="text-destructive">{statusError}</Text>
            </div>
          ) : null}

          {telegramAuthQuery.isLoading ? (
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <Text type="caption2" color="secondary">Loading Telegram connection status...</Text>
            </div>
          ) : null}

          {isConnected ? (
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => void handleDisconnectRequest()}
              disabled={isBusy}
            >
              <Unlink className="h-4 w-4" />
              Disconnect Account
            </Button>
          ) : null}
        </div>
      </AppSheet>
    </>
  );
}
