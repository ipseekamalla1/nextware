"use client";

import {
useCallback,
useEffect,
useMemo,
useState,
} from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
CheckIcon,
CloseIcon,
PlusIcon,
SearchIcon,
} from "@/components/ui/icons";
import {
getCurrentCompanyId,
hasPermission,
} from "@/lib/auth";
import {
getCustomers,
getProducts,
Customer,
Product,
} from "@/lib/api";
import {
cancelSalesOrder,
confirmSalesOrder,
getSalesOrders,
SalesOrder,
SalesOrderStatus,
} from "@/lib/salesApi";

const statusOptions: {
value: SalesOrderStatus | "";
label: string;
}[] = [
{
value: "",
label: "All statuses",
},
{
value: "DRAFT",
label: "Draft",
},
{
value: "CONFIRMED",
label: "Confirmed",
},
{
value: "PARTIALLY_FULFILLED",
label: "Partially Fulfilled",
},
{
value: "FULFILLED",
label: "Fulfilled",
},
{
value: "CANCELLED",
label: "Cancelled",
},
];

function formatStatus(status: SalesOrderStatus): string {
switch (status) {
case "PARTIALLY_FULFILLED":
return "Partially Fulfilled";


default:
  return (
    status.charAt(0) +
    status.slice(1).toLowerCase()
  );


}
}

function statusClass(status: SalesOrderStatus): string {
switch (status) {
case "DRAFT":
return "bg-surface-active text-ink-secondary";


case "CONFIRMED":
  return "bg-success/10 text-success";

case "PARTIALLY_FULFILLED":
  return "bg-primary-100 text-primary-700";

case "FULFILLED":
  return "bg-success/10 text-success";

case "CANCELLED":
  return "bg-danger/10 text-danger";

default:
  return "bg-surface-active text-ink-secondary";


}
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

export default function SalesPage() {
const router = useRouter();

const companyId = getCurrentCompanyId();

const canCreate = hasPermission(
"SALES_ORDER_CREATE",
);

const canApprove = hasPermission(
"SALES_ORDER_APPROVE",
);

const [salesOrders, setSalesOrders] = useState<
SalesOrder[] | null

> (null);

const [customers, setCustomers] = useState<Customer[]>(
[],
);

const [products, setProducts] = useState<Product[]>([]);

const [error, setError] = useState<string | null>(
null,
);

const [search, setSearch] = useState("");

const [statusFilter, setStatusFilter] = useState<
SalesOrderStatus | ""

> ("");

const [customerFilter, setCustomerFilter] =
useState("");

const [actionLoading, setActionLoading] = useState<
string | null

> (null);

const [dialogType, setDialogType] = useState<
"confirm" | "cancel" | null

> (null);

const [dialogOrder, setDialogOrder] =
useState<SalesOrder | null>(null);

const [toast, setToast] = useState<{
type: "success" | "error";
message: string;
} | null>(null);

const loadData = useCallback(
async (activeCompanyId: string) => {
try {
setError(null);


    const [
      salesOrderData,
      customerData,
      productData,
    ] = await Promise.all([
      getSalesOrders(activeCompanyId),
      getCustomers(activeCompanyId),
      getProducts(activeCompanyId),
    ]);

    setSalesOrders(salesOrderData);
    setCustomers(customerData);
    setProducts(productData);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load sales data.",
    );

    setSalesOrders([]);
  }
},
[],


);

useEffect(() => {
if (!companyId || !canCreate) {
return;
}


const activeCompanyId = companyId;

const timer = window.setTimeout(() => {
  void loadData(activeCompanyId);
}, 0);

return () => {
  window.clearTimeout(timer);
};


}, [companyId, canCreate, loadData]);

useEffect(() => {
if (!toast) {
return;
}


const timer = window.setTimeout(() => {
  setToast(null);
}, 4000);

return () => {
  window.clearTimeout(timer);
};


}, [toast]);

const customerMap = useMemo(
() =>
new Map(
customers.map((customer) => [
customer.id,
customer,
]),
),
[customers],
);

const productMap = useMemo(
() =>
new Map(
products.map((product) => [
product.id,
product,
]),
),
[products],
);

const activeCustomers = useMemo(
() =>
customers
.filter((customer) => customer.active)
.sort((a, b) =>
a.name.localeCompare(b.name),
),
[customers],
);

const filteredOrders = useMemo(() => {
if (!salesOrders) {
return [];
}


const normalized = search
  .trim()
  .toLowerCase();

return salesOrders.filter((order) => {
  const customer = customerMap.get(
    order.customerId,
  );

  const matchesSearch =
    normalized.length === 0 ||
    order.orderNumber
      .toLowerCase()
      .includes(normalized) ||
    (customer?.name ?? "")
      .toLowerCase()
      .includes(normalized);

  const matchesStatus =
    !statusFilter ||
    order.status === statusFilter;

  const matchesCustomer =
    !customerFilter ||
    order.customerId === customerFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesCustomer
  );
});


}, [
salesOrders,
customerMap,
search,
statusFilter,
customerFilter,
]);

