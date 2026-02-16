import { OpenAPI } from "@/shared/api/generated/core/OpenAPI";
import { request } from "@/shared/api/generated/core/request";
import type {
  BackendDealStatus,
  DealActivityData,
  DealActivityItem,
  CreativeSubmission,
  Deal,
  DealChat,
  DealChatStatus,
  DealAvailableActions,
  DealCreativeData,
  DealDeadlines,
  DealEscrowStatus,
  DealFinanceData,
  DealFinanceWallet,
  DealMilestone,
  DealStatus,
  DealStatusHistoryEntry,
  PostingPlan,
} from "@/types/deal";
import type { UserRole } from "@/contexts/RoleContext";
import { DEFAULT_CURRENCY } from "@/types/currency";
import { getTelegramChannelAvatarUrl } from "@/shared/lib/channel-avatar";

type DealsPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type DealsPageResult = {
  items: Deal[];
  pagination: DealsPagination;
  statusCounts: Record<UiDealFilter, number>;
};

type RawDealStatusCounts = Record<string, number>;

type RawPostingPlan = {
  agreedMethod?: "scheduled" | "manual";
  agreedDate?: string;
  windowHours?: number;
  guaranteeTerm?: number;
  proposals?: Array<{
    id: string;
    proposedBy: "advertiser" | "publisher";
    method: "scheduled" | "manual";
    date: string;
    windowHours?: number;
    guaranteeTerm: number;
    status: "pending" | "accepted" | "rejected" | "countered";
    createdAt: string;
  }>;
};

type RawDeal = {
  id: string;
  channelId: string;
  briefId: string | null;
  agreedPrice: string;
  currency: string;
  status: BackendDealStatus;
  workflowStatus?: BackendDealStatus | null;
  escrowStatus: DealEscrowStatus;
  statusHistory: unknown;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  scheduledTime: string | null;
  isAdvertiser: boolean;
  isPublisher: boolean;
  availableActions?: Partial<DealAvailableActions> | null;
  deadlines?: Partial<DealDeadlines> | null;
  postingPlan?: RawPostingPlan | null;
  dealChat?: {
    status?: string;
    openedByMe?: boolean;
    openedByCounterparty?: boolean;
    isOpenable?: boolean;
  } | null;
  openDealChatUrl?: string | null;
  channel: {
    id: string;
    username: string | null;
    title: string;
    categories?: Array<{
      slug: string;
      name: string;
      icon: string | null;
    }>;
  };
  advertiser: {
    id: string;
    username: string | null;
    firstName: string | null;
    photoUrl: string | null;
  };
  adFormat: {
    id: string;
    type: string;
    name: string;
    priceAmount: string;
    priceCurrency: string;
  };
  brief: {
    id: string;
    title: string;
    description?: string | null;
  } | null;
  creative?: {
    id: string;
    text: string | null;
    mediaUrls: string[];
    mediaTypes?: string[];
    mediaMeta?: Array<{
      url?: string;
      type?: string;
      name?: string;
      mimeType?: string;
      sizeBytes?: number;
      provider?: string;
      storageKey?: string;
    }>;
    buttons?: unknown;
    status: string;
    feedback: string | null;
    version: number;
    submittedAt: string | null;
    approvedAt: string | null;
    updatedAt: string;
  } | null;
};

