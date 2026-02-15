import { Deal } from "@/types/deal";
import { Text } from "@telegram-tools/ui-kit";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface DealProgressRailProps {
  deal: Deal;
}

export function DealProgressRail({ deal }: DealProgressRailProps) {
  const completedCount = deal.milestones.filter((m) => m.status === "done").length;
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

      {/* Compact milestone row */}
      <div className="flex items-center gap-2 pt-1">
        {deal.milestones.map((m, i) => (
          <div
            key={m.id}
            className="flex flex-col items-center flex-1 relative"
          >
            <div className="relative z-10 flex justify-center">
              {m.status === "done" ? (
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
              ) : m.status === "active" ? (
                <Clock className="w-6 h-6 text-primary animate-pulse flex-shrink-0" />
              ) : (
                <Circle className="w-6 h-6 text-border flex-shrink-0" />
              )}
            </div>
            {/* Connector line between milestones */}
            {i < deal.milestones.length - 1 && (
              <div
                className={`absolute top-3 left-[50%] w-[calc(100%-12px)] h-0.5 ${
                  m.status === "done" ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current milestone label */}
      {deal.milestones.find((m) => m.status === "active") && (
        <div className="bg-secondary/50 rounded-lg px-3 py-2">
          <Text type="caption2" color="secondary">Current Step</Text>
          <Text type="subheadline1" weight="medium">
            {deal.milestones.find((m) => m.status === "active")?.label}
          </Text>
        </div>
      )}
    </div>
  );
}
