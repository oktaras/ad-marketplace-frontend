import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLanguage, LANGUAGES, useLanguage } from "@/contexts/LanguageContext";

interface LanguageSelectorProps {
  /** Override value — if not provided, uses global context */
  value?: string;
  /** Override onChange — if not provided, updates global context */
  onChange?: (value: string) => void;
  /** Show full native label or short code */
  variant?: "full" | "compact";
  /** Additional language options beyond the default 3 */
  extraOptions?: { value: string; label: string }[];
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
  className,
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const currentValue = value ?? language;
  const handleChange = (v: string) => {
    if (onChange) {
      onChange(v);
    } else {
      setLanguage(v as AppLanguage);
    }
  };

  const options = extraOptions
    ? [...ALL_LANGUAGES, ...extraOptions]
    : ALL_LANGUAGES;

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="z-50 bg-popover border border-border shadow-lg">
        {options.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
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
