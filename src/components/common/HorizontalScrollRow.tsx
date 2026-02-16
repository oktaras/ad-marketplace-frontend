import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HorizontalScrollRowProps {
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
  contentClassName?: string;
  fadeWidthClassName?: string;
  bleed?: boolean;
  showEdgeFade?: boolean;
  wrapContent?: boolean;
}

export function HorizontalScrollRow({
  children,
  className,
  scrollClassName,
  contentClassName,
  fadeWidthClassName = "w-6",
  bleed = true,
  showEdgeFade = true,
  wrapContent = true,
}: HorizontalScrollRowProps) {
  return (
    <div className={cn("relative", bleed && "-mx-4", className)}>
      {showEdgeFade ? (
        <>
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 z-10 bg-gradient-to-r from-background to-transparent",
              fadeWidthClassName,
            )}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-10 bg-gradient-to-l from-background to-transparent",
              fadeWidthClassName,
            )}
          />
        </>
      ) : null}

      <div
        className={cn(
          "overflow-x-auto scrollbar-hide",
          bleed && "px-4",
          scrollClassName,
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {wrapContent ? (
          <div className={cn("min-w-min", contentClassName)}>
            {children}
          </div>
        ) : children}
      </div>
    </div>
  );
}
