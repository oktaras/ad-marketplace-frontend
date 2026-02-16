import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Listing, AdFormatPricing } from "@/types/listing";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import { SectionLabel } from "@/components/common/SectionLabel";
import { AdFormatPricingEditor } from "@/components/common/AdFormatPricingEditor";
import { Eye, MessageSquare, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { deleteMyListing, updateMyListing } from "@/shared/api/my-stuff";
import { getApiErrorMessage } from "@/shared/api/error";
import { LISTING_STATUS_CONFIG, isListingTerminalStatus } from "@/shared/constants/marketplace-status";
import { inAppToasts } from "@/shared/notifications/in-app";
import { useTelegramPopupConfirm } from "@/shared/lib/telegram-popup-confirm";
import { isAdFormatActive } from "@/shared/lib/ad-format";

interface ManageListingSheetProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageListingSheet({ listing, open, onOpenChange }: ManageListingSheetProps) {
  const queryClient = useQueryClient();
  const confirmWithPopup = useTelegramPopupConfirm();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formats, setFormats] = useState<AdFormatPricing[]>([]);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setDescription(listing.description);
      setFormats(
        listing.formats.map((format) => ({
          ...format,
          enabled: format.enabled && isAdFormatActive(format.format),
        })),
      );
    }
  }, [listing]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!listing) {
        throw new Error("Listing is unavailable.");
      }

      const offers = formats
        .filter((format) => format.adFormatId)
        .map((format) => ({
          adFormatId: format.adFormatId as string,
          customPrice: Math.max(0, format.price).toString(),
          customCurrency: format.currency,
          enabled: format.enabled && isAdFormatActive(format.format),
        }));

      if (offers.length === 0) {
        throw new Error("No ad formats are configured for this listing.");
      }

      return updateMyListing(listing.id, {
        title: title.trim(),
        description: description.trim(),
        formatOffers: offers,
      });
    },
    onSuccess: async () => {
      toast(inAppToasts.channelAndListing.listingUpdated);
      await queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast(inAppToasts.channelAndListing.listingUpdateFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => {
      if (!listing) {
        throw new Error("Listing is unavailable.");
      }

      if (listing.status !== "ACTIVE" && listing.status !== "PAUSED") {
        throw new Error("This listing status cannot be toggled.");
      }

      const nextStatus = listing.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
      return updateMyListing(listing.id, { status: nextStatus });
    },
    onSuccess: async () => {
      const nowPaused = listing?.status === "ACTIVE";
      toast(nowPaused ? inAppToasts.channelAndListing.listingPaused : inAppToasts.channelAndListing.listingActivated);
      await queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast(inAppToasts.channelAndListing.listingStatusFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!listing) {
        throw new Error("Listing is unavailable.");
      }

      return deleteMyListing(listing.id);
    },
    onSuccess: async () => {
      toast(inAppToasts.channelAndListing.listingDeleted);
      await queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast(inAppToasts.channelAndListing.listingDeleteFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const toggleFormat = (format: string) => {
    setFormats((prev) =>
      prev.map((entry) => (entry.format === format ? { ...entry, enabled: !entry.enabled } : entry)),
    );
  };

  const updatePrice = (format: string, price: number) => {
    setFormats((prev) =>
      prev.map((entry) => (entry.format === format ? { ...entry, price } : entry)),
    );
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleToggleStatus = () => {
    toggleStatusMutation.mutate();
  };

  const handleDelete = async () => {
    const confirmed = await confirmWithPopup({
      title: "Delete listing?",
      message: "This will permanently remove this ad listing. Active deals won't be affected.",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDestructive: true,
    });

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate();
  };

  if (!listing) return null;
  const statusConfig = LISTING_STATUS_CONFIG[listing.status];
  const canToggleStatus = listing.status === "ACTIVE" || listing.status === "PAUSED";
  const statusDotClass =
    statusConfig?.variant === "success"
      ? "bg-success"
      : statusConfig?.variant === "warning"
        ? "bg-warning"
        : statusConfig?.variant === "error"
          ? "bg-destructive"
          : "bg-muted-foreground";

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Manage Listing" fullHeight>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
            <Text type="subheadline2" weight="medium">
              {statusConfig?.label ?? listing.status}
            </Text>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <Text type="caption1" color="secondary">{listing.views}</Text>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <Text type="caption1" color="secondary">{listing.inquiries}</Text>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <SectionLabel>Title</SectionLabel>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-secondary border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <SectionLabel>Description</SectionLabel>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-secondary border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="space-y-3">
          <SectionLabel>Ad Formats & Pricing</SectionLabel>
          <AdFormatPricingEditor
            formats={formats}
            onToggle={toggleFormat}
            onPriceChange={updatePrice}
          />
        </div>

        <div className="space-y-2">
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full">
            {saveMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={toggleStatusMutation.isPending || !canToggleStatus}
            className="w-full"
          >
            {listing.status === "ACTIVE" ? (
              <><Pause className="h-4 w-4" /> Pause Listing</>
            ) : (
              <><Play className="h-4 w-4" /> Activate Listing</>
            )}
          </Button>
          {!canToggleStatus && (
            <Text type="caption2" color="tertiary">
              {isListingTerminalStatus(listing.status) ? "Status is terminal and cannot be changed." : "Status cannot be toggled."}
            </Text>
          )}
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
            disabled={deleteMutation.isPending}
            onClick={() => void handleDelete()}
          >
            <Trash2 className="h-4 w-4" /> Delete Listing
          </Button>
        </div>
      </div>
    </AppSheet>
  );
}
