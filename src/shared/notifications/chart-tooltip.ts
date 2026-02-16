export const chartTooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
  },
} as const;

export const chartCursorFillStyle = {
  fill: "hsl(var(--foreground) / 0.12)",
} as const;

export const chartCursorLineStyle = {
  stroke: "hsl(var(--foreground) / 0.45)",
  strokeWidth: 1,
} as const;
