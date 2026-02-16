import { Channel } from "@/types/marketplace";
import { Text } from "@telegram-tools/ui-kit";
import { formatNumber, formatCurrency } from "@/lib/format";
import { Users, Eye, TrendingUp, BadgeCheck } from "lucide-react";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";

interface ChannelCardProps {
  channel: Channel;
  onClick?: () => void;
}

export function ChannelCard({ channel, onClick }: ChannelCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border p-4 transition-all active:scale-[0.98] hover:border-muted-foreground/30"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-xl flex-shrink-0">
          <ChannelAvatar
            avatar={channel.avatar}
            name={channel.name}
            className="h-full w-full text-xl"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Text type="subheadline1" weight="medium">{channel.name}</Text>
            {channel.verified && <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />}
          </div>
          <Text type="caption1" color="secondary">{channel.username}</Text>
        </div>
        <div className="text-right flex-shrink-0">
          <Text type="subheadline2" weight="bold">{formatCurrency(channel.pricePerPost, channel.currency)}</Text>
          <Text type="caption2" color="tertiary">per post</Text>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption1" color="secondary">{formatNumber(channel.subscribers)}</Text>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption1" color="secondary">{formatNumber(channel.avgViews)}</Text>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption1" color="secondary">{channel.er}% ER</Text>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
            {channel.language}
          </span>
        </div>
      </div>
    </button>
  );
}
