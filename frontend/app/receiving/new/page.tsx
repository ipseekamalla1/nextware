"use client";

import {
useEffect,
useMemo,
useState,
} from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
getCurrentCompanyId,
hasPermission,
} from "@/lib/auth";
import {
getPurchaseOrders,
PurchaseOrder,
} from "@/lib/purchasingApi";
import {
createReceipt,
ReceiptCreateRequest,
} from "@/lib/receivingApi";
import {
getWarehouses,
getWarehouseLocations,
Warehouse,
WarehouseLocation,
} from "@/lib/api";

interface DraftLine {
purchaseOrderLineId: string;
warehouseLocationId: string;
receivedQuantity: string;
unitCost: string;
}

function emptyLine(): DraftLine {
return {
purchaseOrderLineId: "",
warehouseLocationId: "",
receivedQuantity: "",
unitCost: "",
};
}

export default function NewReceivingPage() {
const router = useRouter();

const companyId = getCurrentCompanyId();

const canCreate = hasPermission(
"INVENTORY_ADJUST"
);

const [purchaseOrders, setPurchaseOrders] =
useState<PurchaseOrder[]>([]);

const [warehouses, setWarehouses] =
useState<Warehouse[]>([]);

const [locations, setLocations] =
useState<WarehouseLocation[]>([]);

const [purchaseOrderId, setPurchaseOrderId] =
useState("");

const [warehouseId, setWarehouseId] =
useState("");

const [receiptNumber, setReceiptNumber] =
useState("");

const [receiptDate, setReceiptDate] =
useState(
new Date()
.toISOString()
.slice(0, 10)
);

const [notes, setNotes] =
useState("");

const [lines, setLines] =
useState<DraftLine[]>([emptyLine()]);

const [loading, setLoading] =
useState(true);

const [saving, setSaving] =
useState(false);

const [error, setError] =
useState<string | null>(null);

const [formError, setFormError] =
useState<string | null>(null);

/*

* Load approved purchase orders and active
* warehouses.
*
* The company ID is copied into a separate
* constant after the null check so TypeScript
* knows it is definitely a string inside the
* asynchronous function.
  */
  useEffect(() => {
  if (!companyId || !canCreate) {
  return;
  }


const authenticatedCompanyId: string =



  companyId;

let cancelled = false;

const timer = window.setTimeout(() => {
  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [
        purchaseOrderData,
        warehouseData,
      ] = await Promise.all([
        getPurchaseOrders(
          authenticatedCompanyId,
          {
            status: "APPROVED",
          }
        ),
        getWarehouses(
          authenticatedCompanyId
        ),
      ]);

      if (cancelled) {
        return;
      }

      setPurchaseOrders(
        purchaseOrderData
      );

      setWarehouses(
        warehouseData.filter(
          (warehouse) =>
            warehouse.active
        )
      );
    } catch (err) {
      if (cancelled) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load receiving data."
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

/*

* Load locations whenever the selected
* warehouse changes.
  */
  useEffect(() => {
  if (!warehouseId) {
  return;
  }


const selectedWarehouseId: string =



  warehouseId;

let cancelled = false;

const timer = window.setTimeout(() => {
  async function loadLocations() {
    try {
      setFormError(null);

      const data =
        await getWarehouseLocations(
          selectedWarehouseId
        );

      if (cancelled) {
        return;
      }

      setLocations(
        data.filter(
          (location) =>
            location.active
        )
      );
    } catch (err) {
      if (cancelled) {
        return;
      }

      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to load warehouse locations."
      );
    }
  }

  void loadLocations();
}, 0);

return () => {
  cancelled = true;
  window.clearTimeout(timer);
};


}, [warehouseId]);

const selectedPurchaseOrder =
useMemo(
() =>
purchaseOrders.find(
(order) =>
order.id ===
purchaseOrderId
) ?? null,
[
purchaseOrders,
purchaseOrderId,
]
);

const selectedWarehouse =
useMemo(
() =>
warehouses.find(
(warehouse) =>
warehouse.id ===
warehouseId
) ?? null,
[warehouses, warehouseId]
);

function updateLine(
index: number,
field: keyof DraftLine,
value: string
) {
setLines((current) =>
current.map(
(line, lineIndex) =>
lineIndex === index
? {
...line,
[field]: value,
}
: line
)
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
      lineIndex !== index
  );
});


}

function selectPurchaseOrder(
value: string
) {
setPurchaseOrderId(value);


const order = purchaseOrders.find(
  (item) => item.id === value
);

if (!order) {
  setLines([emptyLine()]);
  return;
}

setLines(
  order.lines.map((line) => ({
    purchaseOrderLineId:
      line.id,
    warehouseLocationId: "",
    receivedQuantity:
      String(
        line.orderedQuantity
      ),
    unitCost: String(
      line.unitCost
    ),
  }))
);


}

async function handleSubmit(
event: React.FormEvent<HTMLFormElement>
) {
event.preventDefault();


if (!companyId) {
  setFormError(
    "No authenticated company context is available."
  );
  return;
}

if (!canCreate) {
  setFormError(
    "You do not have permission to create receipts."
  );
  return;
}

if (!purchaseOrderId) {
  setFormError(
    "Purchase order is required."
  );
  return;
}

if (!warehouseId) {
  setFormError(
    "Warehouse is required."
  );
  return;
}

if (!receiptNumber.trim()) {
  setFormError(
    "Receipt number is required."
  );
  return;
}

if (!receiptDate) {
  setFormError(
    "Receipt date is required."
  );
  return;
}

if (lines.length === 0) {
  setFormError(
    "At least one receipt line is required."
  );
  return;
}

const seenLines = new Set<string>();

const parsedLines: ReceiptCreateRequest["lines"] =
  [];

for (
  let index = 0;
  index < lines.length;
  index += 1
) {
  const line = lines[index];

  if (!line.purchaseOrderLineId) {
    setFormError(
      `Purchase order line is required on line ${
        index + 1
      }.`
    );
    return;
  }

  if (
    seenLines.has(
      line.purchaseOrderLineId
    )
  ) {
    setFormError(
      "A purchase order line cannot appear more than once in the same receipt."
    );
    return;
  }

  seenLines.add(
    line.purchaseOrderLineId
  );

  if (!line.warehouseLocationId) {
    setFormError(
      `Warehouse location is required on line ${
        index + 1
      }.`
    );
    return;
  }

  const quantity = Number(
    line.receivedQuantity
  );

  const unitCost = Number(
    line.unitCost
  );

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    setFormError(
      `Received quantity must be greater than zero on line ${
        index + 1
      }.`
    );
    return;
  }

  if (
    !Number.isFinite(unitCost) ||
    unitCost < 0
  ) {
    setFormError(
      `Unit cost cannot be negative on line ${
        index + 1
      }.`
    );
    return;
  }

  parsedLines.push({
    purchaseOrderLineId:
      line.purchaseOrderLineId,
    warehouseLocationId:
      line.warehouseLocationId,
    receivedQuantity: quantity,
    unitCost,
  });
}

try {
  setSaving(true);
  setFormError(null);

  /*
   * companyId has already been checked above,
   * so this is safe for the request payload.
   */
  const authenticatedCompanyId: string =
    companyId;

  const request: ReceiptCreateRequest =
    {
      companyId:
        authenticatedCompanyId,
      purchaseOrderId,
      warehouseId,
      receiptNumber:
        receiptNumber.trim(),
      receiptDate,
      notes:
        notes.trim() || null,
      lines: parsedLines,
    };

  const created =
    await createReceipt(request);

  router.push(
    `/receiving/view?id=${encodeURIComponent(
      created.id
    )}`
  );
} catch (err) {
  setFormError(
    err instanceof Error
      ? err.message
      : "Failed to create receipt."
  );
} finally {
  setSaving(false);
}


}

if (!canCreate) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10"> <p className="text-sm font-semibold text-danger">
Access denied </p>


        <p className="mt-1 text-sm text-danger">
          You do not have permission to
          create receiving records.
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
          not be determined.
        </p>
      </div>
    </div>
  </AppShell>
);


}

