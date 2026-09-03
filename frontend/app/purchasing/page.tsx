"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import AppShell from "@/components/layout/AppShell";
import {
  AlertIcon,
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
  getProducts,
  getSuppliers,
  Product,
  Supplier,
} from "@/lib/api";
import {
  approvePurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrders,
  PurchaseOrder,
  PurchaseOrderCreateRequest,
  PurchaseOrderStatus,
  submitPurchaseOrder,
} from "@/lib/purchasingApi";

interface DraftLine {
  productId: string;
  orderedQuantity: string;
  unitCost: string;
}

type DialogType =
  | "submit"
  | "approve"
  | null;

const statusOptions: {
  value: PurchaseOrderStatus | "";
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
    value: "SUBMITTED",
    label: "Submitted",
  },
  {
    value: "APPROVED",
    label: "Approved",
  },
  {
    value: "PARTIALLY_RECEIVED",
    label: "Partially Received",
  },
  {
    value: "RECEIVED",
    label: "Received",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];

function formatStatus(
  status: PurchaseOrderStatus
): string {
  switch (status) {
    case "PARTIALLY_RECEIVED":
      return "Partially Received";
    default:
      return (
        status.charAt(0) +
        status.slice(1).toLowerCase()
      );
  }
}

function statusClass(
  status: PurchaseOrderStatus
): string {
  switch (status) {
    case "DRAFT":
      return "bg-surface-active text-ink-secondary";

    case "SUBMITTED":
      return "bg-warning/10 text-warning";

    case "APPROVED":
      return "bg-success/10 text-success";

    case "PARTIALLY_RECEIVED":
      return "bg-primary-100 text-primary-700";

    case "RECEIVED":
      return "bg-success/10 text-success";

    case "CANCELLED":
      return "bg-danger/10 text-danger";

    default:
      return "bg-surface-active text-ink-secondary";
  }
}

