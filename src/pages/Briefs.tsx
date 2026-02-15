import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/common/PageContainer";
import { BriefCard } from "@/components/discovery/BriefCard";
import { BriefApplySheet } from "@/components/discovery/BriefApplySheet";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSortSheet, type FilterSortState } from "@/components/common/FilterSortSheet";
import { ActiveFilters, type ActiveFilterChip } from "@/components/common/ActiveFilters";
import { Brief } from "@/types/marketplace";
import { Text } from "@telegram-tools/ui-kit";
import { SlidersHorizontal } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useAuthStore } from "@/features/auth/model/auth.store";
import { getDiscoveryBriefs, getDiscoveryCategories } from "@/shared/api/discovery";
import { inAppEmptyStates } from "@/shared/notifications/in-app";
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

type BriefSort = "budget_desc" | "budget_asc" | "deadline_asc" | "subs_desc" | "created_desc";

const BRIEF_SORT_OPTIONS: { value: BriefSort; label: string }[] = [
  { value: "created_desc", label: "Newest first" },
  { value: "budget_desc", label: "Budget: High → Low" },
  { value: "budget_asc", label: "Budget: Low → High" },
  { value: "deadline_asc", label: "Deadline: Soonest" },
  { value: "subs_desc", label: "Min Subs: Highest" },
];

export default function Briefs() {
  const { role } = useRole();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterSortState<BriefSort>>({
    search: "",
    categories: [],
    statuses: [],
    sort: "created_desc",
  });
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const normalizedSearch = debouncedSearch.trim();
  const activeSearch = normalizedSearch.length >= SEARCH_MIN_LENGTH ? normalizedSearch : "";
  const waitingForSearchThreshold = normalizedSearch.length > 0 && normalizedSearch.length < SEARCH_MIN_LENGTH;
  const categoryKey = filters.categories.slice().sort().join(",");
  const hasActiveFilters = Boolean(filters.search.trim() || filters.categories.length > 0);

  const categoriesQuery = useQuery({
    queryKey: ["briefs", "categories"],
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
    queryKey: ["briefs", "briefs", categoryKey, activeSearch, filters.sort],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getDiscoveryBriefs({
        categories: filters.categories,
        search: activeSearch,
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

  const visibleBriefs = useMemo(
    () => briefs.filter((brief) => !currentUserId || brief.advertiserId !== currentUserId),
    [briefs, currentUserId],
  );

  const totalBriefs = briefsQuery.data?.pages[0]?.pagination.total ?? visibleBriefs.length;
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

  if (role === "advertiser") {
    return <Navigate to="/listings" replace />;
  }

  return (
    <AppLayout>
      <PageContainer className="py-4 space-y-4">
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
        <Text type="caption1" color="tertiary">
          {`${totalBriefs} brief${totalBriefs !== 1 ? "s" : ""}`}
        </Text>

        <div className="pb-6 flex flex-col gap-3">
          {briefsQuery.isError ? (
            <EmptyState
              emoji={inAppEmptyStates.briefsLoadFailed.emoji}
              title={inAppEmptyStates.briefsLoadFailed.title}
              description={inAppEmptyStates.briefsLoadFailed.description}
              secondaryAction={{
                label: inAppEmptyStates.briefsLoadFailed.secondaryActionLabel || "Retry",
                onClick: () => briefsQuery.refetch(),
              }}
            />
          ) : isLoading ? (
            <Text type="caption1" color="tertiary">
              Loading…
            </Text>
          ) : visibleBriefs.length > 0 ? (
            <>
              {visibleBriefs.map((brief) => (
                <BriefCard key={brief.id} brief={brief} onClick={() => setSelectedBrief(brief)} />
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
              emoji={inAppEmptyStates.briefsNoResults.emoji}
              title={inAppEmptyStates.briefsNoResults.title}
              description={inAppEmptyStates.briefsNoResults.description}
              secondaryAction={
                hasActiveFilters
                  ? { label: inAppEmptyStates.briefsNoResults.secondaryActionLabel || "Clear Filters", onClick: clearFilters }
                  : undefined
              }
            />
          )}
        </div>
      </PageContainer>

      <BriefApplySheet
        brief={selectedBrief}
        open={!!selectedBrief}
        onOpenChange={(open) => !open && setSelectedBrief(null)}
      />

      <FilterSortSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        title="Filter Briefs"
        value={filters}
        onApply={setFilters}
        sortOptions={BRIEF_SORT_OPTIONS}
        categoryOptions={categoryOptions.map((category) => ({
          value: category.slug,
          label: category.name,
          icon: category.icon,
        }))}
        searchPlaceholder="Search briefs…"
      />
    </AppLayout>
  );
}
