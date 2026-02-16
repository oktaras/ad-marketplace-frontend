import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Text } from "@telegram-tools/ui-kit";
import { Plus, SlidersHorizontal } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/common/PageContainer";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusTabs } from "@/components/common/StatusTabs";
import { MyChannelCard } from "@/components/my-stuff/MyChannelCard";
import { ListingCard } from "@/components/my-stuff/ListingCard";
import { AddChannelSheet } from "@/components/my-stuff/AddChannelSheet";
import { ChannelSettingsSheet } from "@/components/my-stuff/ChannelSettingsSheet";
import { CreateListingSheet } from "@/components/my-stuff/CreateListingSheet";
import { ManageListingSheet } from "@/components/my-stuff/ManageListingSheet";
import { FilterSortSheet, type FilterSortState } from "@/components/common/FilterSortSheet";
import { ActiveFilters, type ActiveFilterChip } from "@/components/common/ActiveFilters";
import { useRole } from "@/contexts/RoleContext";
import { Channel } from "@/types/marketplace";
import { Listing } from "@/types/listing";
import { getDiscoveryCategories } from "@/shared/api/discovery";
import { getMyChannels, getMyListings, type ChannelFormatItem } from "@/shared/api/my-stuff";
import {
  buildCategoryMap,
  buildCategoryOptions,
  DISCOVERY_LIMIT,
  mapDiscoveryChannel,
  mapMyListing,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_LENGTH,
  useDebouncedValue,
  useInfiniteScroll,
} from "@/pages/discovery/utils";
import { LISTING_STATUS_CONFIG } from "@/shared/constants/marketplace-status";
import { inAppEmptyStates } from "@/shared/notifications/in-app";
import { useSwipeTabNavigation } from "@/hooks/use-touch-gestures";
import { useTabContentTransition } from "@/hooks/use-tab-content-transition";

type PublisherTab = "channels" | "listings";
type ChannelSort = "subscribers_desc" | "subscribers_asc" | "price_desc" | "price_asc" | "er_desc" | "views_desc";
type ListingSort = "created_desc" | "created_asc" | "price_desc" | "price_asc";

