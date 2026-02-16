import { type ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Text } from "@telegram-tools/ui-kit";
import { Bell, Eye, Lock, RefreshCcw, TrendingUp, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  getDiscoveryChannelAnalytics,
  getDiscoveryChannelGraphsPayload,
} from "@/shared/api/discovery";
import { analyticsMessages } from "@/shared/analytics/messages";
import {
  buildFollowersSeries,
  buildSingleSeriesPoints,
  buildStackedSourcePoints,
  findGraphByTypePriority,
} from "@/shared/analytics/graphs";
import { formatNumber } from "@/lib/format";
import { useAuthStore } from "@/features/auth/model/auth.store";
import {
  getTelegramAuthStatus,
  isTelegramDetailedAnalyticsConnected,
} from "@/shared/telegram-auth/status";
import {
  chartCursorFillStyle,
  chartCursorLineStyle,
  chartTooltipStyle,
} from "@/shared/notifications/chart-tooltip";

interface ChannelAnalyticsPanelProps {
  channelId: string;
  viewer: "owner" | "advertiser";
  showRefreshButton?: boolean;
  refreshLoading?: boolean;
  onQueueRefresh?: () => void;
  onOpenTelegramConnect?: () => void;
}

type TooltipEntry = {
  date: string;
  [key: string]: string | number;
};

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function formatCount(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return formatNumber(Math.round(value));
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsed);
}

function formatDateTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function tooltipWrapper(children: ReactNode) {
  return (
    <div className="rounded-lg border border-border bg-card px-2 py-1.5 shadow-sm">
      {children}
    </div>
  );
}

function GrowthTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const row = payload[0]?.payload as TooltipEntry | undefined;
  const followers = typeof row?.value === "number" ? formatNumber(Math.round(row.value)) : "—";
  const date = typeof row?.date === "string" ? row.date : "—";

  return tooltipWrapper(
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <Text type="caption2" color="secondary">Date</Text>
        <Text type="caption2">{date}</Text>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Text type="caption2" color="secondary">Followers</Text>
        <Text type="caption2" weight="medium">{followers}</Text>
      </div>
    </div>,
  );
}

function InfoBox({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2 rounded-lg bg-secondary/50">
      {icon ? <div className="text-muted-foreground">{icon}</div> : <div className="h-[14px]" />}
      <Text type="caption1" weight="bold">{value}</Text>
      <Text type="caption2" color="tertiary">{label}</Text>
    </div>
  );
}

