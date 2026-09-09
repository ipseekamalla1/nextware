"use client";

import {
useEffect,
useMemo,
useState,
} from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
ArrowLeftIcon,
CloseIcon,
PlusIcon,
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
createSalesOrder,
SalesOrderCreateRequest,
} from "@/lib/salesApi";

interface DraftLine {
productId: string;
orderedQuantity: string;
unitPrice: string;
}

function emptyLine(): DraftLine {
return {
productId: "",
orderedQuantity: "",
unitPrice: "",
};
}

export default function NewSalesOrderPage() {
const router = useRouter();

const companyId = getCurrentCompanyId();

const canCreate = hasPermission(
"SALES_ORDER_CREATE",
);

const [customers, setCustomers] =
useState<Customer[]>([]);

const [products, setProducts] =
useState<Product[]>([]);

const [loading, setLoading] = useState(true);

const [saving, setSaving] = useState(false);

const [error, setError] = useState<string | null>(
null,
);

const [formError, setFormError] =
useState<string | null>(null);

const [customerId, setCustomerId] =
useState("");

const [orderNumber, setOrderNumber] =
useState("");

const [orderDate, setOrderDate] = useState(
new Date().toISOString().slice(0, 10),
);

const [billingAddressLine1, setBillingAddressLine1] =
useState("");

const [billingAddressLine2, setBillingAddressLine2] =
useState("");

const [billingCity, setBillingCity] =
useState("");

const [billingState, setBillingState] =
useState("");

const [billingPostalCode, setBillingPostalCode] =
useState("");

const [billingCountry, setBillingCountry] =
useState("");

const [shippingAddressLine1, setShippingAddressLine1] =
useState("");

const [shippingAddressLine2, setShippingAddressLine2] =
useState("");

const [shippingCity, setShippingCity] =
useState("");

const [shippingState, setShippingState] =
useState("");

const [shippingPostalCode, setShippingPostalCode] =
useState("");

const [shippingCountry, setShippingCountry] =
useState("");

const [notes, setNotes] = useState("");

const [lines, setLines] =
useState<DraftLine[]>([emptyLine()]);

useEffect(() => {
if (!companyId || !canCreate) {
setLoading(false);
return;
}


const activeCompanyId = companyId;

let cancelled = false;

const timer = window.setTimeout(() => {
  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [
        customerData,
        productData,
      ] = await Promise.all([
        getCustomers(activeCompanyId),
        getProducts(activeCompanyId),
      ]);

      if (cancelled) {
        return;
      }

      setCustomers(
        customerData.filter(
          (customer) => customer.active,
        ),
      );

      setProducts(
        productData.filter(
          (product) => product.active,
        ),
      );
    } catch (err) {
      if (cancelled) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load sales order data.",
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void load();
}, 0);

return () => {
  cancelled = true;
  window.clearTimeout(timer);
};


}, [companyId, canCreate]);

const selectedCustomer = useMemo(
() =>
customers.find(
(customer) =>
customer.id === customerId,
) ?? null,
[customers, customerId],
);

const activeProducts = useMemo(
() =>
[...products].sort((a, b) =>
a.sku.localeCompare(b.sku),
),
[products],
);

const calculatedTotal = useMemo(
() =>
lines.reduce((sum, line) => {
const quantity = Number(
line.orderedQuantity,
);


    const unitPrice = Number(
      line.unitPrice,
    );

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(unitPrice)
    ) {
      return sum;
    }

    return sum + quantity * unitPrice;
  }, 0),
[lines],


);

function updateLine(
index: number,
field: keyof DraftLine,
value: string,
) {
setLines((current) =>
current.map((line, lineIndex) =>
lineIndex === index
? {
...line,
[field]: value,
}
: line,
),
);
}

function addLine() {
setLines((current) => [
...current,
emptyLine(),
]);
}

function removeLine(index: number) {
setLines((current) => {
if (current.length === 1) {
return current;
}


  return current.filter(
    (_, lineIndex) =>
      lineIndex !== index,
  );
});


}

function copyCustomerAddresses(
customer: Customer,
) {
setBillingAddressLine1(
customer.billingAddressLine1 ?? "",
);


setBillingAddressLine2(
  customer.billingAddressLine2 ?? "",
);

setBillingCity(
  customer.billingCity ?? "",
);

setBillingState(
  customer.billingState ?? "",
);

setBillingPostalCode(
  customer.billingPostalCode ?? "",
);

setBillingCountry(
  customer.billingCountry ?? "",
);

setShippingAddressLine1(
  customer.shippingAddressLine1 ?? "",
);

setShippingAddressLine2(
  customer.shippingAddressLine2 ?? "",
);

setShippingCity(
  customer.shippingCity ?? "",
);

setShippingState(
  customer.shippingState ?? "",
);

setShippingPostalCode(
  customer.shippingPostalCode ?? "",
);

setShippingCountry(
  customer.shippingCountry ?? "",
);


}

