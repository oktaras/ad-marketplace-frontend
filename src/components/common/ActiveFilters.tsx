import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActiveFilterChip {
  /** Unique key for the filter */
  key: string;
  /** Display label */
  label: string;
  /** Called when the chip is dismissed */
  onRemove: () => void;
}

interface ActiveFiltersProps {
  filters: ActiveFilterChip[];
  /** Called when "Clear all" is tapped */
  onClearAll?: () => void;
  className?: string;
}

export function ActiveFilters({ filters, onClearAll, className }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto scrollbar-hide py-1", className)}>
      {filters.map((f) => (
        <span
          key={f.key}
          className="flex-shrink-0 inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
        >
          {f.label}
          <button
            onClick={f.onRemove}
            className="h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-primary/20 transition-colors"
            aria-label={`Remove ${f.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {filters.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
