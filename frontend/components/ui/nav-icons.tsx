type IconProps = { className?: string };

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function BoxIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

export function TagIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20.5 12.5 12.6 20.4a2 2 0 0 1-2.83 0l-6.17-6.17a2 2 0 0 1 0-2.83L11.5 3.5H19a1.5 1.5 0 0 1 1.5 1.5v7.5Z" />
      <circle cx="15.5" cy="8.5" r="1.25" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16.5 5.2a3.25 3.25 0 0 1 0 6.1" />
      <path d="M18.5 14.2a6.5 6.5 0 0 1 3 5.8" />
    </svg>
  );
}

export function TruckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2 7h11v10H2z" />
      <path d="M13 10h4l4 3.5V17h-8z" />
      <circle cx="6.5" cy="18.5" r="1.75" />
      <circle cx="16.5" cy="18.5" r="1.75" />
    </svg>
  );
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}

export function WarehouseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 10 12 4l9 6v10a1 1 0 0 1-1 1h-4v-7H8v7H4a1 1 0 0 1-1-1V10Z" />
    </svg>
  );
}

export function CartDownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 4h2l2.5 12.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.47-1.2L21 8H6" />
      <circle cx="9.5" cy="20.5" r="1.2" />
      <circle cx="17.5" cy="20.5" r="1.2" />
    </svg>
  );
}

export function CartUpIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 4h2l2.5 12.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.47-1.2L21 8H6" />
      <circle cx="9.5" cy="20.5" r="1.2" />
      <circle cx="17.5" cy="20.5" r="1.2" />
      <path d="M14 8V4M12 6l2-2 2 2" />
    </svg>
  );
}

export function PackageCheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20V10M12 20V4M20 20v-6" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l1.9-1.5-2-3.4-2.3.6a8 8 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a8 8 0 0 0-2.6 1.5l-2.3-.6-2 3.4L4.6 10.5a7.9 7.9 0 0 0 0 3L2.7 15l2 3.4 2.3-.6a8 8 0 0 0 2.6 1.5L10 22h4l.4-2.7a8 8 0 0 0 2.6-1.5l2.3.6 2-3.4-1.9-1.5Z" />
    </svg>
  );
}

export function MenuCollapseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="m14 9-2 3 2 3" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 4.5 1.5 6 2 7H4c.5-1 2-2.5 2-7Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
