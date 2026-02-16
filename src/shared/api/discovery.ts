import { OpenAPI } from '@/shared/api/generated/core/OpenAPI';
import { request } from '@/shared/api/generated/core/request';
import { DEFAULT_CURRENCY } from '@/types/currency';

export type DiscoveryCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
};

export type DiscoveryBrief = {
  id: string;
  title: string;
  description: string;
  adFormatTypes: string[];
  targetCategories: string[];
  minSubscribers: number | null;
  maxSubscribers: number | null;
  budgetMin: string | null;
  budgetMax: string | null;
  totalBudget: string | null;
  currency: string;
  desiredEndDate: string | null;
  status?: string;
  savedChannelsCount?: number;
  createdAt: string;
  applicationCount: number;
  advertiser: {
    id: string;
    username: string | null;
    firstName: string | null;
    photoUrl: string | null;
  } | null;
};

export type DiscoveryBriefDetails = {
  id: string;
  title: string;
  description: string;
  adFormatTypes: string[];
  customFormatDescription: string | null;
  channelsLimit: number | null;
  targetCategories: string[];
  targetLanguages: string[];
  minSubscribers: number | null;
  maxSubscribers: number | null;
  budgetMin: string | null;
  budgetMax: string | null;
  totalBudget: string | null;
  currency: string;
  desiredStartDate: string | null;
  desiredEndDate: string | null;
  flexibility: string | null;
  hasCreative: boolean;
  creativeGuidelines: string | null;
  status: string;
  savedChannelsCount?: number;
  createdAt: string;
  applicationCount: number;
  advertiser: {
    id: string;
    username: string | null;
    firstName: string | null;
    photoUrl: string | null;
  } | null;
};

export type DiscoveryChannel = {
  id: string;
  title: string;
  username: string | null;
  description: string | null;
  language: string;
  isVerified: boolean;
  updatedAt?: string;
  categories: Array<{
    slug: string;
    name: string;
    icon: string | null;
  }>;
  stats: {
    subscribers: number;
    avgViews: number | null;
    engagementRate: number | null;
  } | null;
  formats: Array<{
    id: string;
    type: string;
    name: string;
    priceAmount: string;
    priceCurrency: string;
  }>;
};

export type DiscoveryChannelSortBy =
  | "subscribers_desc"
  | "subscribers_asc"
  | "price_desc"
  | "price_asc"
  | "er_desc"
  | "views_desc";

export type DiscoveryListingSortBy =
  | "created_desc"
  | "created_asc"
  | "price_desc"
  | "price_asc"
  | "subscribers_desc"
  | "subscribers_asc"
  | "views_desc"
  | "er_desc";

export type DiscoveryListing = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  price: number;
  currency: string;
  formatOffers: Array<{
    id: string;
    adFormatId: string;
    enabled: boolean;
    effectivePrice: number;
    effectiveCurrency: string;
    adFormat: {
      id: string;
      type: string;
      name: string;
      priceAmount: string;
      priceCurrency: string;
    };
  }>;
  channel: {
    id: string;
    username: string | null;
    title: string;
    stats: {
      subscribers: number;
      avgViews: number | null;
      engagementRate?: number | null;
    } | null;
    categories: Array<{
      slug: string;
      name: string;
      icon: string | null;
    }>;
    owner?: {
      id: string;
      username: string | null;
      firstName: string | null;
      photoUrl: string | null;
    } | null;
  };
  createdAt: string;
};

export type DiscoveryBriefSortBy =
  | "budget_desc"
  | "budget_asc"
  | "deadline_asc"
  | "subs_desc"
  | "created_desc";

export type DiscoveryTrendMetric = {
  change: number;
  percent: number;
  direction: 'up' | 'down' | 'stable';
};

export type DiscoveryAvailabilityMetric = {
  available: boolean;
  reason?: string;
};