function formatCurrency(
  value: number
): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(
  value: string
): string {
  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function emptyLine(): DraftLine {
  return {
    productId: "",
    orderedQuantity: "",
    unitCost: "",
  };
}

export default function PurchasingPage() {
  const companyId =
    getCurrentCompanyId();

  const canCreate =
    hasPermission(
      "PURCHASE_ORDER_CREATE"
    );

  const canApprove =
    hasPermission(
      "PURCHASE_ORDER_APPROVE"
    );

  const [purchaseOrders, setPurchaseOrders] =
    useState<PurchaseOrder[]>([]);

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<PurchaseOrderStatus | "">(
      ""
    );

  const [supplierFilter, setSupplierFilter] =
    useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [showView, setShowView] =
    useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState<PurchaseOrder | null>(null);

  const [orderNumber, setOrderNumber] =
    useState("");

  const [supplierId, setSupplierId] =
    useState("");

  const [orderDate, setOrderDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [notes, setNotes] =
    useState("");

  const [lines, setLines] =
    useState<DraftLine[]>([
      emptyLine(),
    ]);

  const [formError, setFormError] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [dialogType, setDialogType] =
    useState<DialogType>(null);

  const [dialogOrder, setDialogOrder] =
    useState<PurchaseOrder | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [toast, setToast] =
    useState<{
      type: "success" | "error";
      message: string;
    } | null>(null);

  useEffect(() => {
    if (!companyId || !canCreate) {
      setLoading(false);
      return;
    }

    void loadData();
  }, [companyId, canCreate]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setToast(null);
      }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  async function loadData() {
    if (!companyId || !canCreate) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        purchaseOrderData,
        supplierData,
        productData,
      ] = await Promise.all([
        getPurchaseOrders(companyId),
        getSuppliers(companyId),
        getProducts(companyId),
      ]);

      setPurchaseOrders(
        purchaseOrderData
      );

      setSuppliers(
        supplierData
      );

      setProducts(
        productData
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load purchasing data."
      );
    } finally {
      setLoading(false);
    }
  }

  const supplierMap = useMemo(
    () =>
      new Map(
        suppliers.map(
          (supplier) => [
            supplier.id,
            supplier,
          ]
        )
      ),
    [suppliers]
  );

  const productMap = useMemo(
    () =>
      new Map(
        products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      ),
    [products]
  );

  const activeSuppliers = useMemo(
    () =>
      suppliers
        .filter(
          (supplier) =>
            supplier.active
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name
          )
        ),
    [suppliers]
  );

  const activeProducts = useMemo(
    () =>
      products
        .filter(
          (product) =>
            product.active
        )
        .sort((a, b) =>
          a.sku.localeCompare(
            b.sku
          )
        ),
    [products]
  );

  const filteredOrders = useMemo(() => {
    const normalized =
      search
        .trim()
        .toLowerCase();

    return purchaseOrders.filter(
      (order) => {
        const supplier =
          supplierMap.get(
            order.supplierId
          );

        const matchesSearch =
          normalized.length === 0 ||
          order.orderNumber
            .toLowerCase()
            .includes(normalized) ||
          (
            supplier?.name ?? ""
          )
            .toLowerCase()
            .includes(normalized);

        const matchesStatus =
          !statusFilter ||
          order.status ===
            statusFilter;

        const matchesSupplier =
          !supplierFilter ||
          order.supplierId ===
            supplierFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesSupplier
        );
      }
    );
  }, [
    purchaseOrders,
    supplierMap,
    search,
    statusFilter,
    supplierFilter,
  ]);

  const totalValue = useMemo(
    () =>
      filteredOrders.reduce(
        (sum, order) =>
          sum + order.totalAmount,
        0
      ),
    [filteredOrders]
  );

  const draftCount = useMemo(
    () =>
      purchaseOrders.filter(
        (order) =>
          order.status === "DRAFT"
      ).length,
    [purchaseOrders]
  );

  const submittedCount = useMemo(
    () =>
      purchaseOrders.filter(
        (order) =>
          order.status ===
          "SUBMITTED"
      ).length,
    [purchaseOrders]
  );

  const approvedCount = useMemo(
    () =>
      purchaseOrders.filter(
        (order) =>
          order.status ===
          "APPROVED"
      ).length,
    [purchaseOrders]
  );

  function resetForm() {
    setOrderNumber("");
    setSupplierId("");
    setOrderDate(
      new Date()
        .toISOString()
        .slice(0, 10)
    );
    setNotes("");
    setLines([
      emptyLine(),
    ]);
    setFormError(null);
  }

  function openCreateForm() {
    if (!canCreate) {
      return;
    }

    resetForm();
    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (saving) {
      return;
    }

    setShowCreateForm(false);
    resetForm();
  }

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

  function removeLine(
    index: number
  ) {
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

  async function handleCreate(
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
        "You do not have permission to create purchase orders."
      );
      return;
    }

    if (!orderNumber.trim()) {
      setFormError(
        "Order number is required."
      );
      return;
    }

    if (!supplierId) {
      setFormError(
        "Supplier is required."
      );
      return;
    }

    if (!orderDate) {
      setFormError(
        "Order date is required."
      );
      return;
    }

    if (lines.length === 0) {
      setFormError(
        "At least one purchase order line is required."
      );
      return;
    }

    const seenProducts =
      new Set<string>();

    const parsedLines: PurchaseOrderCreateRequest["lines"] =
      [];

    for (
      let index = 0;
      index < lines.length;
      index += 1
    ) {
      const line =
        lines[index];

      if (!line.productId) {
        setFormError(
          `Product is required on line ${
            index + 1
          }.`
        );
        return;
      }

      if (
        seenProducts.has(
          line.productId
        )
      ) {
        setFormError(
          "A product cannot appear more than once on the same purchase order."
        );
        return;
      }

      seenProducts.add(
        line.productId
      );

      const quantity =
        Number(
          line.orderedQuantity
        );

      const unitCost =
        Number(
          line.unitCost
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        setFormError(
          `Ordered quantity must be greater than zero on line ${
            index + 1
          }.`
        );
        return;
      }

      if (
        !Number.isFinite(
          unitCost
        ) ||
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
        productId:
          line.productId,
        orderedQuantity:
          quantity,
        unitCost,
      });
    }

    try {
      setSaving(true);
      setFormError(null);

      const request: PurchaseOrderCreateRequest =
        {
          companyId,
          supplierId,
          orderNumber:
            orderNumber.trim(),
          orderDate,
          notes:
            notes.trim() ||
            null,
          lines: parsedLines,
        };

      const created =
        await createPurchaseOrder(
          request
        );

      setPurchaseOrders(
        (current) => [
          created,
          ...current,
        ]
      );

      setShowCreateForm(false);
      resetForm();

      setToast({
        type: "success",
        message:
          "Purchase order created successfully.",
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create purchase order."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openOrder(
    order: PurchaseOrder
  ) {
    if (!companyId) {
      return;
    }

    try {
      const freshOrder =
        await getPurchaseOrders(
          companyId
        );

      const found =
        freshOrder.find(
          (item) =>
            item.id === order.id
        );

      setSelectedOrder(
        found ?? order
      );
      setShowView(true);
    } catch {
      setSelectedOrder(
        order
      );
      setShowView(true);
    }
  }

  function closeView() {
    setShowView(false);
    setSelectedOrder(
      null
    );
  }

  function openActionDialog(
    type:
      | "submit"
      | "approve",
    order: PurchaseOrder
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

  async function confirmAction() {
    if (
      !companyId ||
      !dialogType ||
      !dialogOrder
    ) {
      return;
    }

    if (
      dialogType ===
        "submit" &&
      !canCreate
    ) {
      setToast({
        type: "error",
        message:
          "You do not have permission to submit purchase orders.",
      });
      return;
    }

    if (
      dialogType ===
        "approve" &&
      !canApprove
    ) {
      setToast({
        type: "error",
        message:
          "You do not have permission to approve purchase orders.",
      });
      return;
    }

    try {
      setActionLoading(true);

      let updated:
        | PurchaseOrder;

      if (
        dialogType ===
        "submit"
      ) {
        updated =
          await submitPurchaseOrder(
            companyId,
            dialogOrder.id
          );
      } else {
        updated =
          await approvePurchaseOrder(
            companyId,
            dialogOrder.id
          );
      }

      setPurchaseOrders(
        (current) =>
          current.map(
            (order) =>
              order.id ===
              updated.id
                ? updated
                : order
          )
      );

      setSelectedOrder(
        (current) =>
          current?.id ===
          updated.id
            ? updated
            : current
      );

      setToast({
        type: "success",
        message:
          dialogType ===
          "submit"
            ? "Purchase order submitted successfully."
            : "Purchase order approved successfully.",
      });

      closeActionDialog();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "The purchase order action failed.",
      });
    } finally {
      setActionLoading(false);
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
              Please sign in again to access purchasing.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!canCreate) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
              <AlertIcon />
            </div>

            <h1 className="mt-4 text-lg font-semibold text-ink">
              Access denied
            </h1>

            <p className="mt-2 text-sm text-ink-muted">
              Your account does not have permission to access purchasing.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-full bg-canvas">
        <div className="border-b border-line bg-surface">
          <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-ink">
                Purchasing
              </h1>

              <p className="mt-1 text-sm text-ink-muted">
                Create, submit, and approve purchase orders.
              </p>
            </div>

            <button
              type="button"
              onClick={
                openCreateForm
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              <PlusIcon />
              New Purchase Order
            </button>
          </div>
        </div>

        <div className="p-6">
          {toast && (
            <div
              className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                toast.type ===
                "success"
                  ? "border-success/20 bg-success/10 text-success"
                  : "border-danger/20 bg-danger/10 text-danger"
              }`}
            >
              {toast.type ===
              "success" ? (
                <CheckIcon />
              ) : (
                <AlertIcon />
              )}

              <span className="flex-1">
                {toast.message}
              </span>

              <button
                type="button"
                onClick={() =>
                  setToast(null)
                }
                className="opacity-70 hover:opacity-100"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertIcon />

              <span className="flex-1">
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  void loadData()
                }
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Total Orders
              </div>

              <div className="mt-2 text-2xl font-semibold text-ink">
                {purchaseOrders.length}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Draft
              </div>

              <div className="mt-2 text-2xl font-semibold text-ink">
                {draftCount}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Awaiting Approval
              </div>

              <div className="mt-2 text-2xl font-semibold text-ink">
                {submittedCount}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Approved
              </div>

              <div className="mt-2 text-2xl font-semibold text-ink">
                {approvedCount}
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <SearchIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search order number or supplier..."
                  className="w-full rounded-lg border border-line bg-surface px-10 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <select
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as PurchaseOrderStatus | ""
                  )
                }
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                {statusOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>

              <select
                value={
                  supplierFilter
                }
                onChange={(event) =>
                  setSupplierFilter(
                    event.target
                      .value
                  )
                }
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">
                  All suppliers
                </option>

                {suppliers.map(
                  (supplier) => (
                    <option
                      key={
                        supplier.id
                      }
                      value={
                        supplier.id
                      }
                    >
                      {
                        supplier.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Purchase Orders
                </h2>

                <p className="mt-1 text-xs text-ink-muted">
                  {filteredOrders.length} orders
                  {" · "}
                  Total value $
                  {formatCurrency(
                    totalValue
                  )}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="px-5 py-12 text-center text-sm text-ink-muted">
                Loading purchase orders...
              </div>
            ) : filteredOrders.length ===
              0 ? (
              <div className="px-5 py-16 text-center">
                <div className="text-sm font-semibold text-ink">
                  No purchase orders found
                </div>

                <p className="mt-1 text-sm text-ink-muted">
                  Create your first purchase order to get started.
                </p>

                <button
                  type="button"
                  onClick={
                    openCreateForm
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  <PlusIcon />
                  New Purchase Order
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                      <th className="px-5 py-3 font-semibold">
                        Order
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        Supplier
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        Date
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        Lines
                      </th>

                      <th className="px-5 py-3 text-right font-semibold">
                        Total
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map(
                      (order) => {
                        const supplier =
                          supplierMap.get(
                            order.supplierId
                          );

                        return (
                          <tr
                            key={
                              order.id
                            }
                            className="border-b border-line last:border-0 hover:bg-surface-hover"
                          >
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  void openOrder(
                                    order
                                  )
                                }
                                className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                              >
                                {
                                  order.orderNumber
                                }
                              </button>
                            </td>

                            <td className="px-5 py-4 text-sm text-ink-secondary">
                              {supplier?.name ??
                                "Unknown supplier"}
                            </td>

                            <td className="px-5 py-4 text-sm text-ink-secondary">
                              {formatDate(
                                order.orderDate
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm text-ink-secondary">
                              {
                                order.lines
                                  .length
                              }
                            </td>

                            <td className="px-5 py-4 text-right text-sm font-medium text-ink">
                              $
                              {formatCurrency(
                                order.totalAmount
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                  order.status
                                )}`}
                              >
                                {formatStatus(
                                  order.status
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                {order.status ===
                                  "DRAFT" &&
                                  canCreate && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openActionDialog(
                                          "submit",
                                          order
                                        )
                                      }
                                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-secondary transition hover:bg-surface-hover"
                                    >
                                      Submit
                                    </button>
                                  )}

                                {order.status ===
                                  "SUBMITTED" &&
                                  canApprove && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openActionDialog(
                                          "approve",
                                          order
                                        )
                                      }
                                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
                                    >
                                      Approve
                                    </button>
                                  )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    void openOrder(
                                      order
                                    )
                                  }
                                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-secondary transition hover:bg-surface-hover"
                                >
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
            )}
          </div>
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
            <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    New Purchase Order
                  </h2>

                  <p className="mt-1 text-xs text-ink-muted">
                    Create a draft purchase order for an active supplier.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeCreateForm
                  }
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-active hover:text-ink disabled:cursor-not-allowed"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>

              <form
                onSubmit={
                  handleCreate
                }
              >
                <div className="space-y-7 px-6 py-6">
                  {formError && (
                    <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                      <AlertIcon />

                      <span>
                        {formError}
                      </span>
                    </div>
                  )}

                  <section>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Order Information
                    </p>

                    <div className="grid gap-5 md:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                          Order Number{" "}
                          <span className="text-danger">
                            *
                          </span>
                        </label>

                        <input
                          type="text"
                          required
                          maxLength={100}
                          value={
                            orderNumber
                          }
                          onChange={(
                            event
                          ) =>
                            setOrderNumber(
                              event.target
                                .value
                            )
                          }
                          placeholder="PO-1001"
                          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                          Supplier{" "}
                          <span className="text-danger">
                            *
                          </span>
                        </label>

                        <select
                          required
                          value={
                            supplierId
                          }
                          onChange={(
                            event
                          ) =>
                            setSupplierId(
                              event.target
                                .value
                            )
                          }
                          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                        >
                          <option value="">
                            Select supplier
                          </option>

                          {activeSuppliers.map(
                            (
                              supplier
                            ) => (
                              <option
                                key={
                                  supplier.id
                                }
                                value={
                                  supplier.id
                                }
                              >
                                {
                                  supplier.name
                                }{" "}
                                (
                                {
                                  supplier.supplierCode
                                }
                                )
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                          Order Date{" "}
                          <span className="text-danger">
                            *
                          </span>
                        </label>

                        <input
                          type="date"
                          required
                          value={
                            orderDate
                          }
                          onChange={(
                            event
                          ) =>
                            setOrderDate(
                              event.target
                                .value
                            )
                          }
                          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                        Notes
                      </label>

                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={notes}
                        onChange={(
                          event
                        ) =>
                          setNotes(
                            event.target
                              .value
                          )
                        }
                        placeholder="Optional purchasing notes..."
                        className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                      />
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Order Lines
                        </p>

                        <p className="mt-1 text-xs text-ink-muted">
                          Add each product once with its ordered quantity and unit cost.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addLine
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-secondary hover:bg-surface-hover"
                      >
                        <PlusIcon />
                        Add Line
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-line">
                      <table className="w-full min-w-[760px] text-left">
                        <thead>
                          <tr className="border-b border-line bg-surface-active text-xs uppercase tracking-wide text-ink-muted">
                            <th className="px-4 py-3 font-semibold">
                              Product
                            </th>

                            <th className="px-4 py-3 font-semibold">
                              Quantity
                            </th>

                            <th className="px-4 py-3 font-semibold">
                              Unit Cost
                            </th>

                            <th className="px-4 py-3 text-right font-semibold">
                              Line Total
                            </th>

                            <th className="px-4 py-3" />
                          </tr>
                        </thead>

                        <tbody>
                          {lines.map(
                            (
                              line,
                              index
                            ) => {
                              const quantity =
                                Number(
                                  line.orderedQuantity
                                );

                              const unitCost =
                                Number(
                                  line.unitCost
                                );

                              const lineTotal =
                                Number.isFinite(
                                  quantity
                                ) &&
                                Number.isFinite(
                                  unitCost
                                )
                                  ? quantity *
                                    unitCost
                                  : 0;

                              return (
                                <tr
                                  key={
                                    index
                                  }
                                  className="border-b border-line last:border-0"
                                >
                                  <td className="px-4 py-3">
                                    <select
                                      value={
                                        line.productId
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateLine(
                                          index,
                                          "productId",
                                          event.target
                                            .value
                                        )
                                      }
                                      className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                    >
                                      <option value="">
                                        Select product
                                      </option>

                                      {activeProducts.map(
                                        (
                                          product
                                        ) => (
                                          <option
                                            key={
                                              product.id
                                            }
                                            value={
                                              product.id
                                            }
                                          >
                                            {
                                              product.sku
                                            }{" "}
                                            —{" "}
                                            {
                                              product.name
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </td>

                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      min="0.0001"
                                      step="0.0001"
                                      value={
                                        line.orderedQuantity
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateLine(
                                          index,
                                          "orderedQuantity",
                                          event.target
                                            .value
                                        )
                                      }
                                      placeholder="0"
                                      className="w-32 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                    />
                                  </td>

                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.0001"
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
                                      placeholder="0.00"
                                      className="w-32 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                    />
                                  </td>

                                  <td className="px-4 py-3 text-right text-sm font-medium text-ink">
                                    $
                                    {formatCurrency(
                                      lineTotal
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-right">
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
                                      className="rounded-lg px-2 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
                    <button
                      type="button"
                      onClick={
                        closeCreateForm
                      }
                      disabled={
                        saving
                      }
                      className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        saving
                      }
                      className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? "Creating..."
                        : "Create Purchase Order"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {showView &&
          selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
              <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-ink">
                        {
                          selectedOrder.orderNumber
                        }
                      </h2>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                          selectedOrder.status
                        )}`}
                      >
                        {formatStatus(
                          selectedOrder.status
                        )}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-ink-muted">
                      Purchase order details
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeView
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-active hover:text-ink"
                    aria-label="Close"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="space-y-6 px-6 py-6">
                  <div className="grid gap-5 md:grid-cols-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Supplier
                      </div>

                      <div className="mt-1 text-sm font-medium text-ink">
                        {supplierMap.get(
                          selectedOrder.supplierId
                        )?.name ??
                          "Unknown supplier"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Order Date
                      </div>

                      <div className="mt-1 text-sm font-medium text-ink">
                        {formatDate(
                          selectedOrder.orderDate
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Total
                      </div>

                      <div className="mt-1 text-sm font-semibold text-ink">
                        $
                        {formatCurrency(
                          selectedOrder.totalAmount
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div className="rounded-xl border border-line bg-surface-active p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Notes
                      </div>

                      <div className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary">
                        {
                          selectedOrder.notes
                        }
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Order Lines
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-line">
                      <table className="w-full min-w-[700px] text-left">
                        <thead>
                          <tr className="border-b border-line bg-surface-active text-xs uppercase tracking-wide text-ink-muted">
                            <th className="px-4 py-3 font-semibold">
                              Product
                            </th>

                            <th className="px-4 py-3 text-right font-semibold">
                              Quantity
                            </th>

                            <th className="px-4 py-3 text-right font-semibold">
                              Unit Cost
                            </th>

                            <th className="px-4 py-3 text-right font-semibold">
                              Total
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedOrder.lines.map(
                            (
                              line
                            ) => {
                              const product =
                                productMap.get(
                                  line.productId
                                );

                              return (
                                <tr
                                  key={
                                    line.id
                                  }
                                  className="border-b border-line last:border-0"
                                >
                                  <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-ink">
                                      {
                                        product?.name ??
                                        "Unknown product"
                                      }
                                    </div>

                                    <div className="mt-0.5 text-xs text-ink-muted">
                                      {
                                        product?.sku ??
                                        line.productId
                                      }
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 text-right text-sm text-ink-secondary">
                                    {line.orderedQuantity.toLocaleString(
                                      undefined,
                                      {
                                        maximumFractionDigits: 4,
                                      }
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-right text-sm text-ink-secondary">
                                    $
                                    {formatCurrency(
                                      line.unitCost
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-right text-sm font-medium text-ink">
                                    $
                                    {formatCurrency(
                                      line.lineTotal
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>

                        <tfoot>
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-4 text-right text-sm font-semibold text-ink"
                            >
                              Grand Total
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-bold text-ink">
                              $
                              {formatCurrency(
                                selectedOrder.totalAmount
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-line pt-5">
                    {selectedOrder.status ===
                      "DRAFT" &&
                      canCreate && (
                        <button
                          type="button"
                          onClick={() =>
                            openActionDialog(
                              "submit",
                              selectedOrder
                            )
                          }
                          className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover"
                        >
                          Submit for Approval
                        </button>
                      )}

                    {selectedOrder.status ===
                      "SUBMITTED" &&
                      canApprove && (
                        <button
                          type="button"
                          onClick={() =>
                            openActionDialog(
                              "approve",
                              selectedOrder
                            )
                          }
                          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                        >
                          Approve Purchase Order
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={
                        closeView
                      }
                      className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {dialogType &&
          dialogOrder && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
              <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
                <h2 className="text-lg font-semibold text-ink">
                  {dialogType ===
                  "submit"
                    ? "Submit Purchase Order?"
                    : "Approve Purchase Order?"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {dialogType ===
                  "submit"
                    ? `This will submit ${dialogOrder.orderNumber} for approval.`
                    : `This will approve ${dialogOrder.orderNumber} and move it into the approved purchasing workflow.`}
                </p>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={
                      closeActionDialog
                    }
                    disabled={
                      actionLoading
                    }
                    className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      confirmAction
                    }
                    disabled={
                      actionLoading
                    }
                    className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading
                      ? "Processing..."
                      : dialogType ===
                        "submit"
                      ? "Submit"
                      : "Approve"}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </AppShell>
  );
}