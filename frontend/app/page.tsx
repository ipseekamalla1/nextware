"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  BoxIcon,
  LayersIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
} from "@/components/ui/nav-icons";
import {
  Category,
  Customer,
  Product,
  Supplier,
  getCategories,
  getCustomers,
  getProducts,
  getSuppliers,
} from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

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

function AlertIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      <Skeleton className="mt-4 h-7 w-16" />

      <Skeleton className="mt-3 h-3 w-28" />
    </Card>
  );
}

interface DashboardData {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];
}

export default function Home() {
  const router = useRouter();

  const {
    session,
    loading: authLoading,
  } = useAuth();

  const [
    data,
    setData,
  ] = useState<DashboardData | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const companyId =
    session?.companyId ?? null;

  useEffect(() => {
    if (
      authLoading ||
      !companyId
    ) {
      return;
    }

    loadDashboard(companyId);
  }, [
    authLoading,
    companyId,
  ]);

  async function loadDashboard(
    authenticatedCompanyId: string
  ) {
    try {
      setLoading(true);
      setError(null);

      const [
        products,
        categories,
        customers,
        suppliers,
      ] = await Promise.all([
        getProducts(
          authenticatedCompanyId
        ),
        getCategories(
          authenticatedCompanyId
        ),
        getCustomers(
          authenticatedCompanyId
        ),
        getSuppliers(
          authenticatedCompanyId
        ),
      ]);

      setData({
        products,
        categories,
        customers,
        suppliers,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  const today = new Date();

  const dateLabel =
    today.toLocaleDateString(
      undefined,
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

  const hour =
    today.getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";

  const activeProducts =
    data?.products.filter(
      (product) =>
        product.active
    ).length ?? 0;

  const activeCustomers =
    data?.customers.filter(
      (customer) =>
        customer.active
    ).length ?? 0;

  const activeSuppliers =
    data?.suppliers.filter(
      (supplier) =>
        supplier.active
    ).length ?? 0;

  const totalProducts =
    data?.products.length ?? 0;

  const totalCustomers =
    data?.customers.length ?? 0;

  const totalSuppliers =
    data?.suppliers.length ?? 0;

  const quickActions = [
    {
      label: "Add Product",
      description:
        "Create a new product in the catalog",
      href: "/products",
      icon: BoxIcon,
    },
    {
      label: "Add Category",
      description:
        "Organize the product master data",
      href: "/categories",
      icon: TagIcon,
    },
    {
      label: "Add Customer",
      description:
        "Register a new customer account",
      href: "/customers",
      icon: UsersIcon,
    },
    {
      label: "Add Supplier",
      description:
        "Onboard a new supplier",
      href: "/suppliers",
      icon: TruckIcon,
    },
  ];

  if (
    authLoading ||
    !session
  ) {
    return null;
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <p className="mb-1 text-sm font-medium text-ink-muted">
            {dateLabel}
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {greeting}
            {session.firstName
              ? `, ${session.firstName}`
              : ""}
          </h1>

          <p className="mt-1 text-sm text-ink-secondary">
            Here is what is happening across
            your business today.
          </p>
        </div>

        {!loading && error && (
          <div className="mb-6 rounded-xl border border-danger/20 bg-danger-soft px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-danger">
                <AlertIcon />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-danger">
                  Unable to load dashboard data
                </p>

                <p className="mt-1 text-sm text-danger">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  companyId &&
                  loadDashboard(
                    companyId
                  )
                }
                className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label="Total Products"
                value={totalProducts}
                helpText={`${activeProducts} active`}
                tone="primary"
                icon={<BoxIcon />}
              />

              <StatCard
                label="Categories"
                value={
                  data?.categories.length ?? 0
                }
                helpText="Product master data"
                tone="info"
                icon={<LayersIcon />}
              />

              <StatCard
                label="Customers"
                value={totalCustomers}
                helpText={`${activeCustomers} active`}
                tone="success"
                icon={<UsersIcon />}
              />

              <StatCard
                label="Suppliers"
                value={totalSuppliers}
                helpText={`${activeSuppliers} active`}
                tone="warning"
                icon={<TruckIcon />}
              />
            </>
          )}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-3">
          <Card
            padded={false}
            className="xl:col-span-2"
          >
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-sm font-bold text-ink">
                Recent Activity
              </h2>

              <p className="mt-0.5 text-xs text-ink-muted">
                Latest changes across your business
              </p>
            </div>

            <div className="p-6">
              <EmptyState
                icon={<InboxIcon />}
                title="No activity feed yet"
                description="Activity tracking for orders, receipts, and shipments will appear here once those modules are available."
              />
            </div>
          </Card>

          <Card padded={false}>
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-sm font-bold text-ink">
                Quick Actions
              </h2>

              <p className="mt-0.5 text-xs text-ink-muted">
                Common operational tasks
              </p>
            </div>

            <div className="space-y-2 p-4">
              {quickActions.map(
                (action) => {
                  const Icon =
                    action.icon;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() =>
                        router.push(
                          action.href
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-lg border border-line px-4 py-3 text-left transition hover:border-line-strong hover:bg-surface-hover"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600/10 text-primary-600">
                        <Icon />
                      </span>

                      <span>
                        <div className="text-sm font-semibold text-ink">
                          {action.label}
                        </div>

                        <div className="mt-0.5 text-xs text-ink-muted">
                          {action.description}
                        </div>
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}