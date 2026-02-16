import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Text } from "@telegram-tools/ui-kit";
import { CheckCircle2, Circle, Copy, ExternalLink } from "lucide-react";
import { BackendDealStatus, Deal, DEAL_STATUS_CONFIG, type CreativeMedia, type InlineButton } from "@/types/deal";
import { AppSheet } from "@/components/common/AppSheet";
import { HorizontalScrollRow } from "@/components/common/HorizontalScrollRow";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { useRole } from "@/contexts/RoleContext";
import { DealProgressRail } from "./DealProgressRail";
import { TimeoutBanner } from "./TimeoutBanner";
import { EscrowStatusPanel } from "./EscrowStatusPanel";
import { CreativeComposer } from "./CreativeComposer";
import { CreativePreview } from "./CreativePreview";
import { PostingPlanPanel } from "./PostingPlanPanel";
import { ActivityTimeline } from "./ActivityTimeline";
import { DealActions } from "./DealActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { env } from "@/app/config/env";
import { getAdFormatDisplay } from "@/shared/lib/ad-format";
import {
  getDealActivity,
  getDealCreative,
  getDealFinance,
  getDealPostingPlan,
  openDealChat,
} from "@/shared/api/deals";
import { getApiErrorMessage } from "@/shared/api/error";
import { useSwipeTabNavigation } from "@/hooks/use-touch-gestures";
import { useTabContentTransition } from "@/hooks/use-tab-content-transition";
import { isMilestoneTransitionReady } from "./milestone-visual-state";

interface DealDetailSheetProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptTerms?: (dealId: string) => void;
  acceptTermsLoading?: boolean;
  onFundDeal?: (dealId: string) => void;
  fundDealLoading?: boolean;
  onVerifyPayment?: (dealId: string) => void;
  verifyPaymentLoading?: boolean;
  onSubmitCreative?: (dealId: string, payload: {
    text: string;
    media: CreativeMedia[];
    inlineButtons: InlineButton[];
  }) => Promise<void> | void;
  submitCreativeLoading?: boolean;
  onApproveCreative?: (dealId: string) => void;
  approveCreativeLoading?: boolean;
  onRequestCreativeRevision?: (dealId: string, feedback: string) => void;
  requestCreativeRevisionLoading?: boolean;
  onCancelDeal?: (dealId: string) => void;
  cancelDealLoading?: boolean;
  onPostingPlanUpdated?: () => void | Promise<void>;
}

type DealDetailsTab = "overview" | "creative" | "posting-plan" | "finance" | "activity";

const TAB_LABELS: Array<{ id: DealDetailsTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "creative", label: "Creative" },
  { id: "posting-plan", label: "Posting Plan" },
  { id: "finance", label: "Finance" },
  { id: "activity", label: "Activity" },
];
const DEAL_DETAILS_TAB_ORDER: readonly DealDetailsTab[] = TAB_LABELS.map((tabOption) => tabOption.id);

