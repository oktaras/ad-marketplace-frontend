import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useCallback, useRef } from "react";
import { BottomNav } from "./BottomNav";
import { usePullToRefresh } from "@/hooks/use-touch-gestures";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const queryClient = useQueryClient();
  const refreshingRef = useRef(false);

  const refreshActiveQueries = useCallback(async () => {
    if (refreshingRef.current) {
      return;
    }

    refreshingRef.current = true;
    try {
      await queryClient.refetchQueries({ type: "active" });
    } finally {
      refreshingRef.current = false;
    }
  }, [queryClient]);

  const pullToRefreshHandlers = usePullToRefresh({
    onRefresh: refreshActiveQueries,
  });

  return (
    <div className="h-[var(--app-viewport-active-height)] bg-background flex flex-col overflow-hidden pt-[var(--app-safe-top-offset)]">
      <main
        className="app-main-scroll min-h-0 flex-1 overflow-y-auto pb-[calc(3.5rem+var(--app-safe-bottom-offset))]"
        {...pullToRefreshHandlers}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
