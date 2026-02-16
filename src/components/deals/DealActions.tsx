import { BackendDealStatus, Deal } from "@/types/deal";
import { UserRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { openDealChat } from "@/shared/api/deals";
import { getApiErrorMessage } from "@/shared/api/error";
import { env } from "@/app/config/env";
import { useTelegramPopupConfirm } from "@/shared/lib/telegram-popup-confirm";

const TERMINAL_BACKEND_STATUSES = new Set<BackendDealStatus>([
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
  "RESOLVED",
]);

function isTerminalDeal(deal: Deal): boolean {
  if (deal.backendStatus) {
    return TERMINAL_BACKEND_STATUSES.has(deal.backendStatus);
  }

  return deal.status === "completed" || deal.status === "cancelled";
}

function openDealChatUrl(url: string): void {
  const webApp = window.Telegram?.WebApp;

  try {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
      // Telegram may keep the mini app sheet on top after posting tg_link event.
      // Close it to reveal bot chat where /start payload is delivered.
      window.setTimeout(() => {
        try {
          webApp.close?.();
        } catch (closeError) {
          console.warn("WebApp close failed:", closeError);
        }
      }, 120);
      return;
    }
  } catch (error) {
    console.warn("openTelegramLink failed:", error);
  }

  try {
    if (webApp?.openLink) {
      webApp.openLink(url, { try_instant_view: false });
      return;
    }
  } catch (error) {
    console.warn("openLink failed:", error);
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) {
    return;
  }

  window.location.href = url;
}

function getActions(params: {
  deal: Deal;
  role: UserRole | null;
  onAcceptTerms?: (dealId: string) => void;
  acceptTermsLoading: boolean;
  chatOnly: boolean;
  includeChatAction: boolean;
}): DealAction[] {
  const {
    deal,
    role,
    onAcceptTerms,
    acceptTermsLoading,
    chatOnly,
    includeChatAction,
  } = params;

  const actions: DealAction[] = [];
  const availableActions = deal.availableActions;

  if (!chatOnly && role === "publisher" && availableActions?.acceptTerms && onAcceptTerms) {
    actions.push({
      label: "Accept Terms",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: () => onAcceptTerms(deal.id),
      disabled: acceptTermsLoading,
    });
  }

  if (includeChatAction && !isTerminalDeal(deal)) {
    actions.push({
      label: "Chat through Bot",
      icon: <ExternalLink className="w-4 h-4" />,
      variant: "outline",
      onClick: async () => {
        if (deal.dealChat?.isOpenable === false) {
          toast({
            title: "Deal chat is closed",
            description: "This deal chat can no longer be opened.",
          });
          return;
        }

        let targetUrl = deal.openDealChatUrl ?? null;
        try {
          const opened = await openDealChat(deal.id);
          if (opened.openDealChatUrl) {
            targetUrl = opened.openDealChatUrl;
          }
        } catch (error) {
          toast({
            title: "Failed to open deal chat",
            description: getApiErrorMessage(error, "Please try again."),
            variant: "destructive",
          });
          return;
        }

        if (targetUrl) {
          openDealChatUrl(targetUrl);
          return;
        }

        toast({
          title: "Open bot unavailable",
          description: "Bot deep link is not configured yet.",
          variant: "destructive",
        });
      },
    });
  }

  return actions;
}


interface DealAction {
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "outline" | "destructive" | "ghost";
  onClick: () => void;
  disabled?: boolean;
}

interface DealActionsProps {
  deal: Deal;
  role: UserRole | null;
  onAcceptTerms?: (dealId: string) => void;
  onCancelDeal?: (dealId: string) => void;
  acceptTermsLoading?: boolean;
  cancelDealLoading?: boolean;
  chatOnly?: boolean;
  includeChatAction?: boolean;
}

export function DealActions({
  deal,
  role,
  onAcceptTerms,
  onCancelDeal,
  acceptTermsLoading = false,
  cancelDealLoading = false,
  chatOnly = false,
  includeChatAction = true,
}: DealActionsProps) {
  const confirmWithPopup = useTelegramPopupConfirm();
  const actions = getActions({
    deal,
    role,
    onAcceptTerms,
    acceptTermsLoading,
    chatOnly,
    includeChatAction,
  });
  const canShowCancel = !chatOnly && deal.availableActions?.cancelDeal && !isTerminalDeal(deal);
  const cancelConfirmationDescription = env.dealChatDeleteTopicsOnClose
    ? "This action cannot be undone. Both parties will be notified of the cancellation and any held funds will be refunded. Deal-related chat topics will be deleted and message history will be lost."
    : "This action cannot be undone. Both parties will be notified of the cancellation and any held funds will be refunded.";

  const handleCancelDealRequest = async () => {
    const confirmed = await confirmWithPopup({
      title: "Cancel Deal",
      message: cancelConfirmationDescription,
      confirmText: "Cancel Deal",
      cancelText: "Keep Deal",
      isDestructive: true,
    });

    if (!confirmed) {
      return;
    }

    onCancelDeal?.(deal.id);
  };

  if (actions.length === 0 && !canShowCancel) {
    return null;
  }

  // Primary action is first non-outline, rest are secondary
  const primary = actions.find((a) => a.variant !== "outline" && a.variant !== "ghost");
  const secondary = actions.filter((a) => a !== primary);

  return (
    <div className="space-y-2">
      {primary && (
        <Button className="w-full" disabled={primary.disabled} onClick={primary.onClick}>
          {primary.icon}
          {primary.label}
        </Button>
      )}
      {secondary.length > 0 && (
        <div className="flex gap-2">
          {secondary.map((a, i) => (
            <Button
              key={i}
              variant={a.variant ?? "outline"}
              className="flex-1"
              disabled={a.disabled}
              onClick={a.onClick}
            >
              {a.icon}
              {a.label}
            </Button>
          ))}
        </div>
      )}

      {/* Cancel deal button */}
      {canShowCancel && (
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive"
          disabled={cancelDealLoading}
          onClick={() => void handleCancelDealRequest()}
        >
          Cancel Deal
        </Button>
      )}
    </div>
  );
}
