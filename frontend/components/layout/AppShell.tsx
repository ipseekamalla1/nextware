"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navigation = [
  {
    section: "Main",
    items: [
      { label: "Dashboard", icon: "▦", href: "/" },
    ],
  },
  {
    section: "Master Data",
    items: [
      { label: "Products", icon: "▣", href: "/products" },
      { label: "Categories", icon: "◫", href: "/categories" },
      { label: "Customers", icon: "♙", href: "/customers" },
      { label: "Suppliers", icon: "◈", href: "/suppliers" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Inventory", icon: "▤", href: "/inventory" },
      { label: "Warehouses", icon: "⌂", href: "/warehouses" },
      { label: "Purchasing", icon: "↙", href: "/purchasing" },
      { label: "Sales", icon: "↗", href: "/sales" },
      { label: "Fulfillment", icon: "□", href: "/fulfillment" },
    ],
  },
  {
    section: "Insights",
    items: [
      { label: "Reports", icon: "▥", href: "/reports" },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Administration", icon: "⚙", href: "/administration" },
    ],
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } flex shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-200`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              NW
            </div>

            {!sidebarCollapsed && (
              <div>
                <div className="text-base font-bold tracking-tight">
                  NextWare
                </div>

                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
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
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => router.push(item.href)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-sm">
                        {item.icon}
                      </span>

                      {!sidebarCollapsed && (
                        <span>{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } rounded-lg px-2 py-2`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              IM
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  User
                </div>

                <div className="truncate text-xs text-slate-400">
                  Administrator
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>

            <div>
              <div className="text-sm font-semibold text-slate-900">
                {pathname === "/"
                  ? "Dashboard"
                  : pathname.startsWith("/products")
                  ? "Products"
                  : pathname.startsWith("/categories")
                  ? "Categories"
                  : pathname.startsWith("/customers")
                  ? "Customers"
                  : pathname.startsWith("/suppliers")
                  ? "Suppliers"
                  : pathname.startsWith("/inventory")
                  ? "Inventory"
                  : pathname.startsWith("/warehouses")
                  ? "Warehouses"
                  : pathname.startsWith("/purchasing")
                  ? "Purchasing"
                  : pathname.startsWith("/sales")
                  ? "Sales"
                  : pathname.startsWith("/fulfillment")
                  ? "Fulfillment"
                  : pathname.startsWith("/reports")
                  ? "Reports"
                  : pathname.startsWith("/administration")
                  ? "Administration"
                  : "Dashboard"}
              </div>

              <div className="text-xs text-slate-400">
                {pathname === "/"
                  ? "Business overview"
                  : pathname.startsWith("/categories")
                  ? "Category master data"
                  : "NextWare ERP & WMS"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 sm:block"
              aria-label="Search"
            >
              Search
            </button>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              ♢
            </button>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white"
              aria-label="User profile"
            >
              IM
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}