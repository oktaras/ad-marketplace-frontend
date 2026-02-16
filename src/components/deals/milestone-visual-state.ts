import type { BackendDealStatus, Deal } from "@/types/deal";

const MILESTONE_TRANSITION_READY_STATUSES: Record<string, readonly BackendDealStatus[]> = {
  created: ["CREATED"],
  terms: ["TERMS_AGREED"],
  payment: ["FUNDED"],
  creative: ["CREATIVE_APPROVED"],
  "posting-plan": ["POSTING_PLAN_AGREED", "SCHEDULED", "AWAITING_MANUAL_POST"],
  publication: ["POSTED"],
  completion: ["VERIFIED"],
};

function getCurrentBackendStatus(deal: Deal): BackendDealStatus | null {
  return deal.backendStatus ?? deal.workflowStatus ?? null;
}

export function isMilestoneTransitionReady(deal: Deal, milestoneIndex: number): boolean {
  const milestone = deal.milestones[milestoneIndex];
  if (!milestone || milestone.status !== "active") {
    return false;
  }

  const backendStatus = getCurrentBackendStatus(deal);
  if (!backendStatus) {
    return false;
  }

  const transitionStatuses = MILESTONE_TRANSITION_READY_STATUSES[milestone.id];
  return Boolean(transitionStatuses?.includes(backendStatus));
}
