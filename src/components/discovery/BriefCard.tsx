import { Brief } from "@/types/marketplace";
import { Text } from "@telegram-tools/ui-kit";
import { formatCurrency, formatNumber } from "@/lib/format";
import { BriefMetaRow } from "@/components/common/BriefMetaRow";
import { Users, Calendar, MessageSquare } from "lucide-react";

interface BriefCardProps {
  brief: Brief;
  onClick?: () => void;
}

export function BriefCard({ brief, onClick }: BriefCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border p-4 transition-all active:scale-[0.98] hover:border-muted-foreground/30"
    >
      {/* Header */}
      <div className="mb-2">
        <Text type="subheadline1" weight="medium">{brief.title}</Text>
      </div>

      {/* Description */}
      <div className="mb-3">
        <Text type="footnote" color="secondary">
          {brief.description.length > 100 ? brief.description.slice(0, 100) + "…" : brief.description}
        </Text>
      </div>

      {/* Tags row */}
      <BriefMetaRow
        category={brief.category}
        categoryLabel={brief.categoryLabel}
        categoryIcon={brief.categoryIcon}
        format={brief.format}
        className="mb-3"
      />

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Text type="caption1" weight="bold" color="primary">
            {formatCurrency(brief.budget, brief.currency)}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption1" color="secondary">{formatNumber(brief.targetSubscribers)}+</Text>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption1" color="secondary">{brief.applicationsCount} applied</Text>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption2" color="tertiary">
            {new Date(brief.deadline).toLocaleDateString("en", { month: "short", day: "numeric" })}
          </Text>
        </div>
      </div>
    </button>
  );
}
