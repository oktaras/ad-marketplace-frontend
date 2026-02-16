import { Listing } from "@/types/listing";
import { Text } from "@telegram-tools/ui-kit";
import { Eye, MessageSquare, ChevronRight } from "lucide-react";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";

interface ListingCardProps {
  listing: Listing;
  onClick?: () => void;
}

import { StatusBadge, StatusBadgeVariant } from "@/components/common/StatusBadge";
import { LISTING_STATUS_CONFIG } from "@/shared/constants/marketplace-status";

const formatEmoji: Record<string, string> = {
  post: "📝",
  story: "📱",
  repost: "🔄",
};

export function ListingCard({ listing, onClick }: ListingCardProps) {
  const status = LISTING_STATUS_CONFIG[listing.status] ?? ({ label: listing.status, variant: "muted" as StatusBadgeVariant });
  const enabledFormats = listing.formats.filter((f) => f.enabled);
  const visibleFormats = enabledFormats.length > 0 ? enabledFormats : listing.formats;
  const lowestPrice = visibleFormats.length > 0 ? Math.min(...visibleFormats.map((f) => f.price)) : 0;
  const highestPrice = visibleFormats.length > 0 ? Math.max(...visibleFormats.map((f) => f.price)) : 0;
  const currencies = Array.from(new Set(visibleFormats.map((f) => f.currency).filter(Boolean)));
  const singleCurrency = currencies.length === 1 ? currencies[0] : null;
  const priceLabel = lowestPrice === highestPrice
    ? `${lowestPrice}${singleCurrency ? ` ${singleCurrency}` : ""}`
    : `${lowestPrice}–${highestPrice}${singleCurrency ? ` ${singleCurrency}` : ""}`;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border p-4 transition-all active:scale-[0.98] hover:border-muted-foreground/30"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
            <ChannelAvatar
              avatar={listing.channelAvatar}
              name={listing.channelName}
              className="h-full w-full text-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Text type="subheadline1" weight="medium">{listing.title}</Text>
            <Text type="caption1" color="secondary">{listing.channelUsername}</Text>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge label={status.label} variant={status.variant} dot />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Formats + pricing */}
      <div className="flex items-center gap-2 mb-2">
        {visibleFormats.map((f) => (
          <span key={f.format} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
            {formatEmoji[f.format]} {f.format.charAt(0).toUpperCase() + f.format.slice(1)}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <Text type="caption1" weight="bold" color="primary">
          {singleCurrency ? priceLabel : `${priceLabel} (mixed)`}
        </Text>
        <div className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption1" color="secondary">{listing.views} views</Text>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <Text type="caption1" color="secondary">{listing.inquiries} inquiries</Text>
        </div>
      </div>
    </button>
  );
}
