import { CHANNEL_CATEGORIES, ChannelCategory } from "@/types/marketplace";
import { FileText } from "lucide-react";

interface BriefMetaRowProps {
  category?: ChannelCategory;
  categoryLabel?: string;
  categoryIcon?: string;
  format?: "post" | "story" | "repost";
  className?: string;
}

const FORMAT_LABELS: Record<string, string> = {
  post: "Post",
  story: "Story",
  repost: "Repost",
};

function formatCategoryLabel(value?: string): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function BriefMetaRow({ category, categoryLabel, categoryIcon, format, className }: BriefMetaRowProps) {
  const cat = category ? CHANNEL_CATEGORIES.find((c) => c.value === category) : null;
  const resolvedCategoryLabel = categoryLabel || cat?.label || formatCategoryLabel(category);
  const resolvedCategoryIcon = categoryIcon || cat?.emoji;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1.5">
        {resolvedCategoryLabel && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
            {resolvedCategoryIcon ? `${resolvedCategoryIcon} ` : null}
            {resolvedCategoryLabel}
          </span>
        )}
        {format && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
            <FileText className="h-3 w-3" /> {FORMAT_LABELS[format]}
          </span>
        )}
      </div>
    </div>
  );
}