type RawDealsResponse = {
  deals?: RawDeal[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
  statusCounts?: RawDealStatusCounts;
};

type RawDealResponse = {
  deal?: RawDeal;
};

type RawDealCreativeResponse = {
  status?: BackendDealStatus | string | null;
  workflowStatus?: BackendDealStatus | string | null;
  availableActions?: Partial<DealAvailableActions> | null;
  creative?: RawDeal["creative"] | null;
};

type RawDealFinanceResponse = {
  status?: BackendDealStatus | string | null;
  workflowStatus?: BackendDealStatus | string | null;
  availableActions?: Partial<DealAvailableActions> | null;
  finance?: {
    agreedPrice?: string | null;
    currency?: string | null;
    platformFeeBps?: number | null;
    platformFeePercent?: number | null;
    platformFeeAmount?: string | null;
    publisherAmount?: string | null;
    escrowStatus?: DealEscrowStatus;
    escrowWallet?: {
      id?: string;
      address?: string | null;
      contractAddress?: string | null;
      isDeployed?: boolean;
      cachedBalance?: string | null;
    } | null;
  } | null;
};

type RawDealActivityResponse = {
  status?: BackendDealStatus | string | null;
  workflowStatus?: BackendDealStatus | string | null;
  activity?: Array<{
    id?: string;
    timestamp?: string;
    actor?: string;
    type?: string;
    title?: string;
    detail?: string;
  }> | null;
  disputeSummary?: {
    total?: number;
    active?: number;
  } | null;
};

type RawOpenDealChatResponse = {
  ok?: boolean;
  dealId?: string;
  dealChat?: RawDeal["dealChat"];
  openDealChatUrl?: string | null;
};

type FundDealResponse = {
  escrow?: {
    address?: string;
    amount?: string;
    reserveAmount?: string;
    totalAmount?: string;
    currency?: string;
    status?: string;
  };
  transaction?: {
    to?: string;
    amountNano?: string;
    payload?: string;
    stateInit?: string;
    deepLink?: string;
  };
};

type VerifyPaymentResponse = {
  funded?: boolean;
  invalidFunding?: boolean;
  rotation?: Record<string, unknown>;
  nextFundingTransaction?: {
    to?: string;
    amountNano?: string;
    payload?: string;
    stateInit?: string;
    deepLink?: string;
  } | null;
  contractInfo?: {
    amount?: string;
    platformFee?: string;
    publisherAmount?: string;
    status?: string;
    balance?: string;
  } | null;
};

type RawPostingPlanResponse = {
  postingPlan?: RawPostingPlan;
  availableActions?: Partial<DealAvailableActions>;
};

type RawPostingPlanMutationResponse = {
  postingPlan?: RawPostingPlan;
  status?: BackendDealStatus;
};

export type UiDealFilter =
  | "negotiation"
  | "awaiting_creative"
  | "creative_review"
  | "revision_requested"
  | "approved"
  | "published"
  | "completed"
  | "cancelled"
  | "all";

export type DealListSort =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "updated_asc";

export type DealListFormat = "post" | "story" | "repost";

type UiDealFilterStatus = Exclude<UiDealFilter, "all">;

const UI_DEAL_FILTER_TO_BACKEND_STATUSES: Record<UiDealFilterStatus, BackendDealStatus[]> = {
  negotiation: ["CREATED", "NEGOTIATING", "TERMS_AGREED", "AWAITING_PAYMENT"],
  awaiting_creative: ["FUNDED", "AWAITING_CREATIVE"],
  creative_review: ["CREATIVE_SUBMITTED"],
  revision_requested: ["CREATIVE_REVISION"],
  approved: ["CREATIVE_APPROVED", "AWAITING_POSTING_PLAN", "POSTING_PLAN_AGREED", "SCHEDULED", "AWAITING_MANUAL_POST", "POSTING"],
  published: ["POSTED", "VERIFIED"],
  completed: ["COMPLETED"],
  cancelled: ["CANCELLED", "EXPIRED", "REFUNDED", "DISPUTED", "RESOLVED"],
};

const BACKEND_STATUS_SET = new Set<BackendDealStatus>([
  "CREATED",
  "NEGOTIATING",
  "TERMS_AGREED",
  "AWAITING_PAYMENT",
  "FUNDED",
  "AWAITING_CREATIVE",
  "CREATIVE_SUBMITTED",
  "CREATIVE_REVISION",
  "CREATIVE_APPROVED",
  "AWAITING_POSTING_PLAN",
  "POSTING_PLAN_AGREED",
  "SCHEDULED",
  "AWAITING_MANUAL_POST",
  "POSTING",
  "POSTED",
  "VERIFIED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
  "DISPUTED",
  "RESOLVED",
]);

const BACKEND_TO_UI_STATUS: Record<BackendDealStatus, DealStatus> = {
  CREATED: "created",
  NEGOTIATING: "negotiating",
  TERMS_AGREED: "terms_agreed",
  AWAITING_PAYMENT: "awaiting_payment",
  FUNDED: "funded",
  AWAITING_CREATIVE: "awaiting_creative",
  CREATIVE_SUBMITTED: "creative_submitted",
  CREATIVE_REVISION: "creative_revision",
  CREATIVE_APPROVED: "creative_approved",
  AWAITING_POSTING_PLAN: "awaiting_posting_plan",
  POSTING_PLAN_AGREED: "posting_plan_agreed",
  SCHEDULED: "scheduled",
  AWAITING_MANUAL_POST: "awaiting_manual_post",
  POSTING: "posting",
  POSTED: "posted",
  VERIFIED: "verified",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  REFUNDED: "refunded",
  DISPUTED: "disputed",
  RESOLVED: "resolved",
};

type MilestoneDefinition = {
  id: string;
  label: string;
  description: string;
  statuses: BackendDealStatus[];
};

const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: "created",
    label: "Deal Created",
    description: "Deal initiated between advertiser and publisher.",
    statuses: ["CREATED"],
  },
  {
    id: "terms",
    label: "Terms",
    description: "Parties negotiate and align terms.",
    statuses: ["NEGOTIATING", "TERMS_AGREED"],
  },
  {
    id: "payment",
    label: "Payment",
    description: "Advertiser funds escrow.",
    statuses: ["AWAITING_PAYMENT", "FUNDED"],
  },
  {
    id: "creative",
    label: "Creative",
    description: "Creative submitted and approved.",
    statuses: ["AWAITING_CREATIVE", "CREATIVE_SUBMITTED", "CREATIVE_REVISION", "CREATIVE_APPROVED"],
  },
  {
    id: "posting-plan",
    label: "Posting Plan",
    description: "Posting schedule is proposed and agreed.",
    statuses: ["AWAITING_POSTING_PLAN", "POSTING_PLAN_AGREED", "SCHEDULED", "AWAITING_MANUAL_POST"],
  },
  {
    id: "publication",
    label: "Publication",
    description: "Post is being delivered and published.",
    statuses: ["POSTING", "POSTED"],
  },
  {
    id: "completion",
    label: "Completion",
    description: "Delivery verified and deal completed.",
    statuses: ["VERIFIED", "COMPLETED"],
  },
];

