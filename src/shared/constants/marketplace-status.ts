import type { StatusBadgeVariant } from "@/components/common/StatusBadge";
import type { BriefStatus } from "@/types/marketplace";
import type { ListingStatus } from "@/types/listing";

export const BRIEF_STATUS_CONFIG: Record<BriefStatus, { label: string; variant: StatusBadgeVariant }> = {
  DRAFT: { label: "Draft", variant: "muted" },
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  FULFILLED: { label: "Fulfilled", variant: "info" },
  CANCELLED: { label: "Cancelled", variant: "error" },
  EXPIRED: { label: "Expired", variant: "warning" },
};

export const LISTING_STATUS_CONFIG: Record<ListingStatus, { label: string; variant: StatusBadgeVariant }> = {
  DRAFT: { label: "Draft", variant: "muted" },
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  SOLD_OUT: { label: "Sold out", variant: "info" },
  EXPIRED: { label: "Expired", variant: "warning" },
  REMOVED: { label: "Removed", variant: "error" },
};

export function isBriefClosedStatus(status: BriefStatus): boolean {
  return status !== "ACTIVE";
}

export function isListingTerminalStatus(status: ListingStatus): boolean {
  return status === "SOLD_OUT" || status === "EXPIRED" || status === "REMOVED";
}
