import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { Text } from "@telegram-tools/ui-kit";
import { SlidersHorizontal } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/common/PageContainer";
import { FilterSortSheet, type FilterSortState } from "@/components/common/FilterSortSheet";
import { ActiveFilters, type ActiveFilterChip } from "@/components/common/ActiveFilters";
import { EmptyState } from "@/components/common/EmptyState";
import { ListingCard } from "@/components/discovery/ListingCard";
import { ListingDetailSheet } from "@/components/discovery/ListingDetailSheet";
import type { DiscoveryListing } from "@/shared/api/discovery";
import { getDiscoveryCategories, getDiscoveryListings } from "@/shared/api/discovery";
import { createDeal } from "@/shared/api/deals";
import { getApiErrorMessage } from "@/shared/api/error";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "@/hooks/use-toast";
import { inAppEmptyStates, inAppToasts } from "@/shared/notifications/in-app";
import {
  buildCategoryOptions,
  DISCOVERY_LIMIT,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_LENGTH,
  useDebouncedValue,
  useInfiniteScroll,
} from "@/pages/discovery/utils";

type ListingSort =
  | "created_desc"
  | "created_asc"
  | "price_desc"
  | "price_asc"
  | "subscribers_desc"
  | "views_desc"
  | "er_desc";

const LISTING_SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "subscribers_desc", label: "Subscribers: High → Low" },
  { value: "views_desc", label: "Views: High → Low" },
  { value: "er_desc", label: "Engagement: High → Low" },
];

export default function Listings() {
  const { role } = useRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<DiscoveryListing | null>(null);
  const [filters, setFilters] = useState<FilterSortState<ListingSort>>({
    search: "",
    categories: [],
    statuses: [],
    sort: "created_desc",
  });

  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const normalizedSearch = debouncedSearch.trim();
  const activeSearch = normalizedSearch.length >= SEARCH_MIN_LENGTH ? normalizedSearch : "";
  const waitingForSearchThreshold = normalizedSearch.length > 0 && normalizedSearch.length < SEARCH_MIN_LENGTH;
  const categoryKey = filters.categories.slice().sort().join(",");
  const hasActiveFilters = Boolean(filters.search.trim() || filters.categories.length > 0);

  const categoriesQuery = useQuery({
    queryKey: ["listings", "categories"],
    queryFn: getDiscoveryCategories,
  });

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const categoryOptions = useMemo(
    () => buildCategoryOptions(categories),
    [categories],
  );
  const categoryNameBySlug = useMemo(
    () => new Map(categoryOptions.map((entry) => [entry.slug, entry.name])),
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

  const listingsQuery = useInfiniteQuery({
    queryKey: ["listings", "discovery", categoryKey, activeSearch, filters.sort],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getDiscoveryListings({
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

  const listings = useMemo(
    () => listingsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listingsQuery.data],
  );
  const totalListings = listingsQuery.data?.pages[0]?.pagination.total ?? listings.length;
  const isLoading = categoriesQuery.isLoading || listingsQuery.isLoading;

  const clearFilters = () => {
    setFilters((previous) => ({
      ...previous,
      search: "",
      categories: [],
      statuses: [],
    }));
  };

  const loadNextPage = useCallback(() => {
    if (listingsQuery.hasNextPage && !listingsQuery.isFetchingNextPage) {
      void listingsQuery.fetchNextPage();
    }
  }, [listingsQuery]);

  const sentinelRef = useInfiniteScroll({
    enabled: Boolean(listingsQuery.hasNextPage) && !isLoading && !listingsQuery.isFetchingNextPage && !listingsQuery.isError,
    onLoadMore: loadNextPage,
  });

  const createDealMutation = useMutation({
    mutationFn: (payload: { listing: DiscoveryListing; adFormatId: string; price: number; currency: string }) => createDeal({
      origin: "DIRECT",
      channelId: payload.listing.channel.id,
      adFormatId: payload.adFormatId,
      agreedPrice: `${Math.max(0, Math.round(payload.price))}`,
      currency: payload.currency,
    }),
    onSuccess: async (deal) => {
      await queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast(inAppToasts.listings.dealStarted);
      setSelectedListing(null);
      navigate(deal?.id ? `/deals/${deal.id}` : "/deals");
    },
    onError: (error) => {
      toast(inAppToasts.listings.dealStartFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  if (role === "publisher") {
    return <Navigate to="/briefs" replace />;
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
          {`${totalListings} listing${totalListings !== 1 ? "s" : ""}`}
        </Text>

        <div className="pb-6 flex flex-col gap-3">
          {listingsQuery.isError ? (
            <EmptyState
              emoji={inAppEmptyStates.listingsLoadFailed.emoji}
              title={inAppEmptyStates.listingsLoadFailed.title}
              description={inAppEmptyStates.listingsLoadFailed.description}
              secondaryAction={{
                label: inAppEmptyStates.listingsLoadFailed.secondaryActionLabel || "Retry",
                onClick: () => listingsQuery.refetch(),
              }}
            />
          ) : isLoading ? (
            <Text type="caption1" color="tertiary">Loading…</Text>
          ) : listings.length > 0 ? (
            <>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
              ))}
              <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                {listingsQuery.isFetchingNextPage ? (
                  <Text type="caption1" color="tertiary">Loading more…</Text>
                ) : listingsQuery.hasNextPage ? (
                  <Text type="caption2" color="tertiary">Scroll to load more</Text>
                ) : (
                  <Text type="caption2" color="tertiary">No more listings</Text>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              emoji={inAppEmptyStates.listingsNoResults.emoji}
              title={inAppEmptyStates.listingsNoResults.title}
              description={inAppEmptyStates.listingsNoResults.description}
              secondaryAction={
                hasActiveFilters
                  ? { label: inAppEmptyStates.listingsNoResults.secondaryActionLabel || "Clear Filters", onClick: clearFilters }
                  : undefined
              }
            />
          )}
        </div>
      </PageContainer>

      <FilterSortSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        title="Filter Listings"
        value={filters}
        onApply={setFilters}
        sortOptions={LISTING_SORT_OPTIONS}
        categoryOptions={categoryOptions.map((entry) => ({
          value: entry.slug,
          label: entry.name,
          icon: entry.icon,
        }))}
        searchPlaceholder="Search listings…"
      />

      <ListingDetailSheet
        listing={selectedListing}
        open={Boolean(selectedListing)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedListing(null);
          }
        }}
        bookLoading={createDealMutation.isPending}
        onBookListing={(listing, adFormatId, price, currency) => {
          createDealMutation.mutate({ listing, adFormatId, price, currency });
        }}
      />
    </AppLayout>
  );
}