const CHANNEL_SORT_OPTIONS: Array<{ value: ChannelSort; label: string }> = [
  { value: "subscribers_desc", label: "Subscribers: High → Low" },
  { value: "subscribers_asc", label: "Subscribers: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "er_desc", label: "Engagement: High → Low" },
  { value: "views_desc", label: "Views: High → Low" },
];

const LISTING_SORT_OPTIONS: Array<{ value: ListingSort; label: string }> = [
  { value: "created_desc", label: "Created: New → Old" },
  { value: "created_asc", label: "Created: Old → New" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "price_asc", label: "Price: Low → High" },
];
const PUBLISHER_TAB_ORDER = ["channels", "listings"] as const;

export default function MyChannels() {
  const { role } = useRole();
  const [publisherTab, setPublisherTab] = useState<PublisherTab>("channels");
  const [channelFilterSheetOpen, setChannelFilterSheetOpen] = useState(false);
  const [listingFilterSheetOpen, setListingFilterSheetOpen] = useState(false);
  const [channelFilters, setChannelFilters] = useState<FilterSortState<ChannelSort>>({
    search: "",
    categories: [],
    statuses: [],
    sort: "subscribers_desc",
  });
  const [listingFilters, setListingFilters] = useState<FilterSortState<ListingSort>>({
    search: "",
    categories: [],
    statuses: [],
    sort: "created_desc",
  });
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [createListingOpen, setCreateListingOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const debouncedChannelSearch = useDebouncedValue(channelFilters.search, SEARCH_DEBOUNCE_MS);
  const normalizedChannelSearch = debouncedChannelSearch.trim();
  const activeChannelSearch = normalizedChannelSearch.length >= SEARCH_MIN_LENGTH ? normalizedChannelSearch : "";
  const waitingForChannelSearchThreshold = normalizedChannelSearch.length > 0 && normalizedChannelSearch.length < SEARCH_MIN_LENGTH;
  const channelCategoryKey = channelFilters.categories.slice().sort().join(",");

  const debouncedListingSearch = useDebouncedValue(listingFilters.search, SEARCH_DEBOUNCE_MS);
  const normalizedListingSearch = debouncedListingSearch.trim();
  const activeListingSearch = normalizedListingSearch.length >= SEARCH_MIN_LENGTH ? normalizedListingSearch : "";
  const waitingForListingSearchThreshold = normalizedListingSearch.length > 0 && normalizedListingSearch.length < SEARCH_MIN_LENGTH;
  const listingCategoryKey = listingFilters.categories.slice().sort().join(",");
  const listingStatusKey = listingFilters.statuses.slice().sort().join(",");

  const categoriesQuery = useQuery({
    queryKey: ["my-channels", "categories"],
    queryFn: getDiscoveryCategories,
  });

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

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
  const listingStatusOptions = useMemo(
    () => Object.entries(LISTING_STATUS_CONFIG).map(([value, config]) => ({
      value,
      label: config.label,
    })),
    [],
  );
  const channelFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    if (channelFilters.search.trim()) {
      chips.push({
        key: "channel-search",
        label: `Search: ${channelFilters.search.trim()}`,
        onRemove: () => setChannelFilters((previous) => ({ ...previous, search: "" })),
      });
    }

    channelFilters.categories.forEach((slug) => {
      chips.push({
        key: `channel-category-${slug}`,
        label: categoryNameBySlug.get(slug) ?? slug,
        onRemove: () => setChannelFilters((previous) => ({
          ...previous,
          categories: previous.categories.filter((entry) => entry !== slug),
        })),
      });
    });
    return chips;
  }, [categoryNameBySlug, channelFilters.categories, channelFilters.search]);
  const listingFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    if (listingFilters.search.trim()) {
      chips.push({
        key: "listing-search",
        label: `Search: ${listingFilters.search.trim()}`,
        onRemove: () => setListingFilters((previous) => ({ ...previous, search: "" })),
      });
    }

    listingFilters.categories.forEach((slug) => {
      chips.push({
        key: `listing-category-${slug}`,
        label: categoryNameBySlug.get(slug) ?? slug,
        onRemove: () => setListingFilters((previous) => ({
          ...previous,
          categories: previous.categories.filter((entry) => entry !== slug),
        })),
      });
    });

    listingFilters.statuses.forEach((status) => {
      const label = LISTING_STATUS_CONFIG[status as keyof typeof LISTING_STATUS_CONFIG]?.label ?? status;
      chips.push({
        key: `listing-status-${status}`,
        label: `Status: ${label}`,
        onRemove: () => setListingFilters((previous) => ({
          ...previous,
          statuses: previous.statuses.filter((entry) => entry !== status),
        })),
      });
    });

    return chips;
  }, [categoryNameBySlug, listingFilters.categories, listingFilters.search, listingFilters.statuses]);
  const hasActiveChannelFilters = Boolean(channelFilters.search.trim() || channelFilters.categories.length > 0);
  const hasActiveListingFilters = Boolean(
    listingFilters.search.trim() || listingFilters.categories.length > 0 || listingFilters.statuses.length > 0,
  );

  const channelsQuery = useInfiniteQuery({
    queryKey: ["my-channels", channelCategoryKey, activeChannelSearch, channelFilters.sort],
    enabled: role === "publisher",
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getMyChannels({
        categories: channelFilters.categories,
        search: activeChannelSearch,
        sortBy: channelFilters.sort,
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

  const listingsQuery = useInfiniteQuery({
    queryKey: ["my-listings", listingCategoryKey, activeListingSearch, listingStatusKey, listingFilters.sort],
    enabled: role === "publisher",
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getMyListings({
        categories: listingFilters.categories,
        search: activeListingSearch,
        status: listingFilters.statuses.length > 0
          ? (listingFilters.statuses.join(",") as any)
          : "all",
        sortBy: listingFilters.sort,
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

  const allChannels = useMemo(
    () => channelsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [channelsQuery.data],
  );

  const allListings = useMemo(
    () => listingsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listingsQuery.data],
  );

  const channels = useMemo(
    () => allChannels.map((channel) => mapDiscoveryChannel(channel, categoryBySlug)),
    [allChannels, categoryBySlug],
  );

  const listings = useMemo(
    () => allListings.map((listing) => mapMyListing(listing, categoryBySlug)),
    [allListings, categoryBySlug],
  );
  const selectedChannelForSheet = useMemo(() => {
    if (!selectedChannel) {
      return null;
    }

    return channels.find((channel) => channel.id === selectedChannel.id) ?? selectedChannel;
  }, [channels, selectedChannel]);
  const channelFormatsByChannelId = useMemo(
    () =>
      new Map(
        allChannels.map((entry) => [
          entry.id,
          entry.formats.map((format) => ({
            ...format,
            type: String(format.type || "POST").toUpperCase() as ChannelFormatItem["type"],
          })),
        ]),
      ),
    [allChannels],
  );

  const totalChannels = channelsQuery.data?.pages[0]?.pagination.total ?? channels.length;
  const totalListings = listingsQuery.data?.pages[0]?.pagination.total ?? listings.length;
  const channelsLoading = categoriesQuery.isLoading || channelsQuery.isLoading;
  const listingsLoading = categoriesQuery.isLoading || listingsQuery.isLoading;

  const clearChannelFilters = () => {
    setChannelFilters((previous) => ({
      ...previous,
      search: "",
      categories: [],
      statuses: [],
    }));
  };

  const clearListingFilters = () => {
    setListingFilters((previous) => ({
      ...previous,
      search: "",
      categories: [],
      statuses: [],
    }));
  };

  const loadNextChannelPage = useCallback(() => {
    if (channelsQuery.hasNextPage && !channelsQuery.isFetchingNextPage) {
      void channelsQuery.fetchNextPage();
    }
  }, [channelsQuery]);

  const loadNextListingPage = useCallback(() => {
    if (listingsQuery.hasNextPage && !listingsQuery.isFetchingNextPage) {
      void listingsQuery.fetchNextPage();
    }
  }, [listingsQuery]);

  const channelsSentinelRef = useInfiniteScroll({
    enabled: publisherTab === "channels"
      && Boolean(channelsQuery.hasNextPage)
      && !channelsLoading
      && !channelsQuery.isFetchingNextPage
      && !channelsQuery.isError,
    onLoadMore: loadNextChannelPage,
  });

  const listingsSentinelRef = useInfiniteScroll({
    enabled: publisherTab === "listings"
      && Boolean(listingsQuery.hasNextPage)
      && !listingsLoading
      && !listingsQuery.isFetchingNextPage
      && !listingsQuery.isError,
    onLoadMore: loadNextListingPage,
  });

  const tabSwipeHandlers = useSwipeTabNavigation({
    tabOrder: PUBLISHER_TAB_ORDER,
    activeTab: publisherTab,
    onTabChange: (nextTab) => setPublisherTab(nextTab),
  });
  const tabTransitionClass = useTabContentTransition(publisherTab, PUBLISHER_TAB_ORDER);

  if (role === "advertiser") {
    return <Navigate to="/my-briefs" replace />;
  }

  return (
    <AppLayout>
      <PageContainer className="py-4 space-y-4" {...tabSwipeHandlers}>
        <StatusTabs
          tabs={[
            { value: "channels", label: "Channels", count: totalChannels },
            { value: "listings", label: "Listings", count: totalListings },
          ]}
          activeTab={publisherTab}
          onTabChange={(tab) => setPublisherTab(tab as PublisherTab)}
        />
        <div className={`space-y-4 ${tabTransitionClass}`}>
          {publisherTab === "channels" ? (
            <>
              <div className="flex items-center gap-2 flex-nowrap">
                <button
                  onClick={() => setChannelFilterSheetOpen(true)}
                  className="flex-1 min-w-0 flex items-center justify-center gap-2 h-10 rounded-lg border border-border bg-card text-sm font-medium whitespace-nowrap"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters & Sort
                </button>
                <button
                  onClick={() => setAddChannelOpen(true)}
                  className="shrink-0 h-10 flex items-center gap-1 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  Add Channel
                </button>
              </div>

              <ActiveFilters
                filters={channelFilterChips}
                onClearAll={hasActiveChannelFilters ? clearChannelFilters : undefined}
              />

              {waitingForChannelSearchThreshold ? (
                <Text type="caption2" color="tertiary">
                  Enter at least {SEARCH_MIN_LENGTH} characters to start searching.
                </Text>
              ) : null}

              <div className="pb-2 space-y-1">
                <Text type="caption1" color="tertiary">
                  {`${totalChannels} channel${totalChannels !== 1 ? "s" : ""}`}
                  {channelFilters.categories.length > 0
                    ? ` in ${channelFilters.categories.length} categor${channelFilters.categories.length === 1 ? "y" : "ies"}`
                    : ""}
                </Text>
              </div>

              <div className="pb-6 flex flex-col gap-3">
                {channelsQuery.isError ? (
                  <EmptyState
                    emoji={inAppEmptyStates.myChannelsLoadFailed.emoji}
                    title={inAppEmptyStates.myChannelsLoadFailed.title}
                    description={inAppEmptyStates.myChannelsLoadFailed.description}
                    secondaryAction={{
                      label: inAppEmptyStates.myChannelsLoadFailed.secondaryActionLabel || "Retry",
                      onClick: () => channelsQuery.refetch(),
                    }}
                  />
                ) : channelsLoading ? (
                  <Text type="caption1" color="tertiary">
                    Loading…
                  </Text>
                ) : channels.length > 0 ? (
                  <>
                    {channels.map((channel) => (
                      <MyChannelCard key={channel.id} channel={channel} onManage={() => setSelectedChannel(channel)} />
                    ))}
                    <div ref={channelsSentinelRef} className="h-10 flex items-center justify-center">
                      {channelsQuery.isFetchingNextPage ? (
                        <Text type="caption1" color="tertiary">Loading more…</Text>
                      ) : channelsQuery.hasNextPage ? (
                        <Text type="caption2" color="tertiary">Scroll to load more</Text>
                      ) : (
                        <Text type="caption2" color="tertiary">No more channels</Text>
                      )}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    emoji={inAppEmptyStates.myChannelsNoResults.emoji}
                    title={inAppEmptyStates.myChannelsNoResults.title}
                    description={inAppEmptyStates.myChannelsNoResults.description}
                    actionLabel="Add Channel"
                    onAction={() => setAddChannelOpen(true)}
                    secondaryAction={
                      hasActiveChannelFilters
                        ? { label: inAppEmptyStates.myChannelsNoResults.secondaryActionLabel || "Clear Filters", onClick: clearChannelFilters }
                        : undefined
                    }
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-nowrap">
                <button
                  onClick={() => setListingFilterSheetOpen(true)}
                  className="flex-1 min-w-0 flex items-center justify-center gap-2 h-10 rounded-lg border border-border bg-card text-sm font-medium whitespace-nowrap"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters & Sort
                </button>
                <button
                  onClick={() => setCreateListingOpen(true)}
                  className="shrink-0 h-10 flex items-center gap-1 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  New Listing
                </button>
              </div>

              <ActiveFilters
                filters={listingFilterChips}
                onClearAll={hasActiveListingFilters ? clearListingFilters : undefined}
              />

              {waitingForListingSearchThreshold ? (
                <Text type="caption2" color="tertiary">
                  Enter at least {SEARCH_MIN_LENGTH} characters to start searching.
                </Text>
              ) : null}

              <div className="pb-2">
                <Text type="caption1" color="tertiary">
                  {`${totalListings} listing${totalListings !== 1 ? "s" : ""}`}
                </Text>
              </div>

              <div className="pb-6 flex flex-col gap-3">
                {listingsQuery.isError ? (
                  <EmptyState
                    emoji={inAppEmptyStates.myListingsLoadFailed.emoji}
                    title={inAppEmptyStates.myListingsLoadFailed.title}
                    description={inAppEmptyStates.myListingsLoadFailed.description}
                    secondaryAction={{
                      label: inAppEmptyStates.myListingsLoadFailed.secondaryActionLabel || "Retry",
                      onClick: () => listingsQuery.refetch(),
                    }}
                  />
                ) : listingsLoading ? (
                  <Text type="caption1" color="tertiary">
                    Loading…
                  </Text>
                ) : listings.length > 0 ? (
                  <>
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
                    ))}
                    <div ref={listingsSentinelRef} className="h-10 flex items-center justify-center">
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
                    emoji={inAppEmptyStates.myListingsNoResults.emoji}
                    title={inAppEmptyStates.myListingsNoResults.title}
                    description={inAppEmptyStates.myListingsNoResults.description}
                    actionLabel="Create Listing"
                    onAction={() => setCreateListingOpen(true)}
                    secondaryAction={
                      hasActiveListingFilters
                        ? { label: inAppEmptyStates.myListingsNoResults.secondaryActionLabel || "Clear Filters", onClick: clearListingFilters }
                        : undefined
                    }
                  />
                )}
              </div>
            </>
          )}
        </div>
      </PageContainer>

      <AddChannelSheet
        open={addChannelOpen}
        onOpenChange={setAddChannelOpen}
      />

      <ChannelSettingsSheet
        channel={selectedChannelForSheet}
        open={!!selectedChannel}
        onOpenChange={(open) => !open && setSelectedChannel(null)}
      />

      <CreateListingSheet
        open={createListingOpen}
        onOpenChange={setCreateListingOpen}
        channels={channels}
        channelFormatsByChannelId={channelFormatsByChannelId}
      />

      <ManageListingSheet
        listing={selectedListing}
        open={!!selectedListing}
        onOpenChange={(open) => !open && setSelectedListing(null)}
      />

      <FilterSortSheet
        open={channelFilterSheetOpen}
        onOpenChange={setChannelFilterSheetOpen}
        title="Filter Channels"
        value={channelFilters}
        onApply={setChannelFilters}
        sortOptions={CHANNEL_SORT_OPTIONS}
        categoryOptions={categoryOptions.map((category) => ({
          value: category.slug,
          label: category.name,
          icon: category.icon,
        }))}
        searchPlaceholder="Search channels…"
      />

      <FilterSortSheet
        open={listingFilterSheetOpen}
        onOpenChange={setListingFilterSheetOpen}
        title="Filter Listings"
        value={listingFilters}
        onApply={setListingFilters}
        sortOptions={LISTING_SORT_OPTIONS}
        categoryOptions={categoryOptions.map((category) => ({
          value: category.slug,
          label: category.name,
          icon: category.icon,
        }))}
        statusOptions={listingStatusOptions}
        showStatus
        searchPlaceholder="Search listings…"
      />
    </AppLayout>
  );
}
