import { Channel, Brief } from "@/types/marketplace";

// Channels owned by the current publisher user
export const myChannels: Channel[] = [
  {
    id: "my-ch-1",
    name: "CryptoInsider",
    username: "@cryptoinsider",
    avatar: "🪙",
    category: "crypto",
    subscribers: 184000,
    avgViews: 32000,
    er: 17.4,
    pricePerPost: 850,
    currency: "TON",
    verified: true,
    description: "Daily crypto market analysis, DeFi updates, and trading signals. Top-10 CIS crypto channel.",
    language: "EN",
  },
  {
    id: "my-ch-2",
    name: "TechDigest",
    username: "@techdigest",
    avatar: "💻",
    category: "tech",
    subscribers: 92000,
    avgViews: 18500,
    er: 20.1,
    pricePerPost: 420,
    currency: "TON",
    verified: true,
    description: "Curated tech news, startup reviews, and product launches. Quality over quantity.",
    language: "EN",
  },
];

// Applications from publishers on the advertiser's briefs
export interface BriefApplication {
  id: string;
  briefId: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  channelUsername: string;
  subscribers: number;
  proposedPrice: number;
  currency: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
}

// Briefs owned by the current advertiser user
export const myBriefs: Brief[] = [
  {
    id: "my-br-1",
    title: "DeFi Wallet Launch Campaign",
    advertiserName: "You",
    advertiserAvatar: "👤",
    category: "crypto",
    budget: 5000,
    currency: "TON",
    targetSubscribers: 50000,
    description: "Looking for crypto channels to promote our new non-custodial DeFi wallet. Need authentic reviews with tutorial-style content.",
    format: "post",
    deadline: "2026-03-01",
    applicationsCount: 3,
    status: "ACTIVE",
    createdAt: "2026-02-08",
  },
  {
    id: "my-br-2",
    title: "SaaS Product Hunt Launch",
    advertiserName: "You",
    advertiserAvatar: "👤",
    category: "tech",
    budget: 3000,
    currency: "TON",
    targetSubscribers: 30000,
    description: "Promoting our cloud productivity tool across tech-focused Telegram channels. Looking for engaged developer audiences.",
    format: "post",
    deadline: "2026-02-25",
    applicationsCount: 2,
    status: "ACTIVE",
    createdAt: "2026-02-05",
  },
];

export const myBriefApplications: BriefApplication[] = [
  {
    id: "app-1",
    briefId: "my-br-1",
    channelId: "ch-1",
    channelName: "CryptoInsider",
    channelAvatar: "🪙",
    channelUsername: "@cryptoinsider",
    subscribers: 184000,
    proposedPrice: 900,
    currency: "TON",
    message: "We'd love to feature your DeFi wallet with a detailed tutorial post. Our audience is highly engaged with DeFi content.",
    status: "pending",
    appliedAt: "2026-02-09",
  },
  {
    id: "app-2",
    briefId: "my-br-1",
    channelId: "ch-3",
    channelName: "FinanceFlow",
    channelAvatar: "💰",
    channelUsername: "@financeflow",
    subscribers: 256000,
    proposedPrice: 1300,
    currency: "TON",
    message: "Our finance-focused audience would be perfect for your wallet product. We can create a comparison-style review.",
    status: "pending",
    appliedAt: "2026-02-10",
  },
  {
    id: "app-3",
    briefId: "my-br-1",
    channelId: "ch-7",
    channelName: "LearnCode",
    channelAvatar: "📚",
    channelUsername: "@learncode",
    subscribers: 53000,
    proposedPrice: 250,
    currency: "TON",
    message: "We can create a developer-focused tutorial on integrating with your wallet API.",
    status: "pending",
    appliedAt: "2026-02-11",
  },
  {
    id: "app-4",
    briefId: "my-br-2",
    channelId: "ch-2",
    channelName: "TechDigest",
    channelAvatar: "💻",
    channelUsername: "@techdigest",
    subscribers: 92000,
    proposedPrice: 450,
    currency: "TON",
    message: "We regularly cover SaaS launches and can provide an in-depth product review for your tool.",
    status: "pending",
    appliedAt: "2026-02-06",
  },
  {
    id: "app-5",
    briefId: "my-br-2",
    channelId: "ch-8",
    channelName: "MarketingPro",
    channelAvatar: "📈",
    channelUsername: "@marketingpro",
    subscribers: 78000,
    proposedPrice: 400,
    currency: "TON",
    message: "Perfect fit for our audience of growth marketers and startup founders.",
    status: "pending",
    appliedAt: "2026-02-07",
  },
];
