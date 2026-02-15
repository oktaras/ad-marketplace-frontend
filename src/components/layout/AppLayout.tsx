import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-[var(--app-viewport-active-height)] bg-background flex flex-col overflow-hidden pt-[var(--app-safe-top-offset)]">
      <main className="app-main-scroll min-h-0 flex-1 overflow-y-auto pb-[calc(3.5rem+var(--app-safe-bottom-offset))]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
