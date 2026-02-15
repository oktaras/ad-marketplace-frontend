import { Text } from "@telegram-tools/ui-kit";
import { Eye, TrendingUp, Users, BadgeCheck } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DiscoveryListing } from "@/shared/api/discovery";

interface ListingCardProps {
  listing: DiscoveryListing;
  onClick?: () => void;
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
  const stats = listing.channel.stats;
  const subscribers = stats?.subscribers ?? 0;
  const avgViews = stats?.avgViews ?? 0;
  const engagement = stats?.engagementRate ?? null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border p-4 transition-all active:scale-[0.98] hover:border-muted-foreground/30"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
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
        <div className="text-right flex-shrink-0">
          <Text type="subheadline2" weight="bold">
            {formatCurrency(listing.price, listing.currency)}
          </Text>
          <Text type="caption2" color="tertiary">
            from
          </Text>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption1" color="secondary">{formatNumber(subscribers)}</Text>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption1" color="secondary">{formatNumber(avgViews)}</Text>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption1" color="secondary">
            {typeof engagement === "number" ? `${Math.round(engagement * 10) / 10}%` : "—"}
          </Text>
        </div>
      </div>
    </button>
  );
}
