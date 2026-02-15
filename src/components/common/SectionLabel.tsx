import { Text } from "@telegram-tools/ui-kit";
import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <Text type="footnote" color="secondary" uppercase weight="medium" className={className}>
      {children}
    </Text>
  );
}
