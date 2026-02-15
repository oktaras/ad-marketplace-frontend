import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Text } from "@telegram-tools/ui-kit";
import { Plus, SlidersHorizontal } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/common/PageContainer";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusTabs } from "@/components/common/StatusTabs";
import { Button } from "@/components/ui/button";
import { MyBriefCard } from "@/components/my-stuff/MyBriefCard";
import { CreateBriefSheet } from "@/components/my-stuff/CreateBriefSheet";
import { BriefDetailSheet } from "@/components/my-stuff/BriefDetailSheet";
import { AcceptApplicationFormatPicker } from "@/components/my-stuff/AcceptApplicationFormatPicker";
import { ActiveFilters, type ActiveFilterChip } from "@/components/common/ActiveFilters";
import { FilterSortSheet, type FilterSortState } from "@/components/common/FilterSortSheet";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "@/hooks/use-toast";
import { Brief } from "@/types/marketplace";
import type { BriefApplicationCardItem } from "@/components/discovery/ApplicationCard";
import type { CreateBriefFormData } from "@/components/my-stuff/CreateBriefSheet";
import { getBriefSavedChannels, getDiscoveryCategories, removeChannelFromBrief } from "@/shared/api/discovery";
import {
  createMyBrief,
  deleteMyBrief,
  getMyBriefApplicationsForAdvertiser,
  getMyBriefs,
  type MyBriefApplicationItem,
  type UpdateMyBriefPayload,
  updateMyBrief,
  updateMyBriefApplication,
} from "@/shared/api/my-stuff";
import {
  buildCategoryMap,
  buildCategoryOptions,
  DISCOVERY_LIMIT,
  mapDiscoveryBrief,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_LENGTH,
  useDebouncedValue,
  useInfiniteScroll,
} from "@/pages/discovery/utils";
import { inAppEmptyStates, inAppToasts } from "@/shared/notifications/in-app";
import { normalizeCurrency } from "@/types/currency";

type BriefSort = "budget_desc" | "budget_asc" | "deadline_asc" | "subs_desc" | "created_desc";
type MutableBriefStatus = NonNullable<UpdateMyBriefPayload["status"]>;

const BRIEF_SORT_OPTIONS: { value: BriefSort; label: string }[] = [
  { value: "created_desc", label: "Newest first" },
  { value: "budget_desc", label: "Budget: High → Low" },
  { value: "budget_asc", label: "Budget: Low → High" },
  { value: "deadline_asc", label: "Deadline: Soonest" },
  { value: "subs_desc", label: "Min Subs: Highest" },
];

function getApiErrorMessage(error: unknown): string {
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

  return "Please try again in a moment.";
}

function mapBriefFormatToApi(format: CreateBriefFormData["format"]): "POST" | "STORY" | "REPOST" {
  if (format === "story") {
    return "STORY";
  }

  if (format === "repost") {
    return "REPOST";
  }

  return "POST";
}

function toIsoEndOfDay(deadlineDate: string): string {
  const iso = new Date(`${deadlineDate}T23:59:59.000Z`).toISOString();
  return iso;
}

