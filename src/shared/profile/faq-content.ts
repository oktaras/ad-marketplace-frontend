export type FaqAudience = "all" | "advertiser" | "publisher";

export type ProfileFaqItem = {
  id: string;
  question: string;
  answer: string;
  audience: FaqAudience;
};

export const PROFILE_FAQ_ITEMS: ProfileFaqItem[] = [
  {
    id: "brief-vs-listing",
    question: "What is the difference between a brief and a listing?",
    answer:
      "A brief is an advertiser request with budget, format, deadline, and campaign requirements.\n"
      + "A listing is a publisher offer from a Telegram channel with available ad formats and prices.",
    audience: "all",
  },
  {
    id: "advertiser-to-deal",
    question: "How does an advertiser start and reach a deal?",
    answer:
      "Create a brief in My Briefs, receive applications from publishers, then accept an application to create a deal.\n"
      + "You can also open Listings and book a listing directly, which creates a deal immediately.",
    audience: "all",
  },
  {
    id: "publisher-to-deal",
    question: "How does a publisher start and reach a deal?",
    answer:
      "Create a listing for your channel in My Stuff / My Listings, or apply to advertiser briefs from Briefs.\n"
      + "When an advertiser accepts your application or books your listing, the deal appears in Deals.",
    audience: "all",
  },
  {
    id: "after-deal-created",
    question: "What happens after a deal is created?",
    answer:
      "Typical flow: Terms -> Payment / Escrow -> Creative -> Posting Plan -> Publication -> Verification / Completion.\n"
      + "Both parties can track this in Deal details: Overview, Creative, Posting Plan, Finance, and Activity.",
    audience: "all",
  },
  {
    id: "deal-lifecycle-actions",
    question: "What actions happen inside a full deal lifecycle?",
    answer:
      "Advertiser actions: accept terms, fund escrow, review creative, request revision or approve, and respond to posting plan.\n"
      + "Publisher actions: accept terms when required, submit creative, revise creative, propose/respond to posting plan, and publish post.\n"
      + "Both parties: use deal bot chat, monitor timeline/activity, and cancel when allowed.",
    audience: "all",
  },
  {
    id: "why-connect-telegram",
    question: "Why should I connect my Telegram account in Profile?",
    answer:
      "It is strongly recommended for smooth marketplace use, especially for publishers.\n"
      + "Connected Telegram unlocks richer channel analytics and helps keep deal communication and channel performance context reliable.",
    audience: "all",
  },
  {
    id: "without-telegram",
    question: "Can I use the app without connecting Telegram account in Profile?",
    answer:
      "You can still use core marketplace screens, but analytics visibility can be limited and publisher setup can be weaker.\n"
      + "For the best experience, connect Telegram before actively running campaigns and deals.",
    audience: "all",
  },
  {
    id: "where-next-action",
    question: "Where do I check current status and next action?",
    answer:
      "Open Deals and select a deal.\n"
      + "Use status chips, timeline, finance/escrow panel, and activity feed to see what is blocked and what to do next.",
    audience: "all",
  },
];
