import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Channel, ChannelCategory } from "@/types/marketplace";
import { ChannelLanguageSelector } from "@/components/common/LanguageSelector";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import { SectionLabel } from "@/components/common/SectionLabel";
import { CategoryPills } from "@/components/common/CategoryPills";
import { formatNumber } from "@/lib/format";
import { BadgeCheck, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getDiscoveryCategories } from "@/shared/api/discovery";
import {
  deleteMyChannel,
  refreshMyChannelProfile,
  refreshMyChannelStats,
  updateMyChannel,
} from "@/shared/api/my-stuff";
import { getApiErrorMessage } from "@/shared/api/error";
import { inAppToasts } from "@/shared/notifications/in-app";
import { ChannelAnalyticsPanel } from "@/components/analytics/ChannelAnalyticsPanel";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";
import { useTelegramPopupConfirm } from "@/shared/lib/telegram-popup-confirm";

interface ChannelSettingsSheetProps {
  channel: Channel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChannelSettingsSheet({ channel, open, onOpenChange }: ChannelSettingsSheetProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmWithPopup = useTelegramPopupConfirm();
  const [activeSection, setActiveSection] = useState<"info" | "analytics">("info");
  const [editCategory, setEditCategory] = useState<ChannelCategory | null>(null);
  const [editLanguage, setEditLanguage] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["my-channels", "categories"],
    queryFn: getDiscoveryCategories,
  });

  const refreshMutation = useMutation({
    mutationFn: () => {
      if (!channel?.id) {
        throw new Error("Channel is unavailable.");
      }

      return refreshMyChannelStats(channel.id);
    },
    onSuccess: () => {
      toast(inAppToasts.channelAndListing.analyticsRefreshQueued);

      if (!channel?.id) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ["channel-analytics-panel", "owner", "analytics", channel.id, 30] });
      void queryClient.invalidateQueries({ queryKey: ["channel-analytics-panel", "owner", "graphs", channel.id, "30d"] });
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["channel-analytics-panel", "owner", "analytics", channel.id, 30] });
        void queryClient.invalidateQueries({ queryKey: ["channel-analytics-panel", "owner", "graphs", channel.id, "30d"] });
      }, 5_000);
    },
    onError: (error) => {
      toast(inAppToasts.channelAndListing.analyticsRefreshFailed(getApiErrorMessage(error, "Please try again in a moment.")));
    },
  });

  const refreshProfileMutation = useMutation({
    mutationFn: () => {
      if (!channel?.id) {
        throw new Error("Channel is unavailable.");
      }

      return refreshMyChannelProfile(channel.id);
    },
    onSuccess: async () => {
      toast(inAppToasts.channelAndListing.profileRefreshSuccess);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-channels"] }),
        queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
      ]);
    },
    onError: (error) => {
      toast(inAppToasts.channelAndListing.profileRefreshFailed(getApiErrorMessage(error, "Please try again in a moment.")));
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!channel?.id) {
        throw new Error("Channel is unavailable.");
      }

      const selectedCategorySlug = editCategory || channel.category;
      const selectedCategoryId = categoriesQuery.data?.find((entry) => entry.slug === selectedCategorySlug)?.id;
      await updateMyChannel(channel.id, {
        language: (editLanguage || channel.language || "en").toLowerCase(),
        categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
      });
    },
    onSuccess: async () => {
      toast(inAppToasts.channelAndListing.channelUpdated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-channels"] }),
        queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
      ]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast(inAppToasts.channelAndListing.channelUpdateFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: () => {
      if (!channel?.id) {
        throw new Error("Channel is unavailable.");
      }

      return deleteMyChannel(channel.id);
    },
    onSuccess: async () => {
      toast(inAppToasts.channelAndListing.channelDeleted);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-channels"] }),
        queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
      ]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast(inAppToasts.channelAndListing.channelDeleteFailed(getApiErrorMessage(error, "Please try again.")));
    },
  });

  useEffect(() => {
    if (!open || !channel) {
      return;
    }

    setEditCategory(channel.category);
    setEditLanguage(channel.language);
  }, [open, channel]);

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);

    if (!isOpen) {
      setActiveSection("info");
    }
  };

  const handleSave = () => {
    saveSettingsMutation.mutate();
  };

  const handleOpenConnection = () => {
    navigate("/profile");
  };

  const handleDeleteChannel = async () => {
    const confirmed = await confirmWithPopup({
      title: "Remove channel?",
      message: "This will remove the channel and deactivate related listings. Active deals must be completed first.",
      confirmText: "Remove",
      cancelText: "Cancel",
      isDestructive: true,
    });

    if (!confirmed) {
      return;
    }

    deleteChannelMutation.mutate();
  };

  const sections = [
    { value: "info" as const, label: "Settings" },
    { value: "analytics" as const, label: "Analytics" },
  ];

  if (!channel) {
    return null;
  }

  return (
    <AppSheet
      open={open}
      onOpenChange={handleOpen}
      title="Manage Channel"
      fullHeight
    >
      <div className="flex items-center gap-3 mt-3 mb-4">
        <ChannelAvatar
          avatar={channel.avatar}
          name={channel.name}
          className="h-10 w-10 text-lg flex-shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Text type="subheadline1" weight="medium">{channel.name}</Text>
            {channel.verified ? <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" /> : null}
          </div>
          <Text type="caption1" color="secondary">{channel.username}</Text>
        </div>
      </div>

      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 mb-5">
        {sections.map((s) => (
          <button
            key={s.value}
            onClick={() => setActiveSection(s.value)}
            aria-selected={activeSection === s.value}
            role="tab"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeSection === s.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === "info" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
            <div>
              <Text type="footnote" color="secondary">Status</Text>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <Text type="subheadline2" weight="medium">Active</Text>
              </div>
            </div>
            <div>
              <Text type="footnote" color="secondary">Verified</Text>
              <div className="flex items-center gap-1 mt-0.5">
                {channel.verified ? (
                  <>
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <Text type="subheadline2" weight="medium">Yes</Text>
                  </>
                ) : (
                  <Text type="subheadline2" color="secondary">Pending</Text>
                )}
              </div>
            </div>
            <div>
              <Text type="footnote" color="secondary">Subscribers</Text>
              <Text type="subheadline2" weight="bold">{formatNumber(channel.subscribers)}</Text>
            </div>
          </div>

          <div className="space-y-1.5">
            <SectionLabel>Description</SectionLabel>
            <div className="w-full rounded-xl bg-secondary/70 px-3 py-2.5 text-sm text-foreground">
              {channel.description?.trim() || "No description in Telegram channel."}
            </div>
            <Text type="caption2" color="tertiary">
              Description is synced from Telegram and cannot be edited here.
            </Text>
            <Button
variant="outline"
              className="w-full"
              disabled={refreshProfileMutation.isPending}
              onClick={() => refreshProfileMutation.mutate()}
            >
              {refreshProfileMutation.isPending ? "Syncing…" : "Sync with Telegram"}
            </Button>
          </div>

          <div className="space-y-1.5">
            <SectionLabel>Category</SectionLabel>
            <CategoryPills
              selected={editCategory || channel.category}
              onSelect={(cat) => cat && setEditCategory(cat)}
            />
          </div>

          <div className="space-y-1.5">
            <SectionLabel>Language</SectionLabel>
            <ChannelLanguageSelector
              value={editLanguage || channel.language}
              onChange={(lang) => setEditLanguage(lang)}
            />
          </div>

          <Button onClick={handleSave} disabled={saveSettingsMutation.isPending} className="w-full">
            {saveSettingsMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
            disabled={deleteChannelMutation.isPending}
            onClick={() => void handleDeleteChannel()}
          >
            <Trash2 className="h-4 w-4" /> Remove Channel
          </Button>
        </div>
      ) : (
        <ChannelAnalyticsPanel
          channelId={channel.id}
          viewer="owner"
          showRefreshButton
          refreshLoading={refreshMutation.isPending}
          onQueueRefresh={() => refreshMutation.mutate()}
          onOpenTelegramConnect={handleOpenConnection}
        />
      )}
    </AppSheet>
  );
}