const TERMINAL_BACKEND_STATUSES = new Set<BackendDealStatus>([
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
  "RESOLVED",
]);

const DEAL_CHAT_STATUS_SET = new Set<DealChatStatus>([
  "PENDING_OPEN",
  "ACTIVE",
  "CLOSED",
]);

const EMPTY_DEAL_ACTIONS: DealAvailableActions = {
  acceptTerms: false,
  fundDeal: false,
  verifyPayment: false,
  submitCreative: false,
  approveCreative: false,
  requestCreativeRevision: false,
  cancelDeal: false,
  proposePostingPlan: false,
  respondPostingPlan: false,
  openDispute: false,
};

function normalizePagination(
  raw: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  } | undefined,
  fallbackPage: number,
  fallbackLimit: number,
): DealsPagination {
  const page = typeof raw?.page === "number" ? raw.page : fallbackPage;
  const limit = typeof raw?.limit === "number" ? raw.limit : fallbackLimit;
  const total = typeof raw?.total === "number" ? raw.total : 0;
  const pages = typeof raw?.pages === "number" ? raw.pages : Math.max(total > 0 ? Math.ceil(total / limit) : 1, 1);

  return { page, limit, total, pages };
}

function parseAmount(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const TON_NANO_DIVISOR = 1_000_000_000;
const TON_NANO_HEURISTIC_THRESHOLD = 1_000_000;

function isTonCurrency(currency: string | null | undefined): boolean {
  return (currency || "").trim().toUpperCase() === "TON";
}

function isAlmostEqual(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return false;
  }

  const diff = Math.abs(a - b);
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return diff <= scale * 0.000001;
}

function maybeConvertTonFromNano(value: number, referenceAmount: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const threshold = Math.max(TON_NANO_HEURISTIC_THRESHOLD, Math.abs(referenceAmount) * 1000);
  if (Math.abs(value) >= threshold && Number.isInteger(value)) {
    return value / TON_NANO_DIVISOR;
  }

  return value;
}

function normalizeTonFinanceAmounts(
  agreedPrice: number,
  platformFeeAmount: number,
  publisherAmount: number,
): { agreedPrice: number; platformFeeAmount: number; publisherAmount: number } {
  if (!Number.isFinite(agreedPrice) || !Number.isFinite(platformFeeAmount) || !Number.isFinite(publisherAmount)) {
    return {
      agreedPrice,
      platformFeeAmount,
      publisherAmount,
    };
  }

  const feePlusPublisher = platformFeeAmount + publisherAmount;
  const feePlusPublisherInTon = feePlusPublisher / TON_NANO_DIVISOR;
  const agreedPriceInTon = agreedPrice / TON_NANO_DIVISOR;
  const looksLikeNanoTriplet = Number.isInteger(agreedPrice)
    && Number.isInteger(platformFeeAmount)
    && Number.isInteger(publisherAmount)
    && Math.abs(agreedPrice) >= TON_NANO_HEURISTIC_THRESHOLD;

  if (isAlmostEqual(feePlusPublisher, agreedPrice)) {
    if (looksLikeNanoTriplet) {
      return {
        agreedPrice: agreedPrice / TON_NANO_DIVISOR,
        platformFeeAmount: platformFeeAmount / TON_NANO_DIVISOR,
        publisherAmount: publisherAmount / TON_NANO_DIVISOR,
      };
    }

    return { agreedPrice, platformFeeAmount, publisherAmount };
  }

  if (isAlmostEqual(feePlusPublisherInTon, agreedPrice)) {
    return {
      agreedPrice,
      platformFeeAmount: platformFeeAmount / TON_NANO_DIVISOR,
      publisherAmount: publisherAmount / TON_NANO_DIVISOR,
    };
  }

  if (isAlmostEqual(feePlusPublisher, agreedPriceInTon)) {
    return {
      agreedPrice: agreedPriceInTon,
      platformFeeAmount,
      publisherAmount,
    };
  }

  if (isAlmostEqual(feePlusPublisherInTon, agreedPriceInTon)) {
    return {
      agreedPrice: agreedPriceInTon,
      platformFeeAmount: platformFeeAmount / TON_NANO_DIVISOR,
      publisherAmount: publisherAmount / TON_NANO_DIVISOR,
    };
  }

  return {
    agreedPrice,
    platformFeeAmount: maybeConvertTonFromNano(platformFeeAmount, agreedPrice),
    publisherAmount: maybeConvertTonFromNano(publisherAmount, agreedPrice),
  };
}

function formatDateTimeLabel(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }

  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeChannelUsername(username: string | null | undefined): string {
  if (!username) {
    return "@unknown";
  }

  return username.startsWith("@") ? username : `@${username}`;
}

function toUiDealStatus(status: BackendDealStatus): DealStatus {
  return BACKEND_TO_UI_STATUS[status];
}

function normalizeBackendDealStatus(
  value: unknown,
  fallback: BackendDealStatus = "CREATED",
): BackendDealStatus {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.toUpperCase();
  if (!BACKEND_STATUS_SET.has(normalized as BackendDealStatus)) {
    return fallback;
  }

  return normalized as BackendDealStatus;
}

