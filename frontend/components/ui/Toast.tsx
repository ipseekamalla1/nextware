export function Toast({
  type,
  message,
  onDismiss,
}: {
  type: "success" | "error";
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-elevated ${
        type === "success"
          ? "border-success/20 bg-surface text-ink"
          : "border-danger/20 bg-surface text-ink"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          type === "success" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
        }`}
      >
        {type === "success" ? "✓" : "!"}
      </span>
      <p className="text-sm font-medium">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="ml-2 text-ink-muted transition hover:text-ink"
        >
          ✕
        </button>
      )}
    </div>
  );
}