if (loading) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm"> <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />


        <p className="mt-4 text-sm text-ink-muted">
          Loading receiving data...
        </p>
      </div>
    </div>
  </AppShell>
);


}

if (error) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10"> <p className="text-sm font-semibold text-danger">
Unable to load receiving data </p>


        <p className="mt-1 text-sm text-danger">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/receiving"
            )
          }
          className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Back to Receiving
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
router.push("/receiving")
}
className="mb-5 text-sm font-medium text-ink-muted hover:text-ink"
>
← Back to Receiving </button>


      <div className="mb-1 text-xs font-medium text-ink-muted">
        Operations / Purchasing / Receiving
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-ink">
        New Receipt
      </h1>

      <p className="mt-1 text-sm text-ink-muted">
        Create a receipt against an approved
        purchase order.
      </p>
    </div>

    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {formError && (
        <div className="rounded-xl border border-danger/30 bg-danger-soft px-5 py-4">
          <p className="text-sm font-semibold text-danger">
            Unable to create receipt
          </p>

          <p className="mt-1 text-sm text-danger">
            {formError}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          Receipt Details
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Purchase Order
            </label>

            <select
              value={purchaseOrderId}
              onChange={(event) =>
                selectPurchaseOrder(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            >
              <option value="">
                Select approved purchase order
              </option>

              {purchaseOrders.map(
                (order) => (
                  <option
                    key={order.id}
                    value={order.id}
                  >
                    {order.orderNumber}
                  </option>
                )
              )}
            </select>

            {purchaseOrders.length ===
              0 && (
              <p className="mt-1.5 text-xs text-ink-muted">
                No approved purchase orders
                are currently available.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Warehouse
            </label>

            <select
              value={warehouseId}
              onChange={(event) =>
                setWarehouseId(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            >
              <option value="">
                Select warehouse
              </option>

              {warehouses.map(
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
              Receipt Number
            </label>

            <input
              type="text"
              value={receiptNumber}
              onChange={(event) =>
                setReceiptNumber(
                  event.target.value
                )
              }
              maxLength={100}
              placeholder="e.g. GRN-0001"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Receipt Date
            </label>

            <input
              type="date"
              value={receiptDate}
              onChange={(event) =>
                setReceiptDate(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              maxLength={1000}
              rows={3}
              placeholder="Optional receiving notes..."
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Receipt Lines
            </h2>

            <p className="mt-1 text-sm text-ink-muted">
              Enter the quantities received and
              the warehouse location where each
              product was received.
            </p>
          </div>

          <button
            type="button"
            onClick={addLine}
            disabled={!selectedPurchaseOrder}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add Line
          </button>
        </div>

        {!selectedPurchaseOrder && (
          <div className="mt-5 rounded-lg border border-dashed border-line px-5 py-8 text-center">
            <p className="text-sm text-ink-muted">
              Select an approved purchase order
              to load its lines.
            </p>
          </div>
        )}

        {selectedPurchaseOrder &&
          lines.length > 0 && (
            <div className="mt-5 space-y-4">
              {lines.map(
                (line, index) => {
                  const poLine =
                    selectedPurchaseOrder.lines.find(
                      (item) =>
                        item.id ===
                        line.purchaseOrderLineId
                    );

                  return (
                    <div
                      key={`${line.purchaseOrderLineId || "new"}-${index}`}
                      className="rounded-xl border border-line bg-surface-hover p-4"
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto] lg:items-end">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                            Purchase Order Line
                          </label>

                          <select
                            value={
                              line.purchaseOrderLineId
                            }
                            onChange={(
                              event
                            ) =>
                              updateLine(
                                index,
                                "purchaseOrderLineId",
                                event.target
                                  .value
                              )
                            }
                            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                          >
                            <option value="">
                              Select line
                            </option>

                            {selectedPurchaseOrder.lines.map(
                              (
                                poLineOption
                              ) => (
                                <option
                                  key={
                                    poLineOption.id
                                  }
                                  value={
                                    poLineOption.id
                                  }
                                >
                                  Product{" "}
                                  {
                                    poLineOption.productId
                                  }{" "}
                                  — Qty{" "}
                                  {
                                    poLineOption.orderedQuantity
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                            Ordered Qty
                          </label>

                          <div className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary">
                            {poLine
                              ?.orderedQuantity ??
                              "—"}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                            Received Qty
                          </label>

                          <input
                            type="number"
                            min="0.0001"
                            step="0.0001"
                            value={
                              line.receivedQuantity
                            }
                            onChange={(
                              event
                            ) =>
                              updateLine(
                                index,
                                "receivedQuantity",
                                event.target
                                  .value
                              )
                            }
                            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                            Unit Cost
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              line.unitCost
                            }
                            onChange={(
                              event
                            ) =>
                              updateLine(
                                index,
                                "unitCost",
                                event.target
                                  .value
                              )
                            }
                            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeLine(
                              index
                            )
                          }
                          disabled={
                            lines.length ===
                            1
                          }
                          className="rounded-lg border border-danger/30 px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Warehouse Location
                        </label>

                        <select
                          value={
                            line.warehouseLocationId
                          }
                          onChange={(
                            event
                          ) =>
                            updateLine(
                              index,
                              "warehouseLocationId",
                              event.target
                                .value
                            )
                          }
                          disabled={
                            !warehouseId
                          }
                          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400 disabled:cursor-not-allowed disabled:bg-surface-active"
                        >
                          <option value="">
                            {!warehouseId
                              ? "Select warehouse first"
                              : "Select warehouse location"}
                          </option>

                          {locations.map(
                            (
                              location
                            ) => (
                              <option
                                key={
                                  location.id
                                }
                                value={
                                  location.id
                                }
                              >
                                {
                                  location.code
                                }{" "}
                                —{" "}
                                {
                                  location.name
                                }{" "}
                                (
                                {
                                  location.locationType
                                }
                                )
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

        {selectedPurchaseOrder &&
          lines.length === 0 && (
            <div className="mt-5 rounded-lg border border-dashed border-line px-5 py-8 text-center">
              <p className="text-sm text-ink-muted">
                Add at least one receipt line.
              </p>
            </div>
          )}
      </div>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() =>
            router.push("/receiving")
          }
          disabled={saving}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            saving ||
            !selectedPurchaseOrder ||
            !selectedWarehouse
          }
          className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Creating..."
            : "Create Receipt"}
        </button>
      </div>
    </form>
  </div>
</AppShell>


);
}
