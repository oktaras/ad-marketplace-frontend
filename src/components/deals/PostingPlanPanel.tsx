import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PostingPlan, PostingPlanProposal, DealAvailableActions } from "@/types/deal";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CalendarDays, CheckCircle2, X, Send, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/shared/api/error";
import { createPostingPlanProposal, respondPostingPlanProposal } from "@/shared/api/deals";
import { inAppToasts } from "@/shared/notifications/in-app";

interface PostingPlanPanelProps {
  dealId: string;
  plan: PostingPlan;
  role: "advertiser" | "publisher" | null;
  availableActions?: DealAvailableActions;
  onUpdated?: () => void | Promise<void>;
}

type ProposalCardProps = {
  proposal: PostingPlanProposal;
  role: "advertiser" | "publisher" | null;
  canRespond: boolean;
  loading: boolean;
  onAccept: () => void;
  onReject: () => void;
  onCounter: () => void;
};

const statusVariant = {
  pending: "info" as const,
  accepted: "success" as const,
  rejected: "error" as const,
  countered: "warning" as const,
};

function ProposalCard({ proposal, role, canRespond, loading, onAccept, onReject, onCounter }: ProposalCardProps) {
  const isMyProposal = proposal.proposedBy === role;
  const isPending = proposal.status === "pending";

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        isMyProposal ? "bg-primary/5 border-primary/20" : "bg-card border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <Text type="caption2" color="secondary">
          {isMyProposal ? "Your proposal" : `${proposal.proposedBy === "advertiser" ? "Advertiser" : "Publisher"} proposal`}
        </Text>
        <StatusBadge
          label={proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          variant={statusVariant[proposal.status]}
          dot={false}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
          <Text type="caption2" color="secondary">Method</Text>
          <Text type="caption1" weight="medium">⏰ Scheduled (AUTO)</Text>
        </div>
        <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
          <Text type="caption2" color="secondary">Date</Text>
          <Text type="caption1" weight="medium">{new Date(proposal.date).toLocaleString()}</Text>
        </div>
        <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
          <Text type="caption2" color="secondary">Guarantee</Text>
          <Text type="caption1" weight="medium">{proposal.guaranteeTerm}h</Text>
        </div>
      </div>

      {isPending && !isMyProposal && canRespond && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1" onClick={onReject} disabled={loading}>
            <X className="w-3.5 h-3.5" />
            Reject
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={onCounter} disabled={loading}>
            <RotateCcw className="w-3.5 h-3.5" />
            Counter
          </Button>
          <Button size="sm" className="flex-1" onClick={onAccept} disabled={loading}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Accept
          </Button>
        </div>
      )}

      {isPending && isMyProposal && (
        <Text type="caption2" color="secondary" className="text-center">Waiting for response…</Text>
      )}
    </div>
  );
}

