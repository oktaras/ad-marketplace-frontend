import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Text } from "@telegram-tools/ui-kit";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/common/PageContainer";
import { useRole } from "@/contexts/RoleContext";
import { DealCard } from "@/components/deals/DealCard";
import { DealDetailSheet } from "@/components/deals/DealDetailSheet";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
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
  type UiDealFilter,
  verifyDealPayment,
} from "@/shared/api/deals";
import { prepareDealCreativeMediaUploads, uploadPreparedCreativeMediaFile } from "@/shared/api/media";
import { getApiErrorMessage } from "@/shared/api/error";
import { toast } from "@/hooks/use-toast";
import { DISCOVERY_LIMIT, useInfiniteScroll } from "@/pages/discovery/utils";
import { inAppEmptyStates, inAppToasts } from "@/shared/notifications/in-app";
import type { CreativeMedia, InlineButton } from "@/types/deal";

type DealFilter = UiDealFilter;

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

const EMPTY_STATUS_COUNTS: Record<DealFilter, number> = {
  all: 0,
  negotiation: 0,
  awaiting_creative: 0,
  creative_review: 0,
  revision_requested: 0,
  approved: 0,
  published: 0,
  completed: 0,
  cancelled: 0,
};

export default function Deals() {
  const { role } = useRole();
  const navigate = useNavigate();
  const { id: routeDealId } = useParams();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<DealFilter>("all");

  const dealsQuery = useInfiniteQuery({
    queryKey: ["deals", role, selectedFilter],
    enabled: Boolean(role),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getDeals({
        role,
        statusFilter: selectedFilter,
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

  const statusCounts = dealsQuery.data?.pages[0]?.statusCounts ?? EMPTY_STATUS_COUNTS;
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

  const loadNextPage = useCallback(() => {
    if (dealsQuery.hasNextPage && !dealsQuery.isFetchingNextPage) {
      void dealsQuery.fetchNextPage();
    }
  }, [dealsQuery]);

  const sentinelRef = useInfiniteScroll({
    enabled: Boolean(dealsQuery.hasNextPage) && !dealsQuery.isLoading && !dealsQuery.isFetchingNextPage && !dealsQuery.isError,
    onLoadMore: loadNextPage,
  });

  return (
    <AppLayout>
      <PageContainer className="py-3 space-y-4">
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-min" role="tablist">
            {(Object.keys(STATUS_FILTERS) as DealFilter[]).map((filterKey) => {
              const filter = STATUS_FILTERS[filterKey];
              const count = statusCounts[filter.value];
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
                  {count > 0 && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      isActive ? "bg-primary-foreground/20" : "bg-muted"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

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
          <Text type="caption1" color="tertiary">
            Loading…
          </Text>
        ) : deals.length === 0 ? (
          <EmptyState
            emoji={selectedFilter === "all" ? "🤝" : STATUS_FILTERS[selectedFilter].icon}
            title={selectedFilter === "all" ? "No deals yet" : `No ${STATUS_FILTERS[selectedFilter].label.toLowerCase()} deals`}
            description={
              selectedFilter === "all"
                ? role === "advertiser"
                  ? "You don't have any deals. Explore channels to start a deal."
                  : "You don't have any deals yet. Deals from briefs and listings will appear here."
                : `No deals with ${STATUS_FILTERS[selectedFilter].label.toLowerCase()} status.`
            }
            actionLabel={selectedFilter !== "all" ? "Clear Filter" : undefined}
            onAction={selectedFilter !== "all" ? () => setSelectedFilter("all") : undefined}
          />
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} onSelect={(selected) => navigate(`/deals/${selected.id}`)} />
            ))}
            <div ref={sentinelRef} className="h-10 flex items-center justify-center">
              {dealsQuery.isFetchingNextPage ? (
                <Text type="caption1" color="tertiary">Loading more…</Text>
              ) : dealsQuery.hasNextPage ? (
                <Text type="caption2" color="tertiary">Scroll to load more</Text>
              ) : (
                <Text type="caption2" color="tertiary">No more deals</Text>
              )}
            </div>
          </div>
        )}
      </PageContainer>

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
