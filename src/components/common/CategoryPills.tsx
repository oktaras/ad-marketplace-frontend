import { CHANNEL_CATEGORIES, ChannelCategory } from "@/types/marketplace";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { AppSheet } from "@/components/common/AppSheet";
import { HorizontalScrollRow } from "@/components/common/HorizontalScrollRow";

interface CategoryPillsProps {
  /** Currently selected category */
  selected: ChannelCategory | null;
  /** Callback when a category is selected or deselected */
  onSelect: (cat: ChannelCategory | null) => void;
  /** Show an "All" pill at the start (default: false) */
  showAll?: boolean;
  /** Scrollable horizontal strip with fade edges (default: false) */
  scrollable?: boolean;
  /** Show a "More" button that opens a sheet with all categories (default: false) */
  showMore?: boolean;
  className?: string;
}

export function CategoryPills({
  selected,
  onSelect,
  showAll = false,
  scrollable = true,
  showMore = false,
  className,
}: CategoryPillsProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const pillBase =
    "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border";
  const pillActive = "bg-primary text-primary-foreground border-primary";
  const pillInactive = "bg-card text-muted-foreground border-border hover:border-muted-foreground/40";

  const renderPill = (cat: (typeof CHANNEL_CATEGORIES)[number]) => (
    <button
      key={cat.value}
      onClick={() => {
        onSelect(selected === cat.value && showAll ? null : cat.value);
        setSheetOpen(false);
      }}
      aria-pressed={selected === cat.value}
      className={cn(pillBase, selected === cat.value ? pillActive : pillInactive)}
    >
      <span>{cat.emoji}</span> {cat.label}
    </button>
  );

  const allPill = showAll && (
    <button
      onClick={() => {
        onSelect(null);
        setSheetOpen(false);
      }}
      aria-pressed={selected === null}
      className={cn(pillBase, selected === null ? pillActive : pillInactive)}
    >
      All
    </button>
  );

  const morePill = showMore && (
    <button onClick={() => setSheetOpen(true)} className={cn(pillBase, pillInactive)}>
      <SlidersHorizontal className="h-3 w-3" /> More
    </button>
  );

  if (scrollable) {
    return (
      <>
        <HorizontalScrollRow
          className={className}
          scrollClassName="py-3"
          contentClassName="flex gap-2 px-1"
        >
            {allPill}
            {CHANNEL_CATEGORIES.map(renderPill)}
            {morePill}
        </HorizontalScrollRow>

        {showMore && (
          <AppSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            title="Filter by Category"
            icon={<SlidersHorizontal className="h-5 w-5" />}
          >
            <div className="flex flex-wrap gap-2 pb-4">
              {allPill}
              {CHANNEL_CATEGORIES.map(renderPill)}
            </div>
          </AppSheet>
        )}
      </>
    );
  }

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", className)}>
        {allPill}
        {CHANNEL_CATEGORIES.map(renderPill)}
        {morePill}
      </div>

      {showMore && (
        <AppSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Filter by Category"
          icon={<SlidersHorizontal className="h-5 w-5" />}
        >
          <div className="flex flex-wrap gap-2 pb-4">
            {allPill}
            {CHANNEL_CATEGORIES.map(renderPill)}
          </div>
        </AppSheet>
      )}
    </>
  );
}
