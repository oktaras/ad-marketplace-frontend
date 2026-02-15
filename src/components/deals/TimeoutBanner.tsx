import { Deal, BackendDealStatus } from "@/types/deal";
import { Text } from "@telegram-tools/ui-kit";
import { AlertCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface TimeoutBannerProps {
  deal: Deal;
}

const TIMEOUT_MESSAGES: Partial<Record<BackendDealStatus, { owner: "advertiser" | "publisher" | "both"; text: string }>> = {
  CREATED: { owner: "both", text: "Deal is waiting for negotiation to start." },
  NEGOTIATING: { owner: "both", text: "Both parties should agree on terms." },
  TERMS_AGREED: { owner: "advertiser", text: "Initialize escrow funding." },
  AWAITING_PAYMENT: { owner: "advertiser", text: "Fund escrow to continue." },
  AWAITING_CREATIVE: { owner: "publisher", text: "Submit creative for review." },
  CREATIVE_SUBMITTED: { owner: "advertiser", text: "Review creative submission." },
  CREATIVE_REVISION: { owner: "publisher", text: "Submit revised creative." },
  AWAITING_POSTING_PLAN: { owner: "both", text: "Agree on posting plan terms." },
  AWAITING_MANUAL_POST: { owner: "publisher", text: "Post within the allowed window." },
  POSTED: { owner: "advertiser", text: "Verify delivery." },
};

function calculateTimeLeft(deadlineAt: string | null | undefined): number | null {
  if (!deadlineAt) {
    return null;
  }

  const deadline = Date.parse(deadlineAt);
  if (!Number.isFinite(deadline)) {
    return null;
  }

  const diffMs = deadline - Date.now();
  return Math.max(0, Math.floor(diffMs / 1000));
}

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return "Expired";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function TimeoutBanner({ deal }: TimeoutBannerProps) {
  const backendStatus = deal.backendStatus;
  const deadlineAt = deal.deadlines?.currentStageDeadlineAt ?? null;
  const messageTemplate = backendStatus ? TIMEOUT_MESSAGES[backendStatus] : null;
  const [timeLeft, setTimeLeft] = useState<number | null>(() => calculateTimeLeft(deadlineAt));

  useEffect(() => {
    const nextTimeLeft = calculateTimeLeft(deadlineAt);
    setTimeLeft(nextTimeLeft);

    if (nextTimeLeft === null) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(deadlineAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt]);

  if (!messageTemplate || timeLeft === null) {
    return null;
  }

  const ownerPrefix = messageTemplate.owner === "both"
    ? "Action required: "
    : messageTemplate.owner === "advertiser"
      ? "Advertiser action required: "
      : "Publisher action required: ";
  const message = `${ownerPrefix}${messageTemplate.text}`;

  const isUrgent = timeLeft < 3600;
  const isExpired = timeLeft === 0;

  return (
    <div
      className={`rounded-lg p-3 border flex items-start gap-3 ${
        isExpired
          ? "bg-destructive/10 border-destructive"
          : isUrgent
            ? "bg-warning/10 border-warning/30"
            : "bg-info/10 border-info/30"
      }`}
    >
      {isExpired ? (
        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
      ) : (
        <Clock className="w-4 h-4 text-warning flex-shrink-0 mt-0.5 animate-pulse" />
      )}

      <div className="flex-1 min-w-0">
        <Text
          type="caption1"
          weight="medium"
          className={isExpired ? "text-destructive" : isUrgent ? "text-warning" : "text-info"}
        >
          {message}
        </Text>
        <Text type="caption2" color="secondary">
          {isExpired ? "This stage is overdue." : formatTimeLeft(timeLeft)}
        </Text>
      </div>
    </div>
  );
}
