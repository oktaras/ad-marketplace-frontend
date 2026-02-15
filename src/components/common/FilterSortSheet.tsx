import { useEffect, useMemo, useState } from "react";
import { AppSheet } from "@/components/common/AppSheet";
import { SectionLabel } from "@/components/common/SectionLabel";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SortOption<T extends string = string> {
  value: T;
  label: string;
}

export interface FilterOption {
  value: string;
  label: string;
  icon?: string | null;
}

export interface FilterSortState<S extends string = string> {
  search: string;
  categories: string[];
  statuses: string[];
  sort: S;
}

interface FilterSortSheetProps<S extends string = string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FilterSortState<S>;
  onApply: (state: FilterSortState<S>) => void;
  sortOptions: SortOption<S>[];
  categoryOptions?: FilterOption[];
  statusOptions?: FilterOption[];
  title?: string;
  showSearch?: boolean;
  showCategory?: boolean;
  showStatus?: boolean;
  searchPlaceholder?: string;
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

export function FilterSortSheet<S extends string = string>({
  open,
  onOpenChange,
  value,
  onApply,
  sortOptions,
  categoryOptions = [],
  statusOptions = [],
  title = "Filters & Sort",
  showSearch = true,
  showCategory = true,
  showStatus = false,
  searchPlaceholder = "Search…",
}: FilterSortSheetProps<S>) {
  const [draft, setDraft] = useState<FilterSortState<S>>(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  const defaultSort = sortOptions[0]?.value ?? ("" as S);
  const canReset = useMemo(
    () => (
      draft.search.trim().length > 0
      || draft.categories.length > 0
      || draft.statuses.length > 0
      || draft.sort !== defaultSort
    ),
    [defaultSort, draft],
  );

  const handleApply = () => {
    onApply({
      ...draft,
      search: draft.search.trim(),
      categories: Array.from(new Set(draft.categories)),
      statuses: Array.from(new Set(draft.statuses)),
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setDraft({
      search: "",
      categories: [],
      statuses: [],
      sort: defaultSort,
    });
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      icon={<SlidersHorizontal className="h-5 w-5" />}
    >
      <div className="flex flex-col gap-5 pb-2">
        {showSearch && (
          <div>
            <SectionLabel>Search</SectionLabel>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={draft.search}
                onChange={(event) => setDraft((previous) => ({ ...previous, search: event.target.value }))}
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {showCategory && categoryOptions.length > 0 && (
          <div>
            <SectionLabel>Categories</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryOptions.map((option) => {
                const selected = draft.categories.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => setDraft((previous) => ({
                      ...previous,
                      categories: toggleValue(previous.categories, option.value),
                    }))}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-muted-foreground/40",
                    )}
                  >
                    {option.icon ? <span>{option.icon}</span> : null}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showStatus && statusOptions.length > 0 && (
          <div>
            <SectionLabel>Status</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {statusOptions.map((option) => {
                const selected = draft.statuses.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => setDraft((previous) => ({
                      ...previous,
                      statuses: toggleValue(previous.statuses, option.value),
                    }))}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-muted-foreground/40",
                    )}
                  >
                    {option.icon ? <span>{option.icon}</span> : null}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Sort by</SectionLabel>
          <div className="flex flex-col gap-1.5 mt-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDraft((previous) => ({ ...previous, sort: option.value }))}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                  draft.sort === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-muted",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleReset}
            disabled={!canReset}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </AppSheet>
  );
}
