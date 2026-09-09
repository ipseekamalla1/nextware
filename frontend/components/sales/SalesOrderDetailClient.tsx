"use client";

import {
useCallback,
useEffect,
useMemo,
useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
ArrowLeftIcon,
CheckIcon,
CloseIcon,
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
getSalesOrder,
SalesOrder,
SalesOrderStatus,
} from "@/lib/salesApi";

function formatStatus(
status: SalesOrderStatus,
): string {
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

function statusClass(
status: SalesOrderStatus,
): string {
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

function addressLines(
line1: string | null,
line2: string | null,
city: string | null,
state: string | null,
postalCode: string | null,
country: string | null,
): string[] {
const result: string[] = [];

if (line1) {
result.push(line1);
}

if (line2) {
result.push(line2);
}

const cityState = [
city,
state,
postalCode,
]
.filter(Boolean)
.join(", ");

if (cityState) {
result.push(cityState);
}

if (country) {
result.push(country);
}

return result;
}

export default function SalesOrderDetailClient() {
const router = useRouter();
const searchParams = useSearchParams();

const salesOrderId =
searchParams.get("id");

const companyId = getCurrentCompanyId();

const canCreate = hasPermission(
"SALES_ORDER_CREATE",
);

const canApprove = hasPermission(
"SALES_ORDER_APPROVE",
);

const [order, setOrder] =
useState<SalesOrder | null>(null);

const [customer, setCustomer] =
useState<Customer | null>(null);

const [products, setProducts] =
useState<Product[]>([]);

const [loading, setLoading] =
useState(true);

const [error, setError] =
useState<string | null>(null);

const [actionLoading, setActionLoading] =
useState(false);

const [dialogType, setDialogType] =
useState<"confirm" | "cancel" | null>(
null,
);

const [toast, setToast] = useState<{
type: "success" | "error";
message: string;
} | null>(null);

const loadOrder = useCallback(
async (
activeCompanyId: string,
activeSalesOrderId: string,
) => {
try {
setLoading(true);
setError(null);


    const [
      orderData,
      customerData,
      productData,
    ] = await Promise.all([
      getSalesOrder(
        activeCompanyId,
        activeSalesOrderId,
      ),
      getCustomers(activeCompanyId),
      getProducts(activeCompanyId),
    ]);

    setOrder(orderData);

    setCustomer(
      customerData.find(
        (item) =>
          item.id ===
          orderData.customerId,
      ) ?? null,
    );

    setProducts(productData);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load sales order.",
    );
  } finally {
    setLoading(false);
  }
},
[],


);

useEffect(() => {
if (!companyId || !salesOrderId) {
setLoading(false);
return;
}


const activeCompanyId = companyId;
const activeSalesOrderId =
  salesOrderId;

let cancelled = false;

const timer = window.setTimeout(() => {
  if (cancelled) {
    return;
  }

  void loadOrder(
    activeCompanyId,
    activeSalesOrderId,
  );
}, 0);

return () => {
  cancelled = true;
  window.clearTimeout(timer);
};


}, [
companyId,
salesOrderId,
loadOrder,
]);

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

const billingAddress = useMemo(
() => {
if (!order) {
return [];
}


  return addressLines(
    order.billingAddressLine1,
    order.billingAddressLine2,
    order.billingCity,
    order.billingState,
    order.billingPostalCode,
    order.billingCountry,
  );
},
[order],


);

const shippingAddress = useMemo(
() => {
if (!order) {
return [];
}


  return addressLines(
    order.shippingAddressLine1,
    order.shippingAddressLine2,
    order.shippingCity,
    order.shippingState,
    order.shippingPostalCode,
    order.shippingCountry,
  );
},
[order],


);

function openDialog(
type: "confirm" | "cancel",
) {
setDialogType(type);
}

function closeDialog() {
if (actionLoading) {
return;
}


setDialogType(null);


}

async function handleAction() {
if (!companyId || !order || !dialogType) {
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

try {
  setActionLoading(true);

  const updated =
    dialogType === "confirm"
      ? await confirmSalesOrder(
          activeCompanyId,
          order.id,
        )
      : await cancelSalesOrder(
          activeCompanyId,
          order.id,
        );

  setOrder(updated);

  setToast({
    type: "success",
    message:
      dialogType === "confirm"
        ? "Sales order confirmed successfully."
        : "Sales order cancelled successfully.",
  });

  setDialogType(null);
} catch (err) {
  setToast({
    type: "error",
    message:
      err instanceof Error
        ? err.message
        : "Sales order action failed.",
  });
} finally {
  setActionLoading(false);
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

if (!salesOrderId) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10"> <p className="text-sm font-semibold text-danger">
Sales order not specified </p>


        <p className="mt-1 text-sm text-danger">
          No sales order ID was provided.
        </p>

        <button
          type="button"
          onClick={() =>
            router.push("/sales")
          }
          className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Back to Sales
        </button>
      </div>
    </div>
  </AppShell>
);


}

if (loading) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm"> <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />


        <p className="mt-4 text-sm text-ink-muted">
          Loading sales order...
        </p>
      </div>
    </div>
  </AppShell>
);


}

if (error || !order) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10"> <p className="text-sm font-semibold text-danger">
Unable to load sales order </p>


        <p className="mt-1 text-sm text-danger">
          {error ??
            "The requested sales order could not be found."}
        </p>

        <button
          type="button"
          onClick={() =>
            router.push("/sales")
          }
          className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Back to Sales
        </button>
      </div>
    </div>
  </AppShell>
);


}

