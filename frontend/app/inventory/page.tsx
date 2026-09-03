"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { AlertIcon, SearchIcon } from "@/components/ui/icons";
import { getCurrentCompanyId, hasPermission } from "@/lib/auth";
import {
  getProducts,
  getWarehouses,
  getWarehouseLocations,
  Product,
  Warehouse,
  WarehouseLocation,
} from "@/lib/api";
import {
  getInventoryBalances,
  InventoryBalance,
} from "@/lib/inventoryApi";

interface InventoryRow extends InventoryBalance {
  product: Product | null;
  warehouse: Warehouse | null;
  location: WarehouseLocation | null;
}

export default function InventoryPage() {
  const companyId = getCurrentCompanyId();
  const canView = hasPermission("INVENTORY_VIEW");

  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canView || !companyId) {
      setLoading(false);
      return;
    }

    void loadInventory();
  }, [canView, companyId]);

  async function loadInventory() {
    if (!companyId || !canView) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [productData, warehouseData] = await Promise.all([
        getProducts(companyId),
        getWarehouses(companyId),
      ]);

      const activeWarehouses = warehouseData.filter(
        (warehouse) => warehouse.active
      );

      const locationResults = await Promise.all(
        activeWarehouses.map((warehouse) =>
          getWarehouseLocations(warehouse.id)
        )
      );

      const allLocations = locationResults
        .flat()
        .filter((location) => location.active);

      const balanceResults = await Promise.all(
        allLocations.map((location) =>
          getInventoryBalances(
            companyId,
            undefined,
            location.id
          )
        )
      );

      setProducts(productData);
      setWarehouses(warehouseData);
      setLocations(allLocations);
      setBalances(balanceResults.flat());
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

  const productMap = useMemo(() => {
    return new Map(
      products.map((product) => [product.id, product])
    );
  }, [products]);

  const warehouseMap = useMemo(() => {
    return new Map(
      warehouses.map((warehouse) => [warehouse.id, warehouse])
    );
  }, [warehouses]);

  const locationMap = useMemo(() => {
    return new Map(
      locations.map((location) => [location.id, location])
    );
  }, [locations]);

  const rows = useMemo<InventoryRow[]>(() => {
    return balances.map((balance) => {
      const product =
        productMap.get(balance.productId) ?? null;

      const location =
        locationMap.get(balance.warehouseLocationId) ?? null;

      const warehouse = location
        ? warehouseMap.get(location.warehouseId) ?? null
        : null;

      return {
        ...balance,
        product,
        warehouse,
        location,
      };
    });
  }, [
    balances,
    productMap,
    warehouseMap,
    locationMap,
  ]);

  const activeProducts = useMemo(() => {
    return products
      .filter((product) => product.active)
      .sort((a, b) => a.sku.localeCompare(b.sku));
  }, [products]);

  const activeWarehouses = useMemo(() => {
    return warehouses
      .filter((warehouse) => warehouse.active)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [warehouses]);

  const filteredLocations = useMemo(() => {
    return locations
      .filter((location) => {
        if (!warehouseFilter) {
          return true;
        }

        return location.warehouseId === warehouseFilter;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [locations, warehouseFilter]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const productSearch = [
        row.product?.sku ?? "",
        row.product?.name ?? "",
        row.productId,
      ]
        .join(" ")
        .toLowerCase();

      const warehouseSearch = [
        row.warehouse?.code ?? "",
        row.warehouse?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const locationSearch = [
        row.location?.code ?? "",
        row.location?.name ?? "",
        row.warehouseLocationId,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        productSearch.includes(normalizedSearch) ||
        warehouseSearch.includes(normalizedSearch) ||
        locationSearch.includes(normalizedSearch);

      const matchesProduct =
        productFilter === "" ||
        row.productId === productFilter;

      const matchesWarehouse =
        warehouseFilter === "" ||
        row.location?.warehouseId === warehouseFilter;

      const matchesLocation =
        locationFilter === "" ||
        row.warehouseLocationId === locationFilter;

      return (
        matchesSearch &&
        matchesProduct &&
        matchesWarehouse &&
        matchesLocation
      );
    });
  }, [
    rows,
    search,
    productFilter,
    warehouseFilter,
    locationFilter,
  ]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (summary, row) => ({
        quantity:
          summary.quantity + row.quantity,
        reserved:
          summary.reserved + row.reservedQuantity,
        available:
          summary.available + row.availableQuantity,
      }),
      {
        quantity: 0,
        reserved: 0,
        available: 0,
      }
    );
  }, [filteredRows]);

  useEffect(() => {
    if (
      locationFilter &&
      !filteredLocations.some(
        (location) => location.id === locationFilter
      )
    ) {
      setLocationFilter("");
    }
  }, [filteredLocations, locationFilter]);

  if (!canView) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <p className="text-sm font-semibold text-danger">
              Access denied
            </p>

            <p className="mt-1 text-sm text-danger">
              You do not have permission to view inventory.
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
              Your authenticated company could not be
              determined. Please sign in again.
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

          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-ink-muted">
            View inventory quantities, reservations and
            available stock by warehouse location.
          </p>
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
              Across filtered inventory
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
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search inventory..."
                className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
              />
            </div>

            <select
              value={productFilter}
              onChange={(event) =>
                setProductFilter(event.target.value)
              }
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
            >
              <option value="">All Products</option>

              {activeProducts.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.sku} — {product.name}
                </option>
              ))}
            </select>

            <select
              value={warehouseFilter}
              onChange={(event) =>
                setWarehouseFilter(event.target.value)
              }
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
            >
              <option value="">All Warehouses</option>

              {activeWarehouses.map((warehouse) => (
                <option
                  key={warehouse.id}
                  value={warehouse.id}
                >
                  {warehouse.code} — {warehouse.name}
                </option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(event) =>
                setLocationFilter(event.target.value)
              }
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
            >
              <option value="">All Locations</option>

              {filteredLocations.map((location) => (
                <option
                  key={location.id}
                  value={location.id}
                >
                  {location.code}
                  {location.name
                    ? ` — ${location.name}`
                    : ""}
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
                  onClick={() => void loadInventory()}
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
          filteredRows.length === 0 && (
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
                warehouseFilter ||
                locationFilter
                  ? "No inventory balances match your current filters."
                  : "Inventory balances will appear here when stock transactions are recorded."}
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          filteredRows.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="border-b border-line bg-surface-hover">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Product
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Warehouse
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Location
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
                    {filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className="transition hover:bg-surface-hover"
                      >
                        <td className="px-5 py-4">
                          {row.product ? (
                            <div>
                              <p className="text-sm font-semibold text-ink">
                                {row.product.name}
                              </p>

                              <p className="mt-0.5 font-mono text-xs text-ink-muted">
                                {row.product.sku}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-mono text-sm font-medium text-ink-secondary">
                                {row.productId}
                              </p>

                              <p className="mt-0.5 text-xs text-ink-muted">
                                Product unavailable
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {row.warehouse ? (
                            <div>
                              <p className="text-sm font-medium text-ink-secondary">
                                {row.warehouse.name}
                              </p>

                              <p className="mt-0.5 font-mono text-xs text-ink-muted">
                                {row.warehouse.code}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-ink-muted">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {row.location ? (
                            <div>
                              <p className="text-sm font-medium text-ink-secondary">
                                {row.location.name ||
                                  row.location.code}
                              </p>

                              {row.location.name && (
                                <p className="mt-0.5 font-mono text-xs text-ink-muted">
                                  {row.location.code}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-ink-muted">
                              {row.warehouseLocationId}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-semibold text-ink">
                            {row.quantity.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-sm text-ink-secondary">
                            {row.reservedQuantity.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span
                            className={
                              row.availableQuantity > 0
                                ? "text-sm font-semibold text-success"
                                : "text-sm font-semibold text-danger"
                            }
                          >
                            {row.availableQuantity.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="border-t border-line bg-surface-hover">
                    <tr>
                      <td
                        colSpan={3}
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