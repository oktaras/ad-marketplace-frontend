import { Brief } from "@/types/marketplace";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BriefMetaRow } from "@/components/common/BriefMetaRow";
import { Text } from "@telegram-tools/ui-kit";
import { formatCurrency } from "@/lib/format";
import { MessageSquare, Calendar, FileText, ChevronRight } from "lucide-react";
import { BRIEF_STATUS_CONFIG } from "@/shared/constants/marketplace-status";

interface MyBriefCardProps {
  brief: Brief;
  onClick?: () => void;
}

export function MyBriefCard({ brief, onClick }: MyBriefCardProps) {
  const statusConfig = BRIEF_STATUS_CONFIG[brief.status];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border p-4 transition-all active:scale-[0.98] hover:border-muted-foreground/30"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <Text type="subheadline1" weight="medium">{brief.title}</Text>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge
              label={statusConfig?.label ?? brief.status}
              variant={statusConfig?.variant ?? "muted"}
              dot
            />
            <BriefMetaRow category={brief.category} />
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      </div>

      {/* Budget and format */}
      <div className="flex items-center gap-4 mt-3">
        <div>
          <Text type="caption2" color="tertiary">Budget</Text>
          <Text type="subheadline2" weight="bold">{formatCurrency(brief.budget, brief.currency)}</Text>
        </div>
        <div>
          <Text type="caption2" color="tertiary">Format</Text>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <Text type="subheadline2">{brief.format === "post" ? "Post" : brief.format === "story" ? "Story" : "Repost"}</Text>
          </div>
        </div>
        <div>
          <Text type="caption2" color="tertiary">Applications</Text>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            <Text type="subheadline2" weight="medium">{brief.applicationsCount}</Text>
          </div>
        </div>
        <div className="ml-auto">
          <Text type="caption2" color="tertiary">Deadline</Text>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <Text type="caption1" color="secondary">
              {new Date(brief.deadline).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </Text>
          </div>
        </div>
      </div>
    </button>
  );
}
