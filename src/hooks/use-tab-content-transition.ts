import { useEffect, useRef, useState } from "react";

type SwipeAnimationDirection = "left" | "right";

function getDirectionClass(direction: SwipeAnimationDirection): string {
  return direction === "left" ? "tab-content-swipe-left" : "tab-content-swipe-right";
}

export function useTabContentTransition<TTab extends string>(
  activeTab: TTab,
  tabOrder: readonly TTab[],
  durationMs = 180,
): string {
  const previousTabRef = useRef(activeTab);
  const clearTimerRef = useRef<number | null>(null);
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    return () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const previousTab = previousTabRef.current;
    if (previousTab === activeTab) {
      return;
    }

    const previousIndex = tabOrder.indexOf(previousTab);
    const nextIndex = tabOrder.indexOf(activeTab);

    let nextClass = "";
    if (previousIndex >= 0 && nextIndex >= 0 && nextIndex !== previousIndex) {
      nextClass = getDirectionClass(nextIndex > previousIndex ? "left" : "right");
    }

    previousTabRef.current = activeTab;

    if (!nextClass) {
      setAnimationClass("");
      return;
    }

    setAnimationClass(nextClass);
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
    }

    clearTimerRef.current = window.setTimeout(() => {
      setAnimationClass("");
      clearTimerRef.current = null;
    }, durationMs);
  }, [activeTab, durationMs, tabOrder]);

  return animationClass;
}
