"use client";

/**
 * Zero-dependency chart primitives for the Nextware dashboard.
 *
 * Every chart carries a visible text alternative (labels + values, or an
 * accessible name) so information is never conveyed by colour or shape alone.
 * Colours come from the Nextware design tokens.
 */

const PRIMARY = "var(--color-primary-600)";
const ACCENT = "var(--color-accent)";
const MUTED = "var(--color-ink-muted)";

function formatCount(value: number): string {
  return value.toLocaleString();
}

/* ------------------------------------------------------------------ */
/* Horizontal bar list — categorical comparison                       */
/* ------------------------------------------------------------------ */

export interface BarListItem {
  label: string;
  value: number;
  emphasis?: boolean;
}

export function BarList({
  items,
  formatValue = formatCount,
  empty = "No data for this view.",
}: {
  items: BarListItem[];
  formatValue?: (value: number) => string;
  empty?: string;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-muted">{empty}</p>;
  }

  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-secondary" title={item.label}>
              {item.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-ink">
              {formatValue(item.value)}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-surface-active">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                background: item.emphasis ? ACCENT : PRIMARY,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Donut — small part-to-whole composition                            */
/* ------------------------------------------------------------------ */

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
}

export function DonutChart({
  segments,
  centerLabel,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
}) {
  const palette = [PRIMARY, ACCENT, MUTED, "var(--color-primary-300)"];
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  const accessibleName = segments
    .map((segment) => `${segment.label}: ${segment.value}`)
    .join(", ");

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg
        viewBox="0 0 140 140"
        width={132}
        height={132}
        role="img"
        aria-label={accessibleName}
        className="shrink-0"
      >
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="16"
          stroke="var(--color-surface-active)"
        />

        {total > 0 &&
          segments.map((segment, index) => {
            const length = (segment.value / total) * circumference;
            const node = (
              <circle
                key={segment.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                strokeWidth="16"
                stroke={segment.color ?? palette[index % palette.length]}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            );
            offset += length;
            return node;
          })}

        <text
          x="70"
          y="70"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-ink text-xl font-bold"
        >
          {formatCount(total)}
        </text>
      </svg>

      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {segments.map((segment, index) => (
          <li key={segment.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                background: segment.color ?? palette[index % palette.length],
              }}
            />
            <span className="truncate text-ink-secondary">{segment.label}</span>
            <span className="ml-auto shrink-0 font-semibold tabular-nums text-ink">
              {formatCount(segment.value)}
            </span>
          </li>
        ))}
        {centerLabel && (
          <li className="pt-1 text-xs text-ink-muted">{centerLabel}</li>
        )}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trend — cumulative line/area over time                             */
/* ------------------------------------------------------------------ */

export interface TrendPoint {
  date: string;
  value: number;
}

export function TrendChart({
  points,
  summary,
}: {
  points: TrendPoint[];
  summary?: string;
}) {
  if (points.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink-muted">
        No changes recorded in this period.
      </p>
    );
  }

  const width = 100;
  const height = 40;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = points.map((point, index) => {
    const x =
      points.length === 1 ? width : (index / (points.length - 1)) * width;
    const y = height - ((point.value - min) / span) * (height - 6) - 3;
    return { x, y };
  });

  const line = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`)
    .join(" ");

  const area = `${line} L${coords[coords.length - 1].x.toFixed(2)} ${height} L${coords[0].x.toFixed(2)} ${height} Z`;

  const first = points[0];
  const last = points[points.length - 1];
  const accessibleName =
    summary ??
    `Trend from ${first.value} on ${first.date} to ${last.value} on ${last.date}`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-28 w-full"
        role="img"
        aria-label={accessibleName}
      >
        <path d={area} fill={PRIMARY} fillOpacity="0.12" />
        <path
          d={line}
          fill="none"
          stroke={PRIMARY}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.length === 1 && (
          <circle cx={coords[0].x} cy={coords[0].y} r="2" fill={PRIMARY} />
        )}
      </svg>

      <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
        <span>{first.date}</span>
        <span>{last.date}</span>
      </div>

      {summary && <p className="mt-1 text-xs text-ink-muted">{summary}</p>}
    </div>
  );
}
