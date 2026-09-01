"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { BarList, DonutChart, TrendChart } from "@/components/ui/charts";
import {
  BoxIcon,
  CartDownIcon,
  CartUpIcon,
  LayersIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
} from "@/components/ui/nav-icons";
import { AlertIcon } from "@/components/ui/icons";
import {
  DashboardPeriodKey,
  DashboardSummary,
  getDashboardSummary,
} from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

const PERIOD_OPTIONS: { key: DashboardPeriodKey; label: string }[] = [
  { key: "LAST_7_DAYS", label: "Last 7 days" },
  { key: "LAST_30_DAYS", label: "Last 30 days" },
  { key: "LAST_90_DAYS", label: "Last 90 days" },
  { key: "THIS_MONTH", label: "This month" },
  { key: "THIS_QUARTER", label: "This quarter" },
  { key: "ALL_TIME", label: "All time" },
];

function n(value: number): string {
  return value.toLocaleString();
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(iso).toLocaleDateString();
}

function InboxIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function severityColor(severity: string): string {
  if (severity === "critical") return "var(--color-danger)";
  if (severity === "warning") return "var(--color-accent)";
  return "var(--color-info)";
}

export default function DashboardPage() {
  const router = useRouter();
  const { session, loading: authLoading, hasPermission } = useAuth();

  const [period, setPeriod] = useState<DashboardPeriodKey>("LAST_30_DAYS");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = session?.companyId ?? null;

  const load = useCallback(async (selectedPeriod: DashboardPeriodKey) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardSummary(selectedPeriod);
      setSummary(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load the dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !companyId) {
      return;
    }
    load(period);
  }, [authLoading, companyId, period, load]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (authLoading || !session) {
    return null;
  }

  const products = summary?.products ?? null;
  const warehouses = summary?.warehouses ?? null;
  const locations = summary?.warehouseLocations ?? null;
  const periodLabel = summary?.period.label ?? "";

  const kpis: {
    label: string;
    value: number;
    helpText?: string;
    tone: "primary" | "info" | "success" | "warning";
    icon: React.ReactNode;
  }[] = [];

  if (products) {
    kpis.push({
      label: "Products",
      value: products.total,
      helpText: `${n(products.active)} active · ${n(products.inactive)} inactive`,
      tone: "primary",
      icon: <BoxIcon />,
    });
  }
  if (summary?.categories) {
    kpis.push({
      label: "Categories",
      value: summary.categories.total,
      helpText: `${n(summary.categories.active)} active`,
      tone: "info",
      icon: <TagIcon />,
    });
  }
  if (summary?.customers) {
    kpis.push({
      label: "Customers",
      value: summary.customers.total,
      helpText: `${n(summary.customers.active)} active`,
      tone: "success",
      icon: <UsersIcon />,
    });
  }
  if (summary?.suppliers) {
    kpis.push({
      label: "Suppliers",
      value: summary.suppliers.total,
      helpText: `${n(summary.suppliers.active)} active`,
      tone: "warning",
      icon: <TruckIcon />,
    });
  }
  if (warehouses) {
    kpis.push({
      label: "Warehouses",
      value: warehouses.total,
      helpText: `${n(warehouses.active)} active`,
      tone: "primary",
      icon: <WarehouseIcon />,
    });
  }
  if (locations) {
    kpis.push({
      label: "Storage Locations",
      value: locations.total,
      helpText: `${n(locations.active)} active`,
      tone: "info",
      icon: <LayersIcon />,
    });
  }

  const comingSoon: { key: string; title: string; permission: string; icon: React.ReactNode }[] =
    [
      {
        key: "inventory",
        title: "Inventory analytics",
        permission: "INVENTORY_VIEW",
        icon: <LayersIcon />,
      },
      {
        key: "purchasing",
        title: "Purchasing analytics",
        permission: "PURCHASE_ORDER_VIEW",
        icon: <CartDownIcon />,
      },
      {
        key: "sales",
        title: "Sales & fulfillment analytics",
        permission: "SALES_ORDER_VIEW",
        icon: <CartUpIcon />,
      },
    ].filter((entry) => hasPermission(entry.permission));

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-sm font-medium text-ink-muted">{dateLabel}</p>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {greeting}
              {session.firstName ? `, ${session.firstName}` : ""}
            </h1>
            <p className="mt-1 text-sm text-ink-secondary">
              Operational overview for your company.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <span className="hidden sm:inline">Period</span>
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as DashboardPeriodKey)
              }
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary-400"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!loading && error && (
          <div className="mb-6 rounded-xl border border-danger/30 bg-danger-soft px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-danger">
                <AlertIcon />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger">
                  Unable to load the dashboard
                </p>
                <p className="mt-1 text-sm text-danger">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => load(period)}
                className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* KPI ROW */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading && !summary
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-line bg-surface p-5 shadow-card"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-3 h-7 w-16" />
                  <Skeleton className="mt-3 h-3 w-28" />
                </div>
              ))
            : kpis.map((kpi) => (
                <StatCard
                  key={kpi.label}
                  label={kpi.label}
                  value={n(kpi.value)}
                  helpText={kpi.helpText}
                  tone={kpi.tone}
                  icon={kpi.icon}
                />
              ))}
        </section>

        {/* CHARTS */}
        <section className="mt-6 grid gap-6 xl:grid-cols-3">
          {products && (
            <Card className="xl:col-span-2">
              <CardHeader
                title="Catalog growth"
                description={`Cumulative product count · ${periodLabel}`}
              />
              <TrendChart
                points={(summary?.catalogGrowth ?? []).map((point) => ({
                  date: point.date,
                  value: point.cumulative,
                }))}
                summary={
                  products.addedInPeriod > 0
                    ? `${n(products.addedInPeriod)} added in ${periodLabel.toLowerCase()}`
                    : `No products added in ${periodLabel.toLowerCase()}`
                }
              />
            </Card>
          )}

          {products && (
            <Card>
              <CardHeader
                title="Catalog status"
                description="Active vs inactive products"
              />
              <DonutChart
                segments={[
                  { label: "Active", value: products.active },
                  { label: "Inactive", value: products.inactive },
                ]}
              />
            </Card>
          )}

          {products && (
            <Card className="xl:col-span-2">
              <CardHeader
                title="Products by category"
                description="Where the catalogue is concentrated"
              />
              <BarList
                items={products.byCategory.slice(0, 8).map((slice) => ({
                  label: slice.categoryName,
                  value: slice.count,
                  emphasis: slice.categoryId === null,
                }))}
                formatValue={(value) => `${n(value)}`}
              />
            </Card>
          )}

          {locations && (
            <Card>
              <CardHeader
                title="Locations by type"
                description="Warehouse capacity mix"
              />
              <BarList
                items={locations.byType.map((slice) => ({
                  label: slice.type.charAt(0) + slice.type.slice(1).toLowerCase(),
                  value: slice.count,
                }))}
              />
            </Card>
          )}

          {warehouses && (
            <Card className="xl:col-span-2">
              <CardHeader
                title="Locations by warehouse"
                description="Configured storage locations per site"
              />
              <BarList
                items={warehouses.byWarehouse.map((slice) => ({
                  label: `${slice.code} · ${slice.name}`,
                  value: slice.locationCount,
                  emphasis: slice.locationCount === 0,
                }))}
                empty="No warehouses configured yet."
              />
            </Card>
          )}

          {/* NEEDS ATTENTION */}
          <Card padded={false}>
            <CardHeader
              title="Needs attention"
              description="Actionable data-quality items"
              className="px-5 pt-5"
            />
            <div className="px-2 pb-3">
              {summary && summary.needsAttention.length === 0 ? (
                <div className="px-3 py-6">
                  <EmptyState
                    icon={<CheckCircleIcon />}
                    title="All clear"
                    description="Nothing needs your attention right now."
                  />
                </div>
              ) : (
                <ul>
                  {(summary?.needsAttention ?? []).map((item) => (
                    <li key={item.kind}>
                      <button
                        type="button"
                        onClick={() => router.push(item.href)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-surface-hover"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: severityColor(item.severity) }}
                        />
                        <span className="flex-1 text-sm text-ink-secondary">
                          {item.label}
                        </span>
                        <span className="text-ink-muted" aria-hidden="true">
                          ›
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {/* RECENT PRODUCTS */}
          {products && (
            <Card padded={false} className="xl:col-span-2">
              <CardHeader
                title="Recently added products"
                description="Latest additions to the catalogue"
                className="px-5 pt-5"
              />
              <div className="px-2 pb-3">
                {products.recent.length === 0 ? (
                  <div className="px-3 py-6">
                    <EmptyState
                      icon={<InboxIcon />}
                      title="No products yet"
                      description="Products you add will appear here."
                    />
                  </div>
                ) : (
                  <ul>
                    {products.recent.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/products/view?id=${encodeURIComponent(item.id)}`
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-surface-hover"
                        >
                          <span className="font-mono text-xs font-semibold text-ink-muted">
                            {item.sku}
                          </span>
                          <span className="flex-1 truncate text-sm text-ink">
                            {item.name}
                          </span>
                          {!item.active && (
                            <span className="rounded bg-surface-active px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-muted">
                              Inactive
                            </span>
                          )}
                          <span className="shrink-0 text-xs text-ink-muted">
                            {timeAgo(item.createdAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}

          {/* QUICK ACTIONS */}
          <Card padded={false}>
            <CardHeader
              title="Quick actions"
              description="Common master-data tasks"
              className="px-5 pt-5"
            />
            <div className="space-y-1 px-2 pb-3">
              {[
                { label: "Add product", href: "/products", icon: <BoxIcon /> },
                { label: "Add category", href: "/categories/new", icon: <TagIcon /> },
                { label: "Add customer", href: "/customers/new", icon: <UsersIcon /> },
                { label: "Add supplier", href: "/suppliers/new", icon: <TruckIcon /> },
                { label: "Add warehouse", href: "/warehouses/new", icon: <WarehouseIcon /> },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => router.push(action.href)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-surface-hover"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600/10 text-primary-600">
                    {action.icon}
                  </span>
                  <span className="text-sm font-medium text-ink">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* MODULES NOT YET PRODUCING DATA */}
          {comingSoon.map((entry) => (
            <Card key={entry.key}>
              <CardHeader title={entry.title} />
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-line bg-surface-hover px-4 py-5 text-sm text-ink-muted">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-active">
                  {entry.icon}
                </span>
                <span>
                  Charts appear here once the{" "}
                  {entry.title.replace(" analytics", "").toLowerCase()} module
                  records transactions.
                </span>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