function parseAmount(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapApplicationStatus(status: string): "pending" | "accepted" | "rejected" {
  const normalized = status.toUpperCase();
  if (normalized === "ACCEPTED") {
    return "accepted";
  }

  if (normalized === "REJECTED") {
    return "rejected";
  }

  return "pending";
}

function mapMyBriefApplicationToCard(
  application: MyBriefApplicationItem,
  currency: string,
): BriefApplicationCardItem {
  const channel = application.channel;
  const primaryCategory = channel?.categories?.[0];

  return {
    id: application.id,
    briefId: application.briefId,
    channelId: application.channelId,
    channelName: channel?.title || "Untitled channel",
    channelAvatar: primaryCategory?.icon || "📡",
    channelUsername: channel?.username
      ? (channel.username.startsWith("@") ? channel.username : `@${channel.username}`)
      : "@unknown",
    subscribers: channel?.currentStats?.subscriberCount ?? 0,
    proposedPrice: parseAmount(application.proposedPrice),
    currency,
    message: application.pitch || "No message",
    status: mapApplicationStatus(application.status),
    appliedAt: application.createdAt,
  };
}

export default function MyBriefs() {
  const { role } = useRole();
  const queryClient = useQueryClient();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterSortState<BriefSort>>({
    search: "",
    categories: [],
    statuses: [],
    sort: "created_desc",
  });
  const [briefTab, setBriefTab] = useState<"active" | "closed">("active");
  const [createBriefOpen, setCreateBriefOpen] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [acceptPickerState, setAcceptPickerState] = useState<{
    applicationId: string;
    channelName: string;
    options: Array<{ id: string; name: string; price: number; currency: string }>;
  } | null>(null);
  const [removingSavedChannelId, setRemovingSavedChannelId] = useState<string | null>(null);
  const selectedBriefId = selectedBrief?.id ?? "";

  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const normalizedSearch = debouncedSearch.trim();
  const activeSearch = normalizedSearch.length >= SEARCH_MIN_LENGTH ? normalizedSearch : "";
  const waitingForSearchThreshold = normalizedSearch.length > 0 && normalizedSearch.length < SEARCH_MIN_LENGTH;
  const categoryKey = filters.categories.slice().sort().join(",");
  const hasActiveFilters = Boolean(filters.search.trim() || filters.categories.length > 0);

  const categoriesQuery = useQuery({
    queryKey: ["my-briefs", "categories"],
    queryFn: getDiscoveryCategories,
  });

  const categories = categoriesQuery.data ?? [];

  const categoryBySlug = useMemo(
    () => buildCategoryMap(categories),
    [categories],
  );

  const categoryOptions = useMemo(
    () => buildCategoryOptions(categories),
    [categories],
  );
  const categoryNameBySlug = useMemo(
    () => new Map(categoryOptions.map((category) => [category.slug, category.name])),
    [categoryOptions],
  );
  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (filters.search.trim()) {
      chips.push({
        key: "search",
        label: `Search: ${filters.search.trim()}`,
        onRemove: () => setFilters((previous) => ({ ...previous, search: "" })),
      });
    }

    filters.categories.forEach((slug) => {
      chips.push({
        key: `category-${slug}`,
        label: categoryNameBySlug.get(slug) ?? slug,
        onRemove: () => setFilters((previous) => ({
          ...previous,
          categories: previous.categories.filter((entry) => entry !== slug),
        })),
      });
    });

    return chips;
  }, [categoryNameBySlug, filters.categories, filters.search]);

  const briefsQuery = useInfiniteQuery({
    queryKey: ["my-briefs", briefTab, categoryKey, activeSearch, filters.sort],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getMyBriefs({
        categories: filters.categories,
        search: activeSearch,
        status: briefTab === "active" ? "open" : "closed",
        sortBy: filters.sort,
        limit: DISCOVERY_LIMIT,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page >= lastPage.pagination.pages) {
        return undefined;
      }

      return lastPage.pagination.page + 1;
    },
  });

  const allBriefs = useMemo(
    () => briefsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [briefsQuery.data],
  );

  const briefs = useMemo(
    () => allBriefs.map((brief) => mapDiscoveryBrief(brief, categoryBySlug)),
    [allBriefs, categoryBySlug],
  );

  const totalBriefs = briefsQuery.data?.pages[0]?.pagination.total ?? briefs.length;
  const isLoading = categoriesQuery.isLoading || briefsQuery.isLoading;

  const clearFilters = () => {
    setFilters((previous) => ({
      ...previous,
      search: "",
      categories: [],
      statuses: [],
    }));
  };

  const loadNextPage = useCallback(() => {
    if (briefsQuery.hasNextPage && !briefsQuery.isFetchingNextPage) {
      void briefsQuery.fetchNextPage();
    }
  }, [briefsQuery]);

  const sentinelRef = useInfiniteScroll({
    enabled: Boolean(briefsQuery.hasNextPage) && !isLoading && !briefsQuery.isFetchingNextPage && !briefsQuery.isError,
    onLoadMore: loadNextPage,
  });

  const applicationsQuery = useQuery({
    queryKey: ["my-briefs", "applications", selectedBriefId],
    enabled: Boolean(selectedBriefId),
    queryFn: () => getMyBriefApplicationsForAdvertiser(selectedBriefId),
  });

  const savedChannelsQuery = useQuery({
    queryKey: ["brief-saved-channels", selectedBriefId],
    enabled: Boolean(selectedBriefId),
    queryFn: () => getBriefSavedChannels(selectedBriefId),
  });

  const rawApplications = applicationsQuery.data ?? [];

  const applicationsById = useMemo(
    () => new Map(rawApplications.map((application) => [application.id, application])),
    [rawApplications],
  );

  const applications = useMemo(() => {
    if (!selectedBrief) {
      return [] as BriefApplicationCardItem[];
    }

    return rawApplications.map((application) => mapMyBriefApplicationToCard(application, selectedBrief.currency));
  }, [rawApplications, selectedBrief]);

  const createBriefMutation = useMutation({
    mutationFn: (form: CreateBriefFormData) => {
      const normalizedBudget = Math.max(0, form.budget || 0).toString();

      return createMyBrief({
        title: form.title.trim(),
        description: form.description.trim(),
        adFormatTypes: [mapBriefFormatToApi(form.format)],
        targetCategories: [form.category],
        minSubscribers: form.targetSubscribers > 0 ? form.targetSubscribers : undefined,
        budgetMin: normalizedBudget,
        budgetMax: normalizedBudget,
        totalBudget: normalizedBudget,
        currency: form.currency,
        desiredEndDate: toIsoEndOfDay(form.deadline),
      });
    },
    onSuccess: () => {
      toast(inAppToasts.myBriefs.briefPublished);
      setCreateBriefOpen(false);
      setBriefTab("active");
      void queryClient.invalidateQueries({ queryKey: ["my-briefs"] });
    },
    onError: (error) => {
      toast(inAppToasts.myBriefs.briefCreateFailed(getApiErrorMessage(error)));
    },
  });

  const updateBriefStatusMutation = useMutation({
    mutationFn: (params: { briefId: string; nextStatus: MutableBriefStatus }) =>
      updateMyBrief(params.briefId, {
        status: params.nextStatus,
      }),
    onSuccess: (_, params) => {
      setSelectedBrief((previous) =>
        previous && previous.id === params.briefId
          ? { ...previous, status: params.nextStatus }
          : previous,
      );
      toast(params.nextStatus === "ACTIVE" ? inAppToasts.myBriefs.briefReopened : inAppToasts.myBriefs.briefClosed);
      void queryClient.invalidateQueries({ queryKey: ["my-briefs"] });
    },
    onError: (error) => {
      toast(inAppToasts.myBriefs.briefUpdateFailed(getApiErrorMessage(error)));
    },
  });

  const deleteBriefMutation = useMutation({
    mutationFn: (briefId: string) => deleteMyBrief(briefId),
    onSuccess: () => {
      toast(inAppToasts.myBriefs.briefDeleted);
      setSelectedBrief(null);
      void queryClient.invalidateQueries({ queryKey: ["my-briefs"] });
    },
    onError: (error) => {
      toast(inAppToasts.myBriefs.briefDeleteFailed(getApiErrorMessage(error)));
    },
  });

  const removeSavedChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      if (!selectedBriefId) {
        throw new Error("Brief is unavailable.");
      }

      await removeChannelFromBrief(selectedBriefId, channelId);
      return channelId;
    },
    onMutate: (channelId) => {
      setRemovingSavedChannelId(channelId);
    },
    onSuccess: async () => {
      toast(inAppToasts.myBriefs.shortlistRemoved);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["brief-saved-channels", selectedBriefId] }),
        queryClient.invalidateQueries({ queryKey: ["my-briefs"] }),
      ]);
    },
    onError: (error) => {
      toast(inAppToasts.myBriefs.shortlistRemoveFailed(getApiErrorMessage(error)));
    },
    onSettled: () => {
      setRemovingSavedChannelId(null);
    },
  });

  const reviewApplicationMutation = useMutation({
    mutationFn: async (params: { applicationId: string; action: "accept" | "decline"; adFormatId?: string }) => {
      const application = applicationsById.get(params.applicationId);
      if (!application) {
        throw new Error("Application not found");
      }

      if (params.action === "accept") {
        if (!params.adFormatId) {
          throw new Error("Please choose an ad format.");
        }

        if (!application.channel?.adFormats?.some((format) => format.id === params.adFormatId)) {
          throw new Error("Selected ad format is unavailable for this channel.");
        }

        if (
          application.selectedAdFormatIds?.length > 0
          && !application.selectedAdFormatIds.includes(params.adFormatId)
        ) {
          throw new Error("Selected ad format is outside the publisher proposal.");
        }

        return updateMyBriefApplication(params.applicationId, {
          status: "ACCEPTED",
          adFormatId: params.adFormatId,
        });
      }

      return updateMyBriefApplication(params.applicationId, {
        status: "REJECTED",
      });
    },
    onSuccess: (result, params) => {
      if (params.action === "accept") {
        const dealNumber = result.deal?.dealNumber;
        toast(inAppToasts.myBriefs.applicationAccepted(
          typeof dealNumber === "number" ? `Deal #${dealNumber} created.` : "Deal created successfully.",
        ));
      } else {
        toast(inAppToasts.myBriefs.applicationDeclined);
      }

      void queryClient.invalidateQueries({ queryKey: ["my-briefs"] });
      void queryClient.invalidateQueries({ queryKey: ["my-briefs", "applications", selectedBriefId] });
      void queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (error) => {
      toast(inAppToasts.myBriefs.applicationUpdateFailed(getApiErrorMessage(error)));
    },
  });

  const handleCreateBrief = async (form: CreateBriefFormData) => {
    await createBriefMutation.mutateAsync(form);
  };

  const handleAcceptApplication = async (applicationId: string) => {
    const application = applicationsById.get(applicationId);
    if (!application) {
      toast(inAppToasts.myBriefs.applicationNotFound);
      return;
    }

    const allowedIds = new Set(
      application.selectedAdFormatIds.length > 0
        ? application.selectedAdFormatIds
        : application.channel?.adFormats.map((format) => format.id) ?? [],
    );

    const options = (application.channel?.adFormats ?? [])
      .filter((format) => allowedIds.has(format.id))
      .map((format) => ({
        id: format.id,
        name: format.name || format.type,
        price: Number(application.proposedFormatPrices[format.id] ?? application.proposedPrice ?? format.priceAmount ?? 0),
        currency: normalizeCurrency(selectedBrief?.currency || format.priceCurrency),
      }));

    if (options.length === 0) {
      toast(inAppToasts.myBriefs.noAdFormatOptions);
      return;
    }

    setAcceptPickerState({
      applicationId,
      channelName: application.channel?.title || "Untitled channel",
      options,
    });
  };

  const handleDeclineApplication = async (applicationId: string) => {
    await reviewApplicationMutation.mutateAsync({
      applicationId,
      action: "decline",
    });
  };

  const handleToggleBriefStatus = async (nextStatus: Brief["status"]) => {
    if (!selectedBrief) {
      return;
    }

    if (nextStatus !== "ACTIVE" && nextStatus !== "PAUSED") {
      return;
    }

    await updateBriefStatusMutation.mutateAsync({
      briefId: selectedBrief.id,
      nextStatus,
    });
  };

  const handleDeleteBrief = async () => {
    if (!selectedBrief) {
      return;
    }

    await deleteBriefMutation.mutateAsync(selectedBrief.id);
  };

  const handleConfirmAcceptApplication = async (adFormatId: string) => {
    if (!acceptPickerState) {
      return;
    }

    await reviewApplicationMutation.mutateAsync({
      applicationId: acceptPickerState.applicationId,
      action: "accept",
      adFormatId,
    });
    setAcceptPickerState(null);
  };

  if (role === "publisher") {
    return <Navigate to="/my-channels" replace />;
  }

  return (
    <AppLayout>
      <PageContainer className="py-4 space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setCreateBriefOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Create Brief
          </button>
        </div>

        <StatusTabs
          tabs={[
            { value: "active", label: "Active" },
            { value: "closed", label: "Closed" },
          ]}
          activeTab={briefTab}
          onTabChange={(tab) => setBriefTab(tab as "active" | "closed")}
        />

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => setFilterSheetOpen(true)} className="w-full">
            <SlidersHorizontal className="h-4 w-4" />
            Filters & Sort
          </Button>
        </div>

        <ActiveFilters
          filters={activeFilterChips}
          onClearAll={hasActiveFilters ? clearFilters : undefined}
        />

        <div className="pb-2 space-y-1">
          <Text type="caption1" color="tertiary">
            {`${totalBriefs} brief${totalBriefs !== 1 ? "s" : ""}`}
            {filters.categories.length > 0
              ? ` in ${filters.categories.length} categor${filters.categories.length === 1 ? "y" : "ies"}`
              : ""}
          </Text>
          {waitingForSearchThreshold && (
            <Text type="caption2" color="tertiary">
              Enter at least {SEARCH_MIN_LENGTH} characters to start searching.
            </Text>
          )}
        </div>

        <div className="pb-6 flex flex-col gap-3">
          {briefsQuery.isError ? (
            <EmptyState
              emoji={inAppEmptyStates.myBriefsLoadFailed.emoji}
              title={inAppEmptyStates.myBriefsLoadFailed.title}
              description={inAppEmptyStates.myBriefsLoadFailed.description}
              secondaryAction={{
                label: inAppEmptyStates.myBriefsLoadFailed.secondaryActionLabel || "Retry",
                onClick: () => briefsQuery.refetch(),
              }}
            />
          ) : isLoading ? (
            <Text type="caption1" color="tertiary">
              Loading…
            </Text>
          ) : briefs.length > 0 ? (
            <>
              {briefs.map((brief) => (
                <MyBriefCard key={brief.id} brief={brief} onClick={() => setSelectedBrief(brief)} />
              ))}
              <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                {briefsQuery.isFetchingNextPage ? (
                  <Text type="caption1" color="tertiary">Loading more…</Text>
                ) : briefsQuery.hasNextPage ? (
                  <Text type="caption2" color="tertiary">Scroll to load more</Text>
                ) : (
                  <Text type="caption2" color="tertiary">No more briefs</Text>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              emoji={briefTab === "active" ? "📋" : "📭"}
              title={briefTab === "active" ? "No active briefs" : "No closed briefs"}
              description={briefTab === "active" ? "Create your first brief to start receiving applications." : "Your closed briefs will appear here."}
              actionLabel={briefTab === "active" ? "Create Brief" : undefined}
              onAction={briefTab === "active" ? () => setCreateBriefOpen(true) : undefined}
              secondaryAction={hasActiveFilters ? { label: "Clear Filters", onClick: clearFilters } : undefined}
            />
          )}
        </div>
      </PageContainer>

      <CreateBriefSheet
        open={createBriefOpen}
        onOpenChange={setCreateBriefOpen}
        onCreate={handleCreateBrief}
        isSubmitting={createBriefMutation.isPending}
      />

      <BriefDetailSheet
        open={!!selectedBrief}
        brief={selectedBrief}
        applications={applications}
        savedChannels={savedChannelsQuery.data ?? []}
        isSavedChannelsLoading={savedChannelsQuery.isLoading}
        removingSavedChannelId={removingSavedChannelId}
        isApplicationsLoading={applicationsQuery.isLoading}
        onOpenChange={(open) => !open && setSelectedBrief(null)}
        onAcceptApplication={handleAcceptApplication}
        onDeclineApplication={handleDeclineApplication}
        onRemoveSavedChannel={async (channelId) => {
          await removeSavedChannelMutation.mutateAsync(channelId);
        }}
        onToggleBriefStatus={handleToggleBriefStatus}
        onDeleteBrief={handleDeleteBrief}
      />

      <FilterSortSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        title="Filter My Briefs"
        value={filters}
        onApply={setFilters}
        categoryOptions={categoryOptions.map((category) => ({
          value: category.slug,
          label: category.name,
          icon: category.icon,
        }))}
        sortOptions={BRIEF_SORT_OPTIONS}
        searchPlaceholder="Search briefs…"
      />

      <AcceptApplicationFormatPicker
        open={Boolean(acceptPickerState)}
        onOpenChange={(open) => !open && setAcceptPickerState(null)}
        channelName={acceptPickerState?.channelName ?? ""}
        options={acceptPickerState?.options ?? []}
        isSubmitting={reviewApplicationMutation.isPending}
        onConfirm={handleConfirmAcceptApplication}
      />
    </AppLayout>
  );
}
