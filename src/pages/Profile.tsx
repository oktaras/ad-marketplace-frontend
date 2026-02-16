import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/common/PageContainer";
import { WalletCard } from "@/components/profile/WalletCard";
import { TelegramAuthCard } from "@/components/profile/TelegramAuthCard";
import { UserInfoCard } from "@/components/profile/UserInfoCard";
import { SettingsSheet } from "@/components/profile/SettingsSheet";
import { NotificationsSheet } from "@/components/profile/NotificationsSheet";
import { ProfileFaqSheet } from "@/components/profile/ProfileFaqSheet";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { useRole } from "@/contexts/RoleContext";
import { Group, GroupItem, Text } from "@telegram-tools/ui-kit";
import { Settings, Users, Bell, CircleHelp, Bug } from "lucide-react";
import { subscribeProfileSettingsSheetOpen } from "@/app/router/profileSettingsSheetState";
import { env } from "@/app/config/env";

function openTelegramUrl(url: string): void {
  const webApp = window.Telegram?.WebApp;

  try {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
      return;
    }
  } catch (error) {
    console.warn("openTelegramLink failed:", error);
  }

  try {
    if (webApp?.openLink) {
      webApp.openLink(url, { try_instant_view: false });
      return;
    }
  } catch (error) {
    console.warn("openLink failed:", error);
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) {
    return;
  }

  window.location.href = url;
}

export default function Profile() {
  const { role } = useRole();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const telegramSupportUrl = env.telegramSupportUrl;

  useEffect(() => {
    return subscribeProfileSettingsSheetOpen(() => {
      setShowSettings(true);
    });
  }, []);

  return (
    <AppLayout>
      <PageContainer className="py-6 space-y-6">
        {/* User info card */}
        <UserInfoCard />

        {/* Active role */}
        <div className="space-y-3">
          <Text type="caption1" color="secondary" uppercase weight="regular" className="px-4">
            Active Role
          </Text>
          <RoleSwitcher fullWidth />
        </div>

        {/* Wallet */}
        <div className="space-y-3">
          <Text type="caption1" color="secondary" uppercase weight="regular" className="px-4">
            Wallet
          </Text>
          <WalletCard />
        </div>

        {/* Telegram auth */}
        {role === "publisher" ? (
          <div className="space-y-3">
            <Text type="caption1" color="secondary" uppercase weight="regular" className="px-4">
              Telegram Account
            </Text>
            <TelegramAuthCard />
          </div>
        ) : null}

        {/* Workspace section */}
        <Group header="Workspace" footer="">
          <GroupItem
            text="Team"
            before={<Users className="h-5 w-5 text-muted-foreground" />}
            chevron
            disabled
            description="Team features coming in next release"
          />
        </Group>

        {/* Account section */}
        <Group header="Account">
          <GroupItem
            text="Settings"
            before={<Settings className="h-5 w-5 text-muted-foreground" />}
            chevron
            onClick={() => setShowSettings(true)}
            description="Language, theme"
          />
          <GroupItem
            text="Notifications"
            before={<Bell className="h-5 w-5 text-muted-foreground" />}
            chevron
            onClick={() => setShowNotifications(true)}
            description="Deal updates, messages, alerts"
          />
        </Group>

        {/* Help section */}
        <Group header="Help">
          <GroupItem
            text="View FAQ & Documentation"
            before={<CircleHelp className="h-5 w-5 text-muted-foreground" />}
            description="How marketplace workflows and roles work"
            chevron
            onClick={() => setShowFaq(true)}
          />
          <GroupItem
            text="Report an Issue"
            before={<Bug className="h-5 w-5 text-muted-foreground" />}
            chevron
            description="Share a bug or request support"
            onClick={
              telegramSupportUrl
                ? () => {
                    openTelegramUrl(telegramSupportUrl);
                  }
                : undefined
            }
            disabled={!telegramSupportUrl}
          />
        </Group>
        </PageContainer>
      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />
      <NotificationsSheet open={showNotifications} onOpenChange={setShowNotifications} />
      <ProfileFaqSheet open={showFaq} onOpenChange={setShowFaq} />
    </AppLayout>
  );
}