export function ChannelAnalyticsPanel({
  channelId,
  viewer,
  showRefreshButton = false,
  refreshLoading = false,
  onQueueRefresh,
  onOpenTelegramConnect,
}: ChannelAnalyticsPanelProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isOwner = viewer === "owner";

  const analyticsQuery = useQuery({
    queryKey: ["channel-analytics-panel", viewer, "analytics", channelId, 30],
    queryFn: () => getDiscoveryChannelAnalytics(channelId, 30),
    enabled: Boolean(channelId),
    staleTime: 60_000,
  });

  const graphsQuery = useQuery({
    queryKey: ["channel-analytics-panel", viewer, "graphs", channelId, "30d"],
    queryFn: () => getDiscoveryChannelGraphsPayload(channelId, "30d"),
    enabled: Boolean(channelId),
    staleTime: 60_000,
  });

  const telegramAuthQuery = useQuery({
    queryKey: ["telegram-auth-status"],
    queryFn: getTelegramAuthStatus,
    enabled: isOwner && isAuthenticated,
    staleTime: 30_000,
  });

  const analytics = analyticsQuery.data;
  const graphPayload = graphsQuery.data;
  const graphs = graphPayload?.graphs ?? [];

  const isPublisherDisconnected =
    isOwner
    && telegramAuthQuery.isSuccess
    && !isTelegramDetailedAnalyticsConnected(telegramAuthQuery.data);

  const isDetailedLocked = isPublisherDisconnected || analytics?.detailedAccess?.available === false;
  const detailedLockedReason = isOwner
    ? (analytics?.detailedAccess?.reason || analyticsMessages.ownerConnectRequired)
    : analyticsMessages.detailedUnavailableGeneric;

  const periodLabel = useMemo(() => {
    const windowStart = formatDate(graphPayload?.window.start ?? null);
    const windowEnd = formatDate(graphPayload?.window.end ?? null);
    if (windowStart && windowEnd) {
      return `${windowStart} — ${windowEnd}`;
    }

    const analyticsStart = formatDate(analytics?.period.start);
    const analyticsEnd = formatDate(analytics?.period.end);
    if (analyticsStart && analyticsEnd) {
      return `${analyticsStart} — ${analyticsEnd}`;
    }

    return "Last 30 days";
  }, [analytics?.period.end, analytics?.period.start, graphPayload?.window.end, graphPayload?.window.start]);

  const lastUpdatedLabel = useMemo(
    () => formatDateTime(analytics?.lastUpdatedAt),
    [analytics?.lastUpdatedAt],
  );

  const growthGraph = useMemo(
    () => findGraphByTypePriority(graphs, ["GROWTH"]),
    [graphs],
  );
  const followersGraph = useMemo(
    () => findGraphByTypePriority(graphs, ["FOLLOWERS"]),
    [graphs],
  );
  const interactionsGraph = useMemo(
    () => findGraphByTypePriority(graphs, ["INTERACTIONS", "IV_INTERACTIONS", "STORY_INTERACTIONS"]),
    [graphs],
  );
  const viewsBySourceGraph = useMemo(
    () => findGraphByTypePriority(graphs, ["VIEWS_BY_SOURCE"]),
    [graphs],
  );

  const growthPoints = useMemo(
    () => buildSingleSeriesPoints(growthGraph, "growth"),
    [growthGraph],
  );
  const interactionsPoints = useMemo(
    () => buildSingleSeriesPoints(interactionsGraph, "interactions"),
    [interactionsGraph],
  );
  const followersSeries = useMemo(
    () => buildFollowersSeries(followersGraph),
    [followersGraph],
  );
  const followersPoints = useMemo(() => {
    const joinedMap = new Map(followersSeries.joined.map((point) => [point.timestamp, point.value]));
    const leftMap = new Map(followersSeries.left.map((point) => [point.timestamp, point.value]));
    const timestamps = Array.from(new Set([...joinedMap.keys(), ...leftMap.keys()])).sort((a, b) => a - b);

    return timestamps.map((timestamp) => ({
      timestamp,
      date: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(timestamp)),
      joined: joinedMap.get(timestamp) ?? 0,
      left: leftMap.get(timestamp) ?? 0,
    }));
  }, [followersSeries.joined, followersSeries.left]);
  const viewsBySourceSeries = useMemo(
    () => buildStackedSourcePoints(viewsBySourceGraph),
    [viewsBySourceGraph],
  );
  const viewsPoints = useMemo(() => {
    if (viewsBySourceSeries.points.length === 0 || viewsBySourceSeries.keys.length === 0) {
      return [];
    }

    return viewsBySourceSeries.points.map((point) => ({
      date: String(point.date),
      value: viewsBySourceSeries.keys.reduce((sum, series) => {
        const raw = point[series.key];
        const value = typeof raw === "number" ? raw : Number(raw ?? 0);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    }));
  }, [viewsBySourceSeries.keys, viewsBySourceSeries.points]);

  const languageRows = useMemo(() => {
    const values = analytics?.metrics.languageStats;
    if (!values) {
      return [];
    }

    const entries = Object.entries(values)
      .filter((entry): entry is [string, number] => (
        typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0
      ));
    if (entries.length === 0) {
      return [];
    }

    const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
    return entries
      .map(([language, value]) => ({
        language,
        percent: Math.round((value / total) * 1000) / 10,
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [analytics?.metrics.languageStats]);

  const showActionBar = isOwner;

  if (analyticsQuery.isLoading || graphsQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-secondary/40 p-3">
        <Text type="caption2" color="secondary">{analyticsMessages.loading}</Text>
      </div>
    );
  }

  if (analyticsQuery.isError && graphsQuery.isError) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <Text type="caption2" color="secondary">{analyticsMessages.temporaryUnavailable}</Text>
        </div>
        {showActionBar ? (
          <Button variant="outline" className="w-full" onClick={() => {
            void analyticsQuery.refetch();
            void graphsQuery.refetch();
          }}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showActionBar ? (
        <div className="flex items-center gap-2 flex-nowrap">
          <Button
            variant="outline"
            className={showRefreshButton && onQueueRefresh ? "flex-1 min-w-0" : "w-full"}
            onClick={() => {
              void analyticsQuery.refetch();
              void graphsQuery.refetch();
            }}
            disabled={analyticsQuery.isFetching || graphsQuery.isFetching}
          >
            Reload data
          </Button>
          {showRefreshButton && onQueueRefresh ? (
            <Button className="flex-1 min-w-0" onClick={onQueueRefresh} disabled={refreshLoading}>
              <RefreshCcw className={`h-4 w-4 ${refreshLoading ? "animate-spin" : ""}`} />
              Sync analythics
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-1">
        <Text type="caption2" color="secondary">Source: Telegram</Text>
        <Text type="caption2" color="tertiary">Period: {periodLabel}</Text>
        {lastUpdatedLabel ? (
          <Text type="caption2" color="tertiary">Updated: {lastUpdatedLabel}</Text>
        ) : null}
      </div>

      {isDetailedLocked ? (
        <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <Text type="caption2" color="secondary">{detailedLockedReason}</Text>
          </div>
          {isOwner ? (
            <Text type="caption2" color="tertiary">{analyticsMessages.ownerBasicOnlyHint}</Text>
          ) : null}
          {isOwner && isPublisherDisconnected && onOpenTelegramConnect ? (
            <Button variant="outline" className="w-full" onClick={onOpenTelegramConnect}>
              {analyticsMessages.connectTelegramCta}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className={`grid gap-2 ${isDetailedLocked ? "grid-cols-1" : "grid-cols-4"}`}>
        <InfoBox
          icon={<Users className="h-3.5 w-3.5" />}
          label="Subs"
          value={formatCount(analytics?.metrics.subscriberCount)}
        />
        {!isDetailedLocked ? (
          <>
            <InfoBox
              icon={<Eye className="h-3.5 w-3.5" />}
              label="Avg Views"
              value={formatCount(analytics?.metrics.avgViewsPerPost)}
            />
            <InfoBox
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Engagement"
              value={formatPercent(analytics?.metrics.engagementRate ?? null)}
            />
            <InfoBox
              icon={<Bell className="h-3.5 w-3.5" />}
              label="Notifications"
              value={formatPercent(analytics?.metrics.notificationEnabledRate ?? null)}
            />
          </>
        ) : null}
      </div>

      {!isDetailedLocked ? (
        <>
          <div>
            <Text type="subheadline2" weight="medium" className="text-primary mb-1">Growth</Text>
            <Text type="caption2" color="tertiary">{periodLabel}</Text>
            {growthPoints.length > 0 ? (
              <div className="h-48 mt-3" data-disable-swipe="true">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthPoints}>
                    <defs>
                      <linearGradient id={`growthFill-${channelId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v: number) => formatNumber(Number(v) || 0)} />
                    <Tooltip content={<GrowthTooltip />} cursor={chartCursorFillStyle} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill={`url(#growthFill-${channelId})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Text type="caption2" color="tertiary" className="mt-2">Growth history is not available yet.</Text>
            )}
          </div>

          <div>
            <Text type="subheadline2" weight="medium" className="text-primary mb-1">Followers</Text>
            <Text type="caption2" color="tertiary">{periodLabel}</Text>
            {followersPoints.length > 0 ? (
              <>
                <div className="h-48 mt-3" data-disable-swipe="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={followersPoints}>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip {...chartTooltipStyle} cursor={chartCursorFillStyle} />
                      <Bar dataKey="joined" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Joined" />
                      <Bar dataKey="left" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Left" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--success))" }} />
                    <Text type="caption2">Joined</Text>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--destructive))" }} />
                    <Text type="caption2">Left</Text>
                  </div>
                </div>
              </>
            ) : (
              <Text type="caption2" color="tertiary" className="mt-2">Followers history is not available yet.</Text>
            )}
          </div>

          <div>
            <Text type="subheadline2" weight="medium" className="text-primary mb-1">Views</Text>
            <Text type="caption2" color="tertiary">{periodLabel}</Text>
            {viewsPoints.length > 0 ? (
              <div className="h-48 mt-3" data-disable-swipe="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viewsPoints}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} tickFormatter={(v: number) => formatNumber(Number(v) || 0)} />
                    <Tooltip {...chartTooltipStyle} cursor={chartCursorFillStyle} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Text type="caption2" color="tertiary" className="mt-2">Views history is not available yet.</Text>
            )}
          </div>

          <div>
            <Text type="subheadline2" weight="medium" className="text-primary mb-1">Interactions</Text>
            <Text type="caption2" color="tertiary">{periodLabel}</Text>
            {interactionsPoints.length > 0 ? (
              <div className="h-48 mt-3" data-disable-swipe="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={interactionsPoints}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} tickFormatter={(v: number) => formatNumber(Number(v) || 0)} />
                    <Tooltip {...chartTooltipStyle} cursor={chartCursorLineStyle} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Interactions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Text type="caption2" color="tertiary" className="mt-2">Interactions history is not available yet.</Text>
            )}
          </div>

          <div>
            <Text type="subheadline2" weight="medium" className="text-primary mb-1">Users Languages</Text>
            {languageRows.length > 0 ? (
              <div className="space-y-2 mt-3">
                {languageRows.map((entry) => (
                  <div key={entry.language} className="flex items-center gap-3">
                    <Text type="body" className="w-20 truncate">{entry.language}</Text>
                    <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${entry.percent}%` }}
                      />
                    </div>
                    <Text type="caption1" color="secondary" className="w-10 text-right">{entry.percent}%</Text>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="caption2" color="tertiary" className="mt-2">Language distribution is not available yet.</Text>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
