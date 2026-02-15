import { useState } from "react";
import { Channel, CHANNEL_CATEGORIES, ChannelCategory } from "@/types/marketplace";
import { Text, Button } from "@telegram-tools/ui-kit";
import { formatNumber, formatCurrency } from "@/lib/format";
import { Users, Eye, TrendingUp, BadgeCheck, Settings, BarChart3 } from "lucide-react";

interface MyChannelCardProps {
  channel: Channel;
  onManage?: () => void;
}

export function MyChannelCard({ channel, onManage }: MyChannelCardProps) {
  const cat = CHANNEL_CATEGORIES.find((c) => c.value === channel.category);
  const categoryLabel = cat?.label ?? channel.category
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const categoryIcon = cat?.emoji;

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
          {channel.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Text type="subheadline1" weight="medium">{channel.name}</Text>
            {channel.verified && <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />}
          </div>
          <Text type="caption1" color="secondary">{channel.username}</Text>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary flex-shrink-0">
          {categoryIcon ? `${categoryIcon} ` : null}
          {categoryLabel}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox icon={<Users className="h-3.5 w-3.5" />} label="Subs" value={formatNumber(channel.subscribers)} />
        <StatBox icon={<Eye className="h-3.5 w-3.5" />} label="Avg Views" value={formatNumber(channel.avgViews)} />
        <StatBox icon={<TrendingUp className="h-3.5 w-3.5" />} label="ER" value={`${channel.er}%`} />
        <StatBox icon={<BarChart3 className="h-3.5 w-3.5" />} label="Price" value={`$${channel.pricePerPost}`} />
      </div>

      {/* Action */}
      <button
        onClick={onManage}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium transition-colors hover:bg-secondary/80"
      >
        <Settings className="h-4 w-4" />
        Manage Channel
      </button>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2 rounded-lg bg-secondary/50">
      <div className="text-muted-foreground">{icon}</div>
      <Text type="caption1" weight="bold">{value}</Text>
      <Text type="caption2" color="tertiary">{label}</Text>
    </div>
  );
}