export type DiscoveryChannelAnalytics = {
  source: string | null;
  sourceLabel?: string | null;
  lastUpdatedAt: string | null;
  detailedAccess?: {
    available: boolean;
    reason: string | null;
  };
  period: {
    start: string | null;
    end: string | null;
  };
  metrics: {
    subscriberCount: number | null;
    avgViewsPerPost: number | null;
    avgSharesPerPost: number | null;
    avgReactionsPerPost: number | null;
    avgViewsPerStory: number | null;
    avgSharesPerStory: number | null;
    avgReactionsPerStory: number | null;
    engagementRate: number | null;
    storyEngagementRate: number | null;
    notificationEnabledRate: number | null;
    premiumPercent: number | null;
    languageStats: Record<string, number> | null;
  };
  trending: {
    subscribers: DiscoveryTrendMetric | null;
    viewsPerPost: DiscoveryTrendMetric | null;
    sharesPerPost: DiscoveryTrendMetric | null;
    reactionsPerPost: DiscoveryTrendMetric | null;
    viewsPerStory: DiscoveryTrendMetric | null;
  };
  growth: {
    subscriberGrowth: number;
    growthPercent: number;
    avgDailyGrowth: number;
    daysTracked: number;
  } | null;
  history: Array<{
    fetchedAt: string;
    subscriberCount: number | null;
    avgViewsPerPost: number | null;
    avgReactionsPerPost: number | null;
    engagementRate: number | null;
    storyEngagementRate: number | null;
  }>;
  availability: {
    subscriberCount: DiscoveryAvailabilityMetric;
    avgViewsPerPost: DiscoveryAvailabilityMetric;
    avgReactionsPerPost: DiscoveryAvailabilityMetric;
    storyMetrics: DiscoveryAvailabilityMetric;
    engagementRate: DiscoveryAvailabilityMetric;
    notificationRate: DiscoveryAvailabilityMetric;
    premiumPercent: DiscoveryAvailabilityMetric;
    languageStats: DiscoveryAvailabilityMetric;
    subscriberGrowth30d: DiscoveryAvailabilityMetric;
  };
  timeRangeAvailability: Record<
    string,
    {
      available: boolean;
      reason?: string;
    }
  >;
};

export type DiscoveryChannelGraph = {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  isAsync: boolean;
  loadedAt: string | null;
  timestamps: number[];
  series: Array<{
    key: string;
    label: string;
    values: number[];
  }>;
  title: string | null;
  xAxisFormat: string | null;
  yAxisFormat: string | null;
  xAxisLabel?: string | null;
  yAxisLabel?: string | null;
  yUnit?: string | null;
  chartKind?: string | null;
  rawGraph?: unknown;
};

export type DiscoveryGraphsWindow = {
  start: string | null;
  end: string | null;
  days: number;
};

export type DiscoveryPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type DiscoveryPageResult<T> = {
  items: T[];
  pagination: DiscoveryPagination;
};

