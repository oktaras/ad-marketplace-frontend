import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Text } from "@telegram-tools/ui-kit";
import { SlidersHorizontal } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/common/PageContainer";
import { HorizontalScrollRow } from "@/components/common/HorizontalScrollRow";
import { FilterSortSheet, type FilterSortState } from "@/components/common/FilterSortSheet";
import { ActiveFilters, type ActiveFilterChip } from "@/components/common/ActiveFilters";
import { useRole } from "@/contexts/RoleContext";
import { DealCard } from "@/components/deals/DealCard";
import { DealDetailSheet } from "@/components/deals/DealDetailSheet";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { ListPageLoader } from "@/components/common/ListPageLoader";
import {
  acceptDealTerms,
  approveDealCreative,
  cancelDeal,
  fundDeal,
  getDealById,
  getDeals,
  requestDealCreativeRevision,
  submitDealCreative,
  type SubmitDealCreativePayload,
  type DealListFormat,
  type DealListSort,
  type UiDealFilter,
  verifyDealPayment,
} from "@/shared/api/deals";
import { prepareDealCreativeMediaUploads, uploadPreparedCreativeMediaFile } from "@/shared/api/media";
import { getApiErrorMessage } from "@/shared/api/error";
import { toast } from "@/hooks/use-toast";
import {
  DISCOVERY_LIMIT,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_LENGTH,
  useDebouncedValue,
  useInfiniteScroll,
} from "@/pages/discovery/utils";
import { inAppEmptyStates, inAppToasts } from "@/shared/notifications/in-app";
import type { CreativeMedia, InlineButton } from "@/types/deal";
import type { DealEscrowStatus } from "@/types/deal";
import { useSwipeTabNavigation } from "@/hooks/use-touch-gestures";
import { useTabContentTransition } from "@/hooks/use-tab-content-transition";

type DealFilter = UiDealFilter;
type DealSort = DealListSort;
type DealRangeKey = "price";

const STATUS_FILTERS: Record<DealFilter, { value: DealFilter; label: string; icon: string }> = {
  all: { value: "all", label: "All Deals", icon: "🤝" },
  negotiation: { value: "negotiation", label: "Negotiation", icon: "💬" },
  awaiting_creative: { value: "awaiting_creative", label: "Awaiting Creative", icon: "✏️" },
  creative_review: { value: "creative_review", label: "In Review", icon: "👀" },
  revision_requested: { value: "revision_requested", label: "Revision", icon: "🔄" },
  approved: { value: "approved", label: "Approved", icon: "✅" },
  published: { value: "published", label: "Published", icon: "📢" },
  completed: { value: "completed", label: "Completed", icon: "🎉" },
  cancelled: { value: "cancelled", label: "Cancelled", icon: "❌" },
};

const DEAL_SORT_OPTIONS: Array<{ value: DealSort; label: string }> = [
  { value: "created_desc", label: "Created: New → Old" },
  { value: "created_asc", label: "Created: Old → New" },
  { value: "updated_desc", label: "Updated: New → Old" },
  { value: "updated_asc", label: "Updated: Old → New" },
];

const DEAL_FORMAT_OPTIONS: Array<{ value: DealListFormat; label: string; icon: string }> = [
  { value: "post", label: "Post", icon: "📝" },
  { value: "story", label: "Story", icon: "📸" },
  { value: "repost", label: "Repost", icon: "🔁" },
];

const DEAL_ESCROW_STATUS_OPTIONS: Array<{ value: DealEscrowStatus; label: string }> = [
  { value: "NONE", label: "No Escrow" },
  { value: "PENDING", label: "Pending" },
  { value: "HELD", label: "Held" },
  { value: "RELEASING", label: "Releasing" },
  { value: "RELEASED", label: "Released" },
  { value: "REFUNDING", label: "Refunding" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "PARTIAL_REFUND", label: "Partial Refund" },
];

