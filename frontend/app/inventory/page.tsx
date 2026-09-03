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

const historyTypeOptions: {
  value: InventoryTransactionType | "";
  label: string;
}[] = [
  { value: "", label: "All transaction types" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "RETURN", label: "Return" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "STOCKTAKE", label: "Stocktake" },
  { value: "DAMAGE", label: "Damage" },
  { value: "SHIPMENT", label: "Shipment" },
  { value: "TRANSFER_IN", label: "Transfer In" },
  { value: "TRANSFER_OUT", label: "Transfer Out" },
];

function formatTransactionType(
  type: InventoryTransactionType
): string {
  switch (type) {
    case "TRANSFER_IN":
      return "Transfer In";
    case "TRANSFER_OUT":
      return "Transfer Out";
    case "STOCKTAKE":
      return "Stocktake";
    case "ADJUSTMENT":
      return "Adjustment";
    case "RECEIPT":
      return "Receipt";
    case "SHIPMENT":
      return "Shipment";
    case "RETURN":
      return "Return";
    case "DAMAGE":
      return "Damage";
    default:
      return type;
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatQuantity(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function transactionQuantityClass(
  quantity: number
): string {
  if (quantity > 0) {
    return "text-success";
  }

  if (quantity < 0) {
    return "text-danger";
  }

  return "text-ink";
}

export default function InventoryPage() {
  const companyId = getCurrentCompanyId();

  const canView = hasPermission("INVENTORY_VIEW");
  const canAdjust = hasPermission("INVENTORY_ADJUST");

  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [transactions, setTransactions] = useState<
    InventoryTransaction[]
  >([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const [historySearch, setHistorySearch] = useState("");
  const [historyProductFilter, setHistoryProductFilter] =
    useState("");
  const [historyWarehouseFilter, setHistoryWarehouseFilter] =
    useState("");
  const [historyLocationFilter, setHistoryLocationFilter] =
    useState("");
  const [historyTypeFilter, setHistoryTypeFilter] =
    useState<InventoryTransactionType | "">("");

  const [showAdjustmentForm, setShowAdjustmentForm] =
    useState(false);

  const [transactionType, setTransactionType] =
    useState<InventoryTransactionType>("ADJUSTMENT");

  const [transactionProductId, setTransactionProductId] =
    useState("");

  const [transactionWarehouseFilter, setTransactionWarehouseFilter] =
    useState("");

  const [transactionLocationId, setTransactionLocationId] =
    useState("");

  const [transactionQuantity, setTransactionQuantity] =
    useState("");

  const [referenceType, setReferenceType] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("");

  const [transactionError, setTransactionError] =
    useState<string | null>(null);

  const [transactionSuccess, setTransactionSuccess] =
    useState<string | null>(null);

  const [savingTransaction, setSavingTransaction] =
    useState(false);

  useEffect(() => {
    if (!canView || !companyId) {
      setLoading(false);
      setHistoryLoading(false);
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
      setHistoryLoading(true);
      setError(null);
      setHistoryError(null);

      const [productData, warehouseData] =
        await Promise.all([
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

      const transactionResults = await Promise.all(
        allLocations.map((location) =>
          getInventoryTransactions(
            companyId,
            undefined,
            location.id
          )
        )
      );

      const allTransactions = transactionResults
        .flat()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

      setProducts(productData);
      setWarehouses(warehouseData);
      setLocations(allLocations);
      setBalances(balanceResults.flat());
      setTransactions(allTransactions);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load inventory.";

      setError(message);
      setHistoryError(message);
    } finally {
      setLoading(false);
      setHistoryLoading(false);
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

    const parsedQuantity = Number(transactionQuantity);

    if (!Number.isFinite(parsedQuantity)) {
      setTransactionError(
        "Quantity must be a valid number."
      );
      return;
    }

    if (parsedQuantity === 0) {
      setTransactionError("Quantity cannot be zero.");
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
        warehouseLocationId: transactionLocationId,
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

      window.setTimeout(() => {
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
      products.map((product) => [product.id, product])
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
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [
    locations,
    transactionWarehouseFilter,
  ]);

  const historyLocations = useMemo(() => {
    return locations
      .filter((location) => {
        if (!historyWarehouseFilter) {
          return true;
        }

        return (
          location.warehouseId ===
          historyWarehouseFilter
        );
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [
    locations,
    historyWarehouseFilter,
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
        productSearch.includes(normalizedSearch) ||
        warehouseSearch.includes(normalizedSearch) ||
        locationSearch.includes(normalizedSearch);

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

  const filteredTransactions = useMemo(() => {
    const normalizedSearch =
      historySearch.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const product =
        productMap.get(transaction.productId);

      const location =
        locationMap.get(
          transaction.warehouseLocationId
        );

      const warehouse = location
        ? warehouseMap.get(location.warehouseId)
        : undefined;

      const searchable = [
        product?.sku ?? "",
        product?.name ?? "",
        transaction.productId,
        warehouse?.code ?? "",
        warehouse?.name ?? "",
        location?.code ?? "",
        location?.name ?? "",
        transaction.transactionType,
        formatTransactionType(
          transaction.transactionType
        ),
        transaction.referenceType ?? "",
        transaction.referenceId ?? "",
        transaction.notes ?? "",
        transaction.id,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        searchable.includes(normalizedSearch);

      const matchesProduct =
        historyProductFilter === "" ||
        transaction.productId ===
          historyProductFilter;

      const matchesWarehouse =
        historyWarehouseFilter === "" ||
        location?.warehouseId ===
          historyWarehouseFilter;

      const matchesLocation =
        historyLocationFilter === "" ||
        transaction.warehouseLocationId ===
          historyLocationFilter;

      const matchesType =
        historyTypeFilter === "" ||
        transaction.transactionType ===
          historyTypeFilter;

      return (
        matchesSearch &&
        matchesProduct &&
        matchesWarehouse &&
        matchesLocation &&
        matchesType
      );
    });
  }, [
    transactions,
    productMap,
    locationMap,
    warehouseMap,
    historySearch,
    historyProductFilter,
    historyWarehouseFilter,
    historyLocationFilter,
    historyTypeFilter,
  ]);

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

  useEffect(() => {
    if (
      transactionLocationId &&
      !transactionLocations.some(
        (location) =>
          location.id === transactionLocationId
      )
    ) {
      setTransactionLocationId("");
    }
  }, [
    transactionLocations,
    transactionLocationId,
  ]);

  useEffect(() => {
    if (
      historyLocationFilter &&
      !historyLocations.some(
        (location) =>
          location.id === historyLocationFilter
      )
    ) {
      setHistoryLocationFilter("");
    }
  }, [
    historyLocations,
    historyLocationFilter,
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
              View stock balances and the complete
              inventory movement ledger.
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
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Reserved
            </p>

            <p className="mt-2 text-2xl font-bold text-ink">
              {totals.reserved.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Available
            </p>

            <p className="mt-2 text-2xl font-bold text-ink">
              {totals.available.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-line bg-surface shadow-sm">
          <div className="border-b border-line p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">
                  Inventory Balances
                </h2>

                <p className="mt-1 text-sm text-ink-muted">
                  Current quantity by product and
                  warehouse location.
                </p>
              </div>

              <div className="relative w-full lg:w-80">
                <SearchIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search inventory..."
                  className="w-full rounded-lg border border-line bg-surface px-9 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <select
                value={productFilter}
                onChange={(event) =>
                  setProductFilter(event.target.value)
                }
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
              >
                <option value="">All products</option>

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
                onChange={(event) => {
                  setWarehouseFilter(
                    event.target.value
                  );
                  setLocationFilter("");
                }}
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
              >
                <option value="">All warehouses</option>

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
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
              >
                <option value="">All locations</option>

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

          {error ? (
            <div className="flex items-start gap-3 p-6">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger" />

              <div>
                <p className="text-sm font-semibold text-danger">
                  Unable to load inventory
                </p>

                <p className="mt-1 text-sm text-danger">
                  {error}
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="p-10 text-center text-sm text-ink-muted">
              Loading inventory...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-ink">
                No inventory found
              </p>

              <p className="mt-1 text-sm text-ink-muted">
                No inventory balances match the current
                filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-line bg-surface-muted">
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
                      className="transition hover:bg-surface-muted"
                    >
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-ink">
                          {row.product?.sku ??
                            "Unknown product"}
                        </div>

                        <div className="mt-0.5 text-xs text-ink-muted">
                          {row.product?.name ??
                            row.productId}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm text-ink">
                          {row.warehouse?.code ??
                            "Unknown"}
                        </div>

                        <div className="mt-0.5 text-xs text-ink-muted">
                          {row.warehouse?.name ?? ""}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-ink">
                          {row.location?.code ??
                            "Unknown"}
                        </div>

                        <div className="mt-0.5 text-xs text-ink-muted">
                          {row.location?.name ?? ""}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-ink">
                        {formatQuantity(row.quantity)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-ink">
                        {formatQuantity(
                          row.reservedQuantity
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-ink">
                        {formatQuantity(
                          row.availableQuantity
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface shadow-sm">
          <div className="border-b border-line p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">
                  Transaction History
                </h2>

                <p className="mt-1 text-sm text-ink-muted">
                  Append-only inventory movement ledger.
                </p>
              </div>

              <div className="relative w-full lg:w-80">
                <SearchIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                />

                <input
                  value={historySearch}
                  onChange={(event) =>
                    setHistorySearch(event.target.value)
                  }
                  placeholder="Search transaction history..."
                  className="w-full rounded-lg border border-line bg-surface px-9 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <select
                value={historyProductFilter}
                onChange={(event) =>
                  setHistoryProductFilter(
                    event.target.value
                  )
                }
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
              >
                <option value="">All products</option>

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
                value={historyWarehouseFilter}
                onChange={(event) => {
                  setHistoryWarehouseFilter(
                    event.target.value
                  );
                  setHistoryLocationFilter("");
                }}
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
              >
                <option value="">All warehouses</option>

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
                value={historyLocationFilter}
                onChange={(event) =>
                  setHistoryLocationFilter(
                    event.target.value
                  )
                }
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
              >
                <option value="">All locations</option>

                {historyLocations.map((location) => (
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

              <select
                value={historyTypeFilter}
                onChange={(event) =>
                  setHistoryTypeFilter(
                    event.target
                      .value as InventoryTransactionType | ""
                  )
                }
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
              >
                {historyTypeOptions.map((option) => (
                  <option
                    key={option.value || "all"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {historyError ? (
            <div className="flex items-start gap-3 p-6">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger" />

              <div>
                <p className="text-sm font-semibold text-danger">
                  Unable to load transaction history
                </p>

                <p className="mt-1 text-sm text-danger">
                  {historyError}
                </p>
              </div>
            </div>
          ) : historyLoading ? (
            <div className="p-10 text-center text-sm text-ink-muted">
              Loading transaction history...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-ink">
                No transactions found
              </p>

              <p className="mt-1 text-sm text-ink-muted">
                No inventory movements match the current
                filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-line bg-surface-muted">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Date
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Product
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Warehouse / Location
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Type
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Quantity
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Reference
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-line">
                  {filteredTransactions.map(
                    (transaction) => {
                      const product =
                        productMap.get(
                          transaction.productId
                        );

                      const location =
                        locationMap.get(
                          transaction.warehouseLocationId
                        );

                      const warehouse = location
                        ? warehouseMap.get(
                            location.warehouseId
                          )
                        : undefined;

                      return (
                        <tr
                          key={transaction.id}
                          className="transition hover:bg-surface-muted"
                        >
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="text-sm text-ink">
                              {formatDateTime(
                                transaction.createdAt
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm font-semibold text-ink">
                              {product?.sku ??
                                "Unknown product"}
                            </div>

                            <div className="mt-0.5 text-xs text-ink-muted">
                              {product?.name ??
                                transaction.productId}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm text-ink">
                              {warehouse?.code ??
                                "Unknown warehouse"}
                            </div>

                            <div className="mt-0.5 text-xs text-ink-muted">
                              {location?.code ??
                                transaction.warehouseLocationId}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full border border-line bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink">
                              {formatTransactionType(
                                transaction.transactionType
                              )}
                            </span>
                          </td>

                          <td
                            className={`px-5 py-4 text-right text-sm font-bold ${transactionQuantityClass(
                              transaction.quantity
                            )}`}
                          >
                            {transaction.quantity > 0
                              ? "+"
                              : ""}

                            {formatQuantity(
                              transaction.quantity
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {transaction.referenceType ||
                            transaction.referenceId ? (
                              <>
                                <div className="text-sm text-ink">
                                  {transaction.referenceType ||
                                    "Reference"}
                                </div>

                                {transaction.referenceId && (
                                  <div className="mt-0.5 max-w-48 truncate text-xs text-ink-muted">
                                    {
                                      transaction.referenceId
                                    }
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-ink-muted">
                                —
                              </span>
                            )}
                          </td>

                          <td className="max-w-64 px-5 py-4">
                            <span className="block truncate text-sm text-ink-muted">
                              {transaction.notes || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAdjustmentForm && canAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  Record Stock Movement
                </h2>

                <p className="mt-1 text-sm text-ink-muted">
                  Create an inventory ledger transaction.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAdjustmentForm}
                disabled={savingTransaction}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 p-6">
              {transactionError && (
                <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                  {transactionError}
                </div>
              )}

              {transactionSuccess && (
                <div className="rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
                  {transactionSuccess}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
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
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
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
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
                  >
                    <option value="">
                      Select product
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
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
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
                        ? "Use negative to reduce stock"
                        : "Enter quantity"
                    }
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Warehouse
                  </label>

                  <select
                    value={transactionWarehouseFilter}
                    onChange={(event) => {
                      setTransactionWarehouseFilter(
                        event.target.value
                      );
                      setTransactionLocationId("");
                    }}
                    disabled={savingTransaction}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
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
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Warehouse Location
                  </label>

                  <select
                    value={transactionLocationId}
                    onChange={(event) =>
                      setTransactionLocationId(
                        event.target.value
                      )
                    }
                    disabled={savingTransaction}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
                  >
                    <option value="">
                      Select location
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
              </div>

              {selectedTransactionProduct && (
                <div className="rounded-lg border border-line bg-surface-muted px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Selected Product
                  </p>

                  <p className="mt-1 text-sm font-semibold text-ink">
                    {selectedTransactionProduct.sku} —{" "}
                    {selectedTransactionProduct.name}
                  </p>
                </div>
              )}

              {selectedTransactionWarehouse &&
                selectedTransactionLocation && (
                  <div className="rounded-lg border border-line bg-surface-muted px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Destination
                    </p>

                    <p className="mt-1 text-sm font-semibold text-ink">
                      {selectedTransactionWarehouse.code}{" "}
                      —{" "}
                      {selectedTransactionLocation.code}
                    </p>
                  </div>
                )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Reference Type
                  </label>

                  <input
                    value={referenceType}
                    onChange={(event) =>
                      setReferenceType(
                        event.target.value
                      )
                    }
                    disabled={savingTransaction}
                    placeholder="e.g. Purchase Order"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Reference ID
                  </label>

                  <input
                    value={referenceId}
                    onChange={(event) =>
                      setReferenceId(
                        event.target.value
                      )
                    }
                    disabled={savingTransaction}
                    placeholder="UUID reference"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
                  />

                  <p className="mt-1 text-xs text-ink-muted">
                    If provided, this must be a valid UUID.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  disabled={savingTransaction}
                  rows={3}
                  placeholder="Optional explanation for this movement"
                  className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={closeAdjustmentForm}
                disabled={savingTransaction}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateTransaction}
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
    </AppShell>
  );
}