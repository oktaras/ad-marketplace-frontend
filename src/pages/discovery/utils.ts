import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { type DiscoveryBrief, type DiscoveryCategory, type DiscoveryChannel } from "@/shared/api/discovery";
import type { MyListingItem } from "@/shared/api/my-stuff";
import { Brief, Channel, CHANNEL_CATEGORIES } from "@/types/marketplace";
import { Listing, ListingStatus } from "@/types/listing";
import { normalizeCurrency } from "@/types/currency";
import { getTelegramChannelAvatarUrl } from "@/shared/lib/channel-avatar";

export const SEARCH_MIN_LENGTH = 3;
export const SEARCH_DEBOUNCE_MS = 300;
export const DISCOVERY_LIMIT = 10;

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}

export function useInfiniteScroll(options: {
  enabled: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}): RefObject<HTMLDivElement> {
  const { enabled, onLoadMore, rootMargin = "300px" } = options;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = sentinelRef.current;

    if (!enabled || !element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, onLoadMore, rootMargin]);

  return sentinelRef;
}

function parseAmount(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCategoryLabel(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeUsername(username: string | null | undefined): string {
  if (!username || !username.trim()) {
    return "@unknown";
  }

  const normalized = username.trim();
  return normalized.startsWith("@") ? normalized : `@${normalized}`;
}

function mapBriefFormat(types: string[] | undefined): "post" | "story" | "repost" {
  const first = (types?.[0] || "").toLowerCase();

  if (first === "story") {
    return "story";
  }

  if (first === "repost") {
    return "repost";
  }

  return "post";
}

function mapListingFormat(type: string | undefined): "post" | "story" | "repost" {
  const normalized = (type || "").toLowerCase();

  if (normalized === "story") {
    return "story";
  }

  if (normalized === "repost") {
    return "repost";
  }

  return "post";
}

function mapListingStatus(status: string | undefined): ListingStatus {
  const normalized = (status || "").toUpperCase();

  if (normalized === "DRAFT") {
    return "DRAFT";
  }

  if (normalized === "ACTIVE") {
    return "ACTIVE";
  }

  if (normalized === "SOLD_OUT") {
    return "SOLD_OUT";
  }

  if (normalized === "EXPIRED") {
    return "EXPIRED";
  }

  if (normalized === "REMOVED") {
    return "REMOVED";
  }

  return "PAUSED";
}

function mapBriefStatus(status: string | undefined): Brief["status"] {
  const normalized = (status || "").toUpperCase();

  if (normalized === "DRAFT") {
    return "DRAFT";
  }

  if (normalized === "ACTIVE") {
    return "ACTIVE";
  }

  if (normalized === "PAUSED") {
    return "PAUSED";
  }

  if (normalized === "FULFILLED") {
    return "FULFILLED";
  }

  if (normalized === "EXPIRED") {
    return "EXPIRED";
  }

  if (normalized === "CANCELLED") {
    return "CANCELLED";
  }

  return "ACTIVE";
}

function resolveBriefBudget(brief: DiscoveryBrief): number {
  return (
    parseAmount(brief.totalBudget) ||
    parseAmount(brief.budgetMax) ||
    parseAmount(brief.budgetMin) ||
    0
  );
}

export function buildCategoryMap(categories: DiscoveryCategory[]): Map<string, DiscoveryCategory> {
  return new Map(categories.map((category) => [category.slug, category]));
}

export function buildCategoryOptions(categories: DiscoveryCategory[]): DiscoveryCategory[] {
  if (categories.length > 0) {
    return categories;
  }

  return CHANNEL_CATEGORIES.map((entry) => ({
    id: entry.value,
    slug: entry.value,
    name: entry.label,
    icon: entry.emoji,
  }));
}

export function mapDiscoveryChannel(
  channel: DiscoveryChannel,
  categoryBySlug: Map<string, DiscoveryCategory>,
): Channel {
  const primaryCategory = channel.categories?.[0];
  const primarySlug = primaryCategory?.slug || "general";
  const enrichedCategory = categoryBySlug.get(primarySlug);
  const channelAvatarUrl = getTelegramChannelAvatarUrl(channel.username);
  const mainFormat = channel.formats?.[0];
  const adFormats = (channel.formats ?? [])
    .map((format) => {
      const normalizedType = String(format.type || "").toLowerCase();
      if (normalizedType !== "post" && normalizedType !== "story" && normalizedType !== "repost") {
        return null;
      }

      const type = normalizedType as "post" | "story" | "repost";

      return {
        id: format.id,
        type,
        name: format.name,
        price: parseAmount(format.priceAmount),
        currency: normalizeCurrency(format.priceCurrency),
      };
    })
    .filter((format): format is NonNullable<typeof format> => format !== null);

  return {
    id: channel.id,
    name: channel.title || "Untitled channel",
    username: normalizeUsername(channel.username),
    avatar: channelAvatarUrl || enrichedCategory?.icon || primaryCategory?.icon || "📡",
    category: primarySlug,
    subscribers: channel.stats?.subscribers ?? 0,
    avgViews: channel.stats?.avgViews ?? 0,
    er: Number(channel.stats?.engagementRate ?? 0),
    pricePerPost: parseAmount(mainFormat?.priceAmount),
    currency: normalizeCurrency(mainFormat?.priceCurrency),
    verified: Boolean(channel.isVerified),
    description: channel.description || "No description yet.",
    language: (channel.language || "EN").toUpperCase(),
    adFormats,
  };
}

export function mapDiscoveryBrief(
  brief: DiscoveryBrief,
  categoryBySlug: Map<string, DiscoveryCategory>,
): Brief {
  const primarySlug = brief.targetCategories?.[0] || "general";
  const enrichedCategory = categoryBySlug.get(primarySlug);
  const advertiserName = brief.advertiser?.firstName || brief.advertiser?.username || "Advertiser";
  const targetSubscribers = brief.minSubscribers ?? brief.maxSubscribers ?? 0;

  const normalizedStatus = mapBriefStatus(brief.status);

  return {
    id: brief.id,
    title: brief.title || "Untitled brief",
    advertiserId: brief.advertiser?.id || undefined,
    advertiserName,
    advertiserAvatar: enrichedCategory?.icon || "📢",
    category: primarySlug,
    categoryLabel: enrichedCategory?.name || formatCategoryLabel(primarySlug),
    categoryIcon: enrichedCategory?.icon || undefined,
    budget: resolveBriefBudget(brief),
    currency: normalizeCurrency(brief.currency),
    targetSubscribers,
    description: brief.description || "",
    format: mapBriefFormat(brief.adFormatTypes),
    deadline: brief.desiredEndDate || brief.createdAt || new Date().toISOString(),
    applicationsCount: brief.applicationCount ?? 0,
    status: normalizedStatus,
    createdAt: brief.createdAt || new Date().toISOString(),
  };
}

export function mapMyListing(
  listing: MyListingItem,
  categoryBySlug: Map<string, DiscoveryCategory>,
): Listing {
  const primaryCategory = listing.channel.categories?.[0];
  const primarySlug = primaryCategory?.slug || "general";
  const enrichedCategory = categoryBySlug.get(primarySlug);
  const channelAvatarUrl = getTelegramChannelAvatarUrl(listing.channel.username);
  const offerByFormat = new Map<string, MyListingItem["formatOffers"][number]>();
  (listing.formatOffers ?? []).forEach((offer) => {
    const mappedFormat = mapListingFormat(offer.adFormat?.type);
    offerByFormat.set(mappedFormat, offer);
  });

  const fallbackFormat = mapListingFormat(listing.adFormat?.type);
  const fallbackPrice = parseAmount(listing.customPrice) || parseAmount(listing.adFormat?.priceAmount);
  const fallbackCurrency = normalizeCurrency(listing.customCurrency || listing.adFormat?.priceCurrency);

  const formats = (["post", "story", "repost"] as const).map((format) => {
    const offer = offerByFormat.get(format);
    if (!offer) {
      return {
        format,
        adFormatId: undefined,
        price: fallbackFormat === format ? fallbackPrice : 0,
        currency: fallbackCurrency,
        enabled: fallbackFormat === format,
      };
    }

    const price = Number.isFinite(offer.effectivePrice)
      ? offer.effectivePrice
      : (parseAmount(offer.customPrice) || parseAmount(offer.adFormat?.priceAmount));
    const currency = normalizeCurrency(
      offer.effectiveCurrency || offer.customCurrency || offer.adFormat?.priceCurrency || fallbackCurrency,
    );

    return {
      format,
      adFormatId: offer.adFormatId,
      price,
      currency,
      enabled: Boolean(offer.enabled),
    };
  });

  const mappedStatus = mapListingStatus(listing.status);

  return {
    id: listing.id,
    channelId: listing.channel.id,
    channelName: listing.channel.title || "Untitled channel",
    channelAvatar: channelAvatarUrl || enrichedCategory?.icon || primaryCategory?.icon || "📡",
    channelUsername: normalizeUsername(listing.channel.username),
    title: listing.title || listing.adFormat?.name || "Untitled listing",
    description: listing.description || "",
    formats,
    status: mappedStatus,
    views: listing.channel.stats?.avgViews ?? 0,
    inquiries: listing.dealCount ?? 0,
    createdAt: listing.createdAt || new Date().toISOString(),
  };
}
