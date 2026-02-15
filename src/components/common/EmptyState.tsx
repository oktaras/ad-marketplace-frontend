import { ReactNode } from "react";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 space-y-4 px-4">
      <div className="text-5xl">{emoji}</div>
      <div className="space-y-2">
        <Text type="title3" weight="medium">
          {title}
        </Text>
        <Text type="body" color="secondary">
          {description}
        </Text>
      </div>
      {(actionLabel || secondaryAction) && (
        <div className="flex flex-col gap-2 pt-2">
          {actionLabel && onAction && (
            <Button onClick={onAction} className="w-full">
              {actionLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick} className="w-full">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