function parseStatusHistory(raw: unknown): DealStatusHistoryEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const parsed = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const item = entry as {
        status?: unknown;
        timestamp?: unknown;
        actor?: unknown;
      };

      if (typeof item.status !== "string" || typeof item.timestamp !== "string") {
        return null;
      }

      const normalizedStatus = item.status.toUpperCase();
      if (!BACKEND_STATUS_SET.has(normalizedStatus as BackendDealStatus)) {
        return null;
      }

      const actor = typeof item.actor === "string" ? item.actor : undefined;
      return {
        status: normalizedStatus as BackendDealStatus,
        timestamp: item.timestamp,
        ...(actor ? { actor } : {}),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return parsed.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

function getStageIndexForStatus(status: BackendDealStatus): number {
  const milestoneIndex = MILESTONE_DEFINITIONS.findIndex((milestone) => milestone.statuses.includes(status));
  return milestoneIndex >= 0 ? milestoneIndex : 0;
}

function getMilestoneTimestamp(
  history: DealStatusHistoryEntry[],
  statuses: BackendDealStatus[],
): string | null {
  const match = history.find((entry) => statuses.includes(entry.status));
  return formatDateTimeLabel(match?.timestamp);
}

function buildMilestones(
  backendStatus: BackendDealStatus,
  history: DealStatusHistoryEntry[],
): DealMilestone[] {
  const nonTerminalHistory = [...history].reverse().find((entry) => !TERMINAL_BACKEND_STATUSES.has(entry.status));
  const fallbackIndex = nonTerminalHistory ? getStageIndexForStatus(nonTerminalHistory.status) : 0;
  const currentIndex =
    backendStatus === "COMPLETED"
      ? MILESTONE_DEFINITIONS.length - 1
      : TERMINAL_BACKEND_STATUSES.has(backendStatus)
        ? fallbackIndex
        : getStageIndexForStatus(backendStatus);
  const hasActiveStage = !TERMINAL_BACKEND_STATUSES.has(backendStatus) && backendStatus !== "COMPLETED";

  return MILESTONE_DEFINITIONS.map((milestone, index) => {
    let status: DealMilestone["status"] = "upcoming";

    if (backendStatus === "COMPLETED") {
      status = "done";
    } else if (index < currentIndex) {
      status = "done";
    } else if (index === currentIndex && hasActiveStage) {
      status = "active";
    }

    return {
      id: milestone.id,
      label: milestone.label,
      description: milestone.description,
      timestamp: status === "done" ? getMilestoneTimestamp(history, milestone.statuses) : null,
      status,
    };
  });
}

function normalizeCreativeMediaType(
  value: string | undefined,
  url: string,
  index: number,
  explicitName?: string,
): { type: "image" | "video"; name: string } {
  const normalized = (value || "").toUpperCase();
  const basename = url.split("?")[0]?.split("/").pop()?.trim();
  const fallbackName = explicitName?.trim()
    || (basename && basename.length > 0 ? basename : `media-${index + 1}`);

  if (normalized === "VIDEO") {
    return { type: "video", name: fallbackName };
  }

  return { type: "image", name: fallbackName };
}

function normalizeCreativeMediaUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (!isLocalHost || typeof window === "undefined") {
      return url;
    }

    return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

function parseCreativeButtons(rawButtons: unknown): Array<{ label: string; url: string }> {
  if (!Array.isArray(rawButtons)) {
    return [];
  }

  return rawButtons
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const candidate = entry as { text?: unknown; label?: unknown; url?: unknown };
      const url = typeof candidate.url === "string" ? candidate.url.trim() : "";
      const labelRaw = typeof candidate.label === "string" ? candidate.label : typeof candidate.text === "string" ? candidate.text : "";
      const label = labelRaw.trim();
      if (!url || !label) {
        return null;
      }

      return { label, url };
    })
    .filter((entry): entry is { label: string; url: string } => entry !== null);
}

