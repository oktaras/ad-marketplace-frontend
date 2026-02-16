import { Channel } from "@/types/marketplace";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Users, Eye, TrendingUp, BadgeCheck, ExternalLink, Lock, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDiscoveryChannelAnalytics, getDiscoveryChannelGraphs } from "@/shared/api/discovery";
import type { DiscoveryChannelAnalytics, DiscoveryChannelGraph } from "@/shared/api/discovery";
import {
  chartCursorFillStyle,
  chartCursorLineStyle,
  chartTooltipStyle,
} from "@/shared/notifications/chart-tooltip";
import { analyticsMessages } from "@/shared/analytics/messages";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { useSwipeTabNavigation } from "@/hooks/use-touch-gestures";
import { useTabContentTransition } from "@/hooks/use-tab-content-transition";

interface ChannelDetailSheetProps {
  channel: Channel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AnalyticsStatCard = {
  label: string;
  value: string;
  hint?: string;
};

type GraphMetric = "subscribers" | "views" | "engagement";
type GraphDataPoint = {
  date: string;
  value: number;
};

type ParsedRawGraph = {
  timestamps: number[];
  series: Array<{
    key: string;
    label: string;
    values: number[];
  }>;
};

const GRAPH_TYPE_PRIORITY: Record<GraphMetric, string[]> = {
  subscribers: ["GROWTH", "FOLLOWERS"],
  views: ["INTERACTIONS", "IV_INTERACTIONS", "STORY_INTERACTIONS"],
  engagement: ["INTERACTIONS", "REACTIONS_BY_EMOTION", "STORY_INTERACTIONS"],
};
const CHANNEL_DETAIL_TAB_ORDER = ["info", "analytics"] as const;

function formatMetricValue(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return formatNumber(Math.round(value));
}

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  const rounded = Math.round(value * 10) / 10;
  const formatted = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${formatted}%`;
}

function formatPeriodDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatDateTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function EmptyGraph({ label }: { label: string }) {
  return (
    <div className="h-40 rounded-xl border border-border bg-secondary/30 flex items-center justify-center px-4 text-center">
      <Text type="caption2" color="tertiary">{analyticsMessages.noThirtyDayData(label)}</Text>
    </div>
  );
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseRawGraphData(rawGraph: unknown): ParsedRawGraph | null {
  if (!rawGraph || typeof rawGraph !== "object" || Array.isArray(rawGraph)) {
    return null;
  }

  const graphRecord = rawGraph as Record<string, unknown>;
  const jsonContainer =
    graphRecord.json && typeof graphRecord.json === "object" && !Array.isArray(graphRecord.json)
      ? (graphRecord.json as Record<string, unknown>)
      : null;

  let graphData: unknown = null;
  if (jsonContainer && typeof jsonContainer.data === "string") {
    try {
      graphData = JSON.parse(jsonContainer.data);
    } catch {
      graphData = null;
    }
  }

  if (!graphData && graphRecord.data && typeof graphRecord.data === "object" && !Array.isArray(graphRecord.data)) {
    graphData = graphRecord.data;
  }

  if (!graphData || typeof graphData !== "object" || Array.isArray(graphData)) {
    return null;
  }

  const dataRecord = graphData as Record<string, unknown>;
  const columns = Array.isArray(dataRecord.columns) ? dataRecord.columns : [];
  if (columns.length === 0) {
    return null;
  }

  const names =
    dataRecord.names && typeof dataRecord.names === "object" && !Array.isArray(dataRecord.names)
      ? (dataRecord.names as Record<string, unknown>)
      : {};
  const types =
    dataRecord.types && typeof dataRecord.types === "object" && !Array.isArray(dataRecord.types)
      ? (dataRecord.types as Record<string, unknown>)
      : {};

  let timestamps: number[] = [];
  const series: ParsedRawGraph["series"] = [];

  for (const column of columns) {
    if (!Array.isArray(column) || column.length < 2 || typeof column[0] !== "string") {
      continue;
    }

    const key = column[0];
    const columnValues = column.slice(1).map(toFiniteNumber).filter((value): value is number => value !== null);
    if (columnValues.length === 0) {
      continue;
    }

    const metricType = types[key];
    if (metricType === "x" || key === "x") {
      timestamps = columnValues;
      continue;
    }

    const label = typeof names[key] === "string" ? (names[key] as string) : key;
    series.push({ key, label, values: columnValues });
  }

  if (series.length === 0) {
    return null;
  }

  if (timestamps.length === 0) {
    timestamps = Array.from({ length: series[0].values.length }, (_, index) => index + 1);
  }

  return { timestamps, series };
}

function normalizeTimestamp(value: number): number {
  if (value > 0 && value < 1_000_000_000_000) {
    return value * 1000;
  }

  return value;
}

function getSeriesScore(metric: GraphMetric, key: string, label: string): number {
  const text = `${key} ${label}`.toLowerCase();

  if (metric === "subscribers") {
    let score = 0;
    if (text.includes("subscriber") || text.includes("follower") || text.includes("member")) score += 6;
    if (text.includes("total")) score += 3;
    if (text.includes("growth")) score += 2;
    if (text.includes("join")) score += 1;
    if (text.includes("leave")) score -= 3;
    return score;
  }

  if (metric === "views") {
    let score = 0;
    if (text.includes("view")) score += 6;
    if (text.includes("reach") || text.includes("impression")) score += 3;
    if (text.includes("story")) score += 1;
    return score;
  }

  let score = 0;
  if (text.includes("engagement")) score += 6;
  if (text.includes("interaction")) score += 4;
  if (text.includes("reaction")) score += 2;
  if (text.includes("share")) score += 1;
  if (text.includes("percent") || text.includes("%")) score += 2;
  return score;
}

function toGraphPointsForMetric(graph: DiscoveryChannelGraph, metric: GraphMetric): GraphDataPoint[] {
  const parsedRaw = parseRawGraphData(graph.rawGraph);
  const series = graph.series.length > 0 ? graph.series : parsedRaw?.series ?? [];
  const timestamps = graph.timestamps.length > 0 ? graph.timestamps : parsedRaw?.timestamps ?? [];
  if (series.length === 0 || timestamps.length === 0) {
    return [];
  }

  let selectedSeries = series[0];
  let selectedScore = Number.NEGATIVE_INFINITY;
  for (const candidate of series) {
    const score = getSeriesScore(metric, candidate.key, candidate.label);
    if (score > selectedScore) {
      selectedSeries = candidate;
      selectedScore = score;
    }
  }

  const limit = Math.min(timestamps.length, selectedSeries.values.length);
  const points: GraphDataPoint[] = [];

  for (let index = 0; index < limit; index += 1) {
    const timestamp = toFiniteNumber(timestamps[index]);
    const rawValue = toFiniteNumber(selectedSeries.values[index]);
    if (timestamp === null || rawValue === null) {
      continue;
    }

    const normalizedTimestamp = normalizeTimestamp(timestamp);
    const parsedDate = new Date(normalizedTimestamp);
    const date =
      Number.isNaN(parsedDate.getTime())
        ? `${index + 1}`
        : (formatPeriodDate(parsedDate.toISOString()) || `${index + 1}`);
    const value = metric === "engagement" && rawValue > 0 && rawValue <= 1 ? rawValue * 100 : rawValue;
    points.push({ date, value });
  }

  return points;
}

function getRawGraphPoints(graphs: DiscoveryChannelGraph[], metric: GraphMetric): GraphDataPoint[] {
  if (graphs.length === 0) {
    return [];
  }

  const priorities = GRAPH_TYPE_PRIORITY[metric];
  const graphPriority = (type: string) => {
    const index = priorities.indexOf(type);
    return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
  };

  const ordered = [...graphs].sort((a, b) => graphPriority(a.type) - graphPriority(b.type));
  for (const graph of ordered) {
    const points = toGraphPointsForMetric(graph, metric);
    if (points.length > 1) {
      return points;
    }
  }

  return [];
}

export function ChannelDetailSheet({
  channel,
  open,
  onOpenChange,
}: ChannelDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<"info" | "analytics">("info");

  useEffect(() => {
    if (open) {
      setActiveTab("info");
    }
  }, [channel?.id, open]);

  const analyticsQuery = useQuery<DiscoveryChannelAnalytics | null>({
    queryKey: ["channel-detail", "analytics", channel?.id ?? "none", 30],
    queryFn: () => {
      if (!channel?.id) {
        return Promise.resolve(null);
      }

      return getDiscoveryChannelAnalytics(channel.id, 30);
    },
    enabled: open && Boolean(channel?.id),
    staleTime: 60_000,
  });
  const graphsQuery = useQuery<DiscoveryChannelGraph[]>({
    queryKey: ["channel-detail", "graphs", channel?.id ?? "none", "30d"],
    queryFn: () => {
      if (!channel?.id) {
        return Promise.resolve([]);
      }

      return getDiscoveryChannelGraphs(channel.id, "30d");
    },
    enabled: open && activeTab === "analytics" && Boolean(channel?.id),
    staleTime: 60_000,
  });

  const analytics = analyticsQuery.data;
  const rawGraphs = useMemo(() => graphsQuery.data ?? [], [graphsQuery.data]);
  const metrics = analytics?.metrics;
  const subscribers = metrics?.subscriberCount ?? channel?.subscribers ?? null;
  const avgViews = metrics?.avgViewsPerPost ?? channel?.avgViews ?? null;
  const engagement = metrics?.engagementRate ?? channel?.er ?? null;

  const history = useMemo(
    () => analytics?.history ?? [],
    [analytics?.history],
  );

  const periodLabel = useMemo(() => {
    if (analytics?.period?.start && analytics?.period?.end) {
      const start = formatPeriodDate(analytics.period.start);
      const end = formatPeriodDate(analytics.period.end);
      if (start && end) {
        return `${start} — ${end}`;
      }
    }

    if (history.length >= 2) {
      const start = formatPeriodDate(history[0].fetchedAt);
      const end = formatPeriodDate(history[history.length - 1].fetchedAt);
      if (start && end) {
        return `${start} — ${end}`;
      }
    }

    if (rawGraphs.length > 0) {
      const start = formatPeriodDate(rawGraphs[0].periodStart);
      const end = formatPeriodDate(rawGraphs[0].periodEnd);
      if (start && end) {
        return `${start} — ${end}`;
      }
    }

    return "Last 30 days";
  }, [analytics?.period?.end, analytics?.period?.start, history, rawGraphs]);

  const lastUpdatedLabel = useMemo(
    () => formatDateTime(analytics?.lastUpdatedAt),
    [analytics?.lastUpdatedAt],
  );
  const isDetailedLocked = analytics?.detailedAccess?.available === false;

  const analyticsStatCards = useMemo<AnalyticsStatCard[]>(() => {
    if (!analytics || !metrics) {
      return [];
    }

    const cards: AnalyticsStatCard[] = [];

    if (typeof metrics.avgViewsPerStory === "number") {
      cards.push({
        label: "Views / Story",
        value: formatNumber(Math.round(metrics.avgViewsPerStory)),
      });
    }

    if (typeof metrics.avgSharesPerPost === "number") {
      cards.push({
        label: "Shares / Post",
        value: formatNumber(Math.round(metrics.avgSharesPerPost)),
      });
    }

    if (typeof metrics.avgReactionsPerPost === "number") {
      cards.push({
        label: "Reactions / Post",
        value: formatNumber(Math.round(metrics.avgReactionsPerPost)),
      });
    }

    if (typeof metrics.notificationEnabledRate === "number") {
      cards.push({
        label: "Notifications",
        value: formatPercent(metrics.notificationEnabledRate),
      });
    }

    if (typeof metrics.premiumPercent === "number") {
      cards.push({
        label: "Premium Audience",
        value: formatPercent(metrics.premiumPercent),
      });
    }

    if (analytics.growth) {
      const growthValue = analytics.growth.subscriberGrowth;
      cards.push({
        label: "Growth",
        value: `${growthValue > 0 ? "+" : ""}${formatNumber(growthValue)}`,
        hint: `${formatPercent(analytics.growth.growthPercent)} (${analytics.growth.daysTracked}d)`,
      });
    }

    return cards;
  }, [analytics, metrics]);

  const languageStats = useMemo(() => {
    const distribution = metrics?.languageStats;
    if (!distribution) {
      return [];
    }

    const values = Object.entries(distribution)
      .filter((entry): entry is [string, number] => (
        typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0
      ));

    if (values.length === 0) {
      return [];
    }

    const total = values.reduce((sum, [, value]) => sum + value, 0);
    if (total <= 0) {
      return [];
    }

    return values
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, value]) => ({
        lang,
        percent: Math.round((value / total) * 100),
      }));
  }, [metrics?.languageStats]);

  const subscribersGraph = useMemo(() => {
    const fromHistory = history
      .filter((item) => typeof item.subscriberCount === "number")
      .map((item) => ({
        date: formatPeriodDate(item.fetchedAt) || "—",
        value: Number(item.subscriberCount || 0),
      }));

    if (fromHistory.length > 1) {
      return fromHistory;
    }

    return getRawGraphPoints(rawGraphs, "subscribers");
  }, [history, rawGraphs]);

  const viewsGraph = useMemo(() => {
    const fromHistory = history
      .filter((item) => typeof item.avgViewsPerPost === "number")
      .map((item) => ({
        date: formatPeriodDate(item.fetchedAt) || "—",
        value: Number(item.avgViewsPerPost || 0),
      }));

    if (fromHistory.length > 1) {
      return fromHistory;
    }

    return getRawGraphPoints(rawGraphs, "views");
  }, [history, rawGraphs]);

  const engagementGraph = useMemo(() => {
    const fromHistory = history
      .filter((item) => typeof item.engagementRate === "number")
      .map((item) => ({
        date: formatPeriodDate(item.fetchedAt) || "—",
        value: Number(item.engagementRate || 0),
      }));

    if (fromHistory.length > 1) {
      return fromHistory;
    }

    return getRawGraphPoints(rawGraphs, "engagement");
  }, [history, rawGraphs]);

  const handleRefreshAnalytics = () => {
    void Promise.all([analyticsQuery.refetch(), graphsQuery.refetch()]);
  };

  const tabSwipeHandlers = useSwipeTabNavigation({
    tabOrder: CHANNEL_DETAIL_TAB_ORDER,
    activeTab,
    onTabChange: (nextTab) => setActiveTab(nextTab),
    enabled: open,
  });
  const tabTransitionClass = useTabContentTransition(activeTab, CHANNEL_DETAIL_TAB_ORDER);

  if (!channel) return null;

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Channel Details" fullHeight>
      <div className="space-y-6 min-h-full" {...tabSwipeHandlers}>
        <div className="space-y-3 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl flex-shrink-0">
              <ChannelAvatar
                avatar={channel.avatar}
                name={channel.name}
                className="h-full w-full text-3xl"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Text type="title3" weight="medium">{channel.name}</Text>
                {channel.verified && <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />}
              </div>
              <Text type="caption1" color="secondary">{channel.username}</Text>
            </div>
          </div>
          <Text type="body" color="secondary">{channel.description}</Text>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
              {channel.category}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
              {channel.language}
            </span>
          </div>
        </div>

        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("info")}
            aria-selected={activeTab === "info"}
            role="tab"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "info"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Main Info
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            aria-selected={activeTab === "analytics"}
            role="tab"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "analytics"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Analytics
          </button>
        </div>

        <div className={tabTransitionClass}>
          {activeTab === "info" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <Text type="caption2" color="tertiary">Subscribers</Text>
                <Text type="subheadline1" weight="bold">{formatMetricValue(subscribers)}</Text>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
                <Text type="caption2" color="tertiary">Avg Views</Text>
                <Text type="subheadline1" weight="bold">{formatMetricValue(avgViews)}</Text>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <Text type="caption2" color="tertiary">Engagement</Text>
                <Text type="subheadline1" weight="bold">{formatPercent(engagement)}</Text>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <Text type="caption2" color="tertiary">Price/Post</Text>
                <Text type="subheadline1" weight="bold">{formatCurrency(channel.pricePerPost, channel.currency)}</Text>
              </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <a href={`https://t.me/${channel.username.slice(1)}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open in Telegram
              </a>
            </Button>
          </>
        ) : analyticsQuery.isLoading || (!analytics && graphsQuery.isLoading) ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
            <Text type="caption2" color="secondary">{analyticsMessages.loading}</Text>
          </div>
        ) : analyticsQuery.isError && graphsQuery.isError ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Text type="caption2" color="secondary">
                {analyticsMessages.temporaryUnavailable}
              </Text>
            </div>
            <Button variant="outline" className="w-full" onClick={handleRefreshAnalytics}>
              <RefreshCcw className="h-4 w-4" />
              {analyticsMessages.refreshAnalytics}
            </Button>
          </div>
        ) : isDetailedLocked ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Text type="caption2" color="secondary">
                {analyticsMessages.detailedUnavailableGeneric}
              </Text>
            </div>
            <Button variant="outline" className="w-full" onClick={handleRefreshAnalytics}>
              <RefreshCcw className="h-4 w-4" />
              {analyticsMessages.refreshAnalytics}
            </Button>
          </div>
        ) : analytics || rawGraphs.length > 0 ? (
          <div className="space-y-4">
            <Button variant="outline" className="w-full" onClick={handleRefreshAnalytics}>
              <RefreshCcw className="h-4 w-4" />
              {analyticsMessages.refreshAnalytics}
            </Button>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1">
              <Text type="caption2" color="secondary">
                Source: {analytics?.source || (rawGraphs.length > 0 ? "rawGraph" : "unknown")}
              </Text>
              <Text type="caption2" color="tertiary">Period: {periodLabel}</Text>
              {lastUpdatedLabel && (
                <Text type="caption2" color="tertiary">Updated: {lastUpdatedLabel}</Text>
              )}
            </div>

            {analyticsStatCards.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {analyticsStatCards.map((stat) => (
                  <div key={stat.label} className="bg-secondary/50 rounded-xl p-4 text-center">
                    <Text type="caption2" color="tertiary">{stat.label}</Text>
                    <Text type="subheadline1" weight="bold">{stat.value}</Text>
                    {stat.hint ? (
                      <Text type="caption2" color="tertiary">{stat.hint}</Text>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              <Text type="subheadline2" weight="medium">Subscribers Trend (30d)</Text>
              {subscribersGraph.length > 1 ? (
                <div className="h-44 bg-secondary/20 rounded-xl p-2" data-disable-swipe="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={subscribersGraph}>
                      <defs>
                        <linearGradient id="detailSubscribersFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => formatNumber(Number(v) || 0)} />
                      <Tooltip {...chartTooltipStyle} cursor={chartCursorFillStyle} />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#detailSubscribersFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyGraph label="subscribers" />
              )}
            </div>

            <div className="space-y-2">
              <Text type="subheadline2" weight="medium">Views Per Post (30d)</Text>
              {viewsGraph.length > 1 ? (
                <div className="h-44 bg-secondary/20 rounded-xl p-2" data-disable-swipe="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={viewsGraph}>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => formatNumber(Number(v) || 0)} />
                      <Tooltip {...chartTooltipStyle} cursor={chartCursorFillStyle} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyGraph label="views" />
              )}
            </div>

            <div className="space-y-2">
              <Text type="subheadline2" weight="medium">Engagement Rate (30d)</Text>
              {engagementGraph.length > 1 ? (
                <div className="h-44 bg-secondary/20 rounded-xl p-2" data-disable-swipe="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementGraph}>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => `${Number(v) || 0}%`} />
                      <Tooltip {...chartTooltipStyle} cursor={chartCursorLineStyle} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyGraph label="engagement" />
              )}
            </div>

            {languageStats.length > 0 ? (
              <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
                <Text type="subheadline2" weight="medium">Audience Languages</Text>
                {languageStats.map((entry) => (
                  <div key={entry.lang} className="flex items-center gap-3">
                    <Text type="caption1" className="w-20 truncate">{entry.lang}</Text>
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${entry.percent}%` }} />
                    </div>
                    <Text type="caption2" color="secondary" className="w-9 text-right">{entry.percent}%</Text>
                  </div>
                ))}
              </div>
            ) : null}

          </div>
          ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Text type="caption2" color="secondary">
                {analyticsMessages.detailedUnavailableGeneric}
              </Text>
            </div>
            <Button variant="outline" className="w-full" onClick={handleRefreshAnalytics}>
              <RefreshCcw className="h-4 w-4" />
              {analyticsMessages.refreshAnalytics}
            </Button>
          </div>
          )}
        </div>
      </div>
    </AppSheet>
  );
}
