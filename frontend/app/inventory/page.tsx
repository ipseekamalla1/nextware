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
  createInventoryTransaction,
  getInventoryBalances,
  getInventoryTransactions,
  InventoryBalance,
  InventoryTransaction,
  InventoryTransactionType,
} from "@/lib/inventoryApi";

interface InventoryRow extends InventoryBalance {
  product: Product | null;
  warehouse: Warehouse | null;
  location: WarehouseLocation | null;
}

const transactionTypeOptions: {
  value: InventoryTransactionType;
  label: string;
  description: string;
}[] = [
  {
    value: "RECEIPT",
    label: "Receipt",
    description: "Add stock received into inventory.",
  },
  {
    value: "RETURN",
    label: "Return",
    description: "Add stock returned to inventory.",
  },
  {
    value: "ADJUSTMENT",
    label: "Adjustment",
    description: "Increase or decrease inventory by a signed quantity.",
  },
  {
    value: "STOCKTAKE",
    label: "Stocktake",
    description: "Record a signed stocktake difference.",
  },
  {
    value: "DAMAGE",
    label: "Damage",
    description: "Remove damaged stock from inventory.",
  },
  {
    value: "SHIPMENT",
    label: "Shipment",
    description: "Remove stock shipped from inventory.",
  },
];

export default function InventoryPage() {
  const companyId = getCurrentCompanyId();

  const canView = hasPermission("INVENTORY_VIEW");
  const canAdjust = hasPermission("INVENTORY_ADJUST");

  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const [showAdjustmentForm, setShowAdjustmentForm] =
    useState(false);

  const [transactionType, setTransactionType] =
    useState<InventoryTransactionType>("ADJUSTMENT");

  const [transactionProductId, setTransactionProductId] =
    useState("");

  const [
    transactionWarehouseFilter,
    setTransactionWarehouseFilter,
  ] = useState("");

  const [transactionLocationId, setTransactionLocationId] =
    useState("");

  const [transactionQuantity, setTransactionQuantity] =
    useState("");

  const [referenceType, setReferenceType] =
    useState("");

  const [referenceId, setReferenceId] =
    useState("");

  const [notes, setNotes] = useState("");

  const [transactionError, setTransactionError] =
    useState<string | null>(null);

  const [transactionSuccess, setTransactionSuccess] =
    useState<string | null>(null);

  const [savingTransaction, setSavingTransaction] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

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

      const [productData, warehouseData] =
        await Promise.all([
          getProducts(companyId),
          getWarehouses(companyId),
        ]);

      const activeWarehouses =
        warehouseData.filter(
          (warehouse) => warehouse.active
        );

      const locationResults =
        await Promise.all(
          activeWarehouses.map((warehouse) =>
            getWarehouseLocations(warehouse.id)
          )
        );

      const allLocations = locationResults
        .flat()
        .filter((location) => location.active);

      const balanceResults =
        await Promise.all(
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

  function resetTransactionForm() {
    setTransactionType("ADJUSTMENT");
    setTransactionProductId("");
    setTransactionWarehouseFilter("");
    setTransactionLocationId("");
    setTransactionQuantity("");
    setReferenceType("");
    setReferenceId("");
    setNotes("");
    setTransactionError(null);
    setTransactionSuccess(null);
  }

  function openAdjustmentForm() {
    resetTransactionForm();
    setShowAdjustmentForm(true);
  }

  function closeAdjustmentForm() {
    if (savingTransaction) {
      return;
    }

    setShowAdjustmentForm(false);
    resetTransactionForm();
  }

  async function handleCreateTransaction() {
    if (!companyId) {
      setTransactionError(
        "Company context is unavailable. Please sign in again."
      );
      return;
    }

    if (!transactionProductId) {
      setTransactionError("Product is required.");
      return;
    }

    if (!transactionLocationId) {
      setTransactionError(
        "Warehouse location is required."
      );
      return;
    }

    if (!transactionQuantity.trim()) {
      setTransactionError("Quantity is required.");
      return;
    }

    const parsedQuantity =
      Number(transactionQuantity);

    if (!Number.isFinite(parsedQuantity)) {
      setTransactionError(
        "Quantity must be a valid number."
      );
      return;
    }

    if (parsedQuantity === 0) {
      setTransactionError(
        "Quantity cannot be zero."
      );
      return;
    }

    if (
      transactionType !== "ADJUSTMENT" &&
      transactionType !== "STOCKTAKE" &&
      parsedQuantity < 0
    ) {
      setTransactionError(
        "Quantity must be positive for this transaction type."
      );
      return;
    }

    try {
      setSavingTransaction(true);
      setTransactionError(null);
      setTransactionSuccess(null);

      await createInventoryTransaction({
        companyId,
        productId: transactionProductId,
        warehouseLocationId:
          transactionLocationId,
        transactionType,
        quantity: parsedQuantity,
        referenceType:
          referenceType.trim() || null,
        referenceId:
          referenceId.trim() || null,
        notes: notes.trim() || null,
      });

      setTransactionSuccess(
        "Inventory transaction recorded successfully."
      );

      await loadInventory();

      setTimeout(() => {
        setShowAdjustmentForm(false);
        resetTransactionForm();
      }, 700);
    } catch (err) {
      setTransactionError(
        err instanceof Error
          ? err.message
          : "Failed to create inventory transaction."
      );
    } finally {
      setSavingTransaction(false);
    }
  }

  const productMap = useMemo(() => {
    return new Map(
      products.map((product) => [
        product.id,
        product,
      ])
    );
  }, [products]);

  const warehouseMap = useMemo(() => {
    return new Map(
      warehouses.map((warehouse) => [
        warehouse.id,
        warehouse,
      ])
    );
  }, [warehouses]);

  const locationMap = useMemo(() => {
    return new Map(
      locations.map((location) => [
        location.id,
        location,
      ])
    );
  }, [locations]);

  const rows = useMemo<InventoryRow[]>(() => {
    return balances.map((balance) => {
      const product =
        productMap.get(balance.productId) ?? null;

      const location =
        locationMap.get(
          balance.warehouseLocationId
        ) ?? null;

      const warehouse = location
        ? warehouseMap.get(
            location.warehouseId
          ) ?? null
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
      .sort((a, b) =>
        a.sku.localeCompare(b.sku)
      );
  }, [products]);

  const activeWarehouses = useMemo(() => {
    return warehouses
      .filter((warehouse) => warehouse.active)
      .sort((a, b) =>
        a.code.localeCompare(b.code)
      );
  }, [warehouses]);

  const filteredLocations = useMemo(() => {
    return locations
      .filter((location) => {
        if (!warehouseFilter) {
          return true;
        }

        return (
          location.warehouseId ===
          warehouseFilter
        );
      })
      .sort((a, b) =>
        a.code.localeCompare(b.code)
      );
  }, [locations, warehouseFilter]);

  const transactionLocations = useMemo(() => {
    return locations
      .filter((location) => {
        if (!transactionWarehouseFilter) {
          return true;
        }

        return (
          location.warehouseId ===
          transactionWarehouseFilter
        );
      })
      .sort((a, b) =>
        a.code.localeCompare(b.code)
      );
  }, [
    locations,
    transactionWarehouseFilter,
  ]);

  const selectedTransactionLocation =
    locationMap.get(transactionLocationId);

  const selectedTransactionWarehouse =
    selectedTransactionLocation
      ? warehouseMap.get(
          selectedTransactionLocation.warehouseId
        )
      : null;

  const selectedTransactionProduct =
    productMap.get(transactionProductId);

  const filteredRows = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

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
        productSearch.includes(
          normalizedSearch
        ) ||
        warehouseSearch.includes(
          normalizedSearch
        ) ||
        locationSearch.includes(
          normalizedSearch
        );

      const matchesProduct =
        productFilter === "" ||
        row.productId === productFilter;

      const matchesWarehouse =
        warehouseFilter === "" ||
        row.location?.warehouseId ===
          warehouseFilter;

      const matchesLocation =
        locationFilter === "" ||
        row.warehouseLocationId ===
          locationFilter;

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
          summary.reserved +
          row.reservedQuantity,
        available:
          summary.available +
          row.availableQuantity,
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
        (location) =>
          location.id === locationFilter
      )
    ) {
      setLocationFilter("");
    }
  }, [
    filteredLocations,
    locationFilter,
  ]);

  useEffect(() => {
    if (
      transactionLocationId &&
      !transactionLocations.some(
        (location) =>
          location.id ===
          transactionLocationId
      )
    ) {
      setTransactionLocationId("");
    }
  }, [
    transactionLocations,
    transactionLocationId,
  ]);

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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 text-xs font-medium text-ink-muted">
              Inventory
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-ink-muted">
              View inventory quantities, reservations
              and available stock by warehouse location.
            </p>
          </div>

          {canAdjust && (
            <button
              type="button"
              onClick={openAdjustmentForm}
              className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Record Stock Movement
            </button>
          )}
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
              <option value="">
                All Products
              </option>

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
                setWarehouseFilter(
                  event.target.value
                )
              }
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
            >
              <option value="">
                All Warehouses
              </option>

              {activeWarehouses.map(
                (warehouse) => (
                  <option
                    key={warehouse.id}
                    value={warehouse.id}
                  >
                    {warehouse.code} —{" "}
                    {warehouse.name}
                  </option>
                )
              )}
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

              {filteredLocations.map(
                (location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.code}
                    {location.name
                      ? ` — ${location.name}`
                      : ""}
                  </option>
                )
              )}
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
                            <span className="font-mono text-sm text-ink-secondary">
                              {row.productId}
                            </span>
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

        {showAdjustmentForm && canAdjust && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-xl">
              <div className="flex items-start justify-between border-b border-line px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-ink">
                    Record Stock Movement
                  </h2>

                  <p className="mt-1 text-sm text-ink-muted">
                    Record an inventory transaction for a
                    product and warehouse location.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeAdjustmentForm}
                  disabled={savingTransaction}
                  className="rounded-lg px-2 py-1 text-xl text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="space-y-5 px-6 py-6">
                {transactionError && (
                  <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3">
                    <p className="text-sm font-medium text-danger">
                      {transactionError}
                    </p>
                  </div>
                )}

                {transactionSuccess && (
                  <div className="rounded-lg border border-success/30 bg-success-soft px-4 py-3">
                    <p className="text-sm font-medium text-success">
                      {transactionSuccess}
                    </p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Transaction Type
                    </label>

                    <select
                      value={transactionType}
                      onChange={(event) =>
                        setTransactionType(
                          event.target
                            .value as InventoryTransactionType
                        )
                      }
                      disabled={savingTransaction}
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400 disabled:opacity-50"
                    >
                      {transactionTypeOptions.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>

                    <p className="mt-1.5 text-xs text-ink-muted">
                      {
                        transactionTypeOptions.find(
                          (option) =>
                            option.value ===
                            transactionType
                        )?.description
                      }
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Product
                    </label>

                    <select
                      value={transactionProductId}
                      onChange={(event) =>
                        setTransactionProductId(
                          event.target.value
                        )
                      }
                      disabled={savingTransaction}
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400 disabled:opacity-50"
                    >
                      <option value="">
                        Select product
                      </option>

                      {activeProducts.map(
                        (product) => (
                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.sku} —{" "}
                            {product.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Warehouse
                    </label>

                    <select
                      value={
                        transactionWarehouseFilter
                      }
                      onChange={(event) => {
                        setTransactionWarehouseFilter(
                          event.target.value
                        );
                        setTransactionLocationId(
                          ""
                        );
                      }}
                      disabled={savingTransaction}
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400 disabled:opacity-50"
                    >
                      <option value="">
                        Select warehouse
                      </option>

                      {activeWarehouses.map(
                        (warehouse) => (
                          <option
                            key={warehouse.id}
                            value={warehouse.id}
                          >
                            {warehouse.code} —{" "}
                            {warehouse.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Warehouse Location
                    </label>

                    <select
                      value={
                        transactionLocationId
                      }
                      onChange={(event) =>
                        setTransactionLocationId(
                          event.target.value
                        )
                      }
                      disabled={
                        savingTransaction ||
                        !transactionWarehouseFilter
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400 disabled:opacity-50"
                    >
                      <option value="">
                        {transactionWarehouseFilter
                          ? "Select location"
                          : "Select warehouse first"}
                      </option>

                      {transactionLocations.map(
                        (location) => (
                          <option
                            key={location.id}
                            value={location.id}
                          >
                            {location.code}
                            {location.name
                              ? ` — ${location.name}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Quantity
                    </label>

                    <input
                      type="number"
                      step="any"
                      value={transactionQuantity}
                      onChange={(event) =>
                        setTransactionQuantity(
                          event.target.value
                        )
                      }
                      disabled={savingTransaction}
                      placeholder={
                        transactionType ===
                          "ADJUSTMENT" ||
                        transactionType ===
                          "STOCKTAKE"
                          ? "Use negative to decrease"
                          : "Enter quantity"
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-400 disabled:opacity-50"
                    />

                    <p className="mt-1.5 text-xs text-ink-muted">
                      {transactionType ===
                        "ADJUSTMENT" ||
                      transactionType ===
                        "STOCKTAKE"
                        ? "Positive increases stock; negative decreases stock."
                        : "Enter a positive quantity."}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Reference Type
                    </label>

                    <input
                      type="text"
                      value={referenceType}
                      onChange={(event) =>
                        setReferenceType(
                          event.target.value
                        )
                      }
                      disabled={savingTransaction}
                      placeholder="e.g. STOCKTAKE, DAMAGE"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-400 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Reference ID
                    </label>

                    <input
                      type="text"
                      value={referenceId}
                      onChange={(event) =>
                        setReferenceId(
                          event.target.value
                        )
                      }
                      disabled={savingTransaction}
                      placeholder="Optional UUID"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-400 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                    Notes
                  </label>

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    disabled={savingTransaction}
                    rows={4}
                    placeholder="Optional notes about this stock movement..."
                    className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-400 disabled:opacity-50"
                  />
                </div>

                {selectedTransactionProduct &&
                  selectedTransactionLocation && (
                    <div className="rounded-lg border border-line bg-surface-hover px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Movement Summary
                      </p>

                      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <span className="text-ink-muted">
                            Product
                          </span>

                          <p className="font-medium text-ink">
                            {
                              selectedTransactionProduct.sku
                            }
                          </p>
                        </div>

                        <div>
                          <span className="text-ink-muted">
                            Warehouse
                          </span>

                          <p className="font-medium text-ink">
                            {
                              selectedTransactionWarehouse?.code ??
                              "—"
                            }
                          </p>
                        </div>

                        <div>
                          <span className="text-ink-muted">
                            Location
                          </span>

                          <p className="font-medium text-ink">
                            {
                              selectedTransactionLocation.code
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAdjustmentForm}
                  disabled={savingTransaction}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleCreateTransaction()
                  }
                  disabled={savingTransaction}
                  className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingTransaction
                    ? "Saving..."
                    : "Record Movement"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}