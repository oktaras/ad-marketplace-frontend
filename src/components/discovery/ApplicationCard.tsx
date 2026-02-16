import { Text } from "@telegram-tools/ui-kit";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Users, Calendar, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { APPLICATION_STATUS_BADGE } from "@/shared/notifications/status-maps";
import { useTelegramPopupConfirm } from "@/shared/lib/telegram-popup-confirm";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";

export interface BriefApplicationCardItem {
  id: string;
  briefId: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  channelUsername: string;
  subscribers: number;
  proposedPrice: number;
  currency: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
}

interface ApplicationCardProps {
  application: BriefApplicationCardItem;
  onAccept: (appId: string) => void;
  onDecline: (appId: string) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function ApplicationCard({
  application,
  onAccept,
  onDecline,
  isLoading = false,
  readOnly = false,
}: ApplicationCardProps) {
  const confirmWithPopup = useTelegramPopupConfirm();
  const badge = APPLICATION_STATUS_BADGE[application.status];

  const handleAcceptRequest = () => {
    onAccept(application.id);
  };

  const handleDeclineRequest = async () => {
    const confirmed = await confirmWithPopup({
      title: "Decline Application",
      message: `Decline ${application.channelName}'s application? They'll be notified.`,
      confirmText: "Decline",
      cancelText: "Keep Reviewing",
      isDestructive: true,
    });

    if (!confirmed) {
      return;
    }

    onDecline(application.id);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
            <ChannelAvatar
              avatar={application.channelAvatar}
              name={application.channelName}
              className="h-full w-full text-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Text type="subheadline1" weight="medium">
              {application.channelName}
            </Text>
            <Text type="caption1" color="secondary">
              {application.channelUsername}
            </Text>
          </div>
        </div>
        <StatusBadge label={badge.label} variant={badge.variant} icon={badge.icon} dot={false} />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Text type="caption1" color="secondary">
            {formatNumber(application.subscribers)}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Text type="caption1" color="secondary">
            {new Date(application.appliedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
          </Text>
        </div>
        <div className="text-right">
          <Text type="subheadline2" weight="bold">
            {formatCurrency(application.proposedPrice, application.currency)}
          </Text>
          <Text type="caption2" color="secondary">proposed</Text>
        </div>
      </div>

      {/* Message */}
      <div className="bg-secondary/30 rounded-lg p-3">
        <Text type="caption1">{application.message}</Text>
      </div>

      {/* Actions (only show if pending and not readOnly) */}
      {application.status === "pending" && !readOnly && (
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => void handleDeclineRequest()}
            disabled={isLoading}
          >
            <X className="w-3.5 h-3.5" />
            Decline
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => void handleAcceptRequest()}
            disabled={isLoading}
          >
            <Check className="w-3.5 h-3.5" />
            Accept
          </Button>
        </div>
      )}
    </div>
  );
}
