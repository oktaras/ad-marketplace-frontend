import { Text } from "@telegram-tools/ui-kit";
import { Eye, TrendingUp, Users, BadgeCheck } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DiscoveryListing } from "@/shared/api/discovery";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";
import { getTelegramChannelAvatarUrl } from "@/shared/lib/channel-avatar";

interface ListingCardProps {
  listing: DiscoveryListing;
  onClick?: () => void;
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
  const stats = listing.channel.stats;
  const subscribers = stats?.subscribers ?? 0;
  const avgViews = stats?.avgViews ?? 0;
  const engagement = stats?.engagementRate ?? null;
  const channelAvatarUrl = getTelegramChannelAvatarUrl(listing.channel.username);
  const formatCount = listing.formatOffers.filter((offer) => offer.enabled).length || listing.formatOffers.length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border p-4 transition-all active:scale-[0.98] hover:border-muted-foreground/30"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-xl flex-shrink-0">
            <ChannelAvatar
              avatar={channelAvatarUrl}
              name={listing.channel.title}
              className="h-full w-full text-xl"
            />
          </div>
          <div className="min-w-0 flex-1">
            <Text type="subheadline1" weight="medium" className="truncate">
              {listing.title}
            </Text>
            <div className="flex items-center gap-1.5">
              <Text type="caption1" color="secondary" className="truncate">
                {listing.channel.title}
              </Text>
              {listing.channel.owner?.id ? (
                <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              ) : null}
            </div>
            <Text type="caption2" color="tertiary">
              {listing.channel.username ? `@${listing.channel.username.replace(/^@/, "")}` : "@unknown"}
            </Text>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <Text type="subheadline2" weight="bold">
            {formatCurrency(listing.price, listing.currency)}
          </Text>
          <Text type="caption2" color="tertiary">
            from
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <InfoBox icon={<Users className="h-3.5 w-3.5" />} label="Subs" value={formatNumber(subscribers)} />
        <InfoBox icon={<Eye className="h-3.5 w-3.5" />} label="Avg Views" value={formatNumber(avgViews)} />
        <InfoBox
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="ER"
          value={typeof engagement === "number" ? `${Math.round(engagement * 10) / 10}%` : "—"}
        />
        <InfoBox label="Formats" value={String(formatCount)} />
      </div>
    </button>
  );
}

function InfoBox({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2 rounded-lg bg-secondary/50">
      {icon ? <div className="text-muted-foreground">{icon}</div> : <div className="h-[14px]" />}
      <Text type="caption1" weight="bold">{value}</Text>
      <Text type="caption2" color="tertiary">{label}</Text>
    </div>
  );
}
