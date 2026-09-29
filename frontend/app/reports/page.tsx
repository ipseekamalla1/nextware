"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import AppShell from "@/components/layout/AppShell";
import {
  getCurrentCompanyId,
  hasPermission,
} from "@/lib/auth";
import {
  getFulfillmentReport,
  getInventoryBalance,
  getInventoryTransactions,
  getPurchaseOrderReport,
  getReceivingReport,
  getSalesByCustomerReport,
  getSalesReport,
  FulfillmentSummary,
  InventorySummary,
  InventoryTransactionRow,
  PurchaseOrderSummary,
  ReceivingSummary,
  SalesCustomerRow,
  SalesSummary,
} from "@/lib/reportsApi";

type ReportKey =
  | "inventory"
  | "transactions"
  | "purchasing"
  | "receiving"
  | "sales"
  | "customers"
  | "fulfillment";

const reportOptions: {
  key: ReportKey;
  label: string;
  description: string;
}[] = [
  {
    key: "inventory",
    label: "Inventory Balance",
    description: "Quantity, reserved, and available inventory.",
  },
  {
    key: "transactions",
    label: "Inventory Transactions",
    description: "Inventory movements and adjustments.",
  },
  {
    key: "purchasing",
    label: "Purchase Orders",
    description: "Purchase order value and status.",
  },
  {
    key: "receiving",
    label: "Receiving",
    description: "Receiving quantities and values.",
  },
  {
    key: "sales",
    label: "Sales Orders",
    description: "Sales order value and status.",
  },
  {
    key: "customers",
    label: "Sales by Customer",
    description: "Sales activity grouped by customer.",
  },
  {
    key: "fulfillment",
    label: "Fulfillment",
    description: "Picking, packages, and shipments.",
  },
];

const transactionTypes = [
  "RECEIPT",
  "SHIPMENT",
  "ADJUSTMENT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "RETURN",
  "DAMAGE",
  "STOCKTAKE",
];

const purchaseStatuses = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
];

const receivingStatuses = [
  "OPEN",
  "RECEIVING",
  "COMPLETED",
  "CANCELLED",
];

const salesStatuses = [
  "DRAFT",
  "CONFIRMED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "CANCELLED",
];

const fulfillmentStatuses = [
  "OPEN",
  "ASSIGNED",
  "PICKING",
  "COMPLETED",
  "CANCELLED",
  "PACKED",
  "SHIPPED",
  "READY",
  "IN_TRANSIT",
  "DELIVERED",
];

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatStatus(value: string): string {
  return value
    .split("_")
    .map(
      (part) =>
        part.charAt(0) + part.slice(1).toLowerCase(),
    )
    .join(" ");
}

function statusClass(status: string): string {
  switch (status) {
    case "CANCELLED":
      return "bg-danger/10 text-danger";

    case "COMPLETED":
    case "RECEIVED":
    case "FULFILLED":
    case "DELIVERED":
    case "SHIPPED":
      return "bg-success/10 text-success";

    case "SUBMITTED":
    case "APPROVED":
    case "RECEIVING":
    case "PACKED":
    case "IN_TRANSIT":
      return "bg-warning/10 text-warning";

    default:
      return "bg-surface-active text-ink-secondary";
  }
}

function EmptyState({
  message = "No records found for the selected filters.",
}: {
  message?: string;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-ink-muted">
        Loading report...
      </p>
    </div>
  );
}

