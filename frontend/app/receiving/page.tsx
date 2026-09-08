"use client";

import {
useCallback,
useMemo,
useState,
} from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
AlertIcon,
EyeIcon,
PlusIcon,
SearchIcon,
} from "@/components/ui/icons";
import {
getCurrentCompanyId,
hasPermission,
} from "@/lib/auth";
import {
getReceipts,
Receipt,
ReceiptStatus,
} from "@/lib/receivingApi";
import {
getPurchaseOrders,
PurchaseOrder,
} from "@/lib/purchasingApi";
import {
getWarehouses,
Warehouse,
} from "@/lib/api";

const statusOptions: {
value: ReceiptStatus | "";
label: string;
}[] = [
{
value: "",
label: "All statuses",
},
{
value: "OPEN",
label: "Open",
},
{
value: "RECEIVING",
label: "Receiving",
},
{
value: "COMPLETED",
label: "Completed",
},
{
value: "CANCELLED",
label: "Cancelled",
},
];

function formatStatus(status: ReceiptStatus): string {
switch (status) {
case "RECEIVING":
return "Receiving";


case "COMPLETED":
  return "Completed";

case "CANCELLED":
  return "Cancelled";

case "OPEN":
  return "Open";

default:
  return status;


}
}

function statusClass(status: ReceiptStatus): string {
switch (status) {
case "OPEN":
return "bg-surface-active text-ink-secondary";


case "RECEIVING":
  return "bg-warning/10 text-warning";

case "COMPLETED":
  return "bg-success/10 text-success";

case "CANCELLED":
  return "bg-danger/10 text-danger";

default:
  return "bg-surface-active text-ink-secondary";


}
}

function formatDate(value: string): string {
const date = new Date(`${value}T00:00:00`);

if (Number.isNaN(date.getTime())) {
return value;
}

return date.toLocaleDateString();
}

function formatCurrency(value: number): string {
return value.toLocaleString(undefined, {
minimumFractionDigits: 2,
maximumFractionDigits: 2,
});
}

export default function ReceivingPage() {
const router = useRouter();

const companyId = getCurrentCompanyId();

const canView = hasPermission(
"INVENTORY_VIEW"
);

const canCreate = hasPermission(
"INVENTORY_ADJUST"
);

const [receipts, setReceipts] =
useState<Receipt[] | null>(null);

const [purchaseOrders, setPurchaseOrders] =
useState<PurchaseOrder[]>([]);

const [warehouses, setWarehouses] =
useState<Warehouse[]>([]);

const [search, setSearch] =
useState("");

const [statusFilter, setStatusFilter] =
useState<ReceiptStatus | "">("");

const [warehouseFilter, setWarehouseFilter] =
useState("");

const [error, setError] =
useState<string | null>(null);

const loadData = useCallback(async () => {
if (!companyId || !canView) {
return;
}


try {
  setError(null);

  const [
    receiptData,
    purchaseOrderData,
    warehouseData,
  ] = await Promise.all([
    getReceipts(companyId),
    getPurchaseOrders(companyId, {
      status: "APPROVED",
    }),
    getWarehouses(companyId),
  ]);

  setReceipts(receiptData);
  setPurchaseOrders(purchaseOrderData);
  setWarehouses(warehouseData);
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Failed to load receiving data."
  );

  setReceipts([]);
}


}, [companyId, canView]);

/*

* Initial loading is triggered by the browser after
* the component has rendered.
*
* This avoids calling state setters synchronously
* from inside a React effect.
  */
  if (
  companyId &&
  canView &&
  receipts === null &&
  !error
  ) {
  setTimeout(() => {
  void loadData();
  }, 0);
  }

const purchaseOrderMap = useMemo(
() =>
new Map(
purchaseOrders.map((order) => [
order.id,
order,
])
),
[purchaseOrders]
);

const warehouseMap = useMemo(
() =>
new Map(
warehouses.map((warehouse) => [
warehouse.id,
warehouse,
])
),
[warehouses]
);

const filteredReceipts = useMemo(() => {
if (!receipts) {
return [];
}


const normalizedSearch =
  search.trim().toLowerCase();

return receipts.filter((receipt) => {
  const purchaseOrder =
    purchaseOrderMap.get(
      receipt.purchaseOrderId
    );

  const warehouse =
    warehouseMap.get(
      receipt.warehouseId
    );

  const matchesSearch =
    normalizedSearch.length === 0 ||
    receipt.receiptNumber
      .toLowerCase()
      .includes(normalizedSearch) ||
    (
      purchaseOrder?.orderNumber ?? ""
    )
      .toLowerCase()
      .includes(normalizedSearch) ||
    (
      warehouse?.name ?? ""
    )
      .toLowerCase()
      .includes(normalizedSearch);

  const matchesStatus =
    !statusFilter ||
    receipt.status === statusFilter;

  const matchesWarehouse =
    !warehouseFilter ||
    receipt.warehouseId ===
      warehouseFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesWarehouse
  );
});


}, [
receipts,
purchaseOrderMap,
warehouseMap,
search,
statusFilter,
warehouseFilter,
]);

