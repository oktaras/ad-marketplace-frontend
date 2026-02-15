import { BriefMetaRow } from "@/components/common/BriefMetaRow";
import { Text } from "@telegram-tools/ui-kit";
import { formatCurrency } from "@/lib/format";

interface BriefPreviewCardProps {
  title: string;
  category: string;
  format: "post" | "story" | "repost";
  budget: number;
  currency: string;
  description: string;
}

export function BriefPreviewCard({
  title,
  category,
  format,
  budget,
  currency,
  description,
}: BriefPreviewCardProps) {
  return (
    <div className="w-full text-left bg-card rounded-xl border border-border p-4 space-y-3">
      {/* Header */}
      <div className="space-y-1">
        <Text type="subheadline1" weight="medium">{title || "(Untitled Brief)"}</Text>
        <Text type="caption1" color="secondary">Preview</Text>
      </div>

      {/* Tags */}
      <BriefMetaRow category={category as any} format={format} />

      {/* Budget */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-3">
        <Text type="caption2" color="secondary">Budget</Text>
        <Text type="title3" weight="bold" className="text-primary">
          {formatCurrency(budget, currency)}
        </Text>
      </div>

      {/* Description */}
      {description && (
        <Text type="caption1" color="secondary" className="line-clamp-2">
          {description}
        </Text>
      )}
    </div>
  );
}