function MilestoneTimeline({ deal }: { deal: Deal }) {
  return (
    <div className="space-y-0">
      {deal.milestones.map((milestone, index) => {
        const isLast = index === deal.milestones.length - 1;
        const transitionReady = isMilestoneTransitionReady(deal, index);

        return (
          <div key={milestone.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              {milestone.status === "done" ? (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <Circle
                  className={`w-5 h-5 flex-shrink-0 ${
                    milestone.status === "active" ? "text-primary" : "text-border"
                  }`}
                />
              )}
              {!isLast ? (
                <div
                  className={`w-0.5 flex-1 min-h-[24px] ${
                    milestone.status === "done"
                      ? "bg-primary"
                      : milestone.status === "active" && transitionReady
                        ? "bg-primary animate-pulse"
                        : "bg-border"
                  }`}
                />
              ) : null}
            </div>

            <div className="pb-4 min-w-0">
              <Text type="subheadline1" weight={milestone.status === "active" ? "medium" : "regular"}>
                {milestone.label}
              </Text>
              <Text type="caption1" color="secondary">{milestone.description}</Text>
              {milestone.timestamp ? <Text type="caption2" color="tertiary">{milestone.timestamp}</Text> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDateLabel(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value.slice(0, 10);
  }

  return new Date(parsed).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getChatStatusHint(deal: Deal): string | null {
  const chat = deal.dealChat;
  if (!chat) {
    return null;
  }

  if (chat.status === "CLOSED") {
    return "Deal chat: Closed";
  }

  if (chat.status === "ACTIVE" || (chat.openedByMe && chat.openedByCounterparty)) {
    return "Deal chat: Active";
  }

  if (chat.openedByMe) {
    return "Deal chat: Waiting for counterparty";
  }

  return "Deal chat: Open in bot to start";
}

function getTonExplorerUrl(address: string): string {
  const base = env.tonNetwork === "testnet"
    ? "https://testnet.tonviewer.com"
    : "https://tonviewer.com";
  return `${base}/${address}`;
}

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

export function DealDetailSheet({
  deal,
  open,
  onOpenChange,
  onAcceptTerms,
  acceptTermsLoading = false,
  onFundDeal,
  fundDealLoading = false,
  onVerifyPayment,
  verifyPaymentLoading = false,
  onSubmitCreative,
  submitCreativeLoading = false,
  onApproveCreative,
  approveCreativeLoading = false,
  onRequestCreativeRevision,
  requestCreativeRevisionLoading = false,
  onCancelDeal,
  cancelDealLoading = false,
  onPostingPlanUpdated,
}: DealDetailSheetProps) {
  const { role } = useRole();
  const [tab, setTab] = useState<DealDetailsTab>("overview");
  const dealId = deal?.id ?? "";

  useEffect(() => {
    setTab("overview");
  }, [dealId, open]);

  const tabSwipeHandlers = useSwipeTabNavigation({
    tabOrder: DEAL_DETAILS_TAB_ORDER,
    activeTab: tab,
    onTabChange: (nextTab) => setTab(nextTab),
    enabled: open,
  });
  const tabTransitionClass = useTabContentTransition(tab, DEAL_DETAILS_TAB_ORDER);

  const creativeQuery = useQuery({
    queryKey: ["deal", dealId, "creative"],
    queryFn: () => getDealCreative(dealId),
    enabled: Boolean(deal) && open && tab === "creative",
  });

  const postingPlanQuery = useQuery({
    queryKey: ["deal", dealId, "posting-plan"],
    queryFn: () => getDealPostingPlan(dealId),
    enabled: Boolean(deal) && open && tab === "posting-plan",
  });

  const financeQuery = useQuery({
    queryKey: ["deal", dealId, "finance"],
    queryFn: () => getDealFinance(dealId),
    enabled: Boolean(deal) && open && tab === "finance",
  });

  const activityQuery = useQuery({
    queryKey: ["deal", dealId, "activity"],
    queryFn: () => getDealActivity(dealId),
    enabled: Boolean(deal) && open && tab === "activity",
  });

  const creativeActions = creativeQuery.data?.availableActions ?? deal?.availableActions;
  const creativeSubmissions = creativeQuery.data?.creativeSubmissions ?? [];
  const creativeStatus = creativeQuery.data?.status ?? deal?.status;
  const showSubmitCreative = Boolean(creativeActions?.submitCreative);

  const financeDeal = useMemo(
    () => {
      if (!deal) {
        return null;
      }

      return {
        ...deal,
        agreedPrice: financeQuery.data?.agreedPrice ?? deal.agreedPrice,
        currency: financeQuery.data?.currency ?? deal.currency,
        escrowStatus: financeQuery.data?.escrowStatus ?? deal.escrowStatus,
        availableActions: financeQuery.data?.availableActions ?? deal.availableActions,
      };
    },
    [deal, financeQuery.data],
  );

  const postingPlanData = postingPlanQuery.data;
  const activityData = activityQuery.data ?? null;
  const financeData = financeQuery.data ?? null;

  if (!deal) {
    return null;
  }

  const statusCfg = DEAL_STATUS_CONFIG[deal.status];
  const chatStatusHint = getChatStatusHint(deal);
  const briefTitle = deal.briefTitle || "Brief";
  const briefDescription = deal.briefDescription?.trim() || "No brief description";

  const handleSubmitCreative = (data: {
    text: string;
    media: CreativeMedia[];
    inlineButtons: InlineButton[];
  }) => {
    if (!dealId) {
      return;
    }
    onSubmitCreative?.(dealId, data);
  };

  const handleApprove = () => {
    if (!dealId) {
      return;
    }
    onApproveCreative?.(dealId);
  };

  const handleRequestRevision = (feedback: string) => {
    if (!dealId) {
      return;
    }
    onRequestCreativeRevision?.(dealId, feedback);
  };

  const handleCopyEscrowAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Escrow address copied",
        description: "The contract address has been copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenDealChat = async () => {
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
  };

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Deal Details" fullHeight>
      <Tabs
        value={tab}
        onValueChange={(next) => setTab(next as DealDetailsTab)}
        className="space-y-4 min-h-full"
        {...tabSwipeHandlers}
      >
        <HorizontalScrollRow bleed={false} showEdgeFade={false} wrapContent={false}>
          <TabsList className="w-max min-w-full justify-between gap-1 bg-secondary/60 !h-auto !p-0.5">
            {TAB_LABELS.map((tabOption) => (
              <TabsTrigger
                key={tabOption.id}
                value={tabOption.id}
                className="!h-7 !px-1 !py-1 text-xs sm:text-sm !shrink-0"
              >
                {tabOption.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </HorizontalScrollRow>

        <TimeoutBanner deal={deal} />

        <TabsContent value="overview" className={`space-y-5 ${tabTransitionClass}`}>
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-3">
                <Text type="caption1" color="secondary">Brief</Text>
                <div className="mt-0.5">
                  <Text type="body" weight="medium">{briefTitle}</Text>
                </div>
                <div className="mt-1">
                  <Text type="caption1" color="secondary">{briefDescription}</Text>
                </div>
              </div>
              <StatusBadge label={statusCfg.label} icon={statusCfg.emoji} variant={statusCfg.badgeVariant ?? "muted"} />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-secondary/50 rounded-lg px-3 py-2">
                <Text type="caption2" color="secondary">Price</Text>
                <Text type="subheadline1" weight="medium">{formatCurrency(deal.agreedPrice, deal.currency)}</Text>
              </div>
              <div className="bg-secondary/50 rounded-lg px-3 py-2">
                <Text type="caption2" color="secondary">Format</Text>
                <Text type="subheadline1" weight="medium">{getAdFormatDisplay(deal.format)}</Text>
              </div>
              <div className="bg-secondary/50 rounded-lg px-3 py-2">
                <Text type="caption2" color="secondary">Created</Text>
                <Text type="subheadline1" weight="medium">{formatDateLabel(deal.createdAt)}</Text>
              </div>
            </div>

            {chatStatusHint ? (
              <div className="bg-secondary/40 rounded-lg px-3 py-2">
                <Text type="caption1" color="secondary">{chatStatusHint}</Text>
              </div>
            ) : null}

            {!isTerminalDeal(deal) ? (
              <Button variant="outline" className="w-full" onClick={() => void handleOpenDealChat()}>
                <ExternalLink className="w-4 h-4" />
                Chat in Bot
              </Button>
            ) : null}
          </div>

          <DealProgressRail deal={deal} />

          <div className="space-y-3">
            <Text type="subheadline1" weight="medium">Timeline</Text>
            <MilestoneTimeline deal={deal} />
          </div>

          <DealActions
            deal={deal}
            role={role}
            onAcceptTerms={onAcceptTerms}
            acceptTermsLoading={acceptTermsLoading}
            onCancelDeal={onCancelDeal}
            cancelDealLoading={cancelDealLoading}
            includeChatAction={false}
          />
        </TabsContent>

        <TabsContent value="creative" className={`space-y-4 ${tabTransitionClass}`}>
          {creativeQuery.isLoading ? (
            <div className="bg-secondary/40 rounded-lg px-3 py-2">
              <Text type="caption1" color="secondary">Loading creative…</Text>
            </div>
          ) : creativeQuery.isError ? (
            <div className="bg-secondary/40 rounded-lg px-3 py-2">
              <Text type="caption1" color="secondary">Could not load creative tab</Text>
            </div>
          ) : (
            <>
              <Text type="subheadline1" weight="medium">
                Creative {creativeSubmissions.length > 0 ? `(${creativeSubmissions.length})` : ""}
              </Text>

              {creativeSubmissions.length === 0 && !showSubmitCreative ? (
                <div className="bg-secondary/40 rounded-lg px-3 py-2">
                  <Text type="caption1" color="secondary">No creative submitted yet</Text>
                </div>
              ) : null}

              {creativeSubmissions.map((submission) => (
                <CreativePreview
                  key={submission.id}
                  submission={submission}
                  role={role}
                  onApprove={handleApprove}
                  onRequestRevision={handleRequestRevision}
                  approvingLoading={approveCreativeLoading}
                  revisionLoading={requestCreativeRevisionLoading}
                />
              ))}

              {showSubmitCreative ? (
                <CreativeComposer
                  onSubmit={handleSubmitCreative}
                  isRevision={creativeStatus === "creative_revision"}
                  existingFeedback={creativeSubmissions[creativeSubmissions.length - 1]?.feedback}
                  loading={submitCreativeLoading}
                />
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="posting-plan" className={`space-y-4 ${tabTransitionClass}`}>
          {postingPlanQuery.isLoading ? (
            <div className="bg-secondary/40 rounded-lg px-3 py-2">
              <Text type="caption1" color="secondary">Loading posting plan…</Text>
            </div>
          ) : postingPlanQuery.isError ? (
            <div className="bg-secondary/40 rounded-lg px-3 py-2">
              <Text type="caption1" color="secondary">Could not load posting plan</Text>
            </div>
          ) : (
            <PostingPlanPanel
              dealId={deal.id}
              plan={postingPlanData?.postingPlan ?? { proposals: [] }}
              role={role}
              availableActions={postingPlanData?.availableActions ?? deal.availableActions}
              onUpdated={onPostingPlanUpdated}
            />
          )}
        </TabsContent>

        <TabsContent value="finance" className={`space-y-4 ${tabTransitionClass}`}>
          {financeQuery.isLoading ? (
            <div className="text-center py-6 bg-secondary/30 rounded-xl">
              <Text type="caption1" color="secondary">Loading finance data…</Text>
            </div>
          ) : financeQuery.isError ? (
            <div className="text-center py-6 bg-secondary/30 rounded-xl">
              <Text type="caption1" color="secondary">Could not load finance tab</Text>
            </div>
          ) : (
            <>
              <EscrowStatusPanel
                deal={financeDeal ?? deal}
                role={role}
                platformFeeBps={financeData?.platformFeeBps}
                platformFeePercent={financeData?.platformFeePercent}
                platformFeeAmount={financeData?.platformFeeAmount}
                publisherAmount={financeData?.publisherAmount}
                onFundDeal={onFundDeal}
                fundDealLoading={fundDealLoading}
                onVerifyPayment={onVerifyPayment}
                verifyPaymentLoading={verifyPaymentLoading}
              />

              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <Text type="subheadline1" weight="medium">Escrow Wallet</Text>
                <div className="space-y-2">
                  <div className="bg-secondary/50 rounded-lg px-3 py-2">
                    <Text type="caption2" color="secondary">Contract Address</Text>
                    <Text type="caption1" className="break-all">
                      {financeData?.escrowWallet?.contractAddress || "Not deployed yet"}
                    </Text>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (financeData?.escrowWallet?.contractAddress) {
                        void handleCopyEscrowAddress(financeData.escrowWallet.contractAddress);
                      }
                    }}
                    disabled={!financeData?.escrowWallet?.contractAddress}
                  >
                    <Copy className="w-4 h-4" />
                    Copy Address
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const address = financeData?.escrowWallet?.contractAddress;
                      if (!address) {
                        return;
                      }

                      window.open(getTonExplorerUrl(address), "_blank", "noopener,noreferrer");
                    }}
                    disabled={!financeData?.escrowWallet?.contractAddress}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Explorer
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="activity" className={`space-y-4 ${tabTransitionClass}`}>
          <ActivityTimeline activity={activityData} loading={activityQuery.isLoading} />
          <DealActions deal={deal} role={role} chatOnly includeChatAction={false} />
        </TabsContent>
      </Tabs>
    </AppSheet>
  );
}
