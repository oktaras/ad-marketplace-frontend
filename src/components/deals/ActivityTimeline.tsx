import { Deal } from "@/types/deal";
import { Text } from "@telegram-tools/ui-kit";
import { MessageCircle, CheckCircle2, AlertCircle, Send } from "lucide-react";

interface Activity {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  type: "action" | "submission" | "approval" | "warning";
}

function getActivityFromDeal(deal: Deal): Activity[] {
  const activities: Activity[] = [];

  // Add milestone completions
  deal.milestones.forEach((m) => {
    if (m.timestamp && m.status === "done") {
      activities.push({
        id: `m-${m.id}`,
        timestamp: m.timestamp,
        actor: "System",
        action: m.label,
        detail: m.description,
        type: "action",
      });
    }
  });

  // Add creative submissions
  deal.creativeSubmissions.forEach((cs) => {
    activities.push({
      id: `cs-${cs.id}`,
      timestamp: cs.submittedAt,
      actor: "Publisher",
      action: "Creative Submitted",
      detail: cs.text.substring(0, 100) + (cs.text.length > 100 ? "..." : ""),
      type: "submission",
    });

    if (cs.status === "approved") {
      activities.push({
        id: `ca-${cs.id}`,
        timestamp: cs.submittedAt,
        actor: "Advertiser",
        action: "Creative Approved",
        detail: "Post approved via @TGAdsBot",
        type: "approval",
      });
    }

    if (cs.feedback && cs.status === "revision_requested") {
      activities.push({
        id: `cfb-${cs.id}`,
        timestamp: cs.submittedAt,
        actor: "Advertiser",
        action: "Feedback Provided",
        detail: cs.feedback,
        type: "warning",
      });
    }
  });

  // Sort by timestamp descending (most recent first)
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function ActivityTimeline({ deal }: { deal: Deal }) {
  const activities = getActivityFromDeal(deal);

  return (
    <div className="space-y-3">
      <Text type="subheadline1" weight="medium">Activity</Text>

      {activities.length === 0 ? (
        <div className="text-center py-6 bg-secondary/30 rounded-xl">
          <Text type="caption1" color="secondary">No activity yet</Text>
        </div>
      ) : (
        <div className="space-y-0">
          {activities.map((activity, i) => {
            const isLast = i === activities.length - 1;
            const getIcon = () => {
              switch (activity.type) {
                case "approval":
                  return <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />;
                case "warning":
                  return <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />;
                case "submission":
                  return <Send className="w-5 h-5 text-blue-500 flex-shrink-0" />;
                default:
                  return <MessageCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />;
              }
            };

            return (
              <div key={activity.id} className="flex gap-3">
                {/* Icon + line */}
                <div className="flex flex-col items-center">
                  {getIcon()}
                  {!isLast && (
                    <div className="w-0.5 flex-1 min-h-[32px] bg-border" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-4 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Text type="caption1" weight="medium">{activity.action}</Text>
                    <span className="text-xs text-muted-foreground">by {activity.actor}</span>
                  </div>
                  <Text type="caption2" color="secondary">{activity.detail}</Text>
                  <Text type="caption2" color="tertiary">{activity.timestamp}</Text>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
