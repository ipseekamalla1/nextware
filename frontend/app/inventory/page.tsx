"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { AlertIcon, SearchIcon } from "@/components/ui/icons";
import { getCurrentCompanyId, hasPermission } from "@/lib/auth";
import {
  getInventoryBalances,
  InventoryBalance,
} from "@/lib/inventoryApi";

export default function InventoryPage() {
  const companyId = getCurrentCompanyId();

  const canView = hasPermission("INVENTORY_VIEW");

  const [balances, setBalances] = useState<
    InventoryBalance[]
  >([]);

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [locationFilter, setLocationFilter] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!canView || !companyId) {
      setLoading(false);
      return;
    }

    loadBalances();
  }, [canView, companyId]);

  async function loadBalances() {
    if (!companyId || !canView) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getInventoryBalances(
        companyId
      );

      setBalances(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load inventory."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredBalances = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return balances.filter((balance) => {
      const productId =
        balance.productId.toLowerCase();

      const locationId =
        balance.warehouseLocationId.toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        productId.includes(normalizedSearch) ||
        locationId.includes(normalizedSearch);

      const matchesProduct =
        productFilter === "" ||
        balance.productId === productFilter;

      const matchesLocation =
        locationFilter === "" ||
        balance.warehouseLocationId ===
          locationFilter;

      return (
        matchesSearch &&
        matchesProduct &&
        matchesLocation
      );
    });
  }, [
    balances,
    search,
    productFilter,
    locationFilter,
  ]);

  const productIds = useMemo(() => {
    return Array.from(
      new Set(
        balances.map(
          (balance) => balance.productId
        )
      )
    ).sort();
  }, [balances]);

  const locationIds = useMemo(() => {
    return Array.from(
      new Set(
        balances.map(
          (balance) =>
            balance.warehouseLocationId
        )
      )
    ).sort();
  }, [balances]);

  const totals = useMemo(() => {
    return filteredBalances.reduce(
      (summary, balance) => {
        return {
          quantity:
            summary.quantity +
            balance.quantity,

          reserved:
            summary.reserved +
            balance.reservedQuantity,

          available:
            summary.available +
            balance.availableQuantity,
        };
      },
      {
        quantity: 0,
        reserved: 0,
        available: 0,
      }
    );
  }, [filteredBalances]);

  if (!canView) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <p className="text-sm font-semibold text-danger">
              Access denied
            </p>

            <p className="mt-1 text-sm text-danger">
              You do not have permission to view
              inventory.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!companyId) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <p className="text-sm font-semibold text-danger">
              Company context unavailable
            </p>

            <p className="mt-1 text-sm text-danger">
              Your authenticated company could not
              be determined. Please sign in again.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <div className="mb-1 text-xs font-medium text-ink-muted">
            Inventory
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-ink-muted">
              View inventory quantities, reservations
              and available stock by warehouse
              location.
            </p>
          </div>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Total Quantity
            </p>

            <p className="mt-2 text-2xl font-bold text-ink">
              {totals.quantity.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-ink-muted">
              Across filtered locations
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Reserved
            </p>

            <p className="mt-2 text-2xl font-bold text-ink">
              {totals.reserved.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-ink-muted">
              Quantity currently reserved
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Available
            </p>

            <p className="mt-2 text-2xl font-bold text-ink">
              {totals.available.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-ink-muted">
              Quantity available for use
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by product or location ID..."
                className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
              />
            </div>

            <select
              value={productFilter}
              onChange={(event) =>
                setProductFilter(
                  event.target.value
                )
              }
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
            >
              <option value="">
                All Products
              </option>

              {productIds.map((productId) => (
                <option
                  key={productId}
                  value={productId}
                >
                  {productId}
                </option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(event) =>
                setLocationFilter(
                  event.target.value
                )
              }
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
            >
              <option value="">
                All Locations
              </option>

              {locationIds.map((locationId) => (
                <option
                  key={locationId}
                  value={locationId}
                >
                  {locationId}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading inventory...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <div className="flex items-start gap-3">
              <div className="text-danger">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-danger">
                  Unable to load inventory
                </p>

                <p className="mt-1 text-sm text-danger">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadBalances}
                  className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          filteredBalances.length === 0 && (
            <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-active text-xl font-semibold text-ink-muted">
                I
              </div>

              <h2 className="mt-4 text-base font-semibold text-ink">
                No inventory balances found
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                {search ||
                productFilter ||
                locationFilter
                  ? "No inventory balances match your current filters."
                  : "Inventory balances will appear here when stock transactions are recorded."}
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          filteredBalances.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="border-b border-line bg-surface-hover">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Product ID
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Warehouse Location ID
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Quantity
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Reserved
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Available
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line">
                    {filteredBalances.map(
                      (balance) => (
                        <tr
                          key={balance.id}
                          className="transition hover:bg-surface-hover"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-medium text-ink-secondary">
                              {balance.productId}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-mono text-sm text-ink-secondary">
                              {
                                balance.warehouseLocationId
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-semibold text-ink">
                              {balance.quantity.toLocaleString()}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-sm text-ink-secondary">
                              {balance.reservedQuantity.toLocaleString()}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span
                              className={
                                balance.availableQuantity >
                                0
                                  ? "text-sm font-semibold text-success"
                                  : "text-sm font-semibold text-danger"
                              }
                            >
                              {balance.availableQuantity.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                  <tfoot className="border-t border-line bg-surface-hover">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-5 py-4 text-sm font-semibold text-ink"
                      >
                        Total
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-ink">
                        {totals.quantity.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-ink">
                        {totals.reserved.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-ink">
                        {totals.available.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
      </div>
    </AppShell>
  );
}