function mapCreativeSubmission(rawCreative: RawDeal["creative"] | null | undefined): CreativeSubmission[] {
  if (!rawCreative) {
    return [];
  }

  const creativeStatus = rawCreative.status.toUpperCase();
  const status: CreativeSubmission["status"] =
    creativeStatus === "APPROVED" || creativeStatus === "POSTED"
      ? "approved"
      : creativeStatus === "REVISION_REQUESTED"
        ? "revision_requested"
        : "pending";

  const mediaUrls = Array.isArray(rawCreative.mediaUrls) ? rawCreative.mediaUrls : [];
  const mediaTypes = Array.isArray(rawCreative.mediaTypes) ? rawCreative.mediaTypes : [];
  const mediaMeta = Array.isArray(rawCreative.mediaMeta) ? rawCreative.mediaMeta : [];
  const media = mediaMeta.length > 0
    ? mediaMeta
      .map((entry, index) => {
        const rawUrl = typeof entry?.url === "string" ? entry.url.trim() : "";
        const url = normalizeCreativeMediaUrl(rawUrl);
        if (!url) {
          return null;
        }

        const normalized = normalizeCreativeMediaType(
          typeof entry?.type === "string" ? entry.type : mediaTypes[index],
          url,
          index,
          typeof entry?.name === "string" ? entry.name : undefined,
        );

        return {
          id: `${rawCreative.id}-${index}`,
          type: normalized.type,
          url,
          name: normalized.name,
          mimeType: typeof entry?.mimeType === "string" ? entry.mimeType : undefined,
          sizeBytes: typeof entry?.sizeBytes === "number" ? entry.sizeBytes : undefined,
          provider: typeof entry?.provider === "string" ? entry.provider : undefined,
          storageKey: typeof entry?.storageKey === "string" ? entry.storageKey : undefined,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : mediaUrls.map((rawUrl, index) => {
      const url = normalizeCreativeMediaUrl(rawUrl);
      const normalized = normalizeCreativeMediaType(mediaTypes[index], url, index);
      return {
        id: `${rawCreative.id}-${index}`,
        type: normalized.type,
        url,
        name: normalized.name,
      };
    });

  return [
    {
      id: rawCreative.id,
      submittedAt: formatDateTimeLabel(rawCreative.submittedAt || rawCreative.updatedAt) || "Unknown time",
      text: rawCreative.text || "",
      mediaUrl: media[0]?.url || normalizeCreativeMediaUrl(mediaUrls[0] || ""),
      media,
      inlineButtons: parseCreativeButtons(rawCreative.buttons),
      feedback: rawCreative.feedback || undefined,
      status,
    },
  ];
}

function normalizeAdFormat(type: string): "post" | "story" | "repost" {
  const normalized = type.toLowerCase();
  if (normalized === "story") {
    return "story";
  }
  if (normalized === "repost") {
    return "repost";
  }
  return "post";
}

function mapDealActions(raw: Partial<DealAvailableActions> | null | undefined): DealAvailableActions {
  if (!raw || typeof raw !== "object") {
    return EMPTY_DEAL_ACTIONS;
  }

  return {
    acceptTerms: Boolean(raw.acceptTerms),
    fundDeal: Boolean(raw.fundDeal),
    verifyPayment: Boolean(raw.verifyPayment),
    submitCreative: Boolean(raw.submitCreative),
    approveCreative: Boolean(raw.approveCreative),
    requestCreativeRevision: Boolean(raw.requestCreativeRevision),
    cancelDeal: Boolean(raw.cancelDeal),
    proposePostingPlan: Boolean(raw.proposePostingPlan),
    respondPostingPlan: Boolean(raw.respondPostingPlan),
    openDispute: Boolean(raw.openDispute),
  };
}

function mapDealDeadlines(raw: Partial<DealDeadlines> | null | undefined): DealDeadlines | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  return {
    currentStageDeadlineAt: typeof raw.currentStageDeadlineAt === "string" ? raw.currentStageDeadlineAt : null,
    currentStageTimeoutHours: typeof raw.currentStageTimeoutHours === "number" ? raw.currentStageTimeoutHours : null,
    stageStartedAt: typeof raw.stageStartedAt === "string" ? raw.stageStartedAt : null,
  };
}

function mapPostingPlan(raw: RawPostingPlan | null | undefined): PostingPlan | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  return {
    agreedMethod: raw.agreedMethod,
    agreedDate: raw.agreedDate,
    windowHours: raw.windowHours,
    guaranteeTerm: raw.guaranteeTerm,
    proposals: Array.isArray(raw.proposals) ? raw.proposals : [],
  };
}

function mapDealChat(
  raw: RawDeal["dealChat"] | undefined,
  backendStatus: BackendDealStatus,
): DealChat {
  const fallbackStatus: DealChatStatus = TERMINAL_BACKEND_STATUSES.has(backendStatus)
    ? "CLOSED"
    : "PENDING_OPEN";
  const rawStatus = typeof raw?.status === "string" ? raw.status.toUpperCase() : "";
  const status = DEAL_CHAT_STATUS_SET.has(rawStatus as DealChatStatus)
    ? (rawStatus as DealChatStatus)
    : fallbackStatus;

  return {
    status,
    openedByMe: Boolean(raw?.openedByMe),
    openedByCounterparty: Boolean(raw?.openedByCounterparty),
    isOpenable: typeof raw?.isOpenable === "boolean"
      ? raw.isOpenable
      : status !== "CLOSED",
  };
}

function mapDeal(raw: RawDeal): Deal {
  const history = parseStatusHistory(raw.statusHistory);
  const backendStatus = normalizeBackendDealStatus(raw.workflowStatus || raw.status, raw.status);
  const categories = Array.isArray(raw.channel.categories) ? raw.channel.categories : [];
  const primaryCategory = categories[0];
  const channelAvatarUrl = getTelegramChannelAvatarUrl(raw.channel.username);
  const advertiserName = raw.isPublisher
    ? "Advertiser"
    : (raw.advertiser.firstName || raw.advertiser.username || "Advertiser");

  return {
    id: raw.id,
    briefId: raw.brief?.id || raw.briefId || undefined,
    briefTitle: raw.brief?.title || undefined,
    briefDescription: raw.brief?.description || undefined,
    channelId: raw.channelId,
    channelName: raw.channel.title || "Untitled channel",
    channelAvatar: channelAvatarUrl || primaryCategory?.icon || "📡",
    channelUsername: normalizeChannelUsername(raw.channel.username),
    advertiserName,
    advertiserAvatar: "👤",
    agreedPrice: parseAmount(raw.agreedPrice),
    currency: raw.currency || DEFAULT_CURRENCY,
    format: normalizeAdFormat(raw.adFormat.type),
    status: toUiDealStatus(backendStatus),
    workflowStatus: backendStatus,
    backendStatus,
    escrowStatus: raw.escrowStatus,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    expiresAt: raw.expiresAt,
    completedAt: raw.completedAt,
    publishDate: raw.scheduledTime || undefined,
    isAdvertiser: raw.isAdvertiser,
    isPublisher: raw.isPublisher,
    statusHistory: history,
    milestones: buildMilestones(backendStatus, history),
    creativeSubmissions: mapCreativeSubmission(raw.creative),
    postingPlan: mapPostingPlan(raw.postingPlan),
    availableActions: mapDealActions(raw.availableActions),
    deadlines: mapDealDeadlines(raw.deadlines),
    dealChat: mapDealChat(raw.dealChat, backendStatus),
    openDealChatUrl: typeof raw.openDealChatUrl === "string" ? raw.openDealChatUrl : null,
  };
}

function mapDealCreativeData(raw: RawDealCreativeResponse): DealCreativeData {
  const backendStatus = normalizeBackendDealStatus(raw.workflowStatus || raw.status);

  return {
    backendStatus,
    status: toUiDealStatus(backendStatus),
    creativeSubmissions: mapCreativeSubmission(raw.creative),
    availableActions: mapDealActions(raw.availableActions),
  };
}

function mapFinanceWallet(raw: unknown): DealFinanceWallet | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as {
    id?: unknown;
    address?: unknown;
    contractAddress?: unknown;
    isDeployed?: unknown;
    cachedBalance?: unknown;
  };

  if (typeof candidate.id !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    address: typeof candidate.address === "string" ? candidate.address : null,
    contractAddress: typeof candidate.contractAddress === "string" ? candidate.contractAddress : null,
    isDeployed: Boolean(candidate.isDeployed),
    cachedBalance: typeof candidate.cachedBalance === "string" ? candidate.cachedBalance : null,
  };
}

