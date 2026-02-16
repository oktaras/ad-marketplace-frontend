import { OpenAPI } from "@/shared/api/generated/core/OpenAPI";
import { request } from "@/shared/api/generated/core/request";
import type {
  DiscoveryBrief,
  DiscoveryBriefSortBy,
  DiscoveryChannel,
  DiscoveryChannelSortBy,
  DiscoveryPageResult,
  DiscoveryPagination,
} from "@/shared/api/discovery";

type MyChannelsResponse = {
  channels?: DiscoveryChannel[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
};

type MyBriefsResponse = {
  briefs?: DiscoveryBrief[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
};

type BriefMutationResponse = {
  brief?: DiscoveryBrief;
};

export type CreateMyBriefPayload = {
  title: string;
  description: string;
  adFormatTypes: Array<"POST" | "STORY" | "REPOST" | "PINNED" | "OTHER">;
  targetCategories?: string[];
  targetLanguages?: string[];
  minSubscribers?: number;
  maxSubscribers?: number;
  budgetMin?: string;
  budgetMax?: string;
  totalBudget?: string;
  currency?: string;
  desiredEndDate?: string;
};

export type UpdateMyBriefPayload = {
  title?: string;
  description?: string;
  budgetMin?: string;
  budgetMax?: string;
  status?: "ACTIVE" | "PAUSED" | "CANCELLED";
};

type DeleteMyBriefResponse = {
  deleted?: boolean;
};

type DeleteMyChannelResponse = {
  deleted?: boolean;
};

export type MyBriefApplicationItem = {
  id: string;
  briefId: string;
  channelId: string;
  proposedPrice: string;
  proposedDate: string | null;
  pitch: string | null;
  status: string;
  rejectionReason: string | null;
  selectedAdFormatIds: string[];
  proposedFormatPrices: Record<string, string>;
  createdAt: string;
  channel: {
    id: string;
    username: string | null;
    title: string;
    categories: Array<{
      slug: string;
      name: string;
      icon: string | null;
    }>;
    currentStats: {
      subscriberCount: number;
    } | null;
    adFormats: Array<{
      id: string;
      type: string;
      name: string;
      priceAmount: string;
      priceCurrency: string;
    }>;
  } | null;
};

type MyBriefApplicationsResponse = {
  applications?: MyBriefApplicationItem[];
};

export type UpdateMyBriefApplicationPayload = {
  status: "ACCEPTED" | "REJECTED";
  adFormatId?: string;
  rejectionReason?: string;
};

type UpdateMyBriefApplicationResponse = {
  application?: {
    id?: string;
    status?: string;
  };
  deal?: {
    id?: string;
    dealNumber?: number;
  };
};

export type MyListingItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  customPrice: string | null;
  customCurrency: string | null;
  createdAt: string;
  channel: {
    id: string;
    username: string | null;
    title: string;
    categories: Array<{
      slug: string;
      name: string;
      icon: string | null;
    }>;
    stats: {
      subscribers: number;
      avgViews: number | null;
    } | null;
  };
  adFormat: {
    id: string;
    type: string;
    name: string;
    priceAmount: string;
    priceCurrency: string;
  };
  formatOffers: Array<{
    id: string;
    adFormatId: string;
    customPrice: string | null;
    customCurrency: string | null;
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
  dealCount: number;
};

type MyListingsResponse = {
  listings?: MyListingItem[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
};

type RefreshChannelStatsResponse = {
  message?: string;
  jobId?: string;
};

type RefreshChannelProfileResponse = {
  message?: string;
  channel?: {
    id?: string;
    username?: string | null;
    title?: string;
    description?: string | null;
    updatedAt?: string;
  };
};

type VerifyAndAddChannelResponse = {
  channel?: {
    id?: string;
  };
  message?: string;
};

type ChannelMutationResponse = {
  channel?: {
    id?: string;
  };
};

export type ChannelFormatItem = {
  id: string;
  type: "POST" | "STORY" | "REPOST" | "PINNED" | "OTHER";
  customType?: string | null;
  name: string;
  description?: string | null;
  priceAmount: string;
  priceCurrency: string;
  durationHours?: number | null;
  maxLength?: number | null;
  mediaAllowed?: string[] | null;
  isActive?: boolean;
};

type ChannelFormatsResponse = {
  formats?: ChannelFormatItem[];
};

type ChannelFormatMutationResponse = {
  format?: ChannelFormatItem;
};

export type VerifyAndAddChannelPayload = {
  channelUsername: string;
  categoryIds?: string[];
};

export type UpdateMyChannelPayload = {
  title?: string;
  language?: string;
  categoryIds?: string[];
  status?: "ACTIVE" | "PAUSED";
};

export type CreateChannelFormatPayload = {
  type: "POST" | "STORY" | "REPOST" | "PINNED" | "OTHER";
  customType?: string;
  name: string;
  description?: string;
  priceAmount: string;
  priceCurrency?: string;
  durationHours?: number;
  maxLength?: number;
  mediaAllowed?: Array<"TEXT" | "IMAGE" | "VIDEO" | "GIF" | "DOCUMENT" | "AUDIO" | "POLL">;
};

export type UpdateChannelFormatPayload = Partial<CreateChannelFormatPayload>;

export type CreateMyListingPayload = {
  channelId: string;
  adFormatId?: string;
  title: string;
  description?: string;
  customPrice?: string;
  customCurrency?: string;
  formatOffers?: Array<{
    adFormatId: string;
    customPrice?: string;
    customCurrency?: string;
    enabled?: boolean;
  }>;
  availableFrom?: string;
  availableTo?: string;
  requirements?: string;
  restrictions?: string;
};

export type UpdateMyListingPayload = {
  title?: string;
  description?: string;
  customPrice?: string | null;
  customCurrency?: string | null;
  status?: "DRAFT" | "ACTIVE" | "PAUSED" | "SOLD_OUT" | "EXPIRED" | "REMOVED";
  requirements?: string;
  restrictions?: string;
  formatOffers?: Array<{
    adFormatId: string;
    customPrice?: string | null;
    customCurrency?: string | null;
    enabled?: boolean;
  }>;
};

type ListingMutationResponse = {
  listing?: {
    id?: string;
  };
};

type DeleteListingResponse = {
  success?: boolean;
};

function normalizeSearch(search: string | undefined): string | undefined {
  if (!search) {
    return undefined;
  }

  const trimmed = search.trim();
  return trimmed.length >= 3 ? trimmed : undefined;
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
  const page = typeof raw?.page === "number" ? raw.page : fallbackPage;
  const limit = typeof raw?.limit === "number" ? raw.limit : fallbackLimit;
  const total = typeof raw?.total === "number" ? raw.total : 0;
  const pages = typeof raw?.pages === "number" ? raw.pages : Math.max(total > 0 ? Math.ceil(total / limit) : 1, 1);

  return { page, limit, total, pages };
}

export async function getMyChannels(params: {
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
    method: "GET",
    url: "/api/channels/my",
    query: {
      page: requestedPage,
      limit: requestedLimit,
      ...(params.categories && params.categories.length > 0 ? { category: params.categories.join(",") } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sortBy: params.sortBy ?? "subscribers_desc",
    },
  }) as MyChannelsResponse;

  return {
    items: response.channels ?? [],
    pagination: normalizePagination(response.pagination, requestedPage, requestedLimit),
  };
}

export async function getMyBriefs(params: {
  categories?: string[];
  search?: string;
  status?: "open" | "closed" | "all" | "ACTIVE" | "PAUSED" | "FULFILLED" | "CANCELLED" | "EXPIRED" | "DRAFT";
  sortBy?: DiscoveryBriefSortBy;
  page?: number;
  limit?: number;
}): Promise<DiscoveryPageResult<DiscoveryBrief>> {
  const searchQuery = normalizeSearch(params.search);
  const requestedPage = params.page ?? 1;
  const requestedLimit = params.limit ?? 10;

  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/briefs/my",
    query: {
      page: requestedPage,
      limit: requestedLimit,
      status: params.status ?? "all",
      ...(params.categories && params.categories.length > 0 ? { category: params.categories.join(",") } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sortBy: params.sortBy ?? "created_desc",
    },
  }) as MyBriefsResponse;

  return {
    items: response.briefs ?? [],
    pagination: normalizePagination(response.pagination, requestedPage, requestedLimit),
  };
}

export async function createMyBrief(payload: CreateMyBriefPayload): Promise<DiscoveryBrief | null> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/briefs",
    body: payload,
  }) as BriefMutationResponse;

  return response.brief ?? null;
}

