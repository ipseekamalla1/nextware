"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SearchIcon } from "@/components/ui/icons";
import {
  BellIcon,
  BoxIcon,
  CartDownIcon,
  CartUpIcon,
  ChartIcon,
  DashboardIcon,
  LayersIcon,
  MenuCollapseIcon,
  PackageCheckIcon,
  SettingsIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
} from "@/components/ui/nav-icons";

interface NavItem {
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  href: string;
  soon?: boolean;
}

const navigation: { section: string; items: NavItem[] }[] = [
  {
    section: "Main",
    items: [{ label: "Dashboard", icon: DashboardIcon, href: "/" }],
  },
  {
    section: "Master Data",
    items: [
      { label: "Products", icon: BoxIcon, href: "/products" },
      { label: "Categories", icon: TagIcon, href: "/categories" },
      { label: "Customers", icon: UsersIcon, href: "/customers" },
      { label: "Suppliers", icon: TruckIcon, href: "/suppliers" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Inventory", icon: LayersIcon, href: "/inventory", soon: true },
      { label: "Warehouses", icon: WarehouseIcon, href: "/warehouses"},
      { label: "Purchasing", icon: CartDownIcon, href: "/purchasing", soon: true },
      { label: "Sales", icon: CartUpIcon, href: "/sales", soon: true },
      { label: "Fulfillment", icon: PackageCheckIcon, href: "/fulfillment", soon: true },
    ],
  },
  {
    section: "Insights",
    items: [{ label: "Reports", icon: ChartIcon, href: "/reports", soon: true }],
  },
  {
    section: "System",
    items: [
      {
        label: "Administration",
        icon: SettingsIcon,
        href: "/administration",
        soon: true,
      },
    ],
  },
];

const pageTitles: { match: (path: string) => boolean; title: string; description: string }[] = [
  { match: (p) => p === "/", title: "Dashboard", description: "Business overview" },
  { match: (p) => p.startsWith("/products"), title: "Products", description: "Product master data" },
  { match: (p) => p.startsWith("/categories"), title: "Categories", description: "Category master data" },
  { match: (p) => p.startsWith("/customers"), title: "Customers", description: "Customer master data" },
  { match: (p) => p.startsWith("/suppliers"), title: "Suppliers", description: "Supplier master data" },
  { match: (p) => p.startsWith("/inventory"), title: "Inventory", description: "NextWare ERP & WMS" },
  { match: (p) => p.startsWith("/warehouses"), title: "Warehouses", description: "NextWare ERP & WMS" },
  { match: (p) => p.startsWith("/purchasing"), title: "Purchasing", description: "NextWare ERP & WMS" },
  { match: (p) => p.startsWith("/sales"), title: "Sales", description: "NextWare ERP & WMS" },
  { match: (p) => p.startsWith("/fulfillment"), title: "Fulfillment", description: "NextWare ERP & WMS" },
  { match: (p) => p.startsWith("/reports"), title: "Reports", description: "NextWare ERP & WMS" },
  { match: (p) => p.startsWith("/administration"), title: "Administration", description: "NextWare ERP & WMS" },
];

function resolvePageMeta(pathname: string) {
  return (
    pageTitles.find((entry) => entry.match(pathname)) ?? {
      title: "Dashboard",
      description: "NextWare ERP & WMS",
    }
  );
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const pageMeta = resolvePageMeta(pathname);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          sidebarCollapsed ? "md:w-20" : "md:w-64"
        } flex shrink-0 flex-col border-r border-line bg-surface transition-all duration-200 md:static md:translate-x-0`}
      >
        <div className="flex h-16 items-center border-b border-line px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white shadow-sm">
              NW
            </div>

            {!sidebarCollapsed && (
              <div>
                <div className="text-base font-bold tracking-tight text-ink">
                  NextWare
                </div>

                <div className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                  ERP & WMS
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigation.map((group) => (
            <div key={group.section} className="mb-6">
              {!sidebarCollapsed && (
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  {group.section}
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                  const Icon = item.icon;

                  if (item.soon) {
                    return (
                      <div
                        key={item.label}
                        title={
                          sidebarCollapsed
                            ? `${item.label} — coming soon`
                            : undefined
                        }
                        className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted opacity-60"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                          <Icon />
                        </span>

                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left">
                              {item.label}
                            </span>

                            <span className="rounded-full bg-surface-active px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                              Soon
                            </span>
                          </>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => router.push(item.href)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-primary-600 text-white shadow-sm"
                          : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <Icon />
                      </span>

                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } rounded-lg px-2 py-2`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-active text-xs font-semibold text-ink-secondary">
              IM
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">User</div>

                <div className="truncate text-xs text-ink-muted">
                  Administrator
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-hover hover:text-ink md:hidden"
              aria-label="Toggle navigation"
            >
              <MenuCollapseIcon />
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-hover hover:text-ink md:flex"
              aria-label="Toggle sidebar"
            >
              <MenuCollapseIcon />
            </button>

            <div>
              <div className="text-sm font-semibold text-ink">
                {pageMeta.title}
              </div>

              <div className="text-xs text-ink-muted">
                {pageMeta.description}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink-muted transition hover:bg-surface-hover sm:flex"
              aria-label="Search"
            >
              <SearchIcon />
              <span>Search</span>
            </button>

            <ThemeToggle />

            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-hover hover:text-ink"
              aria-label="Notifications"
            >
              <BellIcon />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
            </button>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white"
              aria-label="User profile"
            >
              IM
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