function mapDealFinanceData(raw: RawDealFinanceResponse): DealFinanceData {
  const backendStatus = normalizeBackendDealStatus(raw.workflowStatus || raw.status);
  const finance = raw.finance && typeof raw.finance === "object" ? raw.finance : null;
  const currency = typeof finance?.currency === "string" && finance.currency.trim() ? finance.currency : DEFAULT_CURRENCY;
  const agreedPrice = parseAmount(finance?.agreedPrice);
  const platformFeeAmount = parseAmount(finance?.platformFeeAmount);
  const publisherAmount = parseAmount(finance?.publisherAmount);
  const normalizedAmounts = isTonCurrency(currency)
    ? normalizeTonFinanceAmounts(agreedPrice, platformFeeAmount, publisherAmount)
    : {
      agreedPrice,
      platformFeeAmount,
      publisherAmount,
    };

  return {
    backendStatus,
    status: toUiDealStatus(backendStatus),
    agreedPrice: normalizedAmounts.agreedPrice,
    currency,
    platformFeeBps: typeof finance?.platformFeeBps === "number" ? finance.platformFeeBps : undefined,
    platformFeePercent: typeof finance?.platformFeePercent === "number" ? finance.platformFeePercent : undefined,
    platformFeeAmount: normalizedAmounts.platformFeeAmount,
    publisherAmount: normalizedAmounts.publisherAmount,
    escrowStatus: finance?.escrowStatus,
    escrowWallet: mapFinanceWallet(finance?.escrowWallet),
    availableActions: mapDealActions(raw.availableActions),
  };
}

function mapDealActivityData(raw: RawDealActivityResponse): DealActivityData {
  const backendStatus = normalizeBackendDealStatus(raw.workflowStatus || raw.status);
  const normalizeActorLabel = (actor: unknown): string => {
    if (typeof actor !== "string") {
      return "System";
    }

    const value = actor.trim();
    if (!value) {
      return "System";
    }

    const upper = value.toUpperCase();
    if (upper === "SYSTEM") {
      return "System";
    }

    if (upper === "ADVERTISER") {
      return "Advertiser";
    }

    if (upper === "PUBLISHER" || upper === "CHANNEL_OWNER") {
      return "Publisher";
    }

    if (value === "Advertiser" || value === "Publisher" || value === "System" || value === "Participant") {
      return value;
    }

    return "Participant";
  };
  const items: DealActivityItem[] = Array.isArray(raw.activity)
    ? raw.activity
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const typeRaw = typeof entry.type === "string" ? entry.type.toLowerCase() : "";
        const type: DealActivityItem["type"] =
          typeRaw === "status" || typeRaw === "creative" || typeRaw === "plan" || typeRaw === "system"
            ? typeRaw
            : "system";
        const timestamp = typeof entry.timestamp === "string" && Number.isFinite(Date.parse(entry.timestamp))
          ? entry.timestamp
          : null;
        if (!timestamp) {
          return null;
        }

        const id = typeof entry.id === "string" && entry.id.trim() ? entry.id : `activity-${index}-${timestamp}`;
        const actor = normalizeActorLabel(entry.actor);
        const title = typeof entry.title === "string" && entry.title.trim() ? entry.title : "Activity";
        const detail = typeof entry.detail === "string" ? entry.detail : "";

        return {
          id,
          timestamp,
          actor,
          type,
          title,
          detail,
        };
      })
      .filter((entry): entry is DealActivityItem => entry !== null)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    : [];

  return {
    backendStatus,
    status: toUiDealStatus(backendStatus),
    items,
    disputeSummary: {
      total: typeof raw.disputeSummary?.total === "number" ? raw.disputeSummary.total : 0,
      active: typeof raw.disputeSummary?.active === "number" ? raw.disputeSummary.active : 0,
    },
  };
}

