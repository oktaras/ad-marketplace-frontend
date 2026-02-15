export type ChannelCategory = string;

export const CHANNEL_CATEGORIES: { value: ChannelCategory; label: string; emoji: string }[] = [
  { value: "crypto", label: "Crypto", emoji: "🪙" },
  { value: "tech", label: "Tech", emoji: "💻" },
  { value: "finance", label: "Finance", emoji: "💰" },
  { value: "lifestyle", label: "Lifestyle", emoji: "✨" },
  { value: "news", label: "News", emoji: "📰" },
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "education", label: "Education", emoji: "📚" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "marketing", label: "Marketing", emoji: "📈" },
  { value: "health", label: "Health", emoji: "🏥" },
];

export interface Channel {
  id: string;
  name: string;
  username: string;
  avatar: string;
  category: ChannelCategory;
  subscribers: number;
  avgViews: number;
  er: number; // engagement rate %
  pricePerPost: number;
  currency: string;
  verified: boolean;
  description: string;
  language: string;
  adFormats?: Array<{
    id: string;
    type: "post" | "story" | "repost";
    name: string;
    price: number;
    currency: string;
  }>;
}

export type BriefStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "FULFILLED" | "CANCELLED" | "EXPIRED";

export interface Brief {
  id: string;
  title: string;
  advertiserId?: string;
  advertiserName: string;
  advertiserAvatar: string;
  category: ChannelCategory;
  categoryLabel?: string;
  categoryIcon?: string;
  budget: number;
  currency: string;
  targetSubscribers: number;
  description: string;
  format: "post" | "story" | "repost";
  deadline: string;
  applicationsCount: number;
  status: BriefStatus;
  createdAt: string;
}
