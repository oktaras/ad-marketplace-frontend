import { useCallback, useMemo, useRef, type HTMLAttributes, type TouchEventHandler } from "react";

type GestureAxis = "x" | "y" | null;

type TouchPoint = {
  x: number;
  y: number;
};

const AXIS_LOCK_THRESHOLD_PX = 8;

function readTouchPoint(event: Parameters<TouchEventHandler<HTMLElement>>[0]): TouchPoint | null {
  const touch = event.touches[0] ?? event.changedTouches[0];
  if (!touch) {
    return null;
  }

  return {
    x: touch.clientX,
    y: touch.clientY,
  };
}

function isSwipeBlockedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest("[data-disable-swipe='true']")) {
    return true;
  }

  if (target.closest("input, textarea, select, [contenteditable='true']")) {
    return true;
  }

  return false;
}

type GestureHandlers = Pick<
  HTMLAttributes<HTMLElement>,
  "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel"
>;

interface PullToRefreshOptions {
  enabled?: boolean;
  thresholdPx?: number;
  onRefresh: () => void | Promise<void>;
}

export function usePullToRefresh({
  enabled = true,
  thresholdPx = 72,
  onRefresh,
}: PullToRefreshOptions): GestureHandlers {
  const startPointRef = useRef<TouchPoint | null>(null);
  const axisRef = useRef<GestureAxis>(null);
  const distanceYRef = useRef(0);
  const canTriggerRef = useRef(false);

  const reset = useCallback(() => {
    startPointRef.current = null;
    axisRef.current = null;
    distanceYRef.current = 0;
    canTriggerRef.current = false;
  }, []);

  const onTouchStart = useCallback<TouchEventHandler<HTMLElement>>((event) => {
    if (!enabled || event.touches.length !== 1) {
      reset();
      return;
    }

    if (isSwipeBlockedTarget(event.target)) {
      reset();
      return;
    }

    const point = readTouchPoint(event);
    if (!point) {
      reset();
      return;
    }

    const container = event.currentTarget;
    canTriggerRef.current = container.scrollTop <= 0;
    if (!canTriggerRef.current) {
      reset();
      return;
    }

    startPointRef.current = point;
    axisRef.current = null;
    distanceYRef.current = 0;
  }, [enabled, reset]);

  const onTouchMove = useCallback<TouchEventHandler<HTMLElement>>((event) => {
    const start = startPointRef.current;
    if (!enabled || !start || event.touches.length !== 1 || !canTriggerRef.current) {
      return;
    }

    const point = readTouchPoint(event);
    if (!point) {
      return;
    }

    const dx = point.x - start.x;
    const dy = point.y - start.y;

    if (!axisRef.current) {
      if (Math.abs(dx) < AXIS_LOCK_THRESHOLD_PX && Math.abs(dy) < AXIS_LOCK_THRESHOLD_PX) {
        return;
      }

      axisRef.current = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
    }

    if (axisRef.current !== "y") {
      return;
    }

    distanceYRef.current = Math.max(0, dy);
  }, [enabled]);

  const onTouchEnd = useCallback<TouchEventHandler<HTMLElement>>(() => {
    if (enabled && axisRef.current === "y" && canTriggerRef.current && distanceYRef.current >= thresholdPx) {
      void onRefresh();
    }

    reset();
  }, [enabled, onRefresh, reset, thresholdPx]);

  const onTouchCancel = useCallback<TouchEventHandler<HTMLElement>>(() => {
    reset();
  }, [reset]);

  return useMemo(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    }),
    [onTouchCancel, onTouchEnd, onTouchMove, onTouchStart],
  );
}

interface SwipeTabNavigationOptions<TTab extends string> {
  tabOrder: readonly TTab[];
  activeTab: TTab;
  onTabChange: (tab: TTab) => void;
  enabled?: boolean;
  thresholdPx?: number;
}

export function useSwipeTabNavigation<TTab extends string>({
  tabOrder,
  activeTab,
  onTabChange,
  enabled = true,
  thresholdPx = 56,
}: SwipeTabNavigationOptions<TTab>): GestureHandlers {
  const startPointRef = useRef<TouchPoint | null>(null);
  const axisRef = useRef<GestureAxis>(null);
  const distanceXRef = useRef(0);
  const canTriggerRef = useRef(false);

  const reset = useCallback(() => {
    startPointRef.current = null;
    axisRef.current = null;
    distanceXRef.current = 0;
    canTriggerRef.current = false;
  }, []);

  const onTouchStart = useCallback<TouchEventHandler<HTMLElement>>((event) => {
    if (!enabled || event.touches.length !== 1) {
      reset();
      return;
    }

    if (isSwipeBlockedTarget(event.target)) {
      reset();
      return;
    }

    const point = readTouchPoint(event);
    if (!point) {
      reset();
      return;
    }

    canTriggerRef.current = true;
    startPointRef.current = point;
    axisRef.current = null;
    distanceXRef.current = 0;
  }, [enabled, reset]);

  const onTouchMove = useCallback<TouchEventHandler<HTMLElement>>((event) => {
    const start = startPointRef.current;
    if (!enabled || !start || !canTriggerRef.current || event.touches.length !== 1) {
      return;
    }

    const point = readTouchPoint(event);
    if (!point) {
      return;
    }

    const dx = point.x - start.x;
    const dy = point.y - start.y;

    if (!axisRef.current) {
      if (Math.abs(dx) < AXIS_LOCK_THRESHOLD_PX && Math.abs(dy) < AXIS_LOCK_THRESHOLD_PX) {
        return;
      }

      axisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }

    if (axisRef.current !== "x") {
      return;
    }

    distanceXRef.current = dx;
  }, [enabled]);

  const onTouchEnd = useCallback<TouchEventHandler<HTMLElement>>(() => {
    if (enabled && canTriggerRef.current && axisRef.current === "x" && Math.abs(distanceXRef.current) >= thresholdPx) {
      const currentIndex = tabOrder.indexOf(activeTab);
      if (currentIndex >= 0) {
        const nextIndex = distanceXRef.current < 0 ? currentIndex + 1 : currentIndex - 1;
        const nextTab = tabOrder[nextIndex];
        if (nextTab) {
          onTabChange(nextTab);
        }
      }
    }

    reset();
  }, [activeTab, enabled, onTabChange, reset, tabOrder, thresholdPx]);

  const onTouchCancel = useCallback<TouchEventHandler<HTMLElement>>(() => {
    reset();
  }, [reset]);

  return useMemo(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    }),
    [onTouchCancel, onTouchEnd, onTouchMove, onTouchStart],
  );
}
