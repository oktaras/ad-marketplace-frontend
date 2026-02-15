import { Deal, DealStatus } from "@/types/deal";
import { formatCurrency } from "@/lib/format";
import { Text } from "@telegram-tools/ui-kit";
import { Lock, CheckCircle2, AlertCircle, Wallet, RefreshCcw } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/contexts/RoleContext";

interface EscrowStatusPanelProps {
  deal: Deal;
  role: UserRole | null;
  onFundDeal?: (dealId: string) => void;
  onVerifyPayment?: (dealId: string) => void;
  fundDealLoading?: boolean;
  verifyPaymentLoading?: boolean;
}

function getEscrowState(status: DealStatus, escrowStatus: Deal["escrowStatus"]) {
  if (escrowStatus) {
    if (escrowStatus === "RELEASED") {
      return { label: "Released", state: "released" as const, icon: "check" };
    }

    if (escrowStatus === "DISPUTED") {
      return { label: "Disputed", state: "disputed" as const, icon: "alert" };
    }

    if (escrowStatus === "REFUNDING" || escrowStatus === "REFUNDED" || escrowStatus === "PARTIAL_REFUND") {
      return { label: "Refunding", state: "refunded" as const, icon: "alert" };
    }

    if (escrowStatus === "HELD" || escrowStatus === "RELEASING" || escrowStatus === "FUNDED") {
      return { label: "Held in Escrow", state: "held" as const, icon: "lock" };
    }

    if (escrowStatus === "AWAITING_PAYMENT") {
      return { label: "Awaiting Payment", state: "pending" as const, icon: "lock" };
    }

    return { label: "Pending", state: "pending" as const, icon: "lock" };
  }

  if (status === "cancelled" || status === "expired" || status === "refunded") {
    return { label: "Cancelled", state: "refunded" as const, icon: "alert" };
  }
  if (status === "completed") {
    return { label: "Released", state: "released" as const, icon: "check" };
  }
  if (status === "creative_approved" || status === "awaiting_posting_plan" || status === "posting_plan_agreed" || status === "scheduled" || status === "posting" || status === "posted" || status === "verified") {
    return { label: "Held in Escrow", state: "held" as const, icon: "lock" };
  }
  return { label: "Pending", state: "pending" as const, icon: "lock" };
}

const escrowVariantMap = {
  released: "success",
  refunded: "warning",
  disputed: "error",
  held: "info",
  pending: "info",
} as const;

export function EscrowStatusPanel({
  deal,
  role,
  onFundDeal,
  onVerifyPayment,
  fundDealLoading = false,
  verifyPaymentLoading = false,
}: EscrowStatusPanelProps) {
  const escrow = getEscrowState(deal.status, deal.escrowStatus);
  const amount = deal.agreedPrice;
  const currency = deal.currency;
  const availableActions = deal.availableActions;

  const showFundEscrow = role === "advertiser" && Boolean(availableActions?.fundDeal) && Boolean(onFundDeal);
  const showVerifyPayment = role === "advertiser" && Boolean(availableActions?.verifyPayment) && Boolean(onVerifyPayment);

  const hasEscrowActions = showFundEscrow || showVerifyPayment;

  return (
    <div className="bg-gradient-to-br from-secondary/50 to-secondary/25 rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {escrow.icon === "lock" && <Lock className="w-4 h-4 text-primary" />}
          {escrow.icon === "check" && <CheckCircle2 className="w-4 h-4 text-primary" />}
          {escrow.icon === "alert" && <AlertCircle className="w-4 h-4 text-destructive" />}
          <Text type="caption1" weight="medium">Escrow Status</Text>
        </div>
        <StatusBadge
          label={escrow.label}
          variant={escrowVariantMap[escrow.state]}
          dot={false}
        />
      </div>

      <div className="bg-card rounded-lg px-3 py-2 border border-border">
        <Text type="caption2" color="secondary">Amount</Text>
        <Text type="subheadline1" weight="medium">{formatCurrency(amount, currency)}</Text>
      </div>

      <div>
        <Text type="caption2" color="secondary">
          {escrow.state === "held" && "Funds are securely held until delivery is confirmed."}
          {escrow.state === "released" && "Payment has been released to the publisher."}
          {escrow.state === "refunded" && "Deal was cancelled. Funds have been refunded to advertiser."}
          {escrow.state === "disputed" && "Escrow is in dispute. Resolution is pending."}
          {escrow.state === "pending" && "Funds will be held in escrow once payment is confirmed."}
        </Text>
      </div>

      {hasEscrowActions && (
        <div className="space-y-2">
          {showFundEscrow && (
            <Button className="w-full" onClick={() => onFundDeal?.(deal.id)} disabled={fundDealLoading}>
              <Wallet className="w-4 h-4" />
              Fund Escrow
            </Button>
          )}
          {showVerifyPayment && (
            <Button variant="outline" className="w-full" onClick={() => onVerifyPayment?.(deal.id)} disabled={verifyPaymentLoading}>
              <RefreshCcw className="w-4 h-4" />
              Verify Payment
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
