"use client";

import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";
import {
  ThemeToggle,
} from "@/components/ui/ThemeToggle";
import {
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
  FileTextIcon,
} from "@/components/ui/nav-icons";
import {
  useAuth,
} from "@/components/auth/AuthProvider";

interface NavItem {
  label: string;
  icon: (
    props: {
      className?: string;
    }
  ) => React.ReactNode;
  href: string;
  permission?: string;
  soon?: boolean;
}

const navigation: {
  section: string;
  items: NavItem[];
}[] = [
  {
    section: "Main",
    items: [
      {
        label: "Dashboard",
        icon: DashboardIcon,
        href: "/",
      },
    ],
  },
  {
    section: "Master Data",
    items: [
      {
        label: "Products",
        icon: BoxIcon,
        href: "/products",
        permission: "PRODUCT_VIEW",
      },
      {
        label: "Categories",
        icon: TagIcon,
        href: "/categories",
        permission: "CATEGORY_VIEW",
      },
      {
        label: "Units of Measure",
        icon: LayersIcon,
        href: "/units",
        permission: "UNIT_OF_MEASURE_VIEW",
      },
      {
        label: "Customers",
        icon: UsersIcon,
        href: "/customers",
        permission: "CUSTOMER_VIEW",
      },
      {
        label: "Suppliers",
        icon: TruckIcon,
        href: "/suppliers",
        permission: "SUPPLIER_VIEW",
      },
      {
        label: "Warehouses",
        icon: WarehouseIcon,
        href: "/warehouses",
        permission: "WAREHOUSE_VIEW",
      },
      {
        label: "Warehouse Locations",
        icon: WarehouseIcon,
        href: "/warehouse-locations",
        permission:
          "WAREHOUSE_LOCATION_VIEW",
      },
      {
        label: "Company",
        icon: SettingsIcon,
        href: "/company",
        permission: "COMPANY_VIEW",
      },
    ],
  },
  {
    section: "Operations",
    items: [
      {
        label: "Inventory",
        icon: LayersIcon,
        href: "/inventory",
        permission: "INVENTORY_VIEW",
      },
      {
        label: "Purchasing",
        icon: CartDownIcon,
        href: "/purchasing",
        permission:
          "PURCHASE_ORDER_CREATE",
      },
      {
        label: "Receiving",
        icon: PackageCheckIcon,
        href: "/receiving",
        permission: "INVENTORY_VIEW",
      },
      {
        label: "Sales",
        icon: CartUpIcon,
        href: "/sales",
        permission:
          "SALES_ORDER_CREATE",
      },
      {
        label: "Fulfillment",
        icon: PackageCheckIcon,
        href: "/fulfillment",
        permission:
          "SALES_ORDER_CREATE",
      },
    ],
  },
  {
    section: "Insights",
    items: [
      {
        label: "Reports",
        icon: ChartIcon,
        href: "/reports",
      },
    ],
  },
  {
    section: "System",
    items: [
      {
        label: "Documents",
        icon: FileTextIcon,
        href: "/documents",
        permission: "DOCUMENT_VIEW",
      },
      {
        label: "Audit",
        icon: FileTextIcon,
        href: "/audit",
        permission: "AUDIT_VIEW",
      },
      {
        label: "Settings",
        icon: SettingsIcon,
        href: "/settings",
        permission: "COMPANY_VIEW",
      },
    ],
  },
];

const pageTitles: {
  match: (
    path: string
  ) => boolean;
  title: string;
  description: string;
}[] = [
  {
    match: (p) => p === "/",
    title: "Dashboard",
    description: "Business overview",
  },
  {
    match: (p) =>
      p.startsWith("/products"),
    title: "Products",
    description:
      "Product master data",
  },
  {
    match: (p) =>
      p.startsWith("/categories"),
    title: "Categories",
    description:
      "Category master data",
  },
  {
    match: (p) =>
      p.startsWith("/customers"),
    title: "Customers",
    description:
      "Customer master data",
  },
  {
    match: (p) =>
      p.startsWith("/suppliers"),
    title: "Suppliers",
    description:
      "Supplier master data",
  },
  {
    match: (p) =>
      p.startsWith("/units"),
    title: "Units of Measure",
    description:
      "Unit of measure master data",
  },
  {
    match: (p) =>
      p.startsWith("/company"),
    title: "Company",
    description:
      "Company master data",
  },
  {
    match: (p) =>
      p.startsWith("/inventory"),
    title: "Inventory",
    description:
      "Nextware ERP & WMS",
  },
  {
    match: (p) =>
      p.startsWith("/warehouses"),
    title: "Warehouses",
    description:
      "Warehouse master data",
  },
  {
    match: (p) =>
      p.startsWith(
        "/warehouse-locations"
      ),
    title: "Warehouse Locations",
    description:
      "Warehouse location master data",
  },
  {
    match: (p) =>
      p.startsWith("/purchasing"),
    title: "Purchasing",
    description:
      "Purchase orders and receiving",
  },
  {
    match: (p) =>
      p.startsWith("/receiving"),
    title: "Receiving",
    description:
      "Purchase receiving",
  },
  {
    match: (p) =>
      p.startsWith("/sales"),
    title: "Sales",
    description:
      "Nextware ERP & WMS",
  },
  {
    match: (p) =>
      p.startsWith("/fulfillment"),
    title: "Fulfillment",
    description:
      "Nextware ERP & WMS",
  },
  {
    match: (p) =>
      p.startsWith("/reports"),
    title: "Reports",
    description:
      "Nextware ERP & WMS",
  },
  {
    match: (p) =>
      p.startsWith("/documents"),
    title: "Documents",
    description:
      "Document management",
  },
  {
    match: (p) =>
      p.startsWith("/audit"),
    title: "Audit",
    description:
      "System audit history",
  },
  {
    match: (p) =>
      p.startsWith("/settings"),
    title: "Settings",
    description:
      "Company application settings",
  },
  {
    match: (p) =>
      p.startsWith(
        "/administration"
      ),
    title: "Administration",
    description:
      "Nextware ERP & WMS",
  },
];