export async function updateMyBrief(briefId: string, payload: UpdateMyBriefPayload): Promise<DiscoveryBrief | null> {
  const response = await request(OpenAPI, {
    method: "PUT",
    url: "/api/briefs/{id}",
    path: { id: briefId },
    body: payload,
  }) as BriefMutationResponse;

  return response.brief ?? null;
}

export async function deleteMyBrief(briefId: string): Promise<boolean> {
  const response = await request(OpenAPI, {
    method: "DELETE",
    url: "/api/briefs/{id}",
    path: { id: briefId },
  }) as DeleteMyBriefResponse;

  return Boolean(response.deleted);
}

export async function getMyBriefApplicationsForAdvertiser(briefId: string): Promise<MyBriefApplicationItem[]> {
  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/briefs/{id}/applications",
    path: { id: briefId },
  }) as MyBriefApplicationsResponse;

  return response.applications ?? [];
}

export async function updateMyBriefApplication(
  applicationId: string,
  payload: UpdateMyBriefApplicationPayload,
): Promise<UpdateMyBriefApplicationResponse> {
  const response = await request(OpenAPI, {
    method: "PUT",
    url: "/api/briefs/applications/{id}",
    path: { id: applicationId },
    body: payload,
  }) as UpdateMyBriefApplicationResponse;

  return response;
}