const DEAL_FILTER_ORDER = Object.keys(STATUS_FILTERS) as DealFilter[];

const DEAL_RANGE_OPTIONS = [
  { key: "price", label: "Price", step: "1", fromPlaceholder: "From", toPlaceholder: "To" },
] as const;

const INITIAL_DEAL_RANGES: Record<DealRangeKey, { from: string; to: string }> = {
  price: { from: "", to: "" },
};

const DEAL_FORMAT_VALUES = new Set<DealListFormat>(DEAL_FORMAT_OPTIONS.map((option) => option.value));
const DEAL_ESCROW_STATUS_VALUES = new Set<DealEscrowStatus>(DEAL_ESCROW_STATUS_OPTIONS.map((option) => option.value));

function isDealFormatValue(value: string): value is DealListFormat {
  return DEAL_FORMAT_VALUES.has(value as DealListFormat);
}

function isDealEscrowStatusValue(value: string): value is DealEscrowStatus {
  return DEAL_ESCROW_STATUS_VALUES.has(value as DealEscrowStatus);
}

function hasAnyRangeValue(ranges: Record<DealRangeKey, { from: string; to: string }>): boolean {
  return Object.values(ranges).some((range) => range.from.trim().length > 0 || range.to.trim().length > 0);
}

function formatRangeLabel(label: string, from: string, to: string): string {
  const fromValue = from.trim();
  const toValue = to.trim();
  if (fromValue && toValue) {
    return `${label}: ${fromValue} - ${toValue}`;
  }

  if (fromValue) {
    return `${label}: from ${fromValue}`;
  }

  return `${label}: to ${toValue}`;
}

