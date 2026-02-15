import { Text } from "@telegram-tools/ui-kit";
import { ChevronRight } from "lucide-react";
import { useAuthStore } from "@/features/auth/model/auth.store";
import { useRole } from "@/contexts/RoleContext";

export function UserInfoCard() {
  const user = useAuthStore((state) => state.user);
  const { role } = useRole();

  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : 'Telegram User';
  const displayUsername = user?.username 
    ? `@${user.username}` 
    : user?.telegramId 
      ? `ID: ${user.telegramId}` 
      : '@tgadsmvp';

  return (
    <button
      onClick={() => {
        // TODO: Open user profile details sheet
      }}
      className="w-full flex items-center gap-3 p-4 rounded-xl border transition-colors bg-gradient-to-r from-primary/5 to-primary/0 border-primary/10 hover:from-primary/10"
    >
      {user?.photoUrl ? (
        <img 
          src={user.photoUrl} 
          alt={displayName}
          className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg font-semibold flex-shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 text-left min-w-0">
        <Text type="subheadline1" weight="medium">{displayName}</Text>
        <Text type="caption1" color="secondary" className="truncate">
          {displayUsername}
        </Text>
      </div>
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-primary/10 text-primary flex-shrink-0">
        {role === "advertiser" ? "📢 Advertiser" : "📡 Publisher"}
      </span>
    </button>
  );
}