function toDatetimeLocalValue(isoDate: string): string {
  const parsed = Date.parse(isoDate);
  if (!Number.isFinite(parsed)) {
    return "";
  }
  const date = new Date(parsed);
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function PostingPlanPanel({ dealId, plan, role, availableActions, onUpdated }: PostingPlanPanelProps) {
  const [showPropose, setShowPropose] = useState(false);
  const [counterForProposalId, setCounterForProposalId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [guaranteeTerm, setGuaranteeTerm] = useState(() => `${plan.guaranteeTerm ?? 48}`);

  const canPropose = Boolean(availableActions?.proposePostingPlan);
  const canRespond = Boolean(availableActions?.respondPostingPlan);
  const isAgreed = !!plan.agreedMethod;

  const refreshAfterMutation = async () => {
    if (onUpdated) {
      await onUpdated();
    }
  };

  const proposeMutation = useMutation({
    mutationFn: (payload: { scheduledAt: string; guaranteeTermHours: number }) =>
      createPostingPlanProposal(dealId, {
        method: "AUTO",
        scheduledAt: payload.scheduledAt,
        guaranteeTermHours: payload.guaranteeTermHours,
      }),
    onSuccess: async () => {
      toast(inAppToasts.postingPlan.proposalSent);
      setShowPropose(false);
      setCounterForProposalId(null);
      setDate("");
      await refreshAfterMutation();
    },
    onError: (error) => {
      toast(inAppToasts.postingPlan.proposalSendFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const respondMutation = useMutation({
    mutationFn: (payload: {
      proposalId: string;
      action: "accept" | "reject" | "counter";
      counter?: { scheduledAt: string; guaranteeTermHours: number };
    }) => {
      if (payload.action === "counter") {
        if (!payload.counter) {
          throw new Error("Counter payload is required.");
        }

        return respondPostingPlanProposal(
          dealId,
          payload.proposalId,
          {
            action: "counter",
            counter: {
              method: "AUTO",
              scheduledAt: payload.counter.scheduledAt,
              guaranteeTermHours: payload.counter.guaranteeTermHours,
            },
          },
        );
      }

      return respondPostingPlanProposal(
        dealId,
        payload.proposalId,
        { action: payload.action },
      );
    },
    onSuccess: async (_, variables) => {
      if (variables.action === "accept") {
        toast(inAppToasts.postingPlan.accepted);
      } else if (variables.action === "reject") {
        toast(inAppToasts.postingPlan.rejected);
      } else {
        toast(inAppToasts.postingPlan.countered);
        setShowPropose(false);
        setCounterForProposalId(null);
        setDate("");
      }
      await refreshAfterMutation();
    },
    onError: (error) => {
      toast(inAppToasts.postingPlan.updateFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const loading = proposeMutation.isPending || respondMutation.isPending;

  const startCounter = (proposal: PostingPlanProposal) => {
    setCounterForProposalId(proposal.id);
    setShowPropose(true);
    setDate(toDatetimeLocalValue(proposal.date));
    setGuaranteeTerm(`${proposal.guaranteeTerm}`);
  };

  const handleSubmitProposal = () => {
    if (!date) {
      return;
    }

    const guaranteeTermHours = Math.max(1, Number.parseInt(guaranteeTerm, 10) || 48);
    const scheduledAt = new Date(date).toISOString();

    if (counterForProposalId) {
      respondMutation.mutate({
        proposalId: counterForProposalId,
        action: "counter",
        counter: { scheduledAt, guaranteeTermHours },
      });
      return;
    }

    proposeMutation.mutate({ scheduledAt, guaranteeTermHours });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Text type="subheadline1" weight="medium">Posting Plan</Text>
        {isAgreed && <StatusBadge label="Agreed" variant="success" dot={false} />}
      </div>

      {isAgreed && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card rounded-lg px-2.5 py-1.5 border border-border">
              <Text type="caption2" color="secondary">Method</Text>
              <Text type="caption1" weight="medium">⏰ Scheduled (AUTO)</Text>
            </div>
            <div className="bg-card rounded-lg px-2.5 py-1.5 border border-border">
              <Text type="caption2" color="secondary">Date</Text>
              <Text type="caption1" weight="medium">
                {plan.agreedDate ? new Date(plan.agreedDate).toLocaleString() : "—"}
              </Text>
            </div>
            <div className="bg-card rounded-lg px-2.5 py-1.5 border border-border">
              <Text type="caption2" color="secondary">Guarantee</Text>
              <Text type="caption1" weight="medium">{plan.guaranteeTerm ?? "—"}h</Text>
            </div>
          </div>
        </div>
      )}

      {plan.proposals.length > 0 && (
        <div className="space-y-2">
          {plan.proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              role={role}
              canRespond={canRespond}
              loading={loading}
              onAccept={() => respondMutation.mutate({ proposalId: proposal.id, action: "accept" })}
              onReject={() => respondMutation.mutate({ proposalId: proposal.id, action: "reject" })}
              onCounter={() => startCounter(proposal)}
            />
          ))}
        </div>
      )}

      {canPropose && !isAgreed && (
        <>
          {showPropose ? (
            <div className="bg-card rounded-xl border border-border p-3 space-y-3">
              <Text type="caption1" weight="medium">
                {counterForProposalId ? "Counter Proposal" : "New Proposal"}
              </Text>

              <div className="space-y-2">
                <div>
                  <Text type="caption2" color="secondary">Date & Time</Text>
                  <Input
                    type="datetime-local"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="text-sm"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Text type="caption2" color="secondary">Guarantee Term (hours)</Text>
                  <Input
                    type="number"
                    min="1"
                    max="720"
                    value={guaranteeTerm}
                    onChange={(event) => setGuaranteeTerm(event.target.value)}
                    className="text-sm"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPropose(false);
                    setCounterForProposalId(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button size="sm" className="flex-1" onClick={handleSubmitProposal} disabled={!date || loading}>
                  <Send className="w-3.5 h-3.5" />
                  {counterForProposalId ? "Send Counter" : "Send Proposal"}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowPropose(true)}>
              <CalendarDays className="w-4 h-4" />
              Propose Posting Plan
            </Button>
          )}
        </>
      )}

      {!isAgreed && plan.proposals.length === 0 && !canPropose && (
        <div className="text-center py-4 bg-secondary/30 rounded-xl">
          <Text type="caption1" color="secondary">Posting plan becomes available after creative approval.</Text>
        </div>
      )}
    </div>
  );
}