export default function Deals() {
  const { role } = useRole();
  const navigate = useNavigate();
  const { id: routeDealId } = useParams();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<DealFilter>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterSortState<DealSort>>({
    search: "",
    categories: [],
    statuses: [],
    sort: "created_desc",
    ranges: INITIAL_DEAL_RANGES,
  });

  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const normalizedSearch = debouncedSearch.trim();
  const activeSearch = normalizedSearch.length >= SEARCH_MIN_LENGTH ? normalizedSearch : "";
  const waitingForSearchThreshold = normalizedSearch.length > 0 && normalizedSearch.length < SEARCH_MIN_LENGTH;
  const dealRanges: Record<DealRangeKey, { from: string; to: string }> = {
    ...INITIAL_DEAL_RANGES,
    ...(filters.ranges ?? {}),
  };
  const categoryKey = filters.categories.slice().sort().join(",");
  const statusKey = filters.statuses.slice().sort().join(",");
  const rangesKey = [dealRanges.price.from, dealRanges.price.to].join("|");
  const selectedFormats = filters.categories.filter(isDealFormatValue);
  const selectedEscrowStatuses = filters.statuses.filter(isDealEscrowStatusValue);
  const hasActiveFilters = Boolean(
    filters.search.trim().length > 0
    || selectedFormats.length > 0
    || selectedEscrowStatuses.length > 0
    || hasAnyRangeValue(dealRanges),
  );

  const dealsQuery = useInfiniteQuery({
    queryKey: ["deals", role, selectedFilter, categoryKey, statusKey, activeSearch, filters.sort, rangesKey],
    enabled: Boolean(role),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getDeals({
        role,
        statusFilter: selectedFilter,
        search: activeSearch,
        adFormats: selectedFormats,
        escrowStatuses: selectedEscrowStatuses,
        sortBy: filters.sort,
        page: pageParam,
        limit: DISCOVERY_LIMIT,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page >= lastPage.pagination.pages) {
        return undefined;
      }

      return lastPage.pagination.page + 1;
    },
  });

  const deals = useMemo(
    () => dealsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [dealsQuery.data],
  );
  const minPriceFilter = dealRanges.price.from.trim().length > 0 ? Number(dealRanges.price.from) : null;
  const maxPriceFilter = dealRanges.price.to.trim().length > 0 ? Number(dealRanges.price.to) : null;
  const dealsWithRangeFilter = useMemo(
    () =>
      deals.filter((deal) => {
        if (minPriceFilter !== null && Number.isFinite(minPriceFilter) && deal.agreedPrice < minPriceFilter) {
          return false;
        }

        if (maxPriceFilter !== null && Number.isFinite(maxPriceFilter) && deal.agreedPrice > maxPriceFilter) {
          return false;
        }

        return true;
      }),
    [deals, maxPriceFilter, minPriceFilter],
  );
  const hasPriceRangeFilter = Boolean(
    (dealRanges.price.from.trim() && Number.isFinite(Number(dealRanges.price.from)))
    || (dealRanges.price.to.trim() && Number.isFinite(Number(dealRanges.price.to))),
  );
  const totalDeals = dealsQuery.data?.pages[0]?.pagination.total ?? dealsWithRangeFilter.length;
  const displayedDealsCount = hasPriceRangeFilter ? dealsWithRangeFilter.length : totalDeals;
  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (filters.search.trim()) {
      chips.push({
        key: "search",
        label: `Search: ${filters.search.trim()}`,
        onRemove: () => setFilters((previous) => ({ ...previous, search: "" })),
      });
    }

    selectedFormats.forEach((format) => {
      const label = DEAL_FORMAT_OPTIONS.find((option) => option.value === format)?.label ?? format;
      chips.push({
        key: `format-${format}`,
        label: `Format: ${label}`,
        onRemove: () =>
          setFilters((previous) => ({
            ...previous,
            categories: previous.categories.filter((entry) => entry !== format),
          })),
      });
    });

    selectedEscrowStatuses.forEach((status) => {
      const label = DEAL_ESCROW_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
      chips.push({
        key: `escrow-${status}`,
        label: `Escrow: ${label}`,
        onRemove: () =>
          setFilters((previous) => ({
            ...previous,
            statuses: previous.statuses.filter((entry) => entry !== status),
          })),
      });
    });

    if (dealRanges.price.from.trim() || dealRanges.price.to.trim()) {
      chips.push({
        key: "range-price",
        label: formatRangeLabel("Price", dealRanges.price.from, dealRanges.price.to),
        onRemove: () =>
          setFilters((previous) => ({
            ...previous,
            ranges: {
              ...(previous.ranges ?? {}),
              price: { from: "", to: "" },
            },
          })),
      });
    }

    return chips;
  }, [dealRanges.price.from, dealRanges.price.to, filters.search, selectedEscrowStatuses, selectedFormats]);

  const selectedDealFromList = useMemo(
    () => (routeDealId ? deals.find((deal) => deal.id === routeDealId) ?? null : null),
    [deals, routeDealId],
  );

  const selectedDealQuery = useQuery({
    queryKey: ["deal", routeDealId],
    enabled: Boolean(routeDealId),
    queryFn: () => getDealById(routeDealId!),
  });

  const selectedDeal = selectedDealQuery.data ?? selectedDealFromList ?? null;

  useEffect(() => {
    if (routeDealId && selectedDealQuery.isFetched && !selectedDeal) {
      navigate("/deals", { replace: true });
    }
  }, [routeDealId, selectedDealQuery.isFetched, selectedDeal, navigate]);

  const refreshDeals = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["deals"] }),
      queryClient.invalidateQueries({ queryKey: ["deal"] }),
    ]);
  }, [queryClient]);

  const acceptTermsMutation = useMutation({
    mutationFn: acceptDealTerms,
    onSuccess: async () => {
      toast(inAppToasts.deals.termsAccepted);
      await refreshDeals();
    },
    onError: (error) => {
      toast(inAppToasts.deals.termsAcceptFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const fundDealMutation = useMutation({
    mutationFn: fundDeal,
    onSuccess: async (result) => {
      const deepLink = result.transaction?.deepLink;
      if (deepLink) {
        window.open(deepLink, "_blank", "noopener,noreferrer");
      }

      toast(inAppToasts.deals.paymentPrepared(
        deepLink ? "Wallet deeplink opened." : "Use returned escrow details to complete payment.",
      ));
      await refreshDeals();
    },
    onError: (error) => {
      toast(inAppToasts.deals.paymentPrepareFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: verifyDealPayment,
    onSuccess: async (result) => {
      if (result.funded) {
        toast(inAppToasts.deals.paymentVerified);
      } else if (result.invalidFunding) {
        toast(inAppToasts.deals.fundingMismatch);
      } else {
        toast(inAppToasts.deals.paymentNotDetected);
      }

      await refreshDeals();
    },
    onError: (error) => {
      toast(inAppToasts.deals.paymentVerifyFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const submitCreativeMutation = useMutation({
    mutationFn: async ({
      dealId,
      payload,
    }: {
      dealId: string;
      payload: { text: string; media: CreativeMedia[]; inlineButtons: InlineButton[] };
    }) => {
      const uploadCandidates = payload.media.filter((entry) => entry.file instanceof File);
      const preparedUploads = uploadCandidates.length > 0
        ? await prepareDealCreativeMediaUploads(
          dealId,
          uploadCandidates.map((entry) => ({
            clientId: entry.id,
            name: entry.name,
            mimeType: entry.file?.type || entry.mimeType || (entry.type === "video" ? "video/mp4" : "image/jpeg"),
            sizeBytes: entry.file?.size || entry.sizeBytes || 0,
          })),
        )
        : [];

      const uploadsByClientId = new Map(preparedUploads.map((entry) => [entry.clientId, entry]));
      const uploadedMedia: NonNullable<SubmitDealCreativePayload["media"]> = [];

      for (const entry of payload.media) {
        const mediaType: "IMAGE" | "VIDEO" = entry.type === "video" ? "VIDEO" : "IMAGE";
        if (entry.file instanceof File) {
          const prepared = uploadsByClientId.get(entry.id);
          if (!prepared) {
            throw new Error(`Missing upload instructions for media item ${entry.id}`);
          }

          const uploaded = await uploadPreparedCreativeMediaFile(prepared, entry.file);
          uploadedMedia.push({
            url: uploaded.url,
            type: mediaType,
            name: entry.name,
            mimeType: entry.file.type || entry.mimeType,
            sizeBytes: entry.file.size || entry.sizeBytes,
            provider: uploaded.provider,
            storageKey: uploaded.storageKey,
          });
          continue;
        }

        if (!entry.url || entry.url.startsWith("blob:")) {
          continue;
        }

        uploadedMedia.push({
          url: entry.url,
          type: mediaType,
          name: entry.name,
          mimeType: entry.mimeType,
          sizeBytes: entry.sizeBytes,
          provider: entry.provider,
          storageKey: entry.storageKey,
        });
      }

      const submitPayload: SubmitDealCreativePayload = {
        text: payload.text,
        buttons: payload.inlineButtons.map((button) => ({ text: button.label, url: button.url })),
      };

      if (uploadedMedia.length > 0) {
        submitPayload.media = uploadedMedia;
        submitPayload.mediaUrls = uploadedMedia.map((entry) => entry.url);
        submitPayload.mediaTypes = uploadedMedia.map((entry) => entry.type);
      }

      await submitDealCreative(dealId, submitPayload);
    },
    onSuccess: async () => {
      toast(inAppToasts.deals.creativeSubmitted);
      await refreshDeals();
    },
    onError: (error) => {
      toast(inAppToasts.deals.creativeSubmitFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const approveCreativeMutation = useMutation({
    mutationFn: approveDealCreative,
    onSuccess: async () => {
      toast(inAppToasts.deals.creativeApproved);
      await refreshDeals();
    },
    onError: (error) => {
      toast(inAppToasts.deals.creativeApproveFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const requestRevisionMutation = useMutation({
    mutationFn: ({ dealId, feedback }: { dealId: string; feedback: string }) =>
      requestDealCreativeRevision(dealId, feedback),
    onSuccess: async () => {
      toast(inAppToasts.deals.revisionRequested);
      await refreshDeals();
    },
    onError: (error) => {
      toast(inAppToasts.deals.revisionRequestFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const cancelDealMutation = useMutation({
    mutationFn: cancelDeal,
    onSuccess: async () => {
      toast(inAppToasts.deals.dealCancelled);
      await refreshDeals();
    },
    onError: (error) => {
      toast(inAppToasts.deals.dealCancelFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const clearFilters = () => {
    setFilters((previous) => ({
      ...previous,
      search: "",
      categories: [],
      statuses: [],
      ranges: INITIAL_DEAL_RANGES,
    }));
  };

  const resetAllFilters = () => {
    clearFilters();
    setSelectedFilter("all");
  };

  const loadNextPage = useCallback(() => {
    if (dealsQuery.hasNextPage && !dealsQuery.isFetchingNextPage) {
      void dealsQuery.fetchNextPage();
    }
  }, [dealsQuery]);

  const sentinelRef = useInfiniteScroll({
    enabled: Boolean(dealsQuery.hasNextPage) && !dealsQuery.isLoading && !dealsQuery.isFetchingNextPage && !dealsQuery.isError,
    onLoadMore: loadNextPage,
  });

  const tabSwipeHandlers = useSwipeTabNavigation({
    tabOrder: DEAL_FILTER_ORDER,
    activeTab: selectedFilter,
    onTabChange: (nextTab) => setSelectedFilter(nextTab),
  });
  const tabTransitionClass = useTabContentTransition(selectedFilter, DEAL_FILTER_ORDER);

  return (
    <AppLayout>
      <PageContainer className="py-3 space-y-4" {...tabSwipeHandlers}>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setFilterSheetOpen(true)}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-border bg-card text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters & Sort
          </button>
        </div>

        <ActiveFilters
          filters={activeFilterChips}
          onClearAll={hasActiveFilters ? clearFilters : undefined}
        />

        {waitingForSearchThreshold ? (
          <Text type="caption2" color="tertiary">
            Enter at least {SEARCH_MIN_LENGTH} characters to start searching.
          </Text>
        ) : null}

        <HorizontalScrollRow>
          <div className="flex gap-2" role="tablist">
            {DEAL_FILTER_ORDER.map((filterKey) => {
              const filter = STATUS_FILTERS[filterKey];
              const isActive = selectedFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedFilter(filter.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </HorizontalScrollRow>

        <Text type="caption1" color="tertiary">
          {`${displayedDealsCount} deal${displayedDealsCount !== 1 ? "s" : ""}`}
        </Text>

        <div className={tabTransitionClass}>
          {dealsQuery.isError ? (
            <EmptyState
              emoji={inAppEmptyStates.dealsLoadFailed.emoji}
              title={inAppEmptyStates.dealsLoadFailed.title}
              description={inAppEmptyStates.dealsLoadFailed.description}
              secondaryAction={{
                label: inAppEmptyStates.dealsLoadFailed.secondaryActionLabel || "Retry",
                onClick: () => dealsQuery.refetch(),
              }}
            />
          ) : dealsQuery.isLoading ? (
            <ListPageLoader label="Loading deals…" />
          ) : dealsWithRangeFilter.length === 0 ? (
            <EmptyState
              emoji={selectedFilter === "all" && !hasActiveFilters ? "🤝" : STATUS_FILTERS[selectedFilter].icon}
              title={
                selectedFilter === "all" && !hasActiveFilters
                  ? "No deals yet"
                  : hasActiveFilters
                    ? "No deals match selected filters"
                    : `No ${STATUS_FILTERS[selectedFilter].label.toLowerCase()} deals`
              }
              description={
                selectedFilter === "all" && !hasActiveFilters
                  ? role === "advertiser"
                    ? "You don't have any deals. Explore channels to start a deal."
                    : "You don't have any deals yet. Deals from briefs and listings will appear here."
                  : hasActiveFilters
                    ? "Try changing filters to see more deals."
                    : `No deals with ${STATUS_FILTERS[selectedFilter].label.toLowerCase()} status.`
              }
              actionLabel={selectedFilter !== "all" || hasActiveFilters ? "Clear Filters" : undefined}
              onAction={selectedFilter !== "all" || hasActiveFilters ? resetAllFilters : undefined}
            />
          ) : (
            <div className="space-y-3">
              {dealsWithRangeFilter.map((deal) => (
                <DealCard key={deal.id} deal={deal} onSelect={(selected) => navigate(`/deals/${selected.id}`)} />
              ))}
              <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                {dealsQuery.isFetchingNextPage ? (
                  <ListPageLoader inline label="Loading more…" />
                ) : dealsQuery.hasNextPage ? (
                  <Text type="caption2" color="tertiary">Scroll to load more</Text>
                ) : (
                  <Text type="caption2" color="tertiary">No more deals</Text>
                )}
              </div>
            </div>
          )}
        </div>
      </PageContainer>

      <FilterSortSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        title="Filter Deals"
        value={filters}
        onApply={setFilters}
        sortOptions={DEAL_SORT_OPTIONS}
        categoryOptions={DEAL_FORMAT_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
          icon: option.icon,
        }))}
        statusOptions={DEAL_ESCROW_STATUS_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        showCategory
        showStatus
        searchPlaceholder="Search by deal, brief, channel…"
        rangeOptions={DEAL_RANGE_OPTIONS.map((option) => ({
          key: option.key,
          label: option.label,
          step: option.step,
          fromPlaceholder: option.fromPlaceholder,
          toPlaceholder: option.toPlaceholder,
        }))}
      />

      <DealDetailSheet
        deal={selectedDeal}
        open={Boolean(routeDealId && selectedDeal)}
        onOpenChange={(open) => !open && navigate("/deals")}
        onAcceptTerms={(dealId) => acceptTermsMutation.mutate(dealId)}
        acceptTermsLoading={acceptTermsMutation.isPending && acceptTermsMutation.variables === selectedDeal?.id}
        onFundDeal={(dealId) => fundDealMutation.mutate(dealId)}
        fundDealLoading={fundDealMutation.isPending && fundDealMutation.variables === selectedDeal?.id}
        onVerifyPayment={(dealId) => verifyPaymentMutation.mutate(dealId)}
        verifyPaymentLoading={verifyPaymentMutation.isPending && verifyPaymentMutation.variables === selectedDeal?.id}
        onSubmitCreative={(dealId, payload) =>
          submitCreativeMutation.mutateAsync({
            dealId,
            payload,
          })
        }
        submitCreativeLoading={
          submitCreativeMutation.isPending && submitCreativeMutation.variables?.dealId === selectedDeal?.id
        }
        onApproveCreative={(dealId) => approveCreativeMutation.mutate(dealId)}
        approveCreativeLoading={approveCreativeMutation.isPending && approveCreativeMutation.variables === selectedDeal?.id}
        onRequestCreativeRevision={(dealId, feedback) => requestRevisionMutation.mutate({ dealId, feedback })}
        requestCreativeRevisionLoading={
          requestRevisionMutation.isPending && requestRevisionMutation.variables?.dealId === selectedDeal?.id
        }
        onCancelDeal={(dealId) => cancelDealMutation.mutate(dealId)}
        cancelDealLoading={cancelDealMutation.isPending && cancelDealMutation.variables === selectedDeal?.id}
        onPostingPlanUpdated={refreshDeals}
      />
    </AppLayout>
  );
}
