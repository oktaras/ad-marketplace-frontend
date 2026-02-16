import { Text } from "@telegram-tools/ui-kit";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListPageLoaderProps {
  label?: string;
  inline?: boolean;
  className?: string;
}

export function ListPageLoader({
  label = "Loading…",
  inline = false,
  className,
}: ListPageLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-muted-foreground",
        inline ? "h-10" : "rounded-lg bg-secondary/40 px-3 py-4",
        className,
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <Text type={inline ? "caption1" : "body"} color="tertiary">
        {label}
      </Text>
    </div>
  );
}
