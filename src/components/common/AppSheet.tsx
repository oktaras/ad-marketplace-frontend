import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { registerSheetBackButton } from "@/app/router/sheetBackButtonState";
import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef } from "react";

const NON_KEYBOARD_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

interface AppSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Icon element displayed before the title (when title is a string) */
  icon?: ReactNode;
  /** Full-height sheet (for long content) */
  fullHeight?: boolean;
  children: ReactNode;
  className?: string;
}

export function AppSheet({ open, onOpenChange, title, icon, fullHeight, children, className }: AppSheetProps) {
  const onOpenChangeRef = useRef(onOpenChange);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const getCssVarPx = (name: string): number => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const hasKeyboardInputFocus = (): boolean => {
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement)) {
      return false;
    }

    if (focused instanceof HTMLTextAreaElement) {
      return !focused.readOnly && !focused.disabled;
    }

    if (focused instanceof HTMLSelectElement) {
      return !focused.disabled;
    }

    if (focused instanceof HTMLInputElement) {
      if (focused.readOnly || focused.disabled) {
        return false;
      }
      return !NON_KEYBOARD_INPUT_TYPES.has(focused.type);
    }

    return focused.isContentEditable;
  };

  const getKeyboardOffsetPx = (): number => {
    const cssKeyboardOffset = getCssVarPx("--app-keyboard-offset");
    if (!hasKeyboardInputFocus()) {
      return 0;
    }

    const visualViewport = window.visualViewport;

    if (!visualViewport) {
      return cssKeyboardOffset;
    }

    const layoutHeight = Math.max(
      getCssVarPx("--app-viewport-active-height"),
      getCssVarPx("--app-viewport-height"),
      window.innerHeight || 0,
      document.documentElement.clientHeight || 0,
    );
    const vvKeyboardOffset = Math.max(
      0,
      layoutHeight - visualViewport.height - visualViewport.offsetTop,
    );

    return Math.max(cssKeyboardOffset, vvKeyboardOffset);
  };

  const keepFieldVisible = (target?: HTMLElement | null) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const focused = target ?? document.activeElement;
    if (!(focused instanceof HTMLElement) || !container.contains(focused)) {
      return;
    }

    const fieldRect = focused.getBoundingClientRect();
    const topBound = getCssVarPx("--app-safe-top-offset") + 20;
    const viewportHeight = Math.max(
      getCssVarPx("--app-viewport-active-height"),
      getCssVarPx("--app-viewport-height"),
      window.innerHeight || 0,
      document.documentElement.clientHeight || 0,
    );
    const bottomSafeOffset = getCssVarPx("--app-safe-bottom-offset");
    const bottomBound = Math.max(
      topBound + 64,
      viewportHeight - getKeyboardOffsetPx() - bottomSafeOffset - 20,
    );

    if (fieldRect.bottom > bottomBound) {
      container.scrollBy({
        top: fieldRect.bottom - bottomBound,
        behavior: "auto",
      });
      return;
    }

    if (fieldRect.top < topBound) {
      container.scrollBy({
        top: fieldRect.top - topBound,
        behavior: "auto",
      });
    }
  };

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    return registerSheetBackButton(() => {
      onOpenChangeRef.current(false);
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement)
        && !(target instanceof HTMLTextAreaElement)
        && !(target instanceof HTMLSelectElement)
      ) {
        return;
      }

      keepFieldVisible(target);

      // iOS keyboard animation can continue after focus event.
      [120, 260, 420, 620, 820].forEach((delayMs) => {
        window.setTimeout(() => keepFieldVisible(target), delayMs);
      });
    };
    const handleViewportChange = () => {
      keepFieldVisible();
    };

    container.addEventListener("focusin", handleFocusIn);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);
    return () => {
      container.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
      window.visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        className={cn(
          "rounded-t-2xl px-0 pb-0 flex flex-col scrollbar-hide",
          fullHeight ? "app-sheet-safe-full" : "max-h-[85vh] app-sheet-safe-max",
          className
        )}
      >
        <SheetHeader className="pb-3 px-4 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            {icon} {title}
          </SheetTitle>
        </SheetHeader>
        <div
          ref={scrollContainerRef}
          className="app-sheet-scroll overflow-y-auto flex-1 px-4 scrollbar-hide"
          style={{
            scrollPaddingTop: "calc(var(--app-safe-top-offset) + 16px)",
            scrollPaddingBottom: "calc(var(--app-keyboard-offset) + var(--app-safe-bottom-offset) + 120px)",
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