export async function getMyListings(params: {
  categories?: string[];
  search?: string;
  status?: "active" | "paused" | "draft" | "closed" | "all" | "ACTIVE" | "PAUSED" | "DRAFT" | "SOLD_OUT" | "EXPIRED" | "REMOVED";
  sortBy?: "created_desc" | "created_asc" | "price_desc" | "price_asc";
  page?: number;
  limit?: number;
}): Promise<DiscoveryPageResult<MyListingItem>> {
  const searchQuery = normalizeSearch(params.search);
  const requestedPage = params.page ?? 1;
  const requestedLimit = params.limit ?? 10;

  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/listings/my",
    query: {
      page: requestedPage,
      limit: requestedLimit,
      status: params.status ?? "all",
      ...(params.categories && params.categories.length > 0 ? { category: params.categories.join(",") } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sortBy: params.sortBy ?? "created_desc",
    },
  }) as MyListingsResponse;

  return {
    items: response.listings ?? [],
    pagination: normalizePagination(response.pagination, requestedPage, requestedLimit),
  };
}

export async function refreshMyChannelStats(channelId: string): Promise<RefreshChannelStatsResponse> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/channels/{id}/stats/refresh",
    path: { id: channelId },
  }) as RefreshChannelStatsResponse;

  return response;
}

export async function refreshMyChannelProfile(channelId: string): Promise<RefreshChannelProfileResponse> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/channels/{id}/profile/refresh",
    path: { id: channelId },
  }) as RefreshChannelProfileResponse;

  return response;
}

export async function verifyAndAddMyChannel(payload: VerifyAndAddChannelPayload): Promise<VerifyAndAddChannelResponse> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/channels/verify-and-add",
    body: payload,
  }) as VerifyAndAddChannelResponse;

  return response;
}

export async function updateMyChannel(channelId: string, payload: UpdateMyChannelPayload): Promise<string | null> {
  const response = await request(OpenAPI, {
    method: "PUT",
    url: "/api/channels/{id}",
    path: { id: channelId },
    body: payload,
  }) as ChannelMutationResponse;

  return response.channel?.id ?? null;
}

export async function deleteMyChannel(channelId: string): Promise<boolean> {
  const response = await request(OpenAPI, {
    method: "DELETE",
    url: "/api/channels/{id}",
    path: { id: channelId },
  }) as DeleteMyChannelResponse;

  return Boolean(response.deleted);
}

export async function getMyChannelFormats(channelId: string): Promise<ChannelFormatItem[]> {
  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/channels/{id}/formats",
    path: { id: channelId },
  }) as ChannelFormatsResponse;

  return response.formats ?? [];
}

export async function createMyChannelFormat(
  channelId: string,
  payload: CreateChannelFormatPayload,
): Promise<ChannelFormatItem | null> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/channels/{id}/formats",
    path: { id: channelId },
    body: payload,
  }) as ChannelFormatMutationResponse;

  return response.format ?? null;
}

export async function updateMyChannelFormat(
  channelId: string,
  formatId: string,
  payload: UpdateChannelFormatPayload,
): Promise<ChannelFormatItem | null> {
  const response = await request(OpenAPI, {
    method: "PUT",
    url: "/api/channels/{id}/formats/{formatId}",
    path: { id: channelId, formatId },
    body: payload,
  }) as ChannelFormatMutationResponse;

  return response.format ?? null;
}

export async function deleteMyChannelFormat(channelId: string, formatId: string): Promise<void> {
  await request(OpenAPI, {
    method: "DELETE",
    url: "/api/channels/{id}/formats/{formatId}",
    path: { id: channelId, formatId },
  });
}

export async function createMyListing(payload: CreateMyListingPayload): Promise<string | null> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/listings",
    body: payload,
  }) as ListingMutationResponse;

  return response.listing?.id ?? null;
}

export async function updateMyListing(listingId: string, payload: UpdateMyListingPayload): Promise<string | null> {
  const response = await request(OpenAPI, {
    method: "PUT",
    url: "/api/listings/{id}",
    path: { id: listingId },
    body: payload,
  }) as ListingMutationResponse;

  return response.listing?.id ?? null;
}

export async function deleteMyListing(listingId: string): Promise<boolean> {
  const response = await request(OpenAPI, {
    method: "DELETE",
    url: "/api/listings/{id}",
    path: { id: listingId },
  }) as DeleteListingResponse;

  if (!response.success) {
    throw new Error("Listing deletion was not confirmed by backend");
  }

  return true;
}
