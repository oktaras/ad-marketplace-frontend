export const ANALYTICS_EVENT = {
  appOpened: 'app_opened',
  pageView: 'page_view',
  onboardingCompleted: 'onboarding_completed',
  briefCreated: 'brief_created',
  briefApplicationSubmitted: 'brief_application_submitted',
  dealFundingPrepared: 'deal_funding_prepared',
  dealPaymentSent: 'deal_payment_sent',
  dealPaymentVerified: 'deal_payment_verified',
  dealCreativeSubmitted: 'deal_creative_submitted',
  dealCreativeApproved: 'deal_creative_approved',
  listingCreated: 'listing_created',
  dealCreated: 'deal_created',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT];

export type AnalyticsPropertyValue = string | number | boolean | null | undefined;
export type AnalyticsEventProperties = Record<string, AnalyticsPropertyValue>;