function resolvePageMeta(
  pathname: string
) {
  return (
    pageTitles.find(
      (entry) =>
        entry.match(pathname)
    ) ?? {
      title: "Dashboard",
      description:
        "Nextware ERP & WMS",
    }
  );
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const {
    session,
    logout,
    hasPermission,
  } = useAuth();

  const pageMeta =
    resolvePageMeta(pathname);

  const displayName =
    [
      session?.firstName,
      session?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    session?.username ||
    "User";

  const initials =
    [
      session?.firstName?.[0],
      session?.lastName?.[0],
    ]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    session?.username
      ?.slice(0, 2)
      .toUpperCase() ||
    "NW";

  function handleLogout() {
    logout();
  }

  function canSeeNavItem(
    item: NavItem
  ): boolean {
    if (!item.permission) {
      return true;
    }

    return hasPermission(
      item.permission
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } ${
          sidebarCollapsed
            ? "md:w-20"
            : "md:w-64"
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
                  Nextware
                </div>

                <div className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                  ERP & WMS
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigation.map(
            (group) => {
              const visibleItems =
                group.items.filter(
                  canSeeNavItem
                );

              if (
                visibleItems.length ===
                0
              ) {
                return null;
              }

              return (
                <div
                  key={
                    group.section
                  }
                  className="mb-6"
                >
                  {!sidebarCollapsed && (
                    <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                      {
                        group.section
                      }
                    </div>
                  )}

                  <div className="space-y-1">
                    {visibleItems.map(
                      (item) => {
                        const isActive =
                          item.href ===
                          "/"
                            ? pathname ===
                              "/"
                            : pathname ===
                                item.href ||
                              pathname.startsWith(
                                `${item.href}/`
                              );

                        const Icon =
                          item.icon;

                        if (
                          item.soon
                        ) {
                          return (
                            <div
                              key={
                                item.label
                              }
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
                                    {
                                      item.label
                                    }
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
                            key={
                              item.label
                            }
                            type="button"
                            onClick={() => {
                              setMobileOpen(
                                false
                              );

                              router.push(
                                item.href
                              );
                            }}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                              isActive
                                ? "bg-primary-600 text-white shadow-sm"
                                : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
                            }`}
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                              <Icon />
                            </span>

                            {!sidebarCollapsed && (
                              <span className="flex-1 text-left">
                                {
                                  item.label
                                }
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              );
            }
          )}
        </nav>

        <div className="border-t border-line p-3">
          {!sidebarCollapsed && (
            <div className="mb-3 rounded-lg bg-surface-hover px-3 py-2.5">
              <div className="truncate text-sm font-semibold text-ink">
                {displayName}
              </div>

              <div className="mt-0.5 truncate text-xs text-ink-muted">
                {session?.username ??
                  "Authenticated user"}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-secondary transition hover:bg-danger-soft hover:text-danger"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
              </svg>
            </span>

            {!sidebarCollapsed && (
              <span>Sign Out</span>
            )}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  !mobileOpen
                )
              }
              className="rounded-lg p-2 text-ink-secondary hover:bg-surface-hover hover:text-ink md:hidden"
              aria-label="Open navigation"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() =>
                setSidebarCollapsed(
                  !sidebarCollapsed
                )
              }
              className="hidden rounded-lg p-2 text-ink-secondary hover:bg-surface-hover hover:text-ink md:block"
              aria-label={
                sidebarCollapsed
                  ? "Expand navigation"
                  : "Collapse navigation"
              }
            >
              <MenuCollapseIcon />
            </button>

            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink">
                {pageMeta.title}
              </div>

              <div className="truncate text-xs text-ink-muted">
                {pageMeta.description}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <div className="hidden h-8 w-px bg-line sm:block" />

            <div className="hidden text-right sm:block">
              <div className="text-xs font-semibold text-ink">
                {displayName}
              </div>

              <div className="text-[10px] text-ink-muted">
                {session?.username}
              </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
              {initials}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}