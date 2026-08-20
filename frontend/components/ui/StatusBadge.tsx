type BadgeTone = "success" | "neutral" | "warning" | "danger" | "info";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  neutral: "bg-surface-active text-ink-secondary",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

const dotClasses: Record<BadgeTone, string> = {
  success: "bg-success",
  neutral: "bg-ink-muted",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export function StatusBadge({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  className = "",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}) {
  return (
    <Badge tone={active ? "success" : "neutral"} className={className}>
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className = "",
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[tone]}`} />}
      {children}
    </span>
  );
}
