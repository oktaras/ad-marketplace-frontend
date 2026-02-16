import type { ToastProps } from "@/components/ui/toast";
import { getNotificationActionLabel } from "@/shared/notifications/contract";

export type InAppToast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastProps["variant"];
};

export type InAppEmptyStateCopy = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  secondaryActionLabel?: string;
};

export const inAppToasts = {
  listings: {
    dealStarted: {
      id: "A01",
      title: "Deal started",
      description: "Opening deal details…",
    } satisfies InAppToast,
    dealStartFailed: (description: string) => ({
      id: "A01",
      title: "Could not start deal",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    bookingUnavailable: {
      id: "A01",
      title: "Booking unavailable",
      description: "No active ad format is available for this channel.",
      variant: "destructive",
    } satisfies InAppToast,
  },
  deals: {
    termsAccepted: {
      id: "A02",
      title: "Terms accepted",
      description: "Deal moved to the next stage.",
    } satisfies InAppToast,
    termsAcceptFailed: (description: string) => ({
      id: "A02",
      title: "Could not accept terms",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    paymentPrepared: (description: string) => ({
      id: "A02",
      title: "Escrow payment prepared",
      description,
    } satisfies InAppToast),
    paymentPrepareFailed: (description: string) => ({
      id: "A02",
      title: "Could not prepare payment",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    paymentVerified: {
      id: "A02",
      title: "Payment verified",
      description: "Deal advanced to the creative stage.",
    } satisfies InAppToast,
    fundingMismatch: {
      id: "A02",
      title: "Funding mismatch detected",
      description: "A new escrow address has been prepared.",
      variant: "destructive",
    } satisfies InAppToast,
    paymentNotDetected: {
      id: "A02",
      title: "Payment not detected yet",
      description: "Try verifying again in a moment.",
    } satisfies InAppToast,
    paymentVerifyFailed: (description: string) => ({
      id: "A02",
      title: "Could not verify payment",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    creativeSubmitted: {
      id: "A02",
      title: "Creative submitted",
      description: "Advertiser will review it shortly.",
    } satisfies InAppToast,
    creativeSubmitFailed: (description: string) => ({
      id: "A02",
      title: "Could not submit creative",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    creativeApproved: {
      id: "A02",
      title: "Creative approved",
      description: "Publisher can proceed to publication.",
    } satisfies InAppToast,
    creativeApproveFailed: (description: string) => ({
      id: "A02",
      title: "Could not approve creative",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    revisionRequested: {
      id: "A02",
      title: "Revision requested",
      description: "Feedback sent to publisher.",
    } satisfies InAppToast,
    revisionRequestFailed: (description: string) => ({
      id: "A02",
      title: "Could not request revision",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    dealCancelled: {
      id: "A02",
      title: "Deal cancelled",
      description: "Both parties were notified.",
      variant: "destructive",
    } satisfies InAppToast,
    dealCancelFailed: (description: string) => ({
      id: "A02",
      title: "Could not cancel deal",
      description,
      variant: "destructive",
    } satisfies InAppToast),
  },
  myBriefs: {
    briefPublished: {
      id: "A03",
      title: "Brief published",
      description: "Channels will start applying soon.",
    } satisfies InAppToast,
    briefCreateFailed: (description: string) => ({
      id: "A03",
      title: "Could not create brief",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    briefReopened: {
      id: "A03",
      title: "Brief reopened",
    } satisfies InAppToast,
    briefClosed: {
      id: "A03",
      title: "Brief closed",
    } satisfies InAppToast,
    briefUpdateFailed: (description: string) => ({
      id: "A03",
      title: "Could not update brief",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    briefDeleted: {
      id: "A03",
      title: "Brief deleted",
    } satisfies InAppToast,
    briefDeleteFailed: (description: string) => ({
      id: "A03",
      title: "Could not delete brief",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    shortlistRemoved: {
      id: "A03",
      title: "Channel removed from shortlist",
    } satisfies InAppToast,
    shortlistRemoveFailed: (description: string) => ({
      id: "A03",
      title: "Could not remove channel",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    applicationAccepted: (description: string) => ({
      id: "A03",
      title: "Application accepted",
      description,
    } satisfies InAppToast),
    applicationDeclined: {
      id: "A03",
      title: "Application declined",
    } satisfies InAppToast,
    applicationUpdateFailed: (description: string) => ({
      id: "A03",
      title: "Could not update application",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    applicationNotFound: {
      id: "A03",
      title: "Application not found",
      variant: "destructive",
    } satisfies InAppToast,
    noAdFormatOptions: {
      id: "A03",
      title: "No ad format options",
      description: "This application has no selectable ad format.",
      variant: "destructive",
    } satisfies InAppToast,
  },
  wallet: {
    linked: { id: "A04", title: "Wallet linked" } satisfies InAppToast,
    linkFailed: (description: string) => ({
      id: "A04",
      title: "Could not link wallet",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    disconnected: { id: "A04", title: "Wallet disconnected" } satisfies InAppToast,
    disconnectFailed: (description: string) => ({
      id: "A04",
      title: "Could not disconnect wallet",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    connectionFailed: {
      id: "A04",
      title: "Connection failed",
      description: "Could not open wallet modal.",
      variant: "destructive",
    } satisfies InAppToast,
    connectFirst: {
      id: "A04",
      title: "Connect wallet first",
      description: "Open wallet modal and connect a TON wallet.",
    } satisfies InAppToast,
  },
  postingPlan: {
    proposalSent: {
      id: "A05",
      title: "Plan proposal sent",
      description: "Waiting for the other party response.",
    } satisfies InAppToast,
    proposalSendFailed: (description: string) => ({
      id: "A05",
      title: "Could not send proposal",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    accepted: {
      id: "A05",
      title: "Plan accepted",
      description: "Deal moved to scheduling stage.",
    } satisfies InAppToast,
    rejected: {
      id: "A05",
      title: "Plan rejected",
    } satisfies InAppToast,
    countered: {
      id: "A05",
      title: "Counterproposal sent",
    } satisfies InAppToast,
    updateFailed: (description: string) => ({
      id: "A05",
      title: "Could not update proposal",
      description,
      variant: "destructive",
    } satisfies InAppToast),
  },
  discovery: {
    applicationSent: {
      id: "A06",
      title: "Application submitted",
      description: "The advertiser will review your proposal.",
    } satisfies InAppToast,
    applicationSendFailed: (description: string) => ({
      id: "A06",
      title: "Could not submit application",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    ownBriefWarning: {
      id: "A06",
      title: "Cannot apply to your own brief",
      description: "Choose another brief to continue.",
      variant: "destructive",
    } satisfies InAppToast,
    channelSaved: (description: string) => ({
      id: "A06",
      title: "Channel saved",
      description,
    } satisfies InAppToast),
    saveChannelFailed: (description: string) => ({
      id: "A06",
      title: "Could not save channel",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    selectBrief: {
      id: "A06",
      title: "Select a brief",
      description: "Choose where to save this channel.",
    } satisfies InAppToast,
  },
  channelAndListing: {
    channelAdded: {
      id: "A07",
      title: "Channel added",
      description: "Channel verification completed.",
    } satisfies InAppToast,
    addChannelFailed: (description: string) => ({
      id: "A07",
      title: "Could not add channel",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    listingPublished: {
      id: "A07",
      title: "Listing published",
      description: "Your listing is now live.",
    } satisfies InAppToast,
    listingPublishFailed: (description: string) => ({
      id: "A07",
      title: "Could not publish listing",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    listingUpdated: { id: "A07", title: "Listing updated" } satisfies InAppToast,
    listingUpdateFailed: (description: string) => ({
      id: "A07",
      title: "Could not update listing",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    listingPaused: { id: "A07", title: "Listing paused" } satisfies InAppToast,
    listingActivated: { id: "A07", title: "Listing activated" } satisfies InAppToast,
    listingStatusFailed: (description: string) => ({
      id: "A07",
      title: "Could not update listing status",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    listingDeleted: { id: "A07", title: "Listing deleted" } satisfies InAppToast,
    listingDeleteFailed: (description: string) => ({
      id: "A07",
      title: "Could not delete listing",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    analyticsRefreshQueued: {
      id: "A07",
      title: "Analytics refresh queued",
      description: "Telegram stats refresh started. Data may update in a few moments.",
    } satisfies InAppToast,
    analyticsRefreshFailed: (description: string) => ({
      id: "A07",
      title: "Could not queue analytics refresh",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    channelUpdated: {
      id: "A07",
      title: "Channel updated",
      description: "Settings saved successfully.",
    } satisfies InAppToast,
    channelUpdateFailed: (description: string) => ({
      id: "A07",
      title: "Could not update channel",
      description,
      variant: "destructive",
    } satisfies InAppToast),
    enableAtLeastOneFormat: {
      id: "A07",
      title: "Enable at least one format",
      description: "Add at least one active format before saving.",
      variant: "destructive",
    } satisfies InAppToast,
  },
};

export const inAppEmptyStates = {
  listingsLoadFailed: {
    id: "A08",
    emoji: "⚠️",
    title: "Failed to load listings",
    description: "Please try again in a moment.",
    secondaryActionLabel: getNotificationActionLabel("notifications.actions.retry"),
  } satisfies InAppEmptyStateCopy,
  listingsNoResults: {
    id: "A08",
    emoji: "📡",
    title: "No channels found",
    description: "Try adjusting your filters or search.",
    secondaryActionLabel: getNotificationActionLabel("notifications.actions.clear_filters"),
  } satisfies InAppEmptyStateCopy,
  dealsLoadFailed: {
    id: "A09",
    emoji: "⚠️",
    title: "Failed to load deals",
    description: "Please try again in a moment.",
    secondaryActionLabel: getNotificationActionLabel("notifications.actions.retry"),
  } satisfies InAppEmptyStateCopy,
  briefsLoadFailed: {
    id: "A10",
    emoji: "⚠️",
    title: "Failed to load briefs",
    description: "Please try again in a moment.",
    secondaryActionLabel: getNotificationActionLabel("notifications.actions.retry"),
  } satisfies InAppEmptyStateCopy,
  briefsNoResults: {
    id: "A10",
    emoji: "📢",
    title: "No briefs found",
    description: "Try adjusting your filters or search.",
    secondaryActionLabel: getNotificationActionLabel("notifications.actions.clear_filters"),
  } satisfies InAppEmptyStateCopy,
  myBriefsLoadFailed: {
    id: "A11",
    emoji: "⚠️",
    title: "Failed to load briefs",
    description: "Please try again in a moment.",
    secondaryActionLabel: getNotificationActionLabel("notifications.actions.retry"),
  } satisfies InAppEmptyStateCopy,
  myChannelsLoadFailed: {
    id: "A12",
    emoji: "⚠️",
    title: "Failed to load channels",
    description: "Please try again in a moment.",
    secondaryActionLabel: getNotificationActionLabel("notifications.actions.retry"),
  } satisfies InAppEmptyStateCopy,
  myChannelsNoResults: {
    id: "A12",
    emoji: "📡",
    title: "No channels yet",
    description: "Add your first Telegram channel to start receiving applications.",
    secondaryActionLabel: getNotificationActionLabel("notifications.actions.clear_filters"),
  } satisfies InAppEmptyStateCopy,
  myListingsLoadFailed: {
    id: "A13",
    emoji: "⚠️",
    title: "Failed to load listings",
    description: "Please try again in a moment.",
    secondaryActionLabel: getNotificationActionLabel("notifications.actions.retry"),
  } satisfies InAppEmptyStateCopy,
  myListingsNoResults: {
    id: "A13",
    emoji: "📋",
    title: "No listings yet",
    description: "Create an ad listing to showcase your channel to advertisers.",
    secondaryActionLabel: getNotificationActionLabel("notifications.actions.clear_filters"),
  } satisfies InAppEmptyStateCopy,
};
