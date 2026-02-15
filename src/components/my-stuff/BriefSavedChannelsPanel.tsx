import { Button } from "@/components/ui/button";
import { Text } from "@telegram-tools/ui-kit";
import type { BriefSavedChannelItem } from "@/shared/api/discovery";
import { Trash2, ExternalLink } from "lucide-react";

interface BriefSavedChannelsPanelProps {
  items: BriefSavedChannelItem[];
  isLoading?: boolean;
  removingChannelId?: string | null;
  onRemove?: (channelId: string) => Promise<void> | void;
}

export function BriefSavedChannelsPanel({
  items,
  isLoading = false,
  removingChannelId = null,
  onRemove,
}: BriefSavedChannelsPanelProps) {
  return (
    <div className="space-y-3">
      <Text type="subheadline2" weight="medium">Saved Channels ({items.length})</Text>

      {isLoading ? (
        <div className="p-3 rounded-xl bg-secondary/30 border border-border">
          <Text type="caption1" color="secondary">Loading saved channels…</Text>
        </div>
      ) : items.length === 0 ? (
        <div className="p-3 rounded-xl bg-secondary/30 border border-border">
          <Text type="caption1" color="secondary">No channels saved for this brief yet.</Text>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const channel = item.channel;
            const username = channel?.username?.replace(/^@+/, "") || "";
            return (
              <div key={item.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Text type="subheadline2" weight="medium">{channel?.title || "Untitled channel"}</Text>
                    <Text type="caption1" color="secondary">
                      {channel?.username ? `@${username}` : "No username"}
                    </Text>
                  </div>
                  {onRemove ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={removingChannelId === item.channelId}
                      onClick={() => void onRemove(item.channelId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <Text type="caption2" color="tertiary">
                    {(channel?.stats?.subscribers ?? 0).toLocaleString()} subs
                  </Text>
                  {username ? (
                    <a
                      href={`https://t.me/${username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Open channel
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