function mapUiStatusCounts(raw: RawDealStatusCounts | undefined): Record<UiDealFilter, number> {
  const safeRaw = raw ?? {};
  const counts = (Object.keys(UI_DEAL_FILTER_TO_BACKEND_STATUSES) as UiDealFilterStatus[]).reduce((acc, key) => {
    const totalForStatus = UI_DEAL_FILTER_TO_BACKEND_STATUSES[key]
      .reduce((sum, backendStatus) => sum + (safeRaw[backendStatus] ?? 0), 0);
    acc[key] = totalForStatus;
    return acc;
  }, {} as Record<UiDealFilterStatus, number>);

  const all = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return { ...counts, all };
}

function normalizeRole(role: UserRole | null | undefined): "advertiser" | "publisher" | undefined {
  if (role === "advertiser" || role === "publisher") {
    return role;
  }

  return undefined;
}

function normalizeStatusFilter(statusFilter: UiDealFilter): string | undefined {
  if (statusFilter === "all") {
    return undefined;
  }

  const mapped = UI_DEAL_FILTER_TO_BACKEND_STATUSES[statusFilter];
  if (!mapped || mapped.length === 0) {
    return undefined;
  }

  return mapped.join(",");
}

function normalizeEscrowStatuses(statuses: DealEscrowStatus[] | undefined): string | undefined {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return undefined;
  }

  const normalized = Array.from(new Set(
    statuses
      .map((entry) => String(entry || "").trim().toUpperCase())
      .filter((entry) => entry.length > 0),
  ));

  if (normalized.length === 0) {
    return undefined;
  }

  return normalized.join(",");
}

function normalizeAdFormatTypes(formats: DealListFormat[] | undefined): string | undefined {
  if (!Array.isArray(formats) || formats.length === 0) {
    return undefined;
  }

  const mapped = Array.from(new Set(
    formats
      .map((entry) => String(entry || "").trim().toLowerCase())
      .map((entry) => {
        if (entry === "story") {
          return "STORY";
        }

        if (entry === "repost") {
          return "REPOST";
        }

        return "POST";
      }),
  ));

  if (mapped.length === 0) {
    return undefined;
  }

  return mapped.join(",");
}

export async function getDeals(params: {
  role: UserRole | null;
  statusFilter: UiDealFilter;
  search?: string;
  escrowStatuses?: DealEscrowStatus[];
  adFormats?: DealListFormat[];
  sortBy?: DealListSort;
  page?: number;
  limit?: number;
}): Promise<DealsPageResult> {
  const normalizedRole = normalizeRole(params.role);
  const requestedPage = params.page ?? 1;
  const requestedLimit = params.limit ?? 10;
  const normalizedStatus = normalizeStatusFilter(params.statusFilter);
  const normalizedSearch = (params.search || "").trim();
  const normalizedEscrowStatuses = normalizeEscrowStatuses(params.escrowStatuses);
  const normalizedAdFormats = normalizeAdFormatTypes(params.adFormats);
  const normalizedSortBy = (params.sortBy || "created_desc").trim().toLowerCase();

  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/deals",
    query: {
      page: requestedPage,
      limit: requestedLimit,
      ...(normalizedRole ? { role: normalizedRole } : {}),
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(normalizedSearch ? { search: normalizedSearch } : {}),
      ...(normalizedEscrowStatuses ? { escrowStatus: normalizedEscrowStatuses } : {}),
      ...(normalizedAdFormats ? { adFormatType: normalizedAdFormats } : {}),
      ...(normalizedSortBy ? { sort: normalizedSortBy } : {}),
    },
  }) as RawDealsResponse;

  return {
    items: (response.deals ?? []).map(mapDeal),
    pagination: normalizePagination(response.pagination, requestedPage, requestedLimit),
    statusCounts: mapUiStatusCounts(response.statusCounts),
  };
}

export async function getDealById(dealId: string): Promise<Deal | null> {
  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/deals/{id}",
    path: { id: dealId },
  }) as RawDealResponse;

  return response.deal ? mapDeal(response.deal) : null;
}

export async function getDealCreative(dealId: string): Promise<DealCreativeData> {
  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/deals/{id}/creative",
    path: { id: dealId },
  }) as RawDealCreativeResponse;

  return mapDealCreativeData(response);
}