if (!canView) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10"> <p className="text-sm font-semibold text-danger">
Access denied </p>


        <p className="mt-1 text-sm text-danger">
          You do not have permission to view
          receiving records.
        </p>
      </div>
    </div>
  </AppShell>
);


}

if (!companyId) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10"> <p className="text-sm font-semibold text-danger">
Company context unavailable </p>


        <p className="mt-1 text-sm text-danger">
          Your authenticated company could
          not be determined. Please sign in
          again.
        </p>
      </div>
    </div>
  </AppShell>
);


}

return ( <AppShell> <div className="p-6 lg:p-8"> <div className="mb-6"> <div className="mb-1 text-xs font-medium text-ink-muted">
Operations / Purchasing / Receiving </div>


      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Receiving
          </h1>

          <p className="mt-1 text-sm text-ink-muted">
            Receive products against approved
            purchase orders and update inventory.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() =>
              router.push("/receiving/new")
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <PlusIcon />
            New Receipt
          </button>
        )}
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
            placeholder="Search receipt, purchase order or warehouse..."
            className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target
                .value as ReceiptStatus | ""
            )
          }
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
        >
          {statusOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
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
            All warehouses
          </option>

          {warehouses
            .filter(
              (warehouse) =>
                warehouse.active
            )
            .sort((a, b) =>
              a.name.localeCompare(b.name)
            )
            .map((warehouse) => (
              <option
                key={warehouse.id}
                value={warehouse.id}
              >
                {warehouse.code} —{" "}
                {warehouse.name}
              </option>
            ))}
        </select>
      </div>
    </div>

    {receipts === null && (
      <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />

        <p className="mt-4 text-sm text-ink-muted">
          Loading receipts...
        </p>
      </div>
    )}

    {receipts !== null && error && (
      <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
        <div className="flex items-start gap-3">
          <div className="text-danger">
            <AlertIcon />
          </div>

          <div>
            <p className="text-sm font-semibold text-danger">
              Unable to load receiving
              records
            </p>

            <p className="mt-1 text-sm text-danger">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadData()
              }
              className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )}

    {receipts !== null &&
      !error &&
      filteredReceipts.length === 0 && (
        <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-active text-lg font-semibold text-ink-muted">
            R
          </div>

          <h2 className="mt-4 text-base font-semibold text-ink">
            No receipts found
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
            {search ||
            statusFilter ||
            warehouseFilter
              ? "No receipts match your current filters."
              : "Create a receipt against an approved purchase order to begin receiving."}
          </p>

          {!search &&
            !statusFilter &&
            !warehouseFilter &&
            canCreate && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/receiving/new"
                  )
                }
                className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Create Receipt
              </button>
            )}
        </div>
      )}

    {receipts !== null &&
      !error &&
      filteredReceipts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-line bg-surface-hover">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Receipt
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Purchase Order
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Warehouse
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Receipt Date
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {filteredReceipts.map(
                  (receipt) => {
                    const purchaseOrder =
                      purchaseOrderMap.get(
                        receipt.purchaseOrderId
                      );

                    const warehouse =
                      warehouseMap.get(
                        receipt.warehouseId
                      );

                    return (
                      <tr
                        key={receipt.id}
                        className="transition hover:bg-surface-hover"
                      >
                        <td className="px-5 py-4">
                          <div className="font-mono text-sm font-semibold text-ink">
                            {
                              receipt.receiptNumber
                            }
                          </div>

                          <div className="mt-1 text-xs text-ink-muted">
                            {
                              receipt.lines
                                .length
                            }{" "}
                            line
                            {receipt.lines
                              .length === 1
                              ? ""
                              : "s"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-ink-secondary">
                          {purchaseOrder?.orderNumber ??
                            receipt.purchaseOrderId}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-medium text-ink">
                            {warehouse?.name ??
                              "Unknown warehouse"}
                          </div>

                          {warehouse?.code && (
                            <div className="mt-1 text-xs text-ink-muted">
                              {
                                warehouse.code
                              }
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-ink-secondary">
                          {formatDate(
                            receipt.receiptDate
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-ink-secondary">
                          {formatCurrency(
                            receipt.totalAmount
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(
                              receipt.status
                            )}`}
                          >
                            {formatStatus(
                              receipt.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/receiving/view?id=${encodeURIComponent(
                                    receipt.id
                                  )}`
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-hover"
                            >
                              <EyeIcon />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
  </div>
</AppShell>


);
}
