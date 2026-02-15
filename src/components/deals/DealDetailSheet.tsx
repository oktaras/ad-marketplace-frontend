import { Deal, DEAL_STATUS_CONFIG, type CreativeMedia, type InlineButton } from "@/types/deal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { useRole } from "@/contexts/RoleContext";
import { Text } from "@telegram-tools/ui-kit";
import { AppSheet } from "@/components/common/AppSheet";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { DealActions } from "./DealActions";
import { DealProgressRail } from "./DealProgressRail";
import { EscrowStatusPanel } from "./EscrowStatusPanel";
import { ActivityTimeline } from "./ActivityTimeline";
import { TimeoutBanner } from "./TimeoutBanner";
import { CreativeComposer } from "./CreativeComposer";
import { CreativePreview } from "./CreativePreview";
import { PostingPlanPanel } from "./PostingPlanPanel";
import { Button } from "@/components/ui/button";

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

function MilestoneTimeline({ milestones }: { milestones: Deal["milestones"] }) {
  return (
    <div className="space-y-0">
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;

        return (
          <div key={milestone.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              {milestone.status === "done" ? (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              ) : milestone.status === "active" ? (
                <Clock className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-border flex-shrink-0" />
              )}
              {!isLast ? (
                <div className={`w-0.5 flex-1 min-h-[24px] ${milestone.status === "done" ? "bg-primary" : "bg-border"}`} />
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

  if (!deal) return null;

  const statusCfg = DEAL_STATUS_CONFIG[deal.status];
  const chatStatusHint = getChatStatusHint(deal);
  const showSubmitCreative = Boolean(deal.availableActions?.submitCreative);
  const showPostingPlan = Boolean(deal.postingPlan) || [
    "creative_approved",
    "awaiting_posting_plan",
    "posting_plan_agreed",
    "scheduled",
    "awaiting_manual_post",
    "posting",
    "posted",
    "verified",
    "completed",
  ].includes(deal.status);

  const handleSubmitCreative = (data: {
    text: string;
    media: CreativeMedia[];
    inlineButtons: InlineButton[];
  }) => {
    onSubmitCreative?.(deal.id, data);
  };

  const handleApprove = () => {
    onApproveCreative?.(deal.id);
  };

  const handleRequestRevision = (feedback: string) => {
    onRequestCreativeRevision?.(deal.id, feedback);
  };

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Deal Details" fullHeight>
      <div className="space-y-5">
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl">
                {role === "advertiser" ? deal.channelAvatar : deal.advertiserAvatar}
              </div>
              <div>
                <Text type="body" weight="medium">
                  {role === "advertiser" ? deal.channelName : deal.advertiserName}
                </Text>
                <Text type="caption1" color="secondary">
                  {role === "advertiser" ? deal.channelUsername : "Advertiser"}
                </Text>
              </div>
            </div>
            <StatusBadge label={statusCfg.label} icon={statusCfg.emoji} variant={statusCfg.badgeVariant ?? "muted"} />
          </div>

          {deal.briefTitle ? (
            <div className="bg-secondary/50 rounded-lg px-3 py-2">
              <Text type="caption1" color="secondary">Brief</Text>
              <Text type="subheadline1" weight="medium">{deal.briefTitle}</Text>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-secondary/50 rounded-lg py-2">
              <Text type="caption2" color="secondary">Price</Text>
              <Text type="subheadline1" weight="medium">{formatCurrency(deal.agreedPrice, deal.currency)}</Text>
            </div>
            <div className="bg-secondary/50 rounded-lg py-2">
              <Text type="caption2" color="secondary">Format</Text>
              <Text type="subheadline1" weight="medium"><span className="capitalize">{deal.format}</span></Text>
            </div>
            <div className="bg-secondary/50 rounded-lg py-2">
              <Text type="caption2" color="secondary">Created</Text>
              <Text type="subheadline1" weight="medium">{formatDateLabel(deal.createdAt)}</Text>
            </div>
          </div>

          {chatStatusHint ? (
            <div className="bg-secondary/40 rounded-lg px-3 py-2">
              <Text type="caption1" color="secondary">{chatStatusHint}</Text>
            </div>
          ) : null}
        </div>

        <DealProgressRail deal={deal} />

        <TimeoutBanner deal={deal} />

        <EscrowStatusPanel
          deal={deal}
          role={role}
          onFundDeal={onFundDeal}
          fundDealLoading={fundDealLoading}
          onVerifyPayment={onVerifyPayment}
          verifyPaymentLoading={verifyPaymentLoading}
        />

        <div className="space-y-3">
          <Text type="subheadline1" weight="medium">Timeline</Text>
          <MilestoneTimeline milestones={deal.milestones} />
        </div>

        <div className="space-y-3">
          <Text type="subheadline1" weight="medium">
            Creative {deal.creativeSubmissions.length > 0 ? `(${deal.creativeSubmissions.length})` : ""}
          </Text>

          {deal.creativeSubmissions.length === 0 && !showSubmitCreative ? (
            <div className="text-center py-6 bg-secondary/30 rounded-xl">
              <Text type="caption1" color="secondary">No creative submitted yet</Text>
            </div>
          ) : null}

          {deal.creativeSubmissions.map((submission) => (
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
              isRevision={deal.status === "creative_revision"}
              existingFeedback={deal.creativeSubmissions[deal.creativeSubmissions.length - 1]?.feedback}
              loading={submitCreativeLoading}
            />
          ) : null}
        </div>

        {showPostingPlan ? (
          <PostingPlanPanel
            dealId={deal.id}
            plan={deal.postingPlan ?? { proposals: [] }}
            role={role}
            availableActions={deal.availableActions}
            onUpdated={onPostingPlanUpdated}
          />
        ) : null}

        <div className="space-y-2">
          <Text type="subheadline1" weight="medium">Dispute</Text>
          <div className="bg-secondary/30 rounded-xl border border-border p-3 space-y-2">
            <Text type="caption1" color="secondary">
              Dispute flow is coming soon. Current workflow remains in bot/admin path.
            </Text>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled>
                Open Dispute
              </Button>
              <Button variant="outline" className="flex-1" disabled>
                View Resolution
              </Button>
            </div>
          </div>
        </div>

        <ActivityTimeline deal={deal} />

        <DealActions
          deal={deal}
          role={role}
          onAcceptTerms={onAcceptTerms}
          acceptTermsLoading={acceptTermsLoading}
          onCancelDeal={onCancelDeal}
          cancelDealLoading={cancelDealLoading}
        />
      </div>
    </AppSheet>
  );
}
