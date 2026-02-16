import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Brief, Channel } from "@/types/marketplace";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import { SectionLabel } from "@/components/common/SectionLabel";
import { ChannelSelectList } from "@/components/common/ChannelSelectList";
import { BriefMetaRow } from "@/components/common/BriefMetaRow";
import { formatCurrency, formatNumber } from "@/lib/format";
import { StatBox } from "@/components/common/StatBox";
import { Send, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { DiscoveryChannel } from "@/shared/api/discovery";
import { applyToDiscoveryBrief, getDiscoveryBriefDetails, getMyBriefApplications } from "@/shared/api/discovery";
import { getMyChannels } from "@/shared/api/my-stuff";
import { useAuthStore } from "@/features/auth/model/auth.store";
import { inAppToasts } from "@/shared/notifications/in-app";
import { normalizeCurrency } from "@/types/currency";
import { getTelegramChannelAvatarUrl } from "@/shared/lib/channel-avatar";
import { formatAdFormatTitle, isAdFormatActive } from "@/shared/lib/ad-format";

interface BriefApplySheetProps {
  brief: Brief | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalizeAdFormatType(value: string | null | undefined): string {
  return (value || "").trim().toUpperCase();
}

function parseAmount(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getApiErrorMessage(error: unknown): string | null {
  if (error && typeof error === "object" && "body" in error) {
    const body = (error as { body?: { message?: unknown; error?: unknown } }).body;
    if (body && typeof body.error === "string" && body.error.trim().length > 0) {
      return body.error;
    }

    if (body && typeof body.message === "string" && body.message.trim().length > 0) {
      return body.message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return null;
}

function mapBriefFormatToAdFormatType(format: Brief["format"]): string {
  if (format === "story") {
    return "STORY";
  }

  if (format === "repost") {
    return "REPOST";
  }

  return "POST";
}

function mapApiChannelToSelectChannel(channel: DiscoveryChannel): Channel {
  const primaryCategory = channel.categories?.[0];
  const primaryFormat = channel.formats?.[0];
  const channelAvatarUrl = getTelegramChannelAvatarUrl(channel.username, channel.updatedAt);
  const adFormats = (channel.formats ?? [])
    .map((format) => {
      const normalizedType = String(format.type || "").toLowerCase();
      if (normalizedType !== "post" && normalizedType !== "story" && normalizedType !== "repost") {
        return null;
      }

      return {
        id: format.id,
        type: normalizedType,
        name: format.name,
        price: parseAmount(format.priceAmount),
        currency: normalizeCurrency(format.priceCurrency),
      } as Channel["adFormats"][number];
    })
    .filter((entry): entry is NonNullable<Channel["adFormats"]>[number] => entry !== null);

  return {
    id: channel.id,
    name: channel.title || "Untitled channel",
    username: channel.username ? `@${channel.username.replace(/^@+/, "")}` : "@unknown",
    avatar: channelAvatarUrl || primaryCategory?.icon || "📡",
    category: (primaryCategory?.slug || "general") as Channel["category"],
    subscribers: channel.stats?.subscribers ?? 0,
    avgViews: channel.stats?.avgViews ?? 0,
    er: Number(channel.stats?.engagementRate ?? 0),
    pricePerPost: parseAmount(primaryFormat?.priceAmount),
    currency: normalizeCurrency(primaryFormat?.priceCurrency),
    verified: Boolean(channel.isVerified),
    description: channel.description || "No description yet.",
    language: (channel.language || "EN").toUpperCase(),
    adFormats,
  };
}

export function BriefApplySheet({ brief, open, onOpenChange }: BriefApplySheetProps) {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [applied, setApplied] = useState(false);
  const [selectedFormatIds, setSelectedFormatIds] = useState<string[]>([]);
  const [formatPrices, setFormatPrices] = useState<Record<string, string>>({});
  const [localAppliedChannelIds, setLocalAppliedChannelIds] = useState<string[]>([]);
  const briefId = brief?.id || "";

  const briefDetailsQuery = useQuery({
    queryKey: ["briefs", "details", briefId],
    queryFn: () => getDiscoveryBriefDetails(briefId),
    enabled: open && Boolean(briefId),
    staleTime: 60_000,
  });

  const channelsQuery = useQuery({
    queryKey: ["briefs", "apply", "channels"],
    queryFn: () => getMyChannels({ page: 1, limit: 100 }),
    enabled: open,
    staleTime: 60_000,
  });

  const myApplicationsQuery = useQuery({
    queryKey: ["briefs", "apply", "my-applications", briefId],
    queryFn: () => getMyBriefApplications(briefId),
    enabled: open && Boolean(briefId),
    staleTime: 30_000,
  });

  const channels = channelsQuery.data?.items ?? [];
  const channelById = useMemo(
    () => new Map(channels.map((channel) => [channel.id, channel])),
    [channels],
  );

  const channelsForSelect = useMemo(
    () => channels.map((channel) => mapApiChannelToSelectChannel(channel)),
    [channels],
  );

  const selectedApiChannel = selectedChannelId ? channelById.get(selectedChannelId) ?? null : null;

  const requestedFormatTypes = useMemo(() => {
    const normalizedTypes = (briefDetailsQuery.data?.adFormatTypes ?? [])
      .map((type) => normalizeAdFormatType(type))
      .filter(Boolean);

    if (normalizedTypes.length > 0) {
      return Array.from(new Set(normalizedTypes));
    }

    return [mapBriefFormatToAdFormatType(brief?.format || "post")];
  }, [briefDetailsQuery.data?.adFormatTypes, brief?.format]);

  const requestedTypeSet = useMemo(
    () => new Set(requestedFormatTypes),
    [requestedFormatTypes],
  );

  const availableFormats = useMemo(
    () =>
      (selectedApiChannel?.formats ?? [])
        .map((format) => ({
          ...format,
          priceCurrency: normalizeCurrency(format.priceCurrency),
          normalizedType: normalizeAdFormatType(format.type),
        }))
        .filter((format) => requestedTypeSet.has(format.normalizedType)),
    [selectedApiChannel, requestedTypeSet],
  );
  const selectableFormats = useMemo(
    () => availableFormats.filter((format) => isAdFormatActive(format.normalizedType)),
    [availableFormats],
  );

  const targetSubscribers = briefDetailsQuery.data?.minSubscribers
    ?? briefDetailsQuery.data?.maxSubscribers
    ?? brief?.targetSubscribers
    ?? 0;

  const serverAppliedChannelIds = useMemo(
    () => (myApplicationsQuery.data ?? []).map((entry) => entry.channelId),
    [myApplicationsQuery.data],
  );

  const appliedChannelIdSet = useMemo(
    () => new Set([...serverAppliedChannelIds, ...localAppliedChannelIds]),
    [serverAppliedChannelIds, localAppliedChannelIds],
  );

  const disabledIds = useMemo(
    () => {
      const belowThresholdIds = channels
        .filter((channel) => (channel.stats?.subscribers ?? 0) < targetSubscribers)
        .map((channel) => channel.id);

      return Array.from(new Set([...belowThresholdIds, ...Array.from(appliedChannelIdSet)]));
    },
    [channels, targetSubscribers, appliedChannelIdSet],
  );

  useEffect(() => {
    if (selectedChannelId && disabledIds.includes(selectedChannelId)) {
      setSelectedChannelId(null);
    }
  }, [selectedChannelId, disabledIds]);

  useEffect(() => {
    if (!selectedChannelId || availableFormats.length === 0) {
      setSelectedFormatIds([]);
      setFormatPrices({});
      return;
    }

    setSelectedFormatIds((previous) => {
      const previousSet = new Set(previous);
      const persistedSelection = selectableFormats
        .filter((format) => previousSet.has(format.id))
        .map((format) => format.id);

      return persistedSelection.length > 0
        ? persistedSelection
        : selectableFormats.map((format) => format.id);
    });

    setFormatPrices((previous) => {
      const nextPrices: Record<string, string> = {};

      availableFormats.forEach((format) => {
        const currentPrice = previous[format.id];
        nextPrices[format.id] = currentPrice && currentPrice.trim().length > 0
          ? currentPrice
          : format.priceAmount;
      });

      return nextPrices;
    });
  }, [selectedChannelId, availableFormats, selectableFormats]);

  const selectedFormatPrices = useMemo(() => {
    const mapped: Record<string, string> = {};

    selectedFormatIds.forEach((formatId) => {
      const price = formatPrices[formatId]?.trim();
      if (price) {
        mapped[formatId] = price;
      }
    });

    return mapped;
  }, [selectedFormatIds, formatPrices]);

  const proposedPrice = selectedFormatIds.length > 0
    ? (formatPrices[selectedFormatIds[0]]?.trim() || "")
    : "";

  const hasInvalidPrice = selectedFormatIds.some((formatId) => {
    const raw = formatPrices[formatId]?.trim();
    if (!raw) {
      return true;
    }

    const parsed = Number(raw);
    return !Number.isFinite(parsed) || parsed <= 0;
  });

  const applyMutation = useMutation({
    mutationFn: () => {
      if (!selectedChannelId) {
        throw new Error("Please select a channel.");
      }

      if (!briefId) {
        throw new Error("Brief is unavailable.");
      }

      return applyToDiscoveryBrief(briefId, {
        channelId: selectedChannelId,
        proposedPrice,
        pitch: message.trim(),
        selectedAdFormatIds: selectedFormatIds,
        proposedFormatPrices: selectedFormatPrices,
      });
    },
    onSuccess: () => {
      if (selectedChannelId) {
        setLocalAppliedChannelIds((previous) =>
          previous.includes(selectedChannelId)
            ? previous
            : [...previous, selectedChannelId],
        );
      }

      setApplied(true);
      toast(inAppToasts.discovery.applicationSent);
    },
    onError: (error) => {
      const errorMessage = getApiErrorMessage(error) || "Please try again in a moment.";

      if (selectedChannelId && errorMessage.toLowerCase().includes("already applied")) {
        setLocalAppliedChannelIds((previous) =>
          previous.includes(selectedChannelId)
            ? previous
            : [...previous, selectedChannelId],
        );
      }

      toast(inAppToasts.discovery.applicationSendFailed(errorMessage));
    },
  });

  const canApply = Boolean(
    selectedChannelId
    && briefDetailsQuery.data
    && selectedFormatIds.length > 0
    && proposedPrice
    && !hasInvalidPrice
    && message.trim().length >= 10
    && !applyMutation.isPending
    && !channelsQuery.isLoading,
  );

  const resolvedBudget = useMemo(() => {
    if (!briefDetailsQuery.data) {
      return brief?.budget ?? 0;
    }

    return (
      parseAmount(briefDetailsQuery.data.totalBudget)
      || parseAmount(briefDetailsQuery.data.budgetMax)
      || parseAmount(briefDetailsQuery.data.budgetMin)
      || brief?.budget
      || 0
    );
  }, [briefDetailsQuery.data, brief?.budget]);

  const resolvedCurrency = normalizeCurrency(briefDetailsQuery.data?.currency || brief?.currency);
  const resolvedDeadline = briefDetailsQuery.data?.desiredEndDate || brief?.deadline || new Date().toISOString();
  const isOwnBrief = Boolean(
    currentUserId
    && (
      briefDetailsQuery.data?.advertiser?.id === currentUserId
      || brief?.advertiserId === currentUserId
    ),
  );

  const resetSheetState = () => {
    setSelectedChannelId(null);
    setMessage("");
    setApplied(false);
    setSelectedFormatIds([]);
    setFormatPrices({});
    setLocalAppliedChannelIds([]);
    applyMutation.reset();
  };

  useEffect(() => {
    resetSheetState();
  }, [briefId]);

  const handleApply = () => {
    if (!canApply) return;
    if (isOwnBrief) {
      toast(inAppToasts.discovery.ownBriefWarning);
      return;
    }

    applyMutation.mutate();
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetSheetState();
    }
    onOpenChange(isOpen);
  };

  const toggleFormat = (formatId: string) => {
    const format = availableFormats.find((entry) => entry.id === formatId);
    if (!format || !isAdFormatActive(format.normalizedType)) {
      return;
    }

    setSelectedFormatIds((previous) =>
      previous.includes(formatId)
        ? previous.filter((id) => id !== formatId)
        : [...previous, formatId],
    );
  };

  const updateFormatPrice = (formatId: string, price: string) => {
    setFormatPrices((previous) => ({
      ...previous,
      [formatId]: price,
    }));
  };

  if (!brief) return null;

  return (
    <AppSheet open={open} onOpenChange={handleClose} title="Brief Details" fullHeight>
      <div className="space-y-6">
        {/* Brief header */}
        <div className="space-y-2">
          <div>
            <Text type="title3" weight="medium">{brief.title}</Text>
            <Text type="caption1" color="secondary">Advertiser</Text>
          </div>
          <BriefMetaRow
            category={brief.category}
            categoryLabel={brief.categoryLabel}
            categoryIcon={brief.categoryIcon}
            format={brief.format}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Budget" value={formatCurrency(resolvedBudget, resolvedCurrency)} />
          <StatBox label="Min Subs" value={formatNumber(targetSubscribers)} />
          <StatBox label="Deadline" value={new Date(resolvedDeadline).toLocaleDateString("en", { month: "short", day: "numeric" })} />
        </div>

        {/* Description */}
        <div>
          <SectionLabel>Description</SectionLabel>
          <div className="mt-2">
            <Text type="body">{briefDetailsQuery.data?.description || brief.description}</Text>
          </div>
        </div>

        {briefDetailsQuery.isError && !briefDetailsQuery.data && (
          <div className="p-3 rounded-xl border border-warning/30 bg-warning/10 space-y-2">
            <Text type="caption1" color="secondary">
              Failed to load brief requirements. Retry to apply with the correct format options.
            </Text>
            <Button variant="outline" size="sm" onClick={() => briefDetailsQuery.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Applied success */}
        {applied ? (
          <div className="flex flex-col items-center gap-3 py-8 bg-secondary/30 rounded-xl">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <Text type="title3" weight="medium">Application Sent!</Text>
            <Text type="body" color="secondary">The advertiser will review your proposal and respond.</Text>
            <Button onClick={() => handleClose(false)} variant="outline" className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Apply section */}
            <div className="border-t border-border pt-5 space-y-4">
              <Text type="subheadline2" weight="medium">Apply to This Brief</Text>
              {isOwnBrief && (
                <div className="p-3 rounded-xl border border-warning/30 bg-warning/10">
                  <Text type="caption1" color="secondary">
                    This brief belongs to your account, so applying is disabled.
                  </Text>
                </div>
              )}

              {/* Channel selector */}
              <div className="space-y-1.5">
                <SectionLabel>Select Channel</SectionLabel>
                {channelsQuery.isLoading ? (
                  <div className="p-4 bg-secondary/30 rounded-xl text-center">
                    <Text type="body" color="secondary">Loading channels…</Text>
                  </div>
                ) : channelsQuery.isError ? (
                  <div className="p-4 bg-secondary/30 rounded-xl text-center space-y-2">
                    <Text type="body" color="secondary">Failed to load channels.</Text>
                    <Button variant="outline" size="sm" onClick={() => channelsQuery.refetch()}>
                      Try again
                    </Button>
                  </div>
                ) : (
                  <ChannelSelectList
                    channels={channelsForSelect}
                    selectedId={selectedChannelId}
                    onSelect={setSelectedChannelId}
                    disabledIds={disabledIds}
                    renderExtra={(channel) => {
                      const apiChannel = channelById.get(channel.id);
                      if (!apiChannel) {
                        return null;
                      }

                      const availableRequestedCount = apiChannel.formats
                        .map((format) => normalizeAdFormatType(format.type))
                        .filter((type) => requestedTypeSet.has(type))
                        .length;
                      const alreadyApplied = appliedChannelIdSet.has(channel.id);

                      return (
                        <Text type="caption2" color="tertiary">
                          {alreadyApplied
                            ? "Already applied"
                            : availableRequestedCount > 0
                            ? `${availableRequestedCount} requested format${availableRequestedCount > 1 ? "s" : ""}`
                            : "No requested formats"}
                        </Text>
                      );
                    }}
                  />
                )}
              </div>

              {/* Ad formats and pricing */}
              <div className="space-y-2">
                <SectionLabel>Ad Formats & Pricing</SectionLabel>
                <Text type="caption2" color="tertiary">
                  Only formats requested by advertiser are shown.
                </Text>
                {briefDetailsQuery.isLoading && !briefDetailsQuery.data ? (
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <Text type="caption1" color="secondary">Loading brief requirements…</Text>
                  </div>
                ) : !briefDetailsQuery.data ? (
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <Text type="caption1" color="secondary">Brief requirements are unavailable.</Text>
                  </div>
                ) : !selectedChannelId ? (
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <Text type="caption1" color="secondary">Select a channel to set pricing.</Text>
                  </div>
                ) : availableFormats.length === 0 ? (
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <Text type="caption1" color="secondary">
                      This channel has no active formats matching brief requirements.
                    </Text>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableFormats.map((format) => {
                      const selected = selectedFormatIds.includes(format.id);
                      const active = isAdFormatActive(format.normalizedType);
                      const invalid = selected && (
                        !formatPrices[format.id]
                        || Number(formatPrices[format.id]) <= 0
                      );

                      return (
                        <div
                          key={format.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            selected
                              ? "border-border bg-card"
                              : "border-border/50 bg-secondary/30 opacity-60"
                          } ${!active ? "opacity-60" : ""}`}
                        >
                          <button
                            onClick={() => toggleFormat(format.id)}
                            disabled={!active}
                            aria-pressed={selected}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              selected ? "border-primary bg-primary" : "border-muted-foreground"
                            } ${!active ? "cursor-not-allowed" : ""}`}
                          >
                            {selected && <span className="text-primary-foreground text-xs">✓</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <Text type="subheadline2" weight="medium">
                              {formatAdFormatTitle(format.normalizedType, format.name)}
                            </Text>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formatPrices[format.id] || ""}
                              onChange={(event) => updateFormatPrice(format.id, event.target.value)}
                              disabled={!selected || !active}
                              placeholder="0"
                              className={`w-24 h-9 px-2 rounded-lg bg-secondary border-0 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                                invalid ? "ring-1 ring-destructive" : ""
                              }`}
                            />
                            <Text type="caption2" color="tertiary">{format.priceCurrency}</Text>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <SectionLabel>Message to Advertiser</SectionLabel>
                <textarea
                  placeholder="Explain why your channel is a great fit..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleApply}
                disabled={!canApply || isOwnBrief}
                className="w-full"
              >
                <Send className="h-4 w-4" />
                {applyMutation.isPending ? "Sending..." : "Send Application"}
              </Button>
            </div>
          </>
        )}
      </div>
    </AppSheet>
  );
}
