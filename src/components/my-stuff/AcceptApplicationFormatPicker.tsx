import { useEffect, useMemo, useState } from "react";
import { AppSheet } from "@/components/common/AppSheet";
import { Button } from "@/components/ui/button";
import { Text } from "@telegram-tools/ui-kit";
import { formatCurrency } from "@/lib/format";

export interface AcceptApplicationFormatOption {
  id: string;
  name: string;
  price: number;
  currency: string;
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
      setSelectedId(options[0]?.id ?? "");
    }
  }, [open, options]);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedId) ?? null,
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
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                  selectedId === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Text type="subheadline2" weight="medium">{option.name}</Text>
                  <Text type="subheadline2" weight="bold">{formatCurrency(option.price, option.currency)}</Text>
                </div>
              </button>
            ))}
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
