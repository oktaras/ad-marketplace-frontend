import { ReactNode } from "react";
import { Text } from "@telegram-tools/ui-kit";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex-1 min-w-0">
          <Text type="title3" weight="bold">{title}</Text>
          {subtitle && (
            <Text type="caption1" color="secondary">{subtitle}</Text>
          )}
        </div>
        {right && <div className="flex-shrink-0 ml-3">{right}</div>}
      </div>
    </header>
  );
}
