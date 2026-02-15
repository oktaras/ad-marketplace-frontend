import { Text } from "@telegram-tools/ui-kit";
import { cn } from "@/lib/utils";

interface StatBoxProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function StatBox({ label, value, className }: StatBoxProps) {
  return (
    <div className={cn("bg-secondary/50 rounded-xl p-3 flex flex-col items-center justify-center gap-0.5 min-h-[4.5rem]", className)}>
      <Text type="caption2" color="tertiary" className="truncate w-full text-center">{label}</Text>
      <Text type="subheadline1" weight="bold" className="text-center leading-tight">{value}</Text>
    </div>
  );
}
