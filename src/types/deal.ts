import type { StatusBadgeVariant } from "@/components/common/StatusBadge";

// Canonical workflow states (exact 1:1 with backend workflowStatus)
export type DealStatus =
  | "created"
  | "negotiating"
  | "terms_agreed"
  | "awaiting_payment"
  | "funded"
  | "awaiting_creative"
  | "creative_submitted"
  | "creative_revision"
  | "creative_approved"
  | "awaiting_posting_plan"
  | "posting_plan_agreed"
  | "scheduled"
  | "awaiting_manual_post"
  | "posting"
  | "posted"
  | "verified"
  | "completed"
  | "cancelled"
  | "expired"
  | "refunded"
  | "disputed"
  | "resolved";

export interface DealMilestone {
  id: string;
  label: string;
  description: string;
  timestamp: string | null;
  status: "done" | "active" | "upcoming";
}

export interface CreativeMedia {
  id: string;
  type: "image" | "video";
  url: string;
  name: string;
  file?: File;
  mimeType?: string;
  sizeBytes?: number;
  provider?: string;
  storageKey?: string;
}

export interface InlineButton {
  label: string;
  url: string;
}

export interface CreativeSubmission {
  id: string;
  submittedAt: string;
  text: string;
  mediaUrl?: string;
  media?: CreativeMedia[];
  inlineButtons?: InlineButton[];
  feedback?: string;
  status: "pending" | "approved" | "revision_requested";
}

export type PostingMethod = "manual" | "scheduled";

export interface PostingPlanProposal {
  id: string;
  proposedBy: "advertiser" | "publisher";
  method: PostingMethod;
  date: string; // ISO date or datetime
  windowHours?: number; // for manual — how many hours publisher has to post
  guaranteeTerm: number; // hours the post must stay live
  status: "pending" | "accepted" | "rejected" | "countered";
  createdAt: string;
}

export interface PostingPlan {
  agreedMethod?: PostingMethod;
  agreedDate?: string;
  windowHours?: number;
  guaranteeTerm?: number;
  proposals: PostingPlanProposal[];
}

export type EscrowState = "none" | "awaiting" | "held" | "released" | "refunded" | "frozen";

export type DealEscrowStatus =
  | "NONE"
  | "PENDING"
  | "HELD"
  | "RELEASING"
  | "REFUNDING"
  | "PARTIAL_REFUND"
  | "AWAITING_PAYMENT"
  | "FUNDED"
  | "RELEASED"
  | "REFUNDED"
  | "DISPUTED";

export type BackendDealStatus =
  | "CREATED"
  | "NEGOTIATING"
  | "TERMS_AGREED"
  | "AWAITING_PAYMENT"
  | "FUNDED"
  | "AWAITING_CREATIVE"
  | "CREATIVE_SUBMITTED"
  | "CREATIVE_REVISION"
  | "CREATIVE_APPROVED"
  | "AWAITING_POSTING_PLAN"
  | "POSTING_PLAN_AGREED"
  | "SCHEDULED"
  | "AWAITING_MANUAL_POST"
  | "POSTING"
  | "POSTED"
  | "VERIFIED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "DISPUTED"
  | "RESOLVED";

export interface DealStatusHistoryEntry {
  status: BackendDealStatus;
  timestamp: string;
  actor?: string;
}

export interface DealAvailableActions {
  acceptTerms: boolean;
  fundDeal: boolean;
  verifyPayment: boolean;
  submitCreative: boolean;
  approveCreative: boolean;
  requestCreativeRevision: boolean;
  cancelDeal: boolean;
  proposePostingPlan: boolean;
  respondPostingPlan: boolean;
  openDispute: boolean;
}

export interface DealDeadlines {
  currentStageDeadlineAt: string | null;
  currentStageTimeoutHours: number | null;
  stageStartedAt: string | null;
}

export type DealChatStatus = "PENDING_OPEN" | "ACTIVE" | "CLOSED";

export interface DealChat {
  status: DealChatStatus;
  openedByMe: boolean;
  openedByCounterparty: boolean;
  isOpenable: boolean;
}

export interface Deal {
  id: string;
  briefId?: string;
  briefTitle?: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  channelUsername: string;
  advertiserName: string;
  advertiserAvatar: string;
  agreedPrice: number;
  currency: string;
  format: "post" | "story" | "repost";
  status: DealStatus;
  workflowStatus?: BackendDealStatus;
  escrowState?: EscrowState;
  escrowStatus?: DealEscrowStatus;
  backendStatus?: BackendDealStatus;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string | null;
  completedAt?: string | null;
  publishDate?: string;
  isAdvertiser?: boolean;
  isPublisher?: boolean;
  statusHistory?: DealStatusHistoryEntry[];
  milestones: DealMilestone[];
  creativeSubmissions: CreativeSubmission[];
  postingPlan?: PostingPlan;
  availableActions?: DealAvailableActions;
  deadlines?: DealDeadlines;
  dealChat?: DealChat;
  openDealChatUrl?: string | null;
}

export const DEAL_STATUS_CONFIG: Record<DealStatus, { label: string; emoji: string; badgeVariant: StatusBadgeVariant }> = {
  created:              { label: "Created",            emoji: "🆕", badgeVariant: "muted" },
  negotiating:          { label: "Negotiating",        emoji: "💬", badgeVariant: "warning" },
  terms_agreed:         { label: "Terms Agreed",       emoji: "🤝", badgeVariant: "info" },
  awaiting_payment:     { label: "Awaiting Payment",   emoji: "💰", badgeVariant: "warning" },
  funded:               { label: "Funded",             emoji: "✅", badgeVariant: "success" },
  awaiting_creative:    { label: "Awaiting Creative",  emoji: "✏️", badgeVariant: "info" },
  creative_submitted:   { label: "Creative Submitted", emoji: "👀", badgeVariant: "info" },
  creative_revision:    { label: "Creative Revision",  emoji: "🔄", badgeVariant: "warning" },
  creative_approved:    { label: "Creative Approved",  emoji: "✅", badgeVariant: "success" },
  awaiting_posting_plan:{ label: "Posting Plan",       emoji: "📋", badgeVariant: "info" },
  posting_plan_agreed:  { label: "Plan Agreed",        emoji: "📅", badgeVariant: "success" },
  scheduled:            { label: "Scheduled",          emoji: "⏰", badgeVariant: "info" },
  awaiting_manual_post: { label: "Awaiting Post",      emoji: "📝", badgeVariant: "warning" },
  posting:              { label: "Posting",            emoji: "📤", badgeVariant: "info" },
  posted:               { label: "Posted",             emoji: "📢", badgeVariant: "success" },
  verified:             { label: "Verified",           emoji: "🔒", badgeVariant: "success" },
  completed:            { label: "Completed",          emoji: "🎉", badgeVariant: "success" },
  cancelled:            { label: "Cancelled",          emoji: "❌", badgeVariant: "error" },
  expired:              { label: "Expired",            emoji: "⏳", badgeVariant: "error" },
  refunded:             { label: "Refunded",           emoji: "💸", badgeVariant: "warning" },
  disputed:             { label: "Disputed",           emoji: "⚠️", badgeVariant: "error" },
  resolved:             { label: "Resolved",           emoji: "⚖️", badgeVariant: "info" },
};

export const TERMINAL_STATUSES: DealStatus[] = ["completed", "cancelled", "expired", "refunded", "resolved"];
