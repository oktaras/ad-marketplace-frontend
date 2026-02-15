import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import { ChevronRight, Copy, Check, Unlink, Wallet, Loader2 } from "lucide-react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { AuthService, DealsService, UsersService } from "@/shared/api/generated";
import { getApiErrorMessage } from "@/shared/api/error";
import { useAuthStore } from "@/features/auth/model/auth.store";
import { inAppToasts } from "@/shared/notifications/in-app";
import { WALLET_NETWORK_BADGE } from "@/shared/notifications/status-maps";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useTelegramPopupConfirm } from "@/shared/lib/telegram-popup-confirm";

type NetworkKind = "mainnet" | "testnet" | "unknown";

type AwaitingPaymentSummary = {
  count: number;
  totalAmount: number;
  totalsByCurrency: Array<{ currency: string; amount: number }>;
};

function isRawTonAddress(address: string): boolean {
  return /^-?\d+:[0-9a-fA-F]{64}$/.test(address.trim());
}

function formatAddressForUi(address: string | null | undefined): string | null {
  if (!address) {
    return null;
  }

  const trimmed = address.trim();
  return trimmed || null;
}

function toShortAddress(address: string | null | undefined): string {
  if (!address) {
    return "Not linked";
  }

  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function inferNetworkFromAddress(address: string | null | undefined): NetworkKind {
  if (!address) {
    return "unknown";
  }

  const trimmed = address.trim();
  if (!trimmed || isRawTonAddress(trimmed)) {
    return "unknown";
  }

  const prefix = trimmed.charAt(0);
  if (prefix === "k" || prefix === "0") {
    return "testnet";
  }

  if (prefix === "E" || prefix === "U") {
    return "mainnet";
  }

  return "unknown";
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function buildAwaitingPaymentSummary(rawDeals: Array<Record<string, unknown>> | undefined): AwaitingPaymentSummary {
  if (!Array.isArray(rawDeals) || rawDeals.length === 0) {
    return { count: 0, totalAmount: 0, totalsByCurrency: [] };
  }

  const totalsMap = new Map<string, number>();
  let totalAmount = 0;

  rawDeals.forEach((deal) => {
    const amountRaw = deal.agreedPrice;
    const currencyRaw = deal.currency;
    const parsedAmount = Number(typeof amountRaw === "string" || typeof amountRaw === "number" ? amountRaw : 0);
    const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
    const currency = typeof currencyRaw === "string" && currencyRaw.trim() ? currencyRaw.trim().toUpperCase() : "TON";

    totalAmount += amount;
    totalsMap.set(currency, (totalsMap.get(currency) ?? 0) + amount);
  });

  const totalsByCurrency = [...totalsMap.entries()].map(([currency, amount]) => ({ currency, amount }));

  return {
    count: rawDeals.length,
    totalAmount,
    totalsByCurrency,
  };
}

export function WalletCard() {
  const [showDetail, setShowDetail] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const confirmWithPopup = useTelegramPopupConfirm();
  const hasHydratedProfileRef = useRef(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const linkedWalletAddress = useAuthStore((state) => state.user?.walletAddress ?? null);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [tonConnectUI] = useTonConnectUI();

  const hasLinkedWallet = Boolean(linkedWalletAddress);
  const displayAddress = useMemo(() => formatAddressForUi(linkedWalletAddress), [linkedWalletAddress]);
  const shortAddress = toShortAddress(displayAddress);

  const awaitingPaymentQuery = useQuery({
    queryKey: ["wallet-awaiting-payments"],
    enabled: isAuthenticated,
    staleTime: 30_000,
    queryFn: () =>
      DealsService.getApiDeals({
        role: "advertiser",
        status: "AWAITING_PAYMENT",
        page: 1,
        limit: 100,
      }),
  });

  const awaitingPaymentSummary = useMemo(
    () => buildAwaitingPaymentSummary(awaitingPaymentQuery.data?.deals as Array<Record<string, unknown>> | undefined),
    [awaitingPaymentQuery.data?.deals],
  );

  const awaitingPaymentPrimaryValue = useMemo(() => {
    if (awaitingPaymentSummary.count === 0) {
      return "0 TON";
    }

    if (awaitingPaymentSummary.totalsByCurrency.length === 1) {
      const [single] = awaitingPaymentSummary.totalsByCurrency;
      return `${formatAmount(single.amount)} ${single.currency}`;
    }

    return `${formatAmount(awaitingPaymentSummary.totalAmount)} total`;
  }, [awaitingPaymentSummary]);

  const awaitingPaymentSecondaryLabel = useMemo(() => {
    if (awaitingPaymentSummary.count === 0) {
      return "No deals awaiting funding";
    }

    if (awaitingPaymentSummary.totalsByCurrency.length > 1) {
      return awaitingPaymentSummary.totalsByCurrency
        .map((item) => `${formatAmount(item.amount)} ${item.currency}`)
        .join(" • ");
    }

    return awaitingPaymentSummary.count === 1
      ? "1 deal awaiting funding"
      : `${awaitingPaymentSummary.count} deals awaiting funding`;
  }, [awaitingPaymentSummary]);

  const networkKind: NetworkKind = useMemo(
    () => inferNetworkFromAddress(linkedWalletAddress),
    [linkedWalletAddress],
  );

  const networkLabel = networkKind === "testnet"
    ? "TON Testnet"
    : networkKind === "mainnet"
      ? "TON Mainnet"
      : "Unknown Network";
  const networkHint = linkedWalletAddress
    ? "Detected from linked wallet address"
    : "Link wallet to detect network";

  const networkBadge = WALLET_NETWORK_BADGE[networkKind];

  const walletAppLabel = linkedWalletAddress ? "Linked in account" : "Not connected";
  const connectionHint = linkedWalletAddress
    ? "Connected and linked to this account in backend profile."
    : "No wallet linked.";

  const syncWalletAddressFromProfile = useCallback(async (): Promise<string | null> => {
    const profile = await UsersService.getApiUsersMe();
    const walletAddress = typeof profile.user?.walletAddress === "string"
      ? profile.user.walletAddress
      : null;

    updateUser({ walletAddress });
    return walletAddress;
  }, [updateUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      hasHydratedProfileRef.current = false;
      return;
    }

    if (hasHydratedProfileRef.current) {
      return;
    }

    hasHydratedProfileRef.current = true;
    void syncWalletAddressFromProfile().catch(() => {
      // Keep existing state if the initial hydration request fails.
    });
  }, [isAuthenticated, syncWalletAddressFromProfile]);

  const linkWalletMutation = useMutation({
    mutationFn: async (address: string) => {
      await AuthService.postApiAuthWalletConnect({
        requestBody: {
          address,
        },
      });

      return address;
    },
    onSuccess: async () => {
      try {
        const syncedAddress = await syncWalletAddressFromProfile();

        if (!syncedAddress) {
          toast(inAppToasts.wallet.linkFailed("Wallet is not linked in backend profile yet."));
          return;
        }

        toast(inAppToasts.wallet.linked);
      } catch (error) {
        toast(inAppToasts.wallet.linkFailed(getApiErrorMessage(error, "Could not refresh wallet profile.")));
      }
    },
    onError: (error) => {
      toast(inAppToasts.wallet.linkFailed(getApiErrorMessage(error, "Could not link wallet.")));
    },
  });

  const disconnectWalletMutation = useMutation({
    mutationFn: async () => {
      if (!linkedWalletAddress) {
        throw new Error("No linked wallet to disconnect.");
      }

      await AuthService.deleteApiAuthWallet({ address: linkedWalletAddress });
      return linkedWalletAddress;
    },
    onSuccess: async () => {
      try {
        await syncWalletAddressFromProfile();
      } catch {
        // Keep UI moving even if profile refresh fails after successful unlink.
        updateUser({ walletAddress: null });
      }

      setShowDetail(false);
      toast(inAppToasts.wallet.disconnected);
    },
    onError: (error) => {
      toast(inAppToasts.wallet.disconnectFailed(getApiErrorMessage(error, "Could not disconnect wallet.")));
    },
  });

  const isBusy = linkWalletMutation.isPending || disconnectWalletMutation.isPending;

  const handleConnect = async () => {
    try {
      if (showDetail) {
        setShowDetail(false);
        await new Promise((resolve) => {
          window.setTimeout(resolve, 420);
        });
      }

      const connectedWallet = await tonConnectUI.connectWallet();
      const nextAddress = connectedWallet.account.address?.trim();

      if (!nextAddress) {
        toast(inAppToasts.wallet.connectFirst);
        return;
      }

      if (linkedWalletAddress && linkedWalletAddress.trim().toLowerCase() === nextAddress.toLowerCase()) {
        return;
      }

      linkWalletMutation.mutate(nextAddress);
    } catch {
      // Keep silent for wallet modal close/fail to avoid noisy UX.
    }
  };

  const handleCopy = () => {
    if (!displayAddress) {
      return;
    }

    navigator.clipboard.writeText(displayAddress);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const handleDisconnectRequest = async () => {
    const confirmed = await confirmWithPopup({
      title: "Disconnect Wallet",
      message: "This unlinks your TON wallet. Active deals with escrowed funds are not affected.",
      confirmText: "Disconnect",
      cancelText: "Keep Linked",
      isDestructive: true,
    });

    if (!confirmed) {
      return;
    }

    disconnectWalletMutation.mutate();
  };

  return (
    <>
      {hasLinkedWallet ? (
        <button
          onClick={() => setShowDetail(true)}
          className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-primary/0 rounded-xl border border-primary/10 hover:from-primary/10 hover:to-primary/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <Text type="subheadline1" weight="medium">TON Wallet</Text>
            <Text type="caption1" color="secondary" className="truncate">
              {shortAddress} • {walletAppLabel}
            </Text>
          </div>
          <StatusBadge label={networkBadge.label} variant={networkBadge.variant} dot={false} />
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </button>
      ) : (
        <button
          onClick={() => void handleConnect()}
          className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <Text type="subheadline1" weight="medium">Link Current Wallet</Text>
            <Text type="caption1" color="secondary">
              Connect and link your TON wallet
            </Text>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </button>
      )}

      <AppSheet open={showDetail} onOpenChange={setShowDetail} title="TON Wallet" icon={<Wallet className="h-5 w-5" />}>
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Text type="subheadline2" weight="medium">Linked Wallet</Text>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {walletAppLabel}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              disabled={!displayAddress}
            >
              <code className="text-xs font-mono text-foreground">{shortAddress}</code>
              <span className="ml-2 flex-shrink-0">
                {addressCopied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </span>
            </button>
            <Text type="caption2" color="secondary">
              {connectionHint}
            </Text>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
            <Text type="caption1" color="secondary">Awaiting Payment</Text>
            {awaitingPaymentQuery.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <Text type="body">Calculating…</Text>
              </div>
            ) : awaitingPaymentQuery.isError ? (
              <Text type="body" color="secondary">Failed to load awaiting payments.</Text>
            ) : (
              <>
                <Text type="title3" weight="medium">{awaitingPaymentPrimaryValue}</Text>
                <Text type="caption2" color="secondary">{awaitingPaymentSecondaryLabel}</Text>
              </>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <Text type="subheadline2" weight="medium">{networkLabel}</Text>
              <Text type="caption2" color="secondary">{networkHint}</Text>
            </div>
            <StatusBadge label={networkBadge.label} variant={networkBadge.variant} dot={false} />
          </div>

          <div className="space-y-2">
            {!hasLinkedWallet && (
              <Button className="w-full" onClick={() => void handleConnect()} disabled={isBusy}>
                Link Current Wallet
              </Button>
            )}

            {linkedWalletAddress && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => void handleDisconnectRequest()}
                disabled={isBusy}
              >
                <Unlink className="w-4 h-4" />
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </AppSheet>
    </>
  );
}
