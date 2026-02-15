import type { TFunction } from 'i18next';

export type DealStatus =
  | 'CREATED'
  | 'NEGOTIATING'
  | 'TERMS_AGREED'
  | 'AWAITING_PAYMENT'
  | 'FUNDED'
  | 'AWAITING_CREATIVE'
  | 'CREATIVE_SUBMITTED'
  | 'CREATIVE_REVISION'
  | 'CREATIVE_APPROVED'
  | 'SCHEDULED'
  | 'POSTING'
  | 'POSTED'
  | 'VERIFIED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'EXPIRED';

const DEAL_STATUS_KEYS: Record<DealStatus, string> = {
  CREATED: 'dealStatus.created',
  NEGOTIATING: 'dealStatus.negotiating',
  TERMS_AGREED: 'dealStatus.termsAgreed',
  AWAITING_PAYMENT: 'dealStatus.awaitingPayment',
  FUNDED: 'dealStatus.funded',
  AWAITING_CREATIVE: 'dealStatus.awaitingCreative',
  CREATIVE_SUBMITTED: 'dealStatus.creativeSubmitted',
  CREATIVE_REVISION: 'dealStatus.creativeRevision',
  CREATIVE_APPROVED: 'dealStatus.creativeApproved',
  SCHEDULED: 'dealStatus.scheduled',
  POSTING: 'dealStatus.posting',
  POSTED: 'dealStatus.posted',
  VERIFIED: 'dealStatus.verified',
  COMPLETED: 'dealStatus.completed',
  DISPUTED: 'dealStatus.disputed',
  CANCELLED: 'dealStatus.cancelled',
  REFUNDED: 'dealStatus.refunded',
  EXPIRED: 'dealStatus.expired',
};

export function getDealProgressSteps(t: TFunction): Array<{ statuses: DealStatus[]; label: string }> {
  return [
    {
      statuses: ['CREATED', 'NEGOTIATING'],
      label: t('dealProgress.negotiation'),
    },
    {
      statuses: ['TERMS_AGREED', 'AWAITING_PAYMENT'],
      label: t('dealProgress.payment'),
    },
    {
      statuses: ['FUNDED', 'AWAITING_CREATIVE', 'CREATIVE_SUBMITTED', 'CREATIVE_REVISION', 'CREATIVE_APPROVED'],
      label: t('dealProgress.creative'),
    },
    {
      statuses: ['SCHEDULED', 'POSTING', 'POSTED'],
      label: t('dealProgress.publication'),
    },
    {
      statuses: ['VERIFIED', 'COMPLETED'],
      label: t('dealProgress.complete'),
    },
  ];
}

export function toDealStatus(value: string | undefined): DealStatus | null {
  if (!value) {
    return null;
  }

  const knownStatuses = new Set<DealStatus>([
    'CREATED',
    'NEGOTIATING',
    'TERMS_AGREED',
    'AWAITING_PAYMENT',
    'FUNDED',
    'AWAITING_CREATIVE',
    'CREATIVE_SUBMITTED',
    'CREATIVE_REVISION',
    'CREATIVE_APPROVED',
    'SCHEDULED',
    'POSTING',
    'POSTED',
    'VERIFIED',
    'COMPLETED',
    'DISPUTED',
    'CANCELLED',
    'REFUNDED',
    'EXPIRED',
  ]);

  return knownStatuses.has(value as DealStatus) ? (value as DealStatus) : null;
}

export function formatDealStatus(value: string | undefined, t: TFunction): string {
  const status = toDealStatus(value);
  return status ? t(DEAL_STATUS_KEYS[status]) : value ?? t('common.unknown');
}

export function getDealProgressIndex(statusValue: string | undefined, t: TFunction): number {
  const status = toDealStatus(statusValue);

  if (!status) {
    return 0;
  }

  const steps = getDealProgressSteps(t);
  const index = steps.findIndex((step) => step.statuses.includes(status));
  return index >= 0 ? index : 0;
}
