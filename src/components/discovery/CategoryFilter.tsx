import { cn } from "@/lib/utils";
import { HorizontalScrollRow } from "@/components/common/HorizontalScrollRow";

interface CategoryFilterProps {
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    icon?: string | null;
  }>;
  selected: string[];
  onSelect: (categories: string[]) => void;
  loading?: boolean;
}

export function CategoryFilter({ categories, selected, onSelect, loading = false }: CategoryFilterProps) {
  const pillBase = "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border";
  const pillActive = "bg-primary text-primary-foreground border-primary";
  const pillInactive = "bg-card text-muted-foreground border-border hover:border-muted-foreground/40";

  const toggleCategory = (slug: string) => {
    const alreadySelected = selected.includes(slug);
    const next = alreadySelected
      ? selected.filter((entry) => entry !== slug)
      : [...selected, slug];

    onSelect(next);
  };

  return (
    <HorizontalScrollRow
      scrollClassName="py-3"
      contentClassName="flex gap-2"
    >
      <button
        onClick={() => onSelect([])}
        aria-pressed={selected.length === 0}
        className={cn(pillBase, selected.length === 0 ? pillActive : pillInactive)}
      >
        All
      </button>

      {categories.map((category) => {
        const isSelected = selected.includes(category.slug);

        return (
          <button
            key={category.id}
            onClick={() => toggleCategory(category.slug)}
            aria-pressed={isSelected}
            className={cn(pillBase, isSelected ? pillActive : pillInactive)}
            disabled={loading}
          >
            {category.icon ? <span>{category.icon}</span> : null}
            {category.name}
          </button>
        );
      })}
    </HorizontalScrollRow>
  );
}
