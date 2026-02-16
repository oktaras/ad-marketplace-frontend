import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, Toggle } from "@telegram-tools/ui-kit";
import { AppSheet } from "@/components/common/AppSheet";
import { UsersService } from "@/shared/api/generated";
import { getApiErrorMessage } from "@/shared/api/error";
import { toast } from "@/hooks/use-toast";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS_CATALOG,
  type NotificationSettings,
  type NotificationSettingsKey,
  parseNotificationSettings,
  parseUsersNotificationSettingsPayload,
} from "@/shared/profile/notification-settings";
import { Bell } from "lucide-react";

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NOTIFICATION_SETTINGS_QUERY_KEY = ["profile-notification-settings"] as const;

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationSettings>({ ...DEFAULT_NOTIFICATION_SETTINGS });
  const [catalog, setCatalog] = useState([...DEFAULT_NOTIFICATION_SETTINGS_CATALOG]);

  const profileQuery = useQuery({
    queryKey: NOTIFICATION_SETTINGS_QUERY_KEY,
    enabled: open,
    queryFn: async () => {
      const response = await UsersService.getApiUsersMe();
      return parseUsersNotificationSettingsPayload(response);
    },
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setSettings(profileQuery.data.settings);
    setCatalog(profileQuery.data.catalog);
  }, [profileQuery.data]);

  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (params: {
      key: NotificationSettingsKey;
      value: boolean;
      previousSettings: NotificationSettings;
      optimisticSettings: NotificationSettings;
    }) => {
      const response = await UsersService.putApiUsersMe({
        requestBody: {
          notificationSettings: {
            [params.key]: params.value,
          },
        },
      });

      return { response, optimisticSettings: params.optimisticSettings };
    },
    onError: (error, variables) => {
      setSettings(variables.previousSettings);
      toast({
        title: "Failed to update notifications",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
    onSuccess: async ({ response, optimisticSettings }) => {
      const parsed = parseUsersNotificationSettingsPayload(response);
      const serverSettings = parseNotificationSettings(parsed.settings, optimisticSettings);
      setSettings(serverSettings);
      await queryClient.invalidateQueries({ queryKey: NOTIFICATION_SETTINGS_QUERY_KEY });
    },
  });

  const handleToggle = (key: NotificationSettingsKey, nextValue: boolean) => {
    if (updateNotificationSettingsMutation.isPending) {
      return;
    }

    const previousSettings = settings;
    const optimisticSettings = {
      ...settings,
      [key]: nextValue,
    };

    setSettings(optimisticSettings);
    updateNotificationSettingsMutation.mutate({
      key,
      value: nextValue,
      previousSettings,
      optimisticSettings,
    });
  };

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Notifications" icon={<Bell className="w-5 h-5" />}>

      <div className="space-y-2">
        {profileQuery.isLoading ? (
          <div className="p-3 bg-secondary rounded-lg">
            <Text type="caption2" color="secondary">Loading notification settings...</Text>
          </div>
        ) : null}

        {profileQuery.isError ? (
          <div className="p-3 bg-secondary rounded-lg">
            <Text type="caption2" color="secondary">Could not refresh settings. Showing last known values.</Text>
          </div>
        ) : null}

        {catalog.map((group) => (
          <div key={group.key} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex-1 min-w-0">
              <Text type="body" weight="medium">{group.title}</Text>
              <Text type="caption2" color="secondary">{group.description}</Text>
            </div>
            <Toggle
              isEnabled={settings[group.key]}
              onChange={(nextValue) => handleToggle(group.key, nextValue)}
            />
          </div>
        ))}
      </div>
    </AppSheet>
  );
}
