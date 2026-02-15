import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

type SortOrder = "subscribers-desc" | "subscribers-asc" | "price-desc" | "price-asc" | "er-desc" | "views-desc";

interface SortSelectorProps {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: "subscribers-desc", label: "Subscribers (High to Low)" },
  { value: "subscribers-asc", label: "Subscribers (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "er-desc", label: "Engagement Rate (High to Low)" },
  { value: "views-desc", label: "Avg Views (High to Low)" },
];

export function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto border-0 bg-secondary px-3 py-1.5 text-sm">
        <ArrowUpDown className="h-4 w-4 mr-1" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {sortOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function applySortToChannels<T extends { subscribers?: number; pricePerPost?: number; er?: number; avgViews?: number }>(
  channels: T[],
  sortOrder: SortOrder
): T[] {
  const sorted = [...channels];
  
  switch (sortOrder) {
    case "subscribers-desc":
      return sorted.sort((a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0));
    case "subscribers-asc":
      return sorted.sort((a, b) => (a.subscribers ?? 0) - (b.subscribers ?? 0));
    case "price-desc":
      return sorted.sort((a, b) => (b.pricePerPost ?? 0) - (a.pricePerPost ?? 0));
    case "price-asc":
      return sorted.sort((a, b) => (a.pricePerPost ?? 0) - (b.pricePerPost ?? 0));
    case "er-desc":
      return sorted.sort((a, b) => (b.er ?? 0) - (a.er ?? 0));
    case "views-desc":
      return sorted.sort((a, b) => (b.avgViews ?? 0) - (a.avgViews ?? 0));
    default:
      return sorted;
  }
}
