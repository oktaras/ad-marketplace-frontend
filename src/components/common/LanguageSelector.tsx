import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLanguage, LANGUAGES, useLanguage } from "@/contexts/LanguageContext";

type LanguageOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

interface LanguageSelectorProps {
  /** Override value — if not provided, uses global context */
  value?: string;
  /** Override onChange — if not provided, updates global context */
  onChange?: (value: string) => void;
  /** Show full native label or short code */
  variant?: "full" | "compact";
  /** Additional language options beyond the default 3 */
  extraOptions?: { value: string; label: string }[];
  /** Replace default language options */
  options?: LanguageOption[];
  /** Disable selector interaction */
  disabled?: boolean;
  className?: string;
}

const ALL_LANGUAGES = [
  ...LANGUAGES.map((l) => ({ value: l.value, label: l.nativeLabel })),
];

const EXTENDED_LANGUAGES = [
  ...ALL_LANGUAGES,
  { value: "DE", label: "Deutsch" },
  { value: "FR", label: "Français" },
  { value: "ES", label: "Español" },
  { value: "PT", label: "Português" },
  { value: "TR", label: "Türkçe" },
  { value: "AR", label: "العربية" },
  { value: "ZH", label: "中文" },
];

export function LanguageSelector({
  value,
  onChange,
  variant = "full",
  extraOptions,
  options,
  disabled = false,
  className,
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const requestedValue = value ?? language;
  const handleChange = (v: string) => {
    if (onChange) {
      onChange(v);
    } else {
      setLanguage(v as AppLanguage);
    }
  };

  const availableOptions = options ?? (extraOptions
    ? [...ALL_LANGUAGES, ...extraOptions]
    : ALL_LANGUAGES);
  const currentValue = availableOptions.some((option) => option.value === requestedValue)
    ? requestedValue
    : availableOptions[0]?.value ?? requestedValue;

  return (
    <Select value={currentValue} onValueChange={handleChange} disabled={disabled || availableOptions.length === 0}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="z-50 bg-popover border border-border shadow-lg">
        {availableOptions.map((lang) => (
          <SelectItem key={lang.value} value={lang.value} disabled={lang.disabled}>
            {variant === "compact" ? lang.value : lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Extended language selector for channel settings (includes DE, FR, ES, etc.) */
export function ChannelLanguageSelector({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="z-50 bg-popover border border-border shadow-lg">
        {EXTENDED_LANGUAGES.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
