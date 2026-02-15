import { useMemo, useState } from "react";
import { Text } from "@telegram-tools/ui-kit";
import { AlertCircle, CheckCircle2, MessageCircle, Send, Settings2 } from "lucide-react";
import type { DealActivityData, DealActivityType } from "@/types/deal";
import { cn } from "@/lib/utils";

type ActivityFilter = "all" | DealActivityType;

const FILTER_OPTIONS: Array<{ id: ActivityFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "status", label: "Status" },
  { id: "creative", label: "Creative" },
  { id: "plan", label: "Plan" },
  { id: "system", label: "System" },
];

interface ActivityTimelineProps {
  activity: DealActivityData | null;
  loading?: boolean;
}

function formatTimestamp(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleString();
}

function getItemIcon(type: DealActivityType) {
  switch (type) {
    case "creative":
      return <Send className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    case "status":
      return <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />;
    case "plan":
      return <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />;
    case "system":
    default:
      return <Settings2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />;
  }
}

export function ActivityTimeline({ activity, loading = false }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const filteredItems = useMemo(
    () => {
      const items = activity?.items ?? [];
      return filter === "all" ? items : items.filter((item) => item.type === filter);
    },
    [activity?.items, filter],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Text type="subheadline1" weight="medium">Activity</Text>
        {activity && activity.disputeSummary.total > 0 ? (
          <Text type="caption2" color={activity.disputeSummary.active > 0 ? "secondary" : "tertiary"}>
            Disputes: {activity.disputeSummary.total} ({activity.disputeSummary.active} active)
          </Text>
        ) : null}
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-2 min-w-min">
          {FILTER_OPTIONS.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-secondary",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 bg-secondary/30 rounded-xl">
          <Text type="caption1" color="secondary">Loading activity…</Text>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-6 bg-secondary/30 rounded-xl">
          <Text type="caption1" color="secondary">No activity for selected filter</Text>
        </div>
      ) : (
        <div className="space-y-0">
          {filteredItems.map((item, index) => {
            const isLast = index === filteredItems.length - 1;
            return (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {getItemIcon(item.type)}
                  {!isLast ? <div className="w-0.5 flex-1 min-h-[32px] bg-border" /> : null}
                </div>
                <div className="pb-4 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Text type="caption1" weight="medium">{item.title}</Text>
                    <span className="text-xs text-muted-foreground">by {item.actor}</span>
                  </div>
                  <Text type="caption2" color="secondary">{item.detail}</Text>
                  <Text type="caption2" color="tertiary">{formatTimestamp(item.timestamp)}</Text>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activity && activity.disputeSummary.active > 0 ? (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
          <Text type="caption1" color="secondary">
            Dispute flow remains non-interactive in this page. Use bot/admin path for resolution actions.
          </Text>
        </div>
      ) : null}
    </div>
  );
}