function handleCustomerChange(
value: string,
) {
setCustomerId(value);


const customer = customers.find(
  (item) => item.id === value,
);

if (customer) {
  copyCustomerAddresses(customer);
}


}

async function handleSubmit(
event: React.FormEvent<HTMLFormElement>,
) {
event.preventDefault();


if (!companyId) {
  setFormError(
    "No authenticated company context is available.",
  );
  return;
}

if (!canCreate) {
  setFormError(
    "You do not have permission to create sales orders.",
  );
  return;
}

if (!customerId) {
  setFormError("Customer is required.");
  return;
}

if (!orderNumber.trim()) {
  setFormError(
    "Sales order number is required.",
  );
  return;
}

if (!orderDate) {
  setFormError("Order date is required.");
  return;
}

if (lines.length === 0) {
  setFormError(
    "At least one sales order line is required.",
  );
  return;
}

const seenProducts = new Set<string>();

const parsedLines: SalesOrderCreateRequest["lines"] =
  [];

for (
  let index = 0;
  index < lines.length;
  index += 1
) {
  const line = lines[index];

  if (!line.productId) {
    setFormError(
      `Product is required on line ${index + 1}.`,
    );
    return;
  }

  if (
    seenProducts.has(line.productId)
  ) {
    setFormError(
      "A product cannot appear more than once on the same sales order.",
    );
    return;
  }

  seenProducts.add(line.productId);

  const quantity = Number(
    line.orderedQuantity,
  );

  const unitPrice = Number(
    line.unitPrice,
  );

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    setFormError(
      `Ordered quantity must be greater than zero on line ${index + 1}.`,
    );
    return;
  }

  if (
    !Number.isFinite(unitPrice) ||
    unitPrice < 0
  ) {
    setFormError(
      `Unit price cannot be negative on line ${index + 1}.`,
    );
    return;
  }

  parsedLines.push({
    productId: line.productId,
    orderedQuantity: quantity,
    unitPrice,
  });
}

try {
  setSaving(true);
  setFormError(null);

  const request: SalesOrderCreateRequest = {
    companyId,
    customerId,
    orderNumber: orderNumber.trim(),
    orderDate,

    billingAddressLine1:
      billingAddressLine1.trim() || null,
    billingAddressLine2:
      billingAddressLine2.trim() || null,
    billingCity:
      billingCity.trim() || null,
    billingState:
      billingState.trim() || null,
    billingPostalCode:
      billingPostalCode.trim() || null,
    billingCountry:
      billingCountry.trim() || null,

    shippingAddressLine1:
      shippingAddressLine1.trim() || null,
    shippingAddressLine2:
      shippingAddressLine2.trim() || null,
    shippingCity:
      shippingCity.trim() || null,
    shippingState:
      shippingState.trim() || null,
    shippingPostalCode:
      shippingPostalCode.trim() || null,
    shippingCountry:
      shippingCountry.trim() || null,

    notes: notes.trim() || null,

    lines: parsedLines,
  };

  const created =
    await createSalesOrder(request);

  router.push(
    `/sales/view?id=${encodeURIComponent(
      created.id,
    )}`,
  );
} catch (err) {
  setFormError(
    err instanceof Error
      ? err.message
      : "Failed to create sales order.",
  );
} finally {
  setSaving(false);
}


}

if (!canCreate) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10"> <p className="text-sm font-semibold text-danger">
Access denied </p>


        <p className="mt-1 text-sm text-danger">
          You do not have permission to create sales orders.
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

if (loading) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm"> <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />


        <p className="mt-4 text-sm text-ink-muted">
          Loading sales order data...
        </p>
      </div>
    </div>
  </AppShell>
);


}

