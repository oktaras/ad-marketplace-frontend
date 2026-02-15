import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/common/PageContainer";
import { SectionLabel } from "@/components/common/SectionLabel";
import { WalletCard } from "@/components/profile/WalletCard";
import { TelegramAuthCard } from "@/components/profile/TelegramAuthCard";
import { UserInfoCard } from "@/components/profile/UserInfoCard";
import { SettingsSheet } from "@/components/profile/SettingsSheet";
import { NotificationsSheet } from "@/components/profile/NotificationsSheet";
import { useRole } from "@/contexts/RoleContext";
import { Group, GroupItem } from "@telegram-tools/ui-kit";
import { Settings, Users, Bell } from "lucide-react";
import { subscribeProfileSettingsSheetOpen } from "@/app/router/profileSettingsSheetState";

export default function Profile() {
  const { role } = useRole();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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

        {/* Wallet */}
        <div className="space-y-3">
          <SectionLabel>Wallet</SectionLabel>
          <WalletCard />
        </div>

        {/* Telegram auth */}
        {role === "publisher" ? (
          <div className="space-y-3">
            <SectionLabel>Telegram Account</SectionLabel>
            <TelegramAuthCard />
          </div>
        ) : null}

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

        {/* Workspace section */}
        <Group header="Workspace" footer="Team features coming in next release.">
          <GroupItem
            text="Team"
            before={<Users className="h-5 w-5 text-muted-foreground" />}
            chevron
            disabled
            description="Collaborate with team members"
          />
        </Group>
      </PageContainer>

      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />
      <NotificationsSheet open={showNotifications} onOpenChange={setShowNotifications} />
    </AppLayout>
  );
}
