import { useEffect, useMemo, useState } from "react";
import { Text } from "@telegram-tools/ui-kit";
import { Users, Eye, TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DiscoveryListing } from "@/shared/api/discovery";
import { ChannelAnalyticsPanel } from "@/components/analytics/ChannelAnalyticsPanel";
import { formatAdFormatTitle, getAdFormatDisplay, isAdFormatActive } from "@/shared/lib/ad-format";
import { useSwipeTabNavigation } from "@/hooks/use-touch-gestures";
import { useTabContentTransition } from "@/hooks/use-tab-content-transition";

interface ListingDetailSheetProps {
  listing: DiscoveryListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookListing?: (listing: DiscoveryListing, adFormatId: string, price: number, currency: string) => void;
  bookLoading?: boolean;
}

const LISTING_DETAIL_TAB_ORDER = ["main", "analytics"] as const;

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

export function ListingDetailSheet({
  listing,
  open,
  onOpenChange,
  onBookListing,
  bookLoading = false,
}: ListingDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<"main" | "analytics">("main");
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveTab("main");
  }, [open, listing?.id]);

  const formatOptions = useMemo(() => {
    const offers = listing?.formatOffers ?? [];
    const enabled = offers.filter((offer) => offer.enabled);
    return enabled.length > 0 ? enabled : offers;
  }, [listing?.formatOffers]);
  const bookableOptions = useMemo(
    () => formatOptions.filter((offer) => isAdFormatActive(offer.adFormat.type)),
    [formatOptions],
  );

  useEffect(() => {
    if (bookableOptions.length === 0) {
      setSelectedOfferId("");
      return;
    }

    if (!bookableOptions.some((offer) => offer.id === selectedOfferId)) {
      setSelectedOfferId(bookableOptions[0].id);
    }
  }, [bookableOptions, selectedOfferId]);

  const selectedOffer = useMemo(
    () => bookableOptions.find((offer) => offer.id === selectedOfferId) ?? bookableOptions[0] ?? null,
    [bookableOptions, selectedOfferId],
  );

  const handleBook = () => {
    if (!listing || !selectedOffer || !onBookListing) {
      return;
    }

    onBookListing(
      listing,
      selectedOffer.adFormatId,
      selectedOffer.effectivePrice,
      selectedOffer.effectiveCurrency,
    );
  };

  const tabSwipeHandlers = useSwipeTabNavigation({
    tabOrder: LISTING_DETAIL_TAB_ORDER,
    activeTab,
    onTabChange: (nextTab) => setActiveTab(nextTab),
    enabled: open,
  });
  const tabTransitionClass = useTabContentTransition(activeTab, LISTING_DETAIL_TAB_ORDER);

  if (!listing) {
    return null;
  }

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Listing Details" fullHeight>
      <div className="space-y-5 min-h-full" {...tabSwipeHandlers}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Text type="title3" weight="medium" className="truncate">{listing.title}</Text>
            <Text type="caption1" color="secondary">{listing.channel.title}</Text>
            <Text type="caption2" color="tertiary">
              {listing.channel.username ? `@${listing.channel.username.replace(/^@/, "")}` : "@unknown"}
            </Text>
          </div>
          {listing.channel.username ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`https://t.me/${listing.channel.username.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open
              </a>
            </Button>
          ) : null}
        </div>

        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("main")}
            aria-selected={activeTab === "main"}
            role="tab"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "main" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Main Info
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            aria-selected={activeTab === "analytics"}
            role="tab"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "analytics" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Analytics
          </button>
        </div>

        <div className={tabTransitionClass}>
          {activeTab === "main" ? (
            <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <Text type="caption2" color="tertiary">Subscribers</Text>
                <Text type="subheadline2" weight="bold">
                  {formatNumber(listing.channel.stats?.subscribers ?? 0)}
                </Text>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <Eye className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <Text type="caption2" color="tertiary">Avg Views</Text>
                <Text type="subheadline2" weight="bold">
                  {formatNumber(listing.channel.stats?.avgViews ?? 0)}
                </Text>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <Text type="caption2" color="tertiary">Engagement</Text>
                <Text type="subheadline2" weight="bold">
                  {formatPercent(listing.channel.stats?.engagementRate ?? null)}
                </Text>
              </div>
            </div>

            <div className="space-y-2">
              <Text type="subheadline2" weight="medium">Ad Options</Text>
              <div className="space-y-2 bg-secondary/30 rounded-xl p-3">
                {listing.formatOffers.map((offer) => {
                  const active = isAdFormatActive(offer.adFormat.type);
                  const title = formatAdFormatTitle(offer.adFormat.type, offer.adFormat.name);
                  const typeLabel = getAdFormatDisplay(offer.adFormat.type);
                  const showTypeLabel = title.trim().toLowerCase() !== typeLabel.trim().toLowerCase();
                  return (
                  <div
                    key={offer.id}
                    className={`flex items-center justify-between rounded-lg p-2 ${
                      offer.enabled ? "bg-card" : "bg-card/50"
                    } ${!active ? "opacity-60" : ""}`}
                  >
                    <div className="min-w-0">
                      <Text type="caption1" weight="medium">
                        {title}
                      </Text>
                      {showTypeLabel && (
                        <Text type="caption2" color="tertiary">{typeLabel}</Text>
                      )}
                    </div>
                    <Text type="caption1" weight="medium">
                      {formatCurrency(offer.effectivePrice, offer.effectiveCurrency)}
                    </Text>
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 bg-primary/5 rounded-xl border border-primary/10 p-4">
              <Text type="subheadline2" weight="medium">Book This Listing</Text>
              {formatOptions.length > 0 ? (
                <>
                  <Select value={selectedOfferId} onValueChange={setSelectedOfferId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ad option" />
                    </SelectTrigger>
                    <SelectContent>
                      {formatOptions.map((offer) => (
                        <SelectItem key={offer.id} value={offer.id} disabled={!isAdFormatActive(offer.adFormat.type)}>
                          {formatAdFormatTitle(offer.adFormat.type, offer.adFormat.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Text type="caption2" color="tertiary">
                    Only 📝 Post is active for booking right now.
                  </Text>
                  <div className="bg-card rounded-lg border border-border p-3 text-center">
                    <Text type="caption2" color="secondary">Selected Price</Text>
                    <Text type="title3" weight="bold" className="text-primary">
                      {selectedOffer
                        ? formatCurrency(selectedOffer.effectivePrice, selectedOffer.effectiveCurrency)
                        : "—"}
                    </Text>
                  </div>
                </>
              ) : (
                <Text type="caption2" color="secondary">
                  No active ad options are available for this listing.
                </Text>
              )}

              <Button
                onClick={handleBook}
                disabled={!selectedOffer || bookLoading}
                className="w-full"
              >
                {bookLoading ? "Booking..." : "Book Now"}
              </Button>
            </div>
            </div>
          ) : (
            <ChannelAnalyticsPanel
              channelId={listing.channel.id}
              viewer="advertiser"
            />
          )}
        </div>
      </div>
    </AppSheet>
  );
}
