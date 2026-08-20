type StatTone = "primary" | "success" | "warning" | "danger" | "info";

const iconToneClasses: Record<StatTone, string> = {
  primary: "bg-primary-600/10 text-primary-600",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  trend,
  helpText,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: StatTone;
  trend?: { direction: "up" | "down"; value: string };
  helpText?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-secondary">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconToneClasses[tone]}`}
        >
          {icon}
        </div>
      </div>

      {(trend || helpText) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${
                trend.direction === "up"
                  ? "bg-success-soft text-success"
                  : "bg-danger-soft text-danger"
              }`}
            >
              {trend.direction === "up" ? "↗" : "↘"} {trend.value}
            </span>
          )}
          {helpText && <span className="text-xs text-ink-muted">{helpText}</span>}
        </div>
      )}
    </div>
  );
}
