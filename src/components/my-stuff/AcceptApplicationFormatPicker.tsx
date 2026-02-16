import { useEffect, useMemo, useState } from "react";
import { AppSheet } from "@/components/common/AppSheet";
import { Button } from "@/components/ui/button";
import { Text } from "@telegram-tools/ui-kit";
import { formatCurrency } from "@/lib/format";
import { isAdFormatActive } from "@/shared/lib/ad-format";

export interface AcceptApplicationFormatOption {
  id: string;
  name: string;
  price: number;
  currency: string;
  type?: string;
}

interface AcceptApplicationFormatPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string;
  options: AcceptApplicationFormatOption[];
  onConfirm: (adFormatId: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function AcceptApplicationFormatPicker({
  open,
  onOpenChange,
  channelName,
  options,
  onConfirm,
  isSubmitting = false,
}: AcceptApplicationFormatPickerProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (open) {
      const firstActive = options.find((option) => isAdFormatActive(option.type))?.id ?? "";
      setSelectedId(firstActive);
    }
  }, [open, options]);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedId && isAdFormatActive(option.type)) ?? null,
    [options, selectedId],
  );

  const handleConfirm = async () => {
    if (!selectedOption || isSubmitting) {
      return;
    }

    await onConfirm(selectedOption.id);
  };

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Choose Ad Format">
      <div className="space-y-4">
        <Text type="body" color="secondary">
          Select the ad format for <span className="font-medium text-foreground">{channelName}</span>.
        </Text>

        {options.length === 0 ? (
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <Text type="caption1" color="secondary">No ad format options are available.</Text>
          </div>
        ) : (
          <div className="space-y-2">
            {options.map((option) => {
              const active = isAdFormatActive(option.type);
              return (
              <button
                key={option.id}
                onClick={() => {
                  if (!active) return;
                  setSelectedId(option.id);
                }}
                disabled={!active}
                className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                  selectedId === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/40"
                } ${!active ? "opacity-60 cursor-not-allowed hover:border-border" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Text type="subheadline2" weight="medium">{option.name}</Text>
                  <Text type="subheadline2" weight="bold">{formatCurrency(option.price, option.currency)}</Text>
                </div>
              </button>
              );
            })}
          </div>
        )}

        {options.length > 0 && !options.some((option) => isAdFormatActive(option.type)) && (
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <Text type="caption1" color="secondary">Only 📝 Post is active for now.</Text>
          </div>
        )}

        <Button
          className="w-full"
          disabled={!selectedOption || isSubmitting}
          onClick={() => void handleConfirm()}
        >
          {isSubmitting ? "Accepting…" : "Accept Application"}
        </Button>
      </div>
    </AppSheet>
  );
}
