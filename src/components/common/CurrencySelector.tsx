import { SUPPORTED_CURRENCIES, CryptoCurrency } from "@/types/currency";
import { cn } from "@/lib/utils";

export interface CurrencySelectorOption {
  value: CryptoCurrency;
  label: string;
  icon: string;
  disabled?: boolean;
}

interface CurrencySelectorProps {
  value: CryptoCurrency;
  onChange: (currency: CryptoCurrency) => void;
  options?: ReadonlyArray<CurrencySelectorOption>;
  disabled?: boolean;
  className?: string;
}

export function CurrencySelector({ value, onChange, options, disabled, className }: CurrencySelectorProps) {
  const available = options ?? SUPPORTED_CURRENCIES
    .filter((currency) => currency.available)
    .map((currency) => ({
      value: currency.value,
      label: currency.label,
      icon: currency.icon,
      disabled: false,
    }));

  return (
    <div className={cn("flex gap-2", className)}>
      {available.map((c) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          disabled={disabled || c.disabled}
          aria-pressed={value === c.value}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
            value === c.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border",
            (disabled || c.disabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          <span>{c.icon}</span> {c.label}
        </button>
      ))}
    </div>
  );
}
