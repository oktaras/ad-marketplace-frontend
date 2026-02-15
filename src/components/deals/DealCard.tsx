import { Deal, DEAL_STATUS_CONFIG } from "@/types/deal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { useRole } from "@/contexts/RoleContext";
import { Text } from "@telegram-tools/ui-kit";
import { Clock } from "lucide-react";

interface DealCardProps {
  deal: Deal;
  onSelect: (deal: Deal) => void;
}

export function DealCard({ deal, onSelect }: DealCardProps) {
  const { role } = useRole();
  const statusCfg = DEAL_STATUS_CONFIG[deal.status];

  // Show counterparty info based on role
  const counterpartyName = role === "advertiser" ? deal.channelName : deal.advertiserName;
  const counterpartyAvatar = role === "advertiser" ? deal.channelAvatar : deal.advertiserAvatar;
  const counterpartyLabel = role === "advertiser" ? deal.channelUsername : deal.advertiserName;

  const activeMilestone = deal.milestones.find((m) => m.status === "active");
  const completedCount = deal.milestones.filter((m) => m.status === "done").length;

  return (
    <button
      onClick={() => onSelect(deal)}
      className="w-full text-left bg-card rounded-xl border border-border p-4 space-y-3 active:scale-[0.98] transition-transform"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl flex-shrink-0">
            {counterpartyAvatar}
          </div>
          <div className="min-w-0">
            <Text type="body" weight="medium">{counterpartyName}</Text>
            <Text type="caption1" color="secondary">{counterpartyLabel}</Text>
          </div>
        </div>
        <StatusBadge label={statusCfg.label} icon={statusCfg.emoji} variant={statusCfg.badgeVariant ?? "muted"} />
      </div>

      {/* Brief title if applicable */}
      {deal.briefTitle && (
        <div className="bg-secondary/50 rounded-lg px-3 py-1.5">
          <Text type="caption1" color="secondary">Brief: {deal.briefTitle}</Text>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Text type="subheadline1" weight="medium">{formatCurrency(deal.agreedPrice, deal.currency)}</Text>
          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{deal.format}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress dots */}
          <div className="flex items-center gap-0.5">
            {deal.milestones.map((m) => (
              <div
                key={m.id}
                className={`w-1.5 h-1.5 rounded-full ${
                  m.status === "done"
                    ? "bg-primary"
                    : m.status === "active"
                    ? "bg-primary/40"
                    : "bg-border"
                }`}
              />
            ))}
          </div>
          <Text type="caption2" color="secondary">
            {completedCount}/{deal.milestones.length}
          </Text>
        </div>
      </div>

      {/* Active milestone hint */}
      {activeMilestone && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <Clock className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
          <Text type="caption2" color="secondary">{activeMilestone.label}: {activeMilestone.description}</Text>
        </div>
      )}
    </button>
  );
}
