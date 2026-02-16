import { Deal } from "@/types/deal";
import { Text } from "@telegram-tools/ui-kit";
import { CheckCircle2, Circle } from "lucide-react";
import { isMilestoneTransitionReady } from "./milestone-visual-state";

interface DealProgressRailProps {
  deal: Deal;
}

export function DealProgressRail({ deal }: DealProgressRailProps) {
  const transitionReadyCount = deal.milestones.reduce(
    (count, _milestone, index) => count + (isMilestoneTransitionReady(deal, index) ? 1 : 0),
    0,
  );
  const completedCount = deal.milestones.filter((m) => m.status === "done").length + transitionReadyCount;
  const total = deal.milestones.length;
  const percentage = (completedCount / total) * 100;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Text type="caption1" weight="medium">Progress</Text>
          <Text type="caption2" color="secondary">{completedCount}/{total}</Text>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
