import { ChannelCategory } from "./marketplace";

export type AdFormat = "post" | "story" | "repost";

export interface AdFormatPricing {
  format: AdFormat;
  adFormatId?: string;
  price: number;
  currency: string;
  enabled: boolean;
}

export type ListingStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "SOLD_OUT" | "EXPIRED" | "REMOVED";

export interface Listing {
  id: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  channelUsername: string;
  title: string;
  description: string;
  formats: AdFormatPricing[];
  status: ListingStatus;
  views: number;
  inquiries: number;
  createdAt: string;
}

export interface ChannelAnalytics {
  followers: number;
  followersChange: number;
  followersChangePercent: number;
  enabledNotifications: number;
  viewsPerPost: number;
  viewsPerStory: number;
  sharesPerPost: number;
  sharesPerStory: number;
  reactionsPerStory: number;
  growthData: { date: string; value: number }[];
  followersData: { date: string; joined: number; left: number }[];
  viewsBySource: { date: string; value: number }[];
  interactionsData: { date: string; value: number }[];
  languageData: { lang: string; percent: number }[];
}
