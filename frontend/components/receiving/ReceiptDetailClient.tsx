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
  AlertIcon,
  CheckIcon,
  CloseIcon,
} from "@/components/ui/icons";
import {
  getCurrentCompanyId,
  hasPermission,
} from "@/lib/auth";
import {
  cancelReceipt,
  completeReceipt,
  getReceipt,
  Receipt,
  ReceiptStatus,
  startReceiving,
} from "@/lib/receivingApi";
import {
  getProduct,
  Product,
  getWarehouseLocations,
  WarehouseLocation,
} from "@/lib/api";
import {
  getPurchaseOrder,
  PurchaseOrder,
} from "@/lib/purchasingApi";

interface ReceiptDetailClientProps {
  receiptId: string | null;
}

function formatStatus(
  status: ReceiptStatus
): string {
  switch (status) {
    case "OPEN":
      return "Open";

    case "RECEIVING":
      return "Receiving";

    case "COMPLETED":
      return "Completed";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
}

function statusClass(
  status: ReceiptStatus
): string {
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

function formatCurrency(
  value: number
): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ReceiptDetailClient({
  receiptId,
}: ReceiptDetailClientProps) {
  const router = useRouter();

  const companyId = getCurrentCompanyId();

  const canManage = hasPermission(
    "INVENTORY_ADJUST"
  );

  const [receipt, setReceipt] =
    useState<Receipt | null>(null);

  const [purchaseOrder, setPurchaseOrder] =
    useState<PurchaseOrder | null>(null);

  const [products, setProducts] =
    useState<Map<string, Product>>(
      new Map()
    );

  const [locations, setLocations] =
    useState<Map<string, WarehouseLocation>>(
      new Map()
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [dialogType, setDialogType] =
    useState<
      "start" | "complete" | "cancel" | null
    >(null);

  const [toast, setToast] =
    useState<{
      type: "success" | "error";
      message: string;
    } | null>(null);

  const loadData = useCallback(
    async () => {
      if (
        !companyId ||
        !receiptId
      ) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const receiptData =
          await getReceipt(
            companyId,
            receiptId
          );

        setReceipt(receiptData);

        const [
          purchaseOrderData,
          locationData,
        ] = await Promise.all([
          getPurchaseOrder(
            companyId,
            receiptData.purchaseOrderId
          ),
          getWarehouseLocations(
            receiptData.warehouseId
          ),
        ]);

        setPurchaseOrder(
          purchaseOrderData
        );

        setLocations(
          new Map(
            locationData.map(
              (location) => [
                location.id,
                location,
              ]
            )
          )
        );

        const uniqueProductIds =
          Array.from(
            new Set(
              receiptData.lines.map(
                (line) =>
                  line.productId
              )
            )
          );

        const productResults =
          await Promise.all(
            uniqueProductIds.map(
              async (productId) => {
                try {
                  return await getProduct(
                    companyId,
                    productId
                  );
                } catch {
                  return null;
                }
              }
            )
          );

        const productMap =
          new Map<string, Product>();

        productResults.forEach(
          (product) => {
            if (product) {
              productMap.set(
                product.id,
                product
              );
            }
          }
        );

        setProducts(productMap);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load receipt."
        );
      } finally {
        setLoading(false);
      }
    },
    [companyId, receiptId]
  );

  useEffect(() => {
    if (
      !companyId ||
      !receiptId
    ) {
      setLoading(false);
      return;
    }

    void loadData();
  }, [
    companyId,
    receiptId,
    loadData,
  ]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(
      () => setToast(null),
      4000
    );

    return () =>
      window.clearTimeout(timer);
  }, [toast]);

  const purchaseOrderLineMap =
    useMemo(
      () =>
        new Map(
          (
            purchaseOrder?.lines ??
            []
          ).map((line) => [
            line.id,
            line,
          ])
        ),
      [purchaseOrder]
    );

  function openDialog(
    type:
      | "start"
      | "complete"
      | "cancel"
  ) {
    if (!receipt || !canManage) {
      return;
    }

    setDialogType(type);
  }

  function closeDialog() {
    if (actionLoading) {
      return;
    }

    setDialogType(null);
  }

  async function confirmAction() {
    if (
      !receipt ||
      !companyId ||
      !dialogType ||
      !canManage
    ) {
      return;
    }

    try {
      setActionLoading(true);

      let updated: Receipt;

      if (dialogType === "start") {
        updated =
          await startReceiving(
            companyId,
            receipt.id
          );
      } else if (
        dialogType === "complete"
      ) {
        updated =
          await completeReceipt(
            companyId,
            receipt.id
          );
      } else {
        updated =
          await cancelReceipt(
            companyId,
            receipt.id
          );
      }

      setReceipt(updated);

      setToast({
        type: "success",
        message:
          dialogType === "start"
            ? "Receipt is now receiving."
            : dialogType ===
                "complete"
              ? "Receipt completed successfully."
              : "Receipt cancelled successfully.",
      });

      setDialogType(null);
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "The receipt action failed.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (!canManage) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <p className="text-sm font-semibold text-danger">
              Access denied
            </p>

            <p className="mt-1 text-sm text-danger">
              You do not have permission to view
              receiving details.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!receiptId) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <p className="text-sm font-semibold text-danger">
              Receipt ID is missing
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/receiving"
                )
              }
              className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Back to Receiving
            </button>
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
              Your authenticated company could
              not be determined.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading receipt...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !receipt) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <div className="flex items-start gap-3">
              <div className="text-danger">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-danger">
                  Unable to load receipt
                </p>

                <p className="mt-1 text-sm text-danger">
                  {error ??
                    "Receipt was not found."}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/receiving"
                    )
                  }
                  className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Back to Receiving
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() =>
              router.push("/receiving")
            }
            className="mb-5 text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Back to Receiving
          </button>

          <div className="mb-1 text-xs font-medium text-ink-muted">
            Operations / Purchasing / Receiving
          </div>

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-ink">
                  {receipt.receiptNumber}
                </h1>

                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(
                    receipt.status
                  )}`}
                >
                  {formatStatus(
                    receipt.status
                  )}
                </span>
              </div>

              <p className="mt-1 text-sm text-ink-muted">
                Receipt created on{" "}
                {formatDate(
                  receipt.receiptDate
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {receipt.status ===
                "OPEN" && (
                <button
                  type="button"
                  onClick={() =>
                    openDialog("start")
                  }
                  className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Start Receiving
                </button>
              )}

              {receipt.status ===
                "RECEIVING" && (
                <button
                  type="button"
                  onClick={() =>
                    openDialog("complete")
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  <CheckIcon />
                  Complete Receipt
                </button>
              )}

              {(receipt.status ===
                "OPEN" ||
                receipt.status ===
                  "RECEIVING") && (
                <button
                  type="button"
                  onClick={() =>
                    openDialog("cancel")
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-danger/30 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/5"
                >
                  <CloseIcon />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {toast && (
          <div className="mb-5">
            <div
              className={
                toast.type ===
                "success"
                  ? "flex items-start gap-3 rounded-xl border border-success/30 bg-surface px-4 py-3 shadow-sm"
                  : "flex items-start gap-3 rounded-xl border border-danger/30 bg-surface px-4 py-3 shadow-sm"
              }
            >
              <div
                className={
                  toast.type ===
                  "success"
                    ? "text-success"
                    : "text-danger"
                }
              >
                <AlertIcon />
              </div>

              <p className="flex-1 text-sm text-ink-secondary">
                {toast.message}
              </p>

              <button
                type="button"
                onClick={() =>
                  setToast(null)
                }
                className="text-ink-muted hover:text-ink-secondary"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Receipt Number
            </p>

            <p className="mt-2 font-mono text-sm font-semibold text-ink">
              {receipt.receiptNumber}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Purchase Order
            </p>

            <p className="mt-2 text-sm font-semibold text-ink">
              {purchaseOrder?.orderNumber ??
                receipt.purchaseOrderId}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Total Amount
            </p>

            <p className="mt-2 text-lg font-bold text-ink">
              {formatCurrency(
                receipt.totalAmount
              )}
            </p>
          </div>
        </div>

        {receipt.notes && (
          <div className="mt-5 rounded-xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary">
              {receipt.notes}
            </p>
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold text-ink">
              Receipt Lines
            </h2>

            <p className="mt-1 text-sm text-ink-muted">
              Products recorded on this receipt.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-line bg-surface-hover">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Product
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    PO Quantity
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Received
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Unit Cost
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Location
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Line Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {receipt.lines.map(
                  (line) => {
                    const product =
                      products.get(
                        line.productId
                      );

                    const poLine =
                      purchaseOrderLineMap.get(
                        line.purchaseOrderLineId
                      );

                    const location =
                      locations.get(
                        line.warehouseLocationId
                      );

                    return (
                      <tr
                        key={line.id}
                        className="hover:bg-surface-hover"
                      >
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-ink">
                            {product?.name ??
                              "Unknown product"}
                          </div>

                          <div className="mt-1 text-xs font-mono text-ink-muted">
                            {product?.sku ??
                              line.productId}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-ink-secondary">
                          {poLine
                            ?.orderedQuantity ??
                            "—"}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-ink">
                          {
                            line.receivedQuantity
                          }
                        </td>

                        <td className="px-5 py-4 text-sm text-ink-secondary">
                          {formatCurrency(
                            line.unitCost
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-medium text-ink">
                            {location?.name ??
                              "Unknown location"}
                          </div>

                          <div className="mt-1 text-xs font-mono text-ink-muted">
                            {location?.code ??
                              line.warehouseLocationId}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-ink">
                          {formatCurrency(
                            line.lineTotal
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>

              <tfoot className="border-t border-line bg-surface-hover">
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-4 text-right text-sm font-semibold text-ink-secondary"
                  >
                    Total
                  </td>

                  <td className="px-5 py-4 text-right text-sm font-bold text-ink">
                    {formatCurrency(
                      receipt.totalAmount
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {dialogType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-ink">
                {dialogType === "start"
                  ? "Start Receiving"
                  : dialogType ===
                      "complete"
                    ? "Complete Receipt"
                    : "Cancel Receipt"}
              </h2>

              <p className="mt-2 text-sm text-ink-secondary">
                {dialogType === "start"
                  ? "This will move the receipt into the Receiving status."
                  : dialogType ===
                      "complete"
                    ? "Completing the receipt will post the received quantities to inventory and update the purchase order."
                    : "Cancelling the receipt will prevent it from being completed."}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={
                    actionLoading
                  }
                  className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:opacity-50"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={
                    confirmAction
                  }
                  disabled={
                    actionLoading
                  }
                  className={
                    dialogType ===
                    "cancel"
                      ? "rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      : "rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                  }
                >
                  {actionLoading
                    ? "Processing..."
                    : dialogType ===
                        "start"
                      ? "Start Receiving"
                      : dialogType ===
                          "complete"
                        ? "Complete Receipt"
                        : "Cancel Receipt"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}