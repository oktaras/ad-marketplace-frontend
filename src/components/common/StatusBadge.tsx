import { cn } from "@/lib/utils";

export type StatusBadgeVariant = "success" | "warning" | "error" | "info" | "muted";

interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  /** Optional emoji/icon prefix */
  icon?: string;
  /** Show a dot indicator instead of icon */
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<StatusBadgeVariant, { badge: string; dot: string }> = {
  success: {
    badge: "bg-success/10 text-success",
    dot: "bg-success",
  },
  warning: {
    badge: "bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  error: {
    badge: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  info: {
    badge: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  muted: {
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export function StatusBadge({ label, variant = "muted", icon, dot = true, className }: StatusBadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        styles.badge,
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", styles.dot)} />}
      {icon && !dot && <span>{icon}</span>}
      {label}
    </span>
  );
}