export default function ReportsPage() {
  const companyId = getCurrentCompanyId();
  const canView = hasPermission("REPORT_VIEW");

  const [activeReport, setActiveReport] =
    useState<ReportKey>("inventory");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [status, setStatus] = useState("");
  const [transactionType, setTransactionType] =
    useState("");

  const [
    inventory,
    setInventory,
  ] = useState<InventorySummary | null>(null);

  const [
    transactions,
    setTransactions,
  ] = useState<InventoryTransactionRow[] | null>(
    null,
  );

  const [
    purchasing,
    setPurchasing,
  ] = useState<PurchaseOrderSummary | null>(
    null,
  );

  const [
    receiving,
    setReceiving,
  ] = useState<ReceivingSummary | null>(
    null,
  );

  const [
    sales,
    setSales,
  ] = useState<SalesSummary | null>(null);

  const [
    salesCustomers,
    setSalesCustomers,
  ] = useState<SalesCustomerRow[] | null>(
    null,
  );

  const [
    fulfillment,
    setFulfillment,
  ] = useState<FulfillmentSummary | null>(
    null,
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const activeOption = useMemo(
    () =>
      reportOptions.find(
        (option) =>
          option.key === activeReport,
      ),
    [activeReport],
  );

  const loadReport = useCallback(async () => {
    if (!companyId || !canView) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filter = {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: status || undefined,
        transactionType:
          transactionType || undefined,
      };

      switch (activeReport) {
        case "inventory": {
          const result =
            await getInventoryBalance();

          setInventory(result);
          break;
        }

        case "transactions": {
          const result =
            await getInventoryTransactions(
              filter,
            );

          setTransactions(result);
          break;
        }

        case "purchasing": {
          const result =
            await getPurchaseOrderReport(
              filter,
            );

          setPurchasing(result);
          break;
        }

        case "receiving": {
          const result =
            await getReceivingReport(
              filter,
            );

          setReceiving(result);
          break;
        }

        case "sales": {
          const result =
            await getSalesReport(filter);

          setSales(result);
          break;
        }

        case "customers": {
          const result =
            await getSalesByCustomerReport(
              filter,
            );

          setSalesCustomers(result);
          break;
        }

        case "fulfillment": {
          const result =
            await getFulfillmentReport(
              filter,
            );

          setFulfillment(result);
          break;
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load report.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    activeReport,
    canView,
    companyId,
    dateFrom,
    dateTo,
    status,
    transactionType,
  ]);

  useEffect(() => {
    if (!companyId || !canView) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadReport();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    companyId,
    canView,
    loadReport,
  ]);

  function selectReport(
    report: ReportKey,
  ) {
    setActiveReport(report);
    setStatus("");
    setTransactionType("");
    setError(null);
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setStatus("");
    setTransactionType("");
  }

  function statusOptions(): string[] {
    switch (activeReport) {
      case "purchasing":
        return purchaseStatuses;

      case "receiving":
        return receivingStatuses;

      case "sales":
      case "customers":
        return salesStatuses;

      case "fulfillment":
        return fulfillmentStatuses;

      default:
        return [];
    }
  }

  if (!companyId) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-ink">
              Company context unavailable
            </h1>

            <p className="mt-2 text-sm text-ink-muted">
              Please sign in again to access reports.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!canView) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-ink">
              Access denied
            </h1>

            <p className="mt-2 text-sm text-ink-muted">
              Your account does not have permission to view reports.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const availableStatuses =
    statusOptions();

  return (
    <AppShell>
      <div className="min-h-full bg-canvas">
        <div className="border-b border-line bg-surface">
          <div className="px-6 py-6">
            <h1 className="text-xl font-semibold text-ink">
              Reports
            </h1>

            <p className="mt-1 text-sm text-ink-muted">
              Operational and inventory reporting for your company.
            </p>
          </div>
        </div>

        <div className="border-b border-line bg-surface">
          <div className="flex gap-2 overflow-x-auto px-6 py-3">
            {reportOptions.map((option) => {
              const active =
                option.key === activeReport;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    selectReport(option.key)
                  }
                  className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-primary-600 text-white"
                      : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          <div className="mx-auto max-w-[1600px] space-y-6">
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-ink">
                  {activeOption?.label}
                </h2>

                <p className="mt-1 text-xs text-ink-muted">
                  {activeOption?.description}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    From
                  </label>

                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) =>
                      setDateFrom(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    To
                  </label>

                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) =>
                      setDateTo(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                {activeReport ===
                  "transactions" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Transaction Type
                    </label>

                    <select
                      value={
                        transactionType
                      }
                      onChange={(event) =>
                        setTransactionType(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    >
                      <option value="">
                        All transaction types
                      </option>

                      {transactionTypes.map(
                        (type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {formatStatus(
                              type,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                )}

                {availableStatuses.length >
                  0 && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Status
                    </label>

                    <select
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    >
                      <option value="">
                        All statuses
                      </option>

                      {availableStatuses.map(
                        (value) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {formatStatus(
                              value,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void loadReport()
                    }
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#DDA15E] px-4 py-2.5 text-sm font-semibold text-[#283618] shadow-sm transition hover:bg-[#BC6C25] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Loading..."
                      : "Run Report"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    disabled={loading}
                    className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-surface-hover disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}
            </section>

            {loading ? (
              <section className="rounded-2xl border border-line bg-surface shadow-sm">
                <LoadingState />
              </section>
            ) : (
              <>
                {activeReport ===
                  "inventory" && (
                  <InventoryReport
                    report={inventory}
                  />
                )}

                {activeReport ===
                  "transactions" && (
                  <TransactionsReport
                    rows={transactions}
                  />
                )}

                {activeReport ===
                  "purchasing" && (
                  <PurchasingReport
                    report={purchasing}
                  />
                )}

                {activeReport ===
                  "receiving" && (
                  <ReceivingReport
                    report={receiving}
                  />
                )}

                {activeReport ===
                  "sales" && (
                  <SalesReport
                    report={sales}
                  />
                )}

                {activeReport ===
                  "customers" && (
                  <SalesCustomersReport
                    rows={salesCustomers}
                  />
                )}

                {activeReport ===
                  "fulfillment" && (
                  <FulfillmentReport
                    report={fulfillment}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold text-ink">
        {value}
      </div>
    </div>
  );
}

function InventoryReport({
  report,
}: {
  report: InventorySummary | null;
}) {
  if (!report) {
    return (
      <section className="rounded-2xl border border-line bg-surface shadow-sm">
        <EmptyState />
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Inventory Lines"
          value={formatNumber(
            report.lineCount,
          )}
        />

        <MetricCard
          label="Quantity"
          value={formatNumber(
            report.totalQuantity,
          )}
        />

        <MetricCard
          label="Reserved"
          value={formatNumber(
            report.totalReservedQuantity,
          )}
        />

        <MetricCard
          label="Available"
          value={formatNumber(
            report.totalAvailableQuantity,
          )}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface-active text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3">
                  Product
                </th>

                <th className="px-4 py-3">
                  Warehouse
                </th>

                <th className="px-4 py-3">
                  Location
                </th>

                <th className="px-4 py-3 text-right">
                  Quantity
                </th>

                <th className="px-4 py-3 text-right">
                  Reserved
                </th>

                <th className="px-4 py-3 text-right">
                  Available
                </th>
              </tr>
            </thead>

            <tbody>
              {report.rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                report.rows.map((row) => (
                  <tr
                    key={`${row.productId}-${row.warehouseLocationId}`}
                    className="border-b border-line last:border-0 hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-ink">
                        {row.productName}
                      </div>

                      <div className="mt-0.5 text-xs text-ink-muted">
                        {row.sku}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-ink-secondary">
                      {row.warehouseName}
                    </td>

                    <td className="px-4 py-3 text-sm text-ink-secondary">
                      {row.locationCode}
                    </td>

                    <td className="px-4 py-3 text-right text-sm text-ink">
                      {formatNumber(
                        row.quantity,
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-sm text-ink-secondary">
                      {formatNumber(
                        row.reservedQuantity,
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                      {formatNumber(
                        row.availableQuantity,
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TransactionsReport({
  rows,
}: {
  rows: InventoryTransactionRow[] | null;
}) {
  if (!rows) {
    return (
      <section className="rounded-2xl border border-line bg-surface shadow-sm">
        <EmptyState />
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1250px] text-left">
          <thead>
            <tr className="border-b border-line bg-surface-active text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">
                Date
              </th>

              <th className="px-4 py-3">
                Product
              </th>

              <th className="px-4 py-3">
                Warehouse
              </th>

              <th className="px-4 py-3">
                Location
              </th>

              <th className="px-4 py-3">
                Type
              </th>

              <th className="px-4 py-3 text-right">
                Quantity
              </th>

              <th className="px-4 py-3">
                Reference
              </th>

              <th className="px-4 py-3">
                Notes
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-line last:border-0 hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 text-sm text-ink-secondary">
                    {formatDateTime(
                      row.createdAt,
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-ink">
                      {row.productName}
                    </div>

                    <div className="text-xs text-ink-muted">
                      {row.sku}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-ink-secondary">
                    {row.warehouseName}
                  </td>

                  <td className="px-4 py-3 text-sm text-ink-secondary">
                    {row.locationCode}
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-surface-active px-2.5 py-1 text-xs font-semibold text-ink-secondary">
                      {formatStatus(
                        row.transactionType,
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                    {formatNumber(
                      row.quantity,
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-ink-secondary">
                    {row.referenceType ??
                      "—"}
                  </td>

                  <td className="max-w-xs truncate px-4 py-3 text-sm text-ink-muted">
                    {row.notes ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PurchasingReport({
  report,
}: {
  report: PurchaseOrderSummary | null;
}) {
  if (!report) {
    return (
      <section className="rounded-2xl border border-line bg-surface shadow-sm">
        <EmptyState />
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Purchase Orders"
          value={formatNumber(
            report.orderCount,
          )}
        />

        <MetricCard
          label="Ordered Value"
          value={`$${formatCurrency(
            report.orderedValue,
          )}`}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface-active text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3">
                  Order
                </th>

                <th className="px-4 py-3">
                  Date
                </th>

                <th className="px-4 py-3">
                  Supplier
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3 text-right">
                  Value
                </th>
              </tr>
            </thead>

            <tbody>
              {report.rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                report.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line last:border-0 hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-ink">
                      {row.orderNumber}
                    </td>

                    <td className="px-4 py-3 text-sm text-ink-secondary">
                      {formatDate(
                        row.orderDate,
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-ink-secondary">
                      {row.supplierName}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                          row.status,
                        )}`}
                      >
                        {formatStatus(
                          row.status,
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                      $
                      {formatCurrency(
                        row.orderedValue,
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ReceivingReport({
  report,
}: {
  report: ReceivingSummary | null;
}) {
  if (!report) {
    return (
      <section className="rounded-2xl border border-line bg-surface shadow-sm">
        <EmptyState />
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Receipts"
          value={formatNumber(
            report.receiptCount,
          )}
        />

        <MetricCard
          label="Received Quantity"
          value={formatNumber(
            report.receivedQuantity,
          )}
        />

        <MetricCard
          label="Received Value"
          value={`$${formatCurrency(
            report.receivedValue,
          )}`}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface-active text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3">
                  Receipt
                </th>

                <th className="px-4 py-3">
                  Date
                </th>

                <th className="px-4 py-3">
                  Warehouse
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3 text-right">
                  Quantity
                </th>

                <th className="px-4 py-3 text-right">
                  Value
                </th>
              </tr>
            </thead>

            <tbody>
              {report.rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                report.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line last:border-0 hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-ink">
                      {row.receiptNumber}
                    </td>

                    <td className="px-4 py-3 text-sm text-ink-secondary">
                      {formatDate(
                        row.receiptDate,
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-ink-secondary">
                      {row.warehouseName}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                          row.status,
                        )}`}
                      >
                        {formatStatus(
                          row.status,
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-sm text-ink">
                      {formatNumber(
                        row.receivedQuantity,
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                      $
                      {formatCurrency(
                        row.receivedValue,
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SalesReport({
  report,
}: {
  report: SalesSummary | null;
}) {
  if (!report) {
    return (
      <section className="rounded-2xl border border-line bg-surface shadow-sm">
        <EmptyState />
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Sales Orders"
          value={formatNumber(
            report.orderCount,
          )}
        />

        <MetricCard
          label="Order Value"
          value={`$${formatCurrency(
            report.orderValue,
          )}`}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface-active text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3">
                  Order
                </th>

                <th className="px-4 py-3">
                  Date
                </th>

                <th className="px-4 py-3">
                  Customer
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3 text-right">
                  Value
                </th>
              </tr>
            </thead>

            <tbody>
              {report.rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                report.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line last:border-0 hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-ink">
                      {row.orderNumber}
                    </td>

                    <td className="px-4 py-3 text-sm text-ink-secondary">
                      {formatDate(
                        row.orderDate,
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-ink-secondary">
                      {row.customerName}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                          row.status,
                        )}`}
                      >
                        {formatStatus(
                          row.status,
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                      $
                      {formatCurrency(
                        row.orderValue,
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SalesCustomersReport({
  rows,
}: {
  rows: SalesCustomerRow[] | null;
}) {
  if (!rows) {
    return (
      <section className="rounded-2xl border border-line bg-surface shadow-sm">
        <EmptyState />
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b border-line bg-surface-active text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">
                Customer
              </th>

              <th className="px-4 py-3 text-right">
                Orders
              </th>

              <th className="px-4 py-3 text-right">
                Sales Value
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.customerId}
                  className="border-b border-line last:border-0 hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 text-sm font-medium text-ink">
                    {row.customerName}
                  </td>

                  <td className="px-4 py-3 text-right text-sm text-ink-secondary">
                    {formatNumber(
                      row.orderCount,
                    )}
                  </td>

                  <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                    $
                    {formatCurrency(
                      row.orderValue,
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FulfillmentReport({
  report,
}: {
  report: FulfillmentSummary | null;
}) {
  if (!report) {
    return (
      <section className="rounded-2xl border border-line bg-surface shadow-sm">
        <EmptyState />
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Pick Lists"
          value={formatNumber(
            report.pickListCount,
          )}
        />

        <MetricCard
          label="Packages"
          value={formatNumber(
            report.packageCount,
          )}
        />

        <MetricCard
          label="Shipments"
          value={formatNumber(
            report.shipmentCount,
          )}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatusPanel
          title="Pick Lists"
          rows={
            report.pickListsByStatus
          }
        />

        <StatusPanel
          title="Packages"
          rows={
            report.packagesByStatus
          }
        />

        <StatusPanel
          title="Shipments"
          rows={
            report.shipmentsByStatus
          }
        />
      </div>
    </div>
  );
}

function StatusPanel({
  title,
  rows,
}: {
  title: string;
  rows: {
    status: string;
    count: number;
  }[];
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">
          {title}
        </h2>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-line">
          {rows.map((row) => (
            <div
              key={row.status}
              className="flex items-center justify-between px-5 py-3"
            >
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                  row.status,
                )}`}
              >
                {formatStatus(
                  row.status,
                )}
              </span>

              <span className="text-sm font-semibold text-ink">
                {formatNumber(
                  row.count,
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}