type BriefsResponse = {
  briefs?: DiscoveryBrief[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
};

type BriefDetailsResponse = {
  brief?: {
    id?: string;
    title?: string;
    description?: string;
    adFormatTypes?: string[];
    customFormatDescription?: string | null;
    channelsLimit?: number | null;
    targetCategories?: string[];
    targetLanguages?: string[];
    minSubscribers?: number | null;
    maxSubscribers?: number | null;
    budgetMin?: string | null;
    budgetMax?: string | null;
    totalBudget?: string | null;
    currency?: string;
    desiredStartDate?: string | null;
    desiredEndDate?: string | null;
    flexibility?: string | null;
    hasCreative?: boolean;
    creativeGuidelines?: string | null;
    status?: string;
    savedChannelsCount?: number;
    createdAt?: string;
    applicationCount?: number;
    advertiser?: {
      id?: string;
      username?: string | null;
      firstName?: string | null;
      photoUrl?: string | null;
    } | null;
    _count?: {
      applications?: number;
    };
  };
};

type ChannelsResponse = {
  channels?: DiscoveryChannel[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
};

type ListingsResponse = {
  listings?: DiscoveryListing[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
};

type CategoriesResponse = {
  categories?: Array<{
    id?: string;
    slug?: string;
    name?: string;
    icon?: string | null;
  }>;
};

export type BriefApplyPayload = {
  channelId: string;
  proposedPrice: string;
  proposedDate?: string;
  pitch?: string;
  selectedAdFormatIds?: string[];
  proposedFormatPrices?: Record<string, string>;
};

export type DiscoveryBriefApplication = {
  id: string;
  briefId: string;
  channelId: string;
  applicantId: string;
  proposedPrice: string;
  proposedDate: string | null;
  pitch: string | null;
  selectedAdFormatIds: string[];
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MyBriefApplicationSummary = {
  id: string;
  channelId: string;
  status: string;
  createdAt: string;
};

export type BriefSavedChannelItem = {
  id: string;
  briefId: string;
  channelId: string;
  advertiserId: string;
  createdAt: string;
  channel: DiscoveryChannel | null;
};

type BriefApplyResponse = {
  application?: DiscoveryBriefApplication;
};

type MyBriefApplicationsResponse = {
  applications?: MyBriefApplicationSummary[];
};

type ChannelAnalyticsResponse = {
  analytics?: DiscoveryChannelAnalytics;
};

type ChannelGraphsResponse = {
  window?: {
    start?: string | null;
    end?: string | null;
    days?: number;
  };
  graphs?: DiscoveryChannelGraph[];
};

export type ChannelGraphsPayload = {
  window: DiscoveryGraphsWindow;
  graphs: DiscoveryChannelGraph[];
};

type BriefSavedChannelsResponse = {
  savedChannels?: BriefSavedChannelItem[];
};

type SaveBriefChannelResponse = {
  savedChannel?: BriefSavedChannelItem;
  created?: boolean;
};

function normalizeSearch(search: string | undefined): string | undefined {
  if (!search) {
    return undefined;
  }

  const trimmed = search.trim();
  return trimmed.length >= 3 ? trimmed : undefined;
}

function normalizeRangeValue(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return trimmed;
}

function normalizePagination(
  raw: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  } | undefined,
  fallbackPage: number,
  fallbackLimit: number,
): DiscoveryPagination {
  const page = typeof raw?.page === 'number' ? raw.page : fallbackPage;
  const limit = typeof raw?.limit === 'number' ? raw.limit : fallbackLimit;
  const total = typeof raw?.total === 'number' ? raw.total : 0;
  const pages = typeof raw?.pages === 'number' ? raw.pages : Math.max(total > 0 ? Math.ceil(total / limit) : 1, 1);

  return { page, limit, total, pages };
}

export async function getDiscoveryCategories(): Promise<DiscoveryCategory[]> {
  const response = await request(OpenAPI, {
    method: 'GET',
    url: '/api/channels/categories',
  }) as CategoriesResponse;

  return (response.categories ?? [])
    .filter((entry): entry is Required<Pick<DiscoveryCategory, 'id' | 'slug' | 'name'>> & { icon: string | null } =>
      Boolean(entry.id && entry.slug && entry.name),
    )
    .map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      name: entry.name,
      icon: entry.icon ?? null,
    }));
}

