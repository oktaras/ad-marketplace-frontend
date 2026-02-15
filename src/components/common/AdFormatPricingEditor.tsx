import { AdFormatPricing } from "@/types/listing";
import { Text } from "@telegram-tools/ui-kit";
import { cn } from "@/lib/utils";

interface AdFormatPricingEditorProps {
  formats: AdFormatPricing[];
  onToggle: (format: string) => void;
  onPriceChange: (format: string, price: number) => void;
  className?: string;
}

const FORMAT_LABELS: Record<string, string> = {
  post: "📝 Post",
  story: "📱 Story",
  repost: "🔄 Repost",
};

export function AdFormatPricingEditor({ formats, onToggle, onPriceChange, className }: AdFormatPricingEditorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {formats.map((f) => (
        <div
          key={f.format}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl border transition-all",
            f.enabled ? "border-border bg-card" : "border-border/50 bg-secondary/30 opacity-60"
          )}
        >
          <button
            onClick={() => onToggle(f.format)}
            aria-pressed={f.enabled}
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
              f.enabled ? "border-primary bg-primary" : "border-muted-foreground"
            )}
          >
            {f.enabled && <span className="text-primary-foreground text-xs">✓</span>}
          </button>
          <div className="flex-1">
            <Text type="subheadline2" weight="medium">
              {FORMAT_LABELS[f.format] ?? f.format}
            </Text>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={f.price || ""}
              onChange={(e) => onPriceChange(f.format, parseInt(e.target.value) || 0)}
              disabled={!f.enabled}
              placeholder="0"
              className="w-20 h-9 px-2 rounded-lg bg-secondary border-0 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <Text type="caption2" color="tertiary">{f.currency}</Text>
          </div>
        </div>
      ))}
    </div>
  );
}