return ( <AppShell> <div className="p-6 lg:p-8"> <div className="mb-6">
<button
type="button"
onClick={() =>
router.push("/sales")
}
className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
> <ArrowLeftIcon />
Back to Sales Orders </button>


      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 text-xs font-medium text-ink-muted">
            Operations / Sales
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {order.orderNumber}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                order.status,
              )}`}
            >
              {formatStatus(
                order.status,
              )}
            </span>

            <span className="text-sm text-ink-muted">
              {formatDate(
                order.orderDate,
              )}
            </span>

            {customer && (
              <span className="text-sm text-ink-muted">
                {customer.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.status ===
            "DRAFT" &&
            canApprove && (
              <button
                type="button"
                onClick={() =>
                  openDialog(
                    "confirm",
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <CheckIcon />
                Confirm Order
              </button>
            )}

          {(order.status ===
            "DRAFT" ||
            order.status ===
              "CONFIRMED") && (
            <button
              type="button"
              onClick={() =>
                openDialog("cancel")
              }
              className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              <CloseIcon />
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>

    <div className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Customer
        </p>

        <p className="mt-3 font-semibold text-ink">
          {customer?.name ??
            "Unknown customer"}
        </p>

        {customer?.customerCode && (
          <p className="mt-1 text-sm text-ink-muted">
            {customer.customerCode}
          </p>
        )}

        {customer?.email && (
          <p className="mt-3 text-sm text-ink-secondary">
            {customer.email}
          </p>
        )}

        {customer?.phone && (
          <p className="mt-1 text-sm text-ink-secondary">
            {customer.phone}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Billing Address
        </p>

        <div className="mt-3 space-y-1 text-sm text-ink-secondary">
          {billingAddress.length >
          0 ? (
            billingAddress.map(
              (line, index) => (
                <p key={index}>
                  {line}
                </p>
              ),
            )
          ) : (
            <p className="text-ink-muted">
              No billing address provided.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Shipping Address
        </p>

        <div className="mt-3 space-y-1 text-sm text-ink-secondary">
          {shippingAddress.length >
          0 ? (
            shippingAddress.map(
              (line, index) => (
                <p key={index}>
                  {line}
                </p>
              ),
            )
          ) : (
            <p className="text-ink-muted">
              No shipping address provided.
            </p>
          )}
        </div>
      </div>
    </div>

    <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">
          Order Lines
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-line bg-surface-subtle">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Product
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Quantity
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Unit Price
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Line Total
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {order.lines.map(
              (line) => {
                const product =
                  productMap.get(
                    line.productId,
                  );

                return (
                  <tr
                    key={line.id}
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-ink">
                        {product?.sku ??
                          "Unknown product"}
                      </p>

                      <p className="mt-0.5 text-xs text-ink-muted">
                        {product?.name ??
                          line.productId}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-ink-secondary">
                      {Number(
                        line.orderedQuantity,
                      ).toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 4,
                        },
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-ink-secondary">
                      {formatCurrency(
                        Number(
                          line.unitPrice,
                        ),
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-ink">
                      {formatCurrency(
                        Number(
                          line.lineTotal,
                        ),
                      )}
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>

          <tfoot className="border-t border-line">
            <tr>
              <td
                colSpan={3}
                className="px-5 py-4 text-right text-sm font-semibold text-ink-secondary"
              >
                Order Total
              </td>

              <td className="px-5 py-4 text-right text-lg font-bold text-ink">
                {formatCurrency(
                  Number(
                    order.totalAmount,
                  ),
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    {order.notes && (
      <div className="mt-5 rounded-xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          Notes
        </h2>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-secondary">
          {order.notes}
        </p>
      </div>
    )}

    <div className="mt-5 rounded-xl border border-line bg-surface p-5 shadow-sm">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Created
          </p>

          <p className="mt-1 text-ink-secondary">
            {new Date(
              order.createdAt,
            ).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Last Updated
          </p>

          <p className="mt-1 text-ink-secondary">
            {new Date(
              order.updatedAt,
            ).toLocaleString()}
          </p>
        </div>
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

  {dialogType && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-ink">
          {dialogType === "confirm"
            ? "Confirm Sales Order"
            : "Cancel Sales Order"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {dialogType === "confirm"
            ? `Confirm ${order.orderNumber}? The order will become available for fulfillment.`
            : `Cancel ${order.orderNumber}? This will permanently move the order to Cancelled.`}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={actionLoading}
            onClick={closeDialog}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-subtle disabled:opacity-50"
          >
            Keep
          </button>

          <button
            type="button"
            disabled={actionLoading}
            onClick={() =>
              void handleAction()
            }
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