if (error) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10"> <p className="text-sm font-semibold text-danger">
Unable to load sales data </p>


        <p className="mt-1 text-sm text-danger">
          {error}
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


      <div className="mb-1 text-xs font-medium text-ink-muted">
        Operations / Sales
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-ink">
        New Sales Order
      </h1>

      <p className="mt-1 text-sm text-ink-muted">
        Create a customer sales order.
      </p>
    </div>

    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {formError && (
        <div className="rounded-xl border border-danger/30 bg-danger-soft px-5 py-4">
          <p className="text-sm font-semibold text-danger">
            Unable to create sales order
          </p>

          <p className="mt-1 text-sm text-danger">
            {formError}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          Order Details
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Customer
            </label>

            <select
              value={customerId}
              onChange={(event) =>
                handleCustomerChange(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            >
              <option value="">
                Select customer
              </option>

              {customers.map(
                (customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.customerCode} —{" "}
                    {customer.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Order Number
            </label>

            <input
              type="text"
              value={orderNumber}
              onChange={(event) =>
                setOrderNumber(
                  event.target.value,
                )
              }
              placeholder="SO-0001"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Order Date
            </label>

            <input
              type="date"
              value={orderDate}
              onChange={(event) =>
                setOrderDate(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            Billing Address
          </h2>

          {selectedCustomer && (
            <button
              type="button"
              onClick={() =>
                copyCustomerAddresses(
                  selectedCustomer,
                )
              }
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              Use customer address
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Address Line 1
            </label>

            <input
              type="text"
              value={billingAddressLine1}
              onChange={(event) =>
                setBillingAddressLine1(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Address Line 2
            </label>

            <input
              type="text"
              value={billingAddressLine2}
              onChange={(event) =>
                setBillingAddressLine2(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              City
            </label>

            <input
              type="text"
              value={billingCity}
              onChange={(event) =>
                setBillingCity(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              State / Province
            </label>

            <input
              type="text"
              value={billingState}
              onChange={(event) =>
                setBillingState(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Postal Code
            </label>

            <input
              type="text"
              value={billingPostalCode}
              onChange={(event) =>
                setBillingPostalCode(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Country
            </label>

            <input
              type="text"
              value={billingCountry}
              onChange={(event) =>
                setBillingCountry(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          Shipping Address
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Address Line 1
            </label>

            <input
              type="text"
              value={shippingAddressLine1}
              onChange={(event) =>
                setShippingAddressLine1(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Address Line 2
            </label>

            <input
              type="text"
              value={shippingAddressLine2}
              onChange={(event) =>
                setShippingAddressLine2(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              City
            </label>

            <input
              type="text"
              value={shippingCity}
              onChange={(event) =>
                setShippingCity(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              State / Province
            </label>

            <input
              type="text"
              value={shippingState}
              onChange={(event) =>
                setShippingState(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Postal Code
            </label>

            <input
              type="text"
              value={shippingPostalCode}
              onChange={(event) =>
                setShippingPostalCode(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Country
            </label>

            <input
              type="text"
              value={shippingCountry}
              onChange={(event) =>
                setShippingCountry(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Order Lines
            </h2>

            <p className="mt-1 text-xs text-ink-muted">
              Add each product once with its ordered quantity and unit price.
            </p>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-secondary hover:bg-surface-subtle"
          >
            <PlusIcon />
            Add Line
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {lines.map((line, index) => {
            const product =
              products.find(
                (item) =>
                  item.id ===
                  line.productId,
              );

            const quantity = Number(
              line.orderedQuantity,
            );

            const unitPrice = Number(
              line.unitPrice,
            );

            const lineTotal =
              Number.isFinite(
                quantity,
              ) &&
              Number.isFinite(
                unitPrice,
              )
                ? quantity *
                  unitPrice
                : 0;

            return (
              <div
                key={index}
                className="rounded-lg border border-line bg-surface-subtle p-4"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_140px_160px_140px_auto] lg:items-end">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Product
                    </label>

                    <select
                      value={
                        line.productId
                      }
                      onChange={(
                        event,
                      ) =>
                        updateLine(
                          index,
                          "productId",
                          event.target
                            .value,
                        )
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                    >
                      <option value="">
                        Select product
                      </option>

                      {activeProducts.map(
                        (
                          item,
                        ) => (
                          <option
                            key={
                              item.id
                            }
                            value={
                              item.id
                            }
                          >
                            {item.sku} —{" "}
                            {
                              item.name
                            }
                          </option>
                        ),
                      )}
                    </select>

                    {product && (
                      <p className="mt-1.5 text-xs text-ink-muted">
                        {product.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={
                        line.orderedQuantity
                      }
                      onChange={(
                        event,
                      ) =>
                        updateLine(
                          index,
                          "orderedQuantity",
                          event.target
                            .value,
                        )
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Unit Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={
                        line.unitPrice
                      }
                      onChange={(
                        event,
                      ) =>
                        updateLine(
                          index,
                          "unitPrice",
                          event.target
                            .value,
                        )
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Line Total
                    </label>

                    <div className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-ink">
                      {lineTotal.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeLine(
                        index,
                      )
                    }
                    disabled={
                      lines.length ===
                      1
                    }
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-danger/30 px-3 text-xs font-semibold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CloseIcon />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end border-t border-line pt-5">
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Order Total
            </p>

            <p className="mt-1 text-2xl font-bold text-ink">
              {calculatedTotal.toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          Notes
        </h2>

        <textarea
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          rows={4}
          maxLength={1000}
          placeholder="Optional notes..."
          className="mt-4 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            router.push("/sales")
          }
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-subtle disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Creating..."
            : "Create Sales Order"}
        </button>
      </div>
    </form>
  </div>
</AppShell>


);
}
