import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import { Settings } from "lucide-react";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { useThemeMode } from "@/app/providers/theme-mode";
import type { ThemeMode } from "@/shared/theme/mode";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ENGLISH_ONLY_LANGUAGE_OPTIONS = [
  { value: "EN", label: "English" },
];

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { mode, setMode } = useThemeMode();

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Settings" icon={<Settings className="w-5 h-5" />}>

        <div className="space-y-6">

          {/* Appearance */}
          <div className="space-y-3">
            <Text type="subheadline2" weight="medium">Appearance</Text>
            <div className="flex gap-2">
              {(["light", "dark", "auto"] as ThemeMode[]).map((t) => (
                <Button
                  key={t}
                  variant={mode === t ? "default" : "outline"}
                  size="sm"
                  className="flex-1 capitalize"
                  onClick={() => setMode(t)}
                >
                  {t === "light" ? "☀️" : t === "dark" ? "🌙" : "🔄"} {t}
                </Button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-3">
            <Text type="subheadline2" weight="medium">Language</Text>
            <LanguageSelector
              className="w-full"
              options={ENGLISH_ONLY_LANGUAGE_OPTIONS}
              disabled
            />
          </div>
        </div>
    </AppSheet>
  );
}