export async function getDiscoveryBriefs(params: {
  categories?: string[];
  search?: string;
  sortBy?: DiscoveryBriefSortBy;
  budgetMin?: string;
  budgetMax?: string;
  minSubscribers?: string;
  maxSubscribers?: string;
  minApplications?: string;
  maxApplications?: string;
  page?: number;
  limit?: number;
}): Promise<DiscoveryPageResult<DiscoveryBrief>> {
  const searchQuery = normalizeSearch(params.search);
  const budgetMin = normalizeRangeValue(params.budgetMin);
  const budgetMax = normalizeRangeValue(params.budgetMax);
  const minSubscribers = normalizeRangeValue(params.minSubscribers);
  const maxSubscribers = normalizeRangeValue(params.maxSubscribers);
  const minApplications = normalizeRangeValue(params.minApplications);
  const maxApplications = normalizeRangeValue(params.maxApplications);
  const requestedPage = params.page ?? 1;
  const requestedLimit = params.limit ?? 10;

  const response = await request(OpenAPI, {
    method: 'GET',
    url: '/api/briefs',
    query: {
      page: requestedPage,
      limit: requestedLimit,
      ...(params.categories && params.categories.length > 0 ? { category: params.categories.join(',') } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(budgetMin ? { minBudget: budgetMin } : {}),
      ...(budgetMax ? { maxBudget: budgetMax } : {}),
      ...(minSubscribers ? { minSubscribers } : {}),
      ...(maxSubscribers ? { maxSubscribers } : {}),
      ...(minApplications ? { minApplications } : {}),
      ...(maxApplications ? { maxApplications } : {}),
      sortBy: params.sortBy ?? "created_desc",
    },
  }) as BriefsResponse;

  return {
    items: response.briefs ?? [],
    pagination: normalizePagination(response.pagination, requestedPage, requestedLimit),
  };
}

export async function getDiscoveryBriefDetails(id: string): Promise<DiscoveryBriefDetails> {
  const response = await request(OpenAPI, {
    method: 'GET',
    url: '/api/briefs/{id}',
    path: { id },
  }) as BriefDetailsResponse;

  const brief = response.brief;
  if (!brief?.id) {
    throw new Error('Failed to load brief details');
  }

  const applicationCount = typeof brief.applicationCount === 'number'
    ? brief.applicationCount
    : (typeof brief._count?.applications === 'number' ? brief._count.applications : 0);

  return {
    id: brief.id,
    title: brief.title ?? '',
    description: brief.description ?? '',
    adFormatTypes: Array.isArray(brief.adFormatTypes) ? brief.adFormatTypes : [],
    customFormatDescription: brief.customFormatDescription ?? null,
    channelsLimit: typeof brief.channelsLimit === 'number' ? brief.channelsLimit : null,
    targetCategories: Array.isArray(brief.targetCategories) ? brief.targetCategories : [],
    targetLanguages: Array.isArray(brief.targetLanguages) ? brief.targetLanguages : [],
    minSubscribers: typeof brief.minSubscribers === 'number' ? brief.minSubscribers : null,
    maxSubscribers: typeof brief.maxSubscribers === 'number' ? brief.maxSubscribers : null,
    budgetMin: brief.budgetMin ?? null,
    budgetMax: brief.budgetMax ?? null,
    totalBudget: brief.totalBudget ?? null,
    currency: brief.currency ?? DEFAULT_CURRENCY,
    desiredStartDate: brief.desiredStartDate ?? null,
    desiredEndDate: brief.desiredEndDate ?? null,
    flexibility: brief.flexibility ?? null,
    hasCreative: Boolean(brief.hasCreative),
    creativeGuidelines: brief.creativeGuidelines ?? null,
    status: brief.status ?? 'ACTIVE',
    savedChannelsCount: typeof brief.savedChannelsCount === "number" ? brief.savedChannelsCount : undefined,
    createdAt: brief.createdAt ?? new Date().toISOString(),
    applicationCount,
    advertiser: brief.advertiser && brief.advertiser.id
      ? {
          id: brief.advertiser.id,
          username: brief.advertiser.username ?? null,
          firstName: brief.advertiser.firstName ?? null,
          photoUrl: brief.advertiser.photoUrl ?? null,
        }
      : null,
  };
}

export async function applyToDiscoveryBrief(
  briefId: string,
  payload: BriefApplyPayload,
): Promise<DiscoveryBriefApplication> {
  const response = await request(OpenAPI, {
    method: 'POST',
    url: '/api/briefs/{id}/applications',
    path: { id: briefId },
    body: payload,
  }) as BriefApplyResponse;

  if (!response.application?.id) {
    throw new Error('Failed to submit brief application');
  }

  return response.application;
}

export async function getMyBriefApplications(briefId: string): Promise<MyBriefApplicationSummary[]> {
  const response = await request(OpenAPI, {
    method: 'GET',
    url: '/api/briefs/{id}/my-applications',
    path: { id: briefId },
  }) as MyBriefApplicationsResponse;

  return response.applications ?? [];
}

export async function getDiscoveryChannels(params: {
  categories?: string[];
  search?: string;
  sortBy?: DiscoveryChannelSortBy;
  page?: number;
  limit?: number;
}): Promise<DiscoveryPageResult<DiscoveryChannel>> {
  const searchQuery = normalizeSearch(params.search);
  const requestedPage = params.page ?? 1;
  const requestedLimit = params.limit ?? 10;

  const response = await request(OpenAPI, {
    method: 'GET',
    url: '/api/channels',
    query: {
      page: requestedPage,
      limit: requestedLimit,
      ...(params.categories && params.categories.length > 0 ? { category: params.categories.join(',') } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sortBy: params.sortBy ?? "subscribers_desc",
    },
  }) as ChannelsResponse;

  return {
    items: response.channels ?? [],
    pagination: normalizePagination(response.pagination, requestedPage, requestedLimit),
  };
}

export async function getDiscoveryListings(params: {
  categories?: string[];
  search?: string;
  sortBy?: DiscoveryListingSortBy;
  minPrice?: string;
  maxPrice?: string;
  minSubscribers?: string;
  maxSubscribers?: string;
  minViews?: string;
  maxViews?: string;
  minEngagementRate?: string;
  maxEngagementRate?: string;
  page?: number;
  limit?: number;
}): Promise<DiscoveryPageResult<DiscoveryListing>> {
  const searchQuery = normalizeSearch(params.search);
  const minPrice = normalizeRangeValue(params.minPrice);
  const maxPrice = normalizeRangeValue(params.maxPrice);
  const minSubscribers = normalizeRangeValue(params.minSubscribers);
  const maxSubscribers = normalizeRangeValue(params.maxSubscribers);
  const minViews = normalizeRangeValue(params.minViews);
  const maxViews = normalizeRangeValue(params.maxViews);
  const minEngagementRate = normalizeRangeValue(params.minEngagementRate);
  const maxEngagementRate = normalizeRangeValue(params.maxEngagementRate);
  const requestedPage = params.page ?? 1;
  const requestedLimit = params.limit ?? 10;

  const response = await request(OpenAPI, {
    method: 'GET',
    url: '/api/listings',
    query: {
      page: requestedPage,
      limit: requestedLimit,
      ...(params.categories && params.categories.length > 0 ? { category: params.categories.join(',') } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(minPrice ? { minPrice } : {}),
      ...(maxPrice ? { maxPrice } : {}),
      ...(minSubscribers ? { minSubscribers } : {}),
      ...(maxSubscribers ? { maxSubscribers } : {}),
      ...(minViews ? { minViews } : {}),
      ...(maxViews ? { maxViews } : {}),
      ...(minEngagementRate ? { minEngagementRate } : {}),
      ...(maxEngagementRate ? { maxEngagementRate } : {}),
      sortBy: params.sortBy ?? 'created_desc',
    },
  }) as ListingsResponse;

  return {
    items: response.listings ?? [],
    pagination: normalizePagination(response.pagination, requestedPage, requestedLimit),
  };
}

export async function getDiscoveryChannelAnalytics(
  channelId: string,
  days: number = 30,
): Promise<DiscoveryChannelAnalytics | null> {
  const response = await request(OpenAPI, {
    method: 'GET',
    url: '/api/channels/{id}/analytics',
    path: { id: channelId },
    query: { days },
  }) as ChannelAnalyticsResponse;

  return response.analytics ?? null;
}

export async function getDiscoveryChannelGraphs(
  channelId: string,
  range: '7d' | '30d' | '90d' = '30d',
): Promise<DiscoveryChannelGraph[]> {
  const payload = await getDiscoveryChannelGraphsPayload(channelId, range);
  return payload.graphs;
}

export async function getDiscoveryChannelGraphsPayload(
  channelId: string,
  range: '7d' | '30d' | '90d' = '30d',
): Promise<ChannelGraphsPayload> {
  const response = await request(OpenAPI, {
    method: 'GET',
    url: '/api/channels/{id}/graphs',
    path: { id: channelId },
    query: { range },
  }) as ChannelGraphsResponse;

  return {
    window: {
      start: response.window?.start ?? null,
      end: response.window?.end ?? null,
      days: typeof response.window?.days === 'number' ? response.window.days : Number.parseInt(range, 10),
    },
    graphs: response.graphs ?? [],
  };
}

export async function addChannelToBrief(briefId: string, channelId: string): Promise<BriefSavedChannelItem | null> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/briefs/{id}/saved-channels",
    path: { id: briefId },
    body: { channelId },
  }) as SaveBriefChannelResponse;

  return response.savedChannel ?? null;
}

export async function getBriefSavedChannels(briefId: string): Promise<BriefSavedChannelItem[]> {
  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/briefs/{id}/saved-channels",
    path: { id: briefId },
  }) as BriefSavedChannelsResponse;

  return response.savedChannels ?? [];
}

export async function removeChannelFromBrief(briefId: string, channelId: string): Promise<boolean> {
  const response = await request(OpenAPI, {
    method: "DELETE",
    url: "/api/briefs/{id}/saved-channels/{channelId}",
    path: { id: briefId, channelId },
  }) as { deleted?: boolean };

  return Boolean(response.deleted);
}
