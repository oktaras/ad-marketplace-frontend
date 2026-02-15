import type { DiscoveryChannelGraph } from "@/shared/api/discovery";

export type SeriesPoint = {
  date: string;
  timestamp: number;
  value: number;
};

export type StackedSeriesPoint = {
  date: string;
  timestamp: number;
  [seriesKey: string]: string | number;
};

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

function normalizeTimestampMs(value: number): number {
  if (value > 0 && value < 1_000_000_000_000) {
    return value * 1000;
  }

  return value;
}

function formatDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function scoreSeriesForMetric(metric: "growth" | "followers" | "interactions" | "views_by_source", label: string): number {
  const text = label.toLowerCase();

  if (metric === "growth") {
    if (text.includes("total") || text.includes("subscriber") || text.includes("follower")) return 10;
    if (text.includes("growth")) return 8;
    return 1;
  }

  if (metric === "followers") {
    if (text.includes("join")) return 10;
    if (text.includes("left") || text.includes("leave")) return 9;
    return 1;
  }

  if (metric === "interactions") {
    if (text.includes("interaction")) return 10;
    if (text.includes("reaction")) return 8;
    if (text.includes("view")) return 7;
    return 1;
  }

  if (text.includes("view")) return 10;
  if (text.includes("source")) return 6;
  return 1;
}

export function findGraphByTypePriority(
  graphs: DiscoveryChannelGraph[],
  types: string[],
): DiscoveryChannelGraph | null {
  for (const type of types) {
    const graph = graphs.find((entry) => entry.type === type);
    if (graph) {
      return graph;
    }
  }

  return null;
}

export function buildSingleSeriesPoints(
  graph: DiscoveryChannelGraph | null,
  metric: "growth" | "interactions",
): SeriesPoint[] {
  if (!graph || graph.series.length === 0 || graph.timestamps.length === 0) {
    return [];
  }

  const selectedSeries = [...graph.series]
    .sort((a, b) => (
      scoreSeriesForMetric(metric === "growth" ? "growth" : "interactions", b.label)
      - scoreSeriesForMetric(metric === "growth" ? "growth" : "interactions", a.label)
    ))[0];

  if (!selectedSeries) {
    return [];
  }

  const points: SeriesPoint[] = [];
  const maxLength = Math.min(graph.timestamps.length, selectedSeries.values.length);
  for (let index = 0; index < maxLength; index += 1) {
    const ts = toFiniteNumber(graph.timestamps[index]);
    const value = toFiniteNumber(selectedSeries.values[index]);
    if (ts === null || value === null) {
      continue;
    }

    const timestamp = normalizeTimestampMs(ts);
    points.push({
      timestamp,
      date: formatDateLabel(timestamp),
      value,
    });
  }

  return points;
}

export function buildFollowersSeries(
  graph: DiscoveryChannelGraph | null,
): { joined: SeriesPoint[]; left: SeriesPoint[] } {
  if (!graph || graph.series.length === 0 || graph.timestamps.length === 0) {
    return { joined: [], left: [] };
  }

  const sorted = [...graph.series].sort((a, b) => (
    scoreSeriesForMetric("followers", b.label) - scoreSeriesForMetric("followers", a.label)
  ));

  const joinedSeries = sorted.find((series) => series.label.toLowerCase().includes("join")) || sorted[0];
  const leftSeries = sorted.find((series) => {
    const text = series.label.toLowerCase();
    return text.includes("left") || text.includes("leave");
  }) || sorted[1] || null;

  const build = (series: DiscoveryChannelGraph["series"][number] | null): SeriesPoint[] => {
    if (!series) {
      return [];
    }

    const points: SeriesPoint[] = [];
    const maxLength = Math.min(graph.timestamps.length, series.values.length);
    for (let index = 0; index < maxLength; index += 1) {
      const ts = toFiniteNumber(graph.timestamps[index]);
      const value = toFiniteNumber(series.values[index]);
      if (ts === null || value === null) {
        continue;
      }

      const timestamp = normalizeTimestampMs(ts);
      points.push({
        timestamp,
        date: formatDateLabel(timestamp),
        value,
      });
    }

    return points;
  };

  return {
    joined: build(joinedSeries),
    left: build(leftSeries),
  };
}

export function buildStackedSourcePoints(
  graph: DiscoveryChannelGraph | null,
): { points: StackedSeriesPoint[]; keys: Array<{ key: string; label: string }> } {
  if (!graph || graph.series.length === 0 || graph.timestamps.length === 0) {
    return { points: [], keys: [] };
  }

  const keys = graph.series.map((series) => ({
    key: series.key,
    label: series.label,
  }));

  const points: StackedSeriesPoint[] = [];
  const maxLength = Math.max(
    graph.timestamps.length,
    ...graph.series.map((series) => series.values.length),
  );

  for (let index = 0; index < maxLength; index += 1) {
    const ts = toFiniteNumber(graph.timestamps[index]);
    if (ts === null) {
      continue;
    }

    const timestamp = normalizeTimestampMs(ts);
    const point: StackedSeriesPoint = {
      timestamp,
      date: formatDateLabel(timestamp),
    };

    for (const series of graph.series) {
      const value = toFiniteNumber(series.values[index]);
      point[series.key] = value ?? 0;
    }

    points.push(point);
  }

  return { points, keys };
}