const totalValue = useMemo(
() =>
filteredOrders.reduce(
(sum, order) =>
sum + Number(order.totalAmount),
0,
),
[filteredOrders],
);

const draftCount = useMemo(
() =>
(salesOrders ?? []).filter(
(order) => order.status === "DRAFT",
).length,
[salesOrders],
);

const confirmedCount = useMemo(
() =>
(salesOrders ?? []).filter(
(order) =>
order.status === "CONFIRMED",
).length,
[salesOrders],
);

const fulfilledCount = useMemo(
() =>
(salesOrders ?? []).filter(
(order) =>
order.status === "FULFILLED",
).length,
[salesOrders],
);

function openActionDialog(
type: "confirm" | "cancel",
order: SalesOrder,
) {
setDialogType(type);
setDialogOrder(order);
}

function closeActionDialog() {
if (actionLoading) {
return;
}


setDialogType(null);
setDialogOrder(null);


}

async function handleAction() {
if (
!companyId ||
!dialogType ||
!dialogOrder
) {
return;
}


if (
  dialogType === "confirm" &&
  !canApprove
) {
  setToast({
    type: "error",
    message:
      "You do not have permission to confirm sales orders.",
  });
  return;
}

if (
  dialogType === "cancel" &&
  !canCreate
) {
  setToast({
    type: "error",
    message:
      "You do not have permission to cancel sales orders.",
  });
  return;
}

const activeCompanyId = companyId;
const orderId = dialogOrder.id;

try {
  setActionLoading(orderId);

  const updated =
    dialogType === "confirm"
      ? await confirmSalesOrder(
          activeCompanyId,
          orderId,
        )
      : await cancelSalesOrder(
          activeCompanyId,
          orderId,
        );

  setSalesOrders((current) =>
    (current ?? []).map((order) =>
      order.id === updated.id
        ? updated
        : order,
    ),
  );

  setToast({
    type: "success",
    message:
      dialogType === "confirm"
        ? "Sales order confirmed successfully."
        : "Sales order cancelled successfully.",
  });

  closeActionDialog();
} catch (err) {
  setToast({
    type: "error",
    message:
      err instanceof Error
        ? err.message
        : "Sales order action failed.",
  });
} finally {
  setActionLoading(null);
}


}

if (!canCreate) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10"> <p className="text-sm font-semibold text-danger">
Access denied </p>


        <p className="mt-1 text-sm text-danger">
          You do not have permission to view sales orders.
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
          Your authenticated company could not be determined.
        </p>
      </div>
    </div>
  </AppShell>
);


}

if (salesOrders === null) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm"> <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />


        <p className="mt-4 text-sm text-ink-muted">
          Loading sales orders...
        </p>
      </div>
    </div>
  </AppShell>
);


}

