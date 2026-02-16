import { Channel } from "@/types/marketplace";
import { Text } from "@telegram-tools/ui-kit";
import { formatNumber } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";

interface ChannelSelectListProps {
  channels: Channel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Optionally disable channels that don't meet a threshold */
  disabledIds?: string[];
  /** Render extra info below the subscriber count */
  renderExtra?: (channel: Channel) => React.ReactNode;
  className?: string;
}

export function ChannelSelectList({ channels, selectedId, onSelect, disabledIds = [], renderExtra, className }: ChannelSelectListProps) {
  if (channels.length === 0) {
    return (
      <div className="p-4 bg-secondary/30 rounded-xl text-center">
        <Text type="body" color="secondary">No channels available.</Text>
        <Text type="caption2" color="tertiary">Add a channel in My Stuff first.</Text>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {channels.map((ch) => {
        const disabled = disabledIds.includes(ch.id);
        const isSelected = selectedId === ch.id;
        return (
          <button
            key={ch.id}
            disabled={disabled}
            onClick={() => onSelect(ch.id)}
            aria-selected={isSelected}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
              isSelected
                ? "border-primary bg-primary/5"
                : disabled
                ? "border-border bg-secondary/30 opacity-50 cursor-not-allowed"
                : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
              <ChannelAvatar
                avatar={ch.avatar}
                name={ch.name}
                className="h-full w-full text-lg"
              />
            </div>
            <div className="flex-1 text-left min-w-0">
              <Text type="subheadline2" weight="medium">{ch.name}</Text>
              <Text type="caption2" color="secondary">
                {formatNumber(ch.subscribers)} subscribers
                {disabled && " • Below minimum"}
              </Text>
              {renderExtra?.(ch)}
            </div>
            {isSelected && (
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
