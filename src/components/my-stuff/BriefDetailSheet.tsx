import { Brief } from "@/types/marketplace";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BriefMetaRow } from "@/components/common/BriefMetaRow";
import type { BriefApplicationCardItem } from "@/components/discovery/ApplicationCard";
import { Text } from "@telegram-tools/ui-kit";
import { formatCurrency, formatNumber } from "@/lib/format";
import { StatBox } from "@/components/common/StatBox";
import { ApplicationCard } from "@/components/discovery/ApplicationCard";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import { SectionLabel } from "@/components/common/SectionLabel";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { BRIEF_STATUS_CONFIG } from "@/shared/constants/marketplace-status";

interface BriefDetailSheetProps {
  open: boolean;
  brief: Brief | null;
  applications: BriefApplicationCardItem[];
  isApplicationsLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptApplication?: (appId: string) => Promise<void> | void;
  onDeclineApplication?: (appId: string) => Promise<void> | void;
  onToggleBriefStatus?: (nextStatus: Brief["status"]) => Promise<void> | void;
  onDeleteBrief?: () => Promise<void> | void;
}

export function BriefDetailSheet({
  open,
  brief,
  applications,
  isApplicationsLoading = false,
  onOpenChange,
  onAcceptApplication,
  onDeclineApplication,
  onToggleBriefStatus,
  onDeleteBrief,
}: BriefDetailSheetProps) {
  const [loadingAppId, setLoadingAppId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!open || !brief) return null;

  const handleAccept = async (appId: string) => {
    if (!onAcceptApplication) {
      return;
    }

    setLoadingAppId(appId);
    try {
      await onAcceptApplication(appId);
    } finally {
      setLoadingAppId(null);
    }
  };

  const handleDecline = async (appId: string) => {
    if (!onDeclineApplication) {
      return;
    }

    setLoadingAppId(appId);
    try {
      await onDeclineApplication(appId);
    } finally {
      setLoadingAppId(null);
    }
  };

  const handleToggleBriefStatus = async () => {
    if (!onToggleBriefStatus || isUpdatingStatus) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const nextStatus: Brief["status"] = brief.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
      await onToggleBriefStatus(nextStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteBrief = async () => {
    if (!onDeleteBrief || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteBrief();
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const statusConfig = BRIEF_STATUS_CONFIG[brief.status];
  const canToggleStatus = brief.status === "ACTIVE" || brief.status === "PAUSED";
  const toggleLabel = brief.status === "ACTIVE" ? "Close Brief" : "Reopen Brief";

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Brief Details" fullHeight>
      <div className="space-y-6">
        {/* Title & status */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Text type="title3" weight="medium" className="flex-1">{brief.title}</Text>
            <StatusBadge
              label={statusConfig?.label ?? brief.status}
              variant={statusConfig?.variant ?? "muted"}
              dot
              className="flex-shrink-0 mt-1"
            />
          </div>
          <BriefMetaRow category={brief.category} format={brief.format} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Budget" value={formatCurrency(brief.budget, brief.currency)} />
          <StatBox label="Min Subs" value={formatNumber(brief.targetSubscribers)} />
          <StatBox label="Deadline" value={new Date(brief.deadline).toLocaleDateString("en", { month: "short", day: "numeric" })} />
        </div>

        {/* Description */}
        <div>
          <SectionLabel>Description</SectionLabel>
          <div className="mt-2">
            <Text type="body">{brief.description}</Text>
          </div>
        </div>

        {/* Applications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Applications ({applications.length})</SectionLabel>
            {pendingCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning font-medium">
                {pendingCount} pending
              </span>
            )}
          </div>

          {isApplicationsLoading ? (
            <div className="text-center py-6 bg-secondary/30 rounded-xl">
              <Text type="body" color="secondary">Loading applications…</Text>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-6 bg-secondary/30 rounded-xl">
              <Text type="body" color="secondary">No applications yet</Text>
              <Text type="caption2" color="tertiary">Channels will start applying soon</Text>
            </div>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onAccept={(appId) => void handleAccept(appId)}
                  onDecline={(appId) => void handleDecline(appId)}
                  isLoading={loadingAppId === app.id}
                  readOnly={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Close brief action */}
        <div className="space-y-2">
          {canToggleStatus ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={isUpdatingStatus || isDeleting}
              onClick={() => void handleToggleBriefStatus()}
            >
              {toggleLabel}
            </Button>
          ) : null}

          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
            disabled={isUpdatingStatus || isDeleting}
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Brief
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete brief?"
        description="This will permanently remove the brief and pending applications."
        confirmLabel="Delete"
        onConfirm={() => void handleDeleteBrief()}
        onCancel={() => setShowDeleteConfirm(false)}
        isDangerous
        isLoading={isDeleting}
      />
    </AppSheet>
  );
}