return ( <AppShell> <div className="p-6 lg:p-8"> <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"> <div> <div className="mb-1 text-xs font-medium text-ink-muted">
Operations / Sales </div>


        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Sales Orders
        </h1>

        <p className="mt-1 text-sm text-ink-muted">
          Create and manage customer sales orders.
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          router.push("/sales/new")
        }
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
      >
        <PlusIcon />
        New Sales Order
      </button>
    </div>

    {error && (
      <div className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4">
        <p className="text-sm font-semibold text-danger">
          Unable to load sales orders
        </p>

        <p className="mt-1 text-sm text-danger">
          {error}
        </p>
      </div>
    )}

    <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Total Orders
        </p>

        <p className="mt-2 text-2xl font-bold text-ink">
          {salesOrders.length}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Draft
        </p>

        <p className="mt-2 text-2xl font-bold text-ink">
          {draftCount}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Confirmed
        </p>

        <p className="mt-2 text-2xl font-bold text-ink">
          {confirmedCount}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Fulfilled
        </p>

        <p className="mt-2 text-2xl font-bold text-ink">
          {fulfilledCount}
        </p>
      </div>
    </div>

    <div className="mb-5 rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px_auto]">
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
            <SearchIcon />
          </div>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search order number or customer..."
            className="w-full rounded-lg border border-line bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target
                .value as SalesOrderStatus | "",
            )
          }
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
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
          value={customerFilter}
          onChange={(event) =>
            setCustomerFilter(
              event.target.value,
            )
          }
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
        >
          <option value="">
            All customers
          </option>

          {activeCustomers.map(
            (customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.name}
              </option>
            ),
          )}
        </select>

        <div className="flex items-center justify-end text-sm text-ink-muted">
          Total:{" "}
          <span className="ml-1 font-semibold text-ink">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>
    </div>

    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-line bg-surface-subtle">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Order
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Customer
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Date
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Lines
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Total
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Status
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {filteredOrders.map((order) => {
              const customer =
                customerMap.get(
                  order.customerId,
                );

              const busy =
                actionLoading === order.id;

              return (
                <tr
                  key={order.id}
                  className="hover:bg-surface-subtle"
                >
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/sales/view?id=${encodeURIComponent(
                            order.id,
                          )}`,
                        )
                      }
                      className="font-semibold text-primary-600 hover:text-primary-700"
                    >
                      {order.orderNumber}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-sm text-ink">
                    {customer?.name ??
                      "Unknown customer"}
                  </td>

                  <td className="px-5 py-4 text-sm text-ink-secondary">
                    {formatDate(
                      order.orderDate,
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm text-ink-secondary">
                    {order.lines.length}
                  </td>

                  <td className="px-5 py-4 text-right text-sm font-semibold text-ink">
                    {formatCurrency(
                      Number(
                        order.totalAmount,
                      ),
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                        order.status,
                      )}`}
                    >
                      {formatStatus(
                        order.status,
                      )}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/sales/view?id=${encodeURIComponent(
                              order.id,
                            )}`,
                          )
                        }
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:bg-surface-subtle"
                      >
                        View
                      </button>

                      {order.status ===
                        "DRAFT" &&
                        canApprove && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              openActionDialog(
                                "confirm",
                                order,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/15 disabled:opacity-50"
                          >
                            <CheckIcon />
                            Confirm
                          </button>
                        )}

                      {(order.status ===
                        "DRAFT" ||
                        order.status ===
                          "CONFIRMED") && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            openActionDialog(
                              "cancel",
                              order,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/15 disabled:opacity-50"
                        >
                          <CloseIcon />
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredOrders.length ===
              0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-14 text-center"
                >
                  <p className="text-sm font-semibold text-ink">
                    No sales orders found
                  </p>

                  <p className="mt-1 text-sm text-ink-muted">
                    Try changing your filters or create a new sales order.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  {toast && (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-line bg-surface px-5 py-4 shadow-lg">
      <p
        className={`text-sm font-semibold ${
          toast.type === "success"
            ? "text-success"
            : "text-danger"
        }`}
      >
        {toast.message}
      </p>
    </div>
  )}

  {dialogType && dialogOrder && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-ink">
          {dialogType === "confirm"
            ? "Confirm Sales Order"
            : "Cancel Sales Order"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {dialogType === "confirm"
            ? `Confirm ${dialogOrder.orderNumber}? Once confirmed, it can proceed to fulfillment.`
            : `Cancel ${dialogOrder.orderNumber}? This action cannot be used to return the order to its previous status.`}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={Boolean(actionLoading)}
            onClick={closeActionDialog}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-subtle disabled:opacity-50"
          >
            Keep
          </button>

          <button
            type="button"
            disabled={Boolean(actionLoading)}
            onClick={() => void handleAction()}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
              dialogType === "confirm"
                ? "bg-success hover:opacity-90"
                : "bg-danger hover:opacity-90"
            }`}
          >
            {actionLoading
              ? "Processing..."
              : dialogType === "confirm"
                ? "Confirm Order"
                : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  )}
</AppShell>


);
}
