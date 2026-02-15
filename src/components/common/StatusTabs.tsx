import { Text } from "@telegram-tools/ui-kit";
import { cn } from "@/lib/utils";

interface StatusTab {
  value: string;
  label: string;
  count?: number;
}

interface StatusTabsProps {
  tabs: StatusTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function StatusTabs({ tabs, activeTab, onTabChange }: StatusTabsProps) {
  return (
    <div className="flex gap-1 bg-secondary/50 rounded-lg p-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={activeTab === t.value}
          onClick={() => onTabChange(t.value)}
          className={cn(
            "flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5",
            activeTab === t.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                activeTab === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
