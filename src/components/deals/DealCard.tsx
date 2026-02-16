import { Deal, DEAL_STATUS_CONFIG } from "@/types/deal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { Text } from "@telegram-tools/ui-kit";
import { Clock } from "lucide-react";
import { getAdFormatDisplay } from "@/shared/lib/ad-format";

interface DealCardProps {
  deal: Deal;
  onSelect: (deal: Deal) => void;
}

export function DealCard({ deal, onSelect }: DealCardProps) {
  const statusCfg = DEAL_STATUS_CONFIG[deal.status];
  const briefTitle = deal.briefTitle || "Brief";
  const rawBriefDescription = (deal.briefDescription || "").trim();
  const briefDescription = rawBriefDescription.length > 0
    ? rawBriefDescription
    : "No brief description";
  const briefDescriptionPreview = briefDescription.length > 96
    ? `${briefDescription.slice(0, 96).trimEnd()}...`
    : briefDescription;

  const activeMilestone = deal.milestones.find((m) => m.status === "active");
  const completedCount = deal.milestones.filter((m) => m.status === "done").length;

  return (
    <button
      onClick={() => onSelect(deal)}
      className="w-full text-left bg-card rounded-xl border border-border p-4 space-y-3 active:scale-[0.98] transition-transform"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Text type="body" weight="medium">{briefTitle}</Text>
          <div className="mt-0.5">
            <Text type="caption1" color="secondary">{briefDescriptionPreview}</Text>
          </div>
        </div>
        <StatusBadge label={statusCfg.label} icon={statusCfg.emoji} variant={statusCfg.badgeVariant ?? "muted"} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Text type="subheadline1" weight="medium">{formatCurrency(deal.agreedPrice, deal.currency)}</Text>
          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{getAdFormatDisplay(deal.format)}</span>
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
