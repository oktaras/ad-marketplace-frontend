import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import { SectionLabel } from "@/components/common/SectionLabel";
import { ChannelSelectList } from "@/components/common/ChannelSelectList";
import { AdFormatPricingEditor } from "@/components/common/AdFormatPricingEditor";
import { AdFormatPricing } from "@/types/listing";
import { toast } from "@/hooks/use-toast";
import { CurrencySelector } from "@/components/common/CurrencySelector";
import { CryptoCurrency, DEFAULT_CURRENCY } from "@/types/currency";
import type { Channel } from "@/types/marketplace";
import { createMyChannelFormat, createMyListing, type ChannelFormatItem } from "@/shared/api/my-stuff";
import { getApiErrorMessage } from "@/shared/api/error";
import { inAppToasts } from "@/shared/notifications/in-app";

interface CreateListingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channels: Channel[];
  channelFormatsByChannelId: Map<string, ChannelFormatItem[]>;
}

const typeByFormat: Record<AdFormatPricing["format"], "POST" | "STORY" | "REPOST"> = {
  post: "POST",
  story: "STORY",
  repost: "REPOST",
};

const nameByFormat: Record<AdFormatPricing["format"], string> = {
  post: "Post",
  story: "Story",
  repost: "Repost",
};

export function CreateListingSheet({ open, onOpenChange, channels, channelFormatsByChannelId }: CreateListingSheetProps) {
  const queryClient = useQueryClient();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<CryptoCurrency>(DEFAULT_CURRENCY);
  const [formats, setFormats] = useState<AdFormatPricing[]>([
    { format: "post", price: 0, currency: DEFAULT_CURRENCY, enabled: true },
    { format: "story", price: 0, currency: DEFAULT_CURRENCY, enabled: false },
    { format: "repost", price: 0, currency: DEFAULT_CURRENCY, enabled: false },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createListingMutation = useMutation({
    mutationFn: async (payload: {
      channelId: string;
      title: string;
      description?: string;
      currency: CryptoCurrency;
      formats: AdFormatPricing[];
      availableFormats: ChannelFormatItem[];
    }) => {
      const availableByType = new Map(payload.availableFormats.map((format) => [format.type, format]));
      const enabledFormats = payload.formats.filter((format) => format.enabled);

      for (const format of enabledFormats) {
        const backendType = typeByFormat[format.format];
        if (availableByType.has(backendType)) {
          continue;
        }

        const created = await createMyChannelFormat(payload.channelId, {
          type: backendType,
          name: nameByFormat[format.format],
          priceAmount: Math.max(0, format.price).toString(),
          priceCurrency: payload.currency,
        });

        if (!created) {
          throw new Error(`Failed to create ${nameByFormat[format.format]} format for selected channel.`);
        }

        availableByType.set(backendType, created);
      }

      const offers = payload.formats
        .map((format) => {
          const backendType = typeByFormat[format.format];
          const channelFormat = availableByType.get(backendType);
          if (!channelFormat) {
            return null;
          }

          return {
            adFormatId: channelFormat.id,
            customPrice: Math.max(0, format.price).toString(),
            customCurrency: payload.currency,
            enabled: format.enabled,
          };
        })
        .filter((offer): offer is NonNullable<typeof offer> => offer !== null);

      return createMyListing({
        channelId: payload.channelId,
        title: payload.title,
        description: payload.description,
        formatOffers: offers,
      });
    },
    onSuccess: async () => {
      toast(inAppToasts.channelAndListing.listingPublished);
      await queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      setSelectedChannelId(null);
      setTitle("");
      setDescription("");
      setCurrency(DEFAULT_CURRENCY);
      setFormats([
        { format: "post", price: 0, currency: DEFAULT_CURRENCY, enabled: true },
        { format: "story", price: 0, currency: DEFAULT_CURRENCY, enabled: false },
        { format: "repost", price: 0, currency: DEFAULT_CURRENCY, enabled: false },
      ]);
      setErrors({});
      onOpenChange(false);
    },
    onError: (error) => {
      toast(inAppToasts.channelAndListing.listingPublishFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const toggleFormat = (format: string) => {
    setFormats((prev) =>
      prev.map((f) => f.format === format ? { ...f, enabled: !f.enabled } : f)
    );
  };

  const updatePrice = (format: string, price: number) => {
    setFormats((prev) =>
      prev.map((f) => f.format === format ? { ...f, price } : f)
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedChannelId) e.channel = "Select a channel";
    if (!title || title.length < 5) e.title = "Title must be at least 5 chars";
    if (!description || description.length < 10) e.description = "Description must be at least 10 chars";
    const enabledFormats = formats.filter((f) => f.enabled);
    if (enabledFormats.length === 0) e.formats = "Enable at least one format";
    if (enabledFormats.some((f) => f.price <= 0)) e.formats = "Set price for all enabled formats";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (!selectedChannelId) {
      return;
    }

    const availableFormats = channelFormatsByChannelId.get(selectedChannelId) ?? [];
    createListingMutation.mutate({
      channelId: selectedChannelId,
      title: title.trim(),
      description: description.trim() || undefined,
      currency,
      formats,
      availableFormats,
    });
  };

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Create Listing" fullHeight>
      <div className="space-y-6">
        {/* Channel selector */}
        <div className="space-y-1.5">
          <SectionLabel>Channel *</SectionLabel>
          <ChannelSelectList
            channels={channels}
            selectedId={selectedChannelId}
            onSelect={setSelectedChannelId}
          />
          {errors.channel && <Text type="caption2" className="text-destructive">{errors.channel}</Text>}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <SectionLabel>Listing Title *</SectionLabel>
          <input
            type="text"
            placeholder="e.g. Sponsored Post — CryptoInsider"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full h-11 px-3 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              errors.title ? "focus:ring-destructive" : "focus:ring-ring"
            }`}
          />
          {errors.title && <Text type="caption2" className="text-destructive">{errors.title}</Text>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <SectionLabel>Description *</SectionLabel>
          <textarea
            placeholder="Describe what advertisers can expect..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`w-full px-3 py-2.5 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 resize-none ${
              errors.description ? "focus:ring-destructive" : "focus:ring-ring"
            }`}
          />
          {errors.description && <Text type="caption2" className="text-destructive">{errors.description}</Text>}
        </div>

        {/* Ad Formats */}
        <div className="space-y-3">
          <SectionLabel>Ad Formats & Pricing *</SectionLabel>
          <CurrencySelector value={currency} onChange={(c) => {
            setCurrency(c);
            setFormats((prev) => prev.map((f) => ({ ...f, currency: c })));
          }} />
          <AdFormatPricingEditor
            formats={formats}
            onToggle={toggleFormat}
            onPriceChange={updatePrice}
          />
          {errors.formats && <Text type="caption2" className="text-destructive">{errors.formats}</Text>}
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={createListingMutation.isPending} className="w-full">
          {createListingMutation.isPending ? "Publishing…" : "Publish Listing"}
        </Button>
      </div>
    </AppSheet>
  );
}
