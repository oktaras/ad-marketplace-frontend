import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <div className={cn("max-w-lg mx-auto px-4 min-h-full", className)} {...props}>
      {children}
    </div>
  );
}
