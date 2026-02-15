import { SUPPORTED_CURRENCIES, CryptoCurrency } from "@/types/currency";
import { cn } from "@/lib/utils";

interface CurrencySelectorProps {
  value: CryptoCurrency;
  onChange: (currency: CryptoCurrency) => void;
  disabled?: boolean;
  className?: string;
}

export function CurrencySelector({ value, onChange, disabled, className }: CurrencySelectorProps) {
  const available = SUPPORTED_CURRENCIES.filter((c) => c.available);

  return (
    <div className={cn("flex gap-2", className)}>
      {available.map((c) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          disabled={disabled}
          aria-pressed={value === c.value}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
            value === c.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span>{c.icon}</span> {c.label}
        </button>
      ))}
    </div>
  );
}
