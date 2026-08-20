export function IconButton({
  label,
  onClick,
  children,
  danger = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        disabled={disabled}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition disabled:cursor-not-allowed disabled:opacity-40 ${
          danger
            ? "hover:border-danger/30 hover:bg-danger-soft hover:text-danger"
            : "hover:border-line-strong hover:bg-surface-hover hover:text-ink"
        }`}
      >
        {children}
      </button>

      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-[11px] font-medium text-canvas opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </div>
    </div>
  );
}
