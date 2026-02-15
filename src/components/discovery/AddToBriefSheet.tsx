import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text } from "@telegram-tools/ui-kit";
import { AppSheet } from "@/components/common/AppSheet";
import { Button } from "@/components/ui/button";
import { Channel } from "@/types/marketplace";
import { addChannelToBrief } from "@/shared/api/discovery";
import { getMyBriefs } from "@/shared/api/my-stuff";
import { getApiErrorMessage } from "@/shared/api/error";
import { toast } from "@/hooks/use-toast";
import { inAppToasts } from "@/shared/notifications/in-app";

interface AddToBriefSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null;
}

export function AddToBriefSheet({ open, onOpenChange, channel }: AddToBriefSheetProps) {
  const queryClient = useQueryClient();
  const [selectedBriefId, setSelectedBriefId] = useState<string>("");

  const briefsQuery = useQuery({
    queryKey: ["add-to-brief", "my-briefs"],
    enabled: open,
    queryFn: () => getMyBriefs({ status: "ACTIVE", page: 1, limit: 100, sortBy: "created_desc" }),
    staleTime: 30_000,
  });

  const briefs = briefsQuery.data?.items ?? [];

  useEffect(() => {
    if (!open) {
      setSelectedBriefId("");
      return;
    }

    if (briefs.length > 0) {
      setSelectedBriefId((previous) => previous || briefs[0].id);
    }
  }, [briefs, open]);

  const selectedBrief = useMemo(
    () => briefs.find((brief) => brief.id === selectedBriefId) ?? null,
    [briefs, selectedBriefId],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!channel?.id) {
        throw new Error("Channel is unavailable.");
      }

      if (!selectedBriefId) {
        throw new Error("Please choose a brief.");
      }

      return addChannelToBrief(selectedBriefId, channel.id);
    },
    onSuccess: async () => {
      toast(inAppToasts.discovery.channelSaved(
        selectedBrief ? `Added to “${selectedBrief.title}”.` : "Channel was added to brief shortlist.",
      ));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-briefs"] }),
        queryClient.invalidateQueries({ queryKey: ["brief-saved-channels"] }),
      ]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast(inAppToasts.discovery.saveChannelFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Add to Brief">
      <div className="space-y-4">
        {channel ? (
          <div className="p-3 rounded-xl bg-secondary/40 border border-border">
            <Text type="subheadline2" weight="medium">{channel.name}</Text>
            <Text type="caption1" color="secondary">{channel.username}</Text>
          </div>
        ) : null}

        {briefsQuery.isLoading ? (
          <div className="p-3 rounded-xl bg-secondary/30 border border-border">
            <Text type="caption1" color="secondary">Loading briefs…</Text>
          </div>
        ) : briefsQuery.isError ? (
          <div className="space-y-2 p-3 rounded-xl bg-secondary/30 border border-border">
            <Text type="caption1" color="secondary">Failed to load briefs.</Text>
            <Button variant="outline" size="sm" onClick={() => briefsQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : briefs.length === 0 ? (
          <div className="p-3 rounded-xl bg-secondary/30 border border-border">
            <Text type="caption1" color="secondary">
              You have no active briefs. Create one in My Briefs, then save channels here.
            </Text>
          </div>
        ) : (
          <div className="space-y-2">
            {briefs.map((brief) => (
              <button
                key={brief.id}
                onClick={() => setSelectedBriefId(brief.id)}
                className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                  selectedBriefId === brief.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/40"
                }`}
              >
                <Text type="subheadline2" weight="medium">{brief.title}</Text>
                <Text type="caption1" color="secondary">{brief.currency}</Text>
              </button>
            ))}
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => saveMutation.mutate()}
          disabled={!channel || briefs.length === 0 || !selectedBriefId || saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving…" : "Add to Brief"}
        </Button>
      </div>
    </AppSheet>
  );
}