export async function getDealFinance(dealId: string): Promise<DealFinanceData> {
  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/deals/{id}/finance",
    path: { id: dealId },
  }) as RawDealFinanceResponse;

  return mapDealFinanceData(response);
}

export async function getDealActivity(dealId: string): Promise<DealActivityData> {
  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/deals/{id}/activity",
    path: { id: dealId },
  }) as RawDealActivityResponse;

  return mapDealActivityData(response);
}

export async function openDealChat(dealId: string): Promise<{
  dealChat?: DealChat;
  openDealChatUrl?: string | null;
}> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/open-chat",
    path: { id: dealId },
  }) as RawOpenDealChatResponse;

  return {
    dealChat: response.dealChat
      ? mapDealChat(response.dealChat, "CREATED")
      : undefined,
    openDealChatUrl: typeof response.openDealChatUrl === "string"
      ? response.openDealChatUrl
      : null,
  };
}

export type CreateDealPayload = {
  origin: "LISTING" | "BRIEF" | "DIRECT";
  channelId: string;
  adFormatId: string;
  agreedPrice: string;
  currency: string;
  listingId?: string;
  briefId?: string;
  applicationId?: string;
  scheduledTime?: string;
  durationHours?: number;
};

export async function createDeal(payload: CreateDealPayload): Promise<Deal | null> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/deals",
    body: payload,
    mediaType: "application/json",
  }) as RawDealResponse;

  return response.deal ? mapDeal(response.deal) : null;
}

export async function acceptDealTerms(dealId: string): Promise<void> {
  await request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/accept",
    path: { id: dealId },
  });
}

export type SubmitDealCreativePayload = {
  text: string;
  mediaUrls?: string[];
  mediaTypes?: Array<"TEXT" | "IMAGE" | "VIDEO" | "GIF" | "DOCUMENT" | "AUDIO" | "POLL">;
  media?: Array<{
    url: string;
    type: "TEXT" | "IMAGE" | "VIDEO" | "GIF" | "DOCUMENT" | "AUDIO" | "POLL";
    name?: string;
    mimeType?: string;
    sizeBytes?: number;
    provider?: string;
    storageKey?: string;
  }>;
  buttons?: Array<{ text: string; url: string }>;
};

export async function submitDealCreative(dealId: string, payload: SubmitDealCreativePayload): Promise<void> {
  await request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/creative",
    path: { id: dealId },
    body: payload,
    mediaType: "application/json",
  });
}

export async function approveDealCreative(dealId: string): Promise<void> {
  await request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/creative/approve",
    path: { id: dealId },
  });
}

export async function requestDealCreativeRevision(dealId: string, feedback: string): Promise<void> {
  await request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/creative/revision",
    path: { id: dealId },
    body: { feedback },
    mediaType: "application/json",
  });
}

export async function cancelDeal(dealId: string): Promise<void> {
  await request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/cancel",
    path: { id: dealId },
    body: {},
    mediaType: "application/json",
  });
}

export async function fundDeal(dealId: string): Promise<FundDealResponse> {
  return request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/fund",
    path: { id: dealId },
  }) as Promise<FundDealResponse>;
}

export async function verifyDealPayment(dealId: string): Promise<VerifyPaymentResponse> {
  return request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/verify-payment",
    path: { id: dealId },
  }) as Promise<VerifyPaymentResponse>;
}

export type CreatePostingPlanProposalPayload = {
  method: "AUTO";
  scheduledAt: string;
  guaranteeTermHours: number;
  windowHours?: number;
};

export type RespondPostingPlanProposalPayload =
  | { action: "accept" | "reject" }
  | {
      action: "counter";
      counter: CreatePostingPlanProposalPayload;
    };

export async function getDealPostingPlan(dealId: string): Promise<{ postingPlan: PostingPlan; availableActions: DealAvailableActions }> {
  const response = await request(OpenAPI, {
    method: "GET",
    url: "/api/deals/{id}/posting-plan",
    path: { id: dealId },
  }) as RawPostingPlanResponse;

  return {
    postingPlan: mapPostingPlan(response.postingPlan) ?? { proposals: [] },
    availableActions: mapDealActions(response.availableActions),
  };
}

export async function createPostingPlanProposal(dealId: string, payload: CreatePostingPlanProposalPayload): Promise<PostingPlan> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/posting-plan/proposals",
    path: { id: dealId },
    body: payload,
    mediaType: "application/json",
  }) as RawPostingPlanMutationResponse;

  return mapPostingPlan(response.postingPlan) ?? { proposals: [] };
}

export async function respondPostingPlanProposal(
  dealId: string,
  proposalId: string,
  payload: RespondPostingPlanProposalPayload,
): Promise<{ postingPlan: PostingPlan; status?: BackendDealStatus }> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/posting-plan/proposals/{proposalId}/respond",
    path: { id: dealId, proposalId },
    body: payload,
    mediaType: "application/json",
  }) as RawPostingPlanMutationResponse;

  return {
    postingPlan: mapPostingPlan(response.postingPlan) ?? { proposals: [] },
    status: response.status,
  };
}
