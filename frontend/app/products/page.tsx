"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  activateProduct,
  createProduct,
  deactivateProduct,
  getProduct,
  getProducts,
  Product,
  ProductCreateRequest,
  updateProduct,
} from "@/lib/api";

const COMPANY_ID = "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

const UNIT_OF_MEASURE_ID =
  "a938839d-ca27-4a60-b25b-038a41b34236";

const initialForm: ProductCreateRequest = {
  companyId: COMPANY_ID,
  categoryId: null,
  unitOfMeasureId: UNIT_OF_MEASURE_ID,
  sku: "",
  name: "",
  description: "",
  barcode: "",
  costPrice: null,
  sellingPrice: null,
  active: true,
};

type DialogType =
  | "deactivate"
  | "activate"
  | "success"
  | "error"
  | null;

type ActionType =
  | "view"
  | "edit"
  | "activate"
  | "deactivate";

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2v10" />
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function IconButton({
  label,
  onClick,
  children,
  danger = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        disabled={disabled}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${
          danger
            ? "border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        {children}
      </button>

      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [showEditForm, setShowEditForm] =
    useState(false);

  const [form, setForm] =
    useState<ProductCreateRequest>(initialForm);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  const [dialogType, setDialogType] =
    useState<DialogType>(null);

  const [dialogProduct, setDialogProduct] =
    useState<Product | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

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

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);

      const data = await getProducts(COMPANY_ID);

      setProducts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        product.sku
          .toLowerCase()
          .includes(normalizedSearch) ||
        (product.barcode ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        (statusFilter === "Active" &&
          product.active) ||
        (statusFilter === "Inactive" &&
          !product.active);

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  function updateForm(
    field: keyof ProductCreateRequest,
    value: string | boolean | number | null
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateForm() {
    setForm({ ...initialForm });
    setFormError(null);
    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (saving) {
      return;
    }

    setShowCreateForm(false);
    setFormError(null);
    setForm({ ...initialForm });
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);

    setForm({
      companyId: product.companyId,
      categoryId: product.categoryId,
      unitOfMeasureId: product.unitOfMeasureId,
      sku: product.sku,
      name: product.name,
      description: product.description,
      barcode: product.barcode,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      active: product.active,
    });

    setFormError(null);
    setShowEditForm(true);
  }

  function closeEditForm() {
    if (saving) {
      return;
    }

    setShowEditForm(false);
    setEditingProduct(null);
    setFormError(null);
    setForm({ ...initialForm });
  }

  async function handleCreateProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.sku.trim() || !form.name.trim()) {
      setFormError(
        "SKU and Product Name are required."
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const request: ProductCreateRequest = {
        companyId: COMPANY_ID,
        categoryId: form.categoryId,
        unitOfMeasureId: UNIT_OF_MEASURE_ID,
        sku: form.sku.trim(),
        name: form.name.trim(),
        description:
          form.description?.trim() || null,
        barcode:
          form.barcode?.trim() || null,
        costPrice:
          form.costPrice === null ||
          form.costPrice === undefined
            ? null
            : Number(form.costPrice),
        sellingPrice:
          form.sellingPrice === null ||
          form.sellingPrice === undefined
            ? null
            : Number(form.sellingPrice),
        active: form.active,
      };

      await createProduct(request);

      await loadProducts();

      closeCreateForm();

      setToast({
        type: "success",
        message: "Product created successfully.",
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    if (!form.sku.trim() || !form.name.trim()) {
      setFormError(
        "SKU and Product Name are required."
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const request: ProductCreateRequest = {
        companyId: COMPANY_ID,
        categoryId: form.categoryId,
        unitOfMeasureId:
          editingProduct.unitOfMeasureId,
        sku: form.sku.trim(),
        name: form.name.trim(),
        description:
          form.description?.trim() || null,
        barcode:
          form.barcode?.trim() || null,
        costPrice:
          form.costPrice === null ||
          form.costPrice === undefined
            ? null
            : Number(form.costPrice),
        sellingPrice:
          form.sellingPrice === null ||
          form.sellingPrice === undefined
            ? null
            : Number(form.sellingPrice),
        active: form.active,
      };

      await updateProduct(
        COMPANY_ID,
        editingProduct.id,
        request
      );

      await loadProducts();

      closeEditForm();

      setToast({
        type: "success",
        message: "Product updated successfully.",
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  function openStatusDialog(product: Product) {
    setDialogProduct(product);

    setDialogType(
      product.active
        ? "deactivate"
        : "activate"
    );
  }

  function closeDialog() {
    if (actionLoading) {
      return;
    }

    setDialogType(null);
    setDialogProduct(null);
  }

  async function confirmStatusChange() {
    if (!dialogProduct || !dialogType) {
      return;
    }

    setActionLoading(true);

    try {
      if (dialogType === "deactivate") {
        await deactivateProduct(
          COMPANY_ID,
          dialogProduct.id
        );

        setProducts((current) =>
          current.map((product) =>
            product.id === dialogProduct.id
              ? {
                  ...product,
                  active: false,
                }
              : product
          )
        );

        setToast({
          type: "success",
          message: `${dialogProduct.name} has been deactivated.`,
        });
      } else if (dialogType === "activate") {
        const updatedProduct =
          await activateProduct(
            COMPANY_ID,
            dialogProduct
          );

        setProducts((current) =>
          current.map((product) =>
            product.id === updatedProduct.id
              ? updatedProduct
              : product
          )
        );

        setToast({
          type: "success",
          message: `${dialogProduct.name} has been activated.`,
        });
      }

      closeDialog();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "The product status could not be changed.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function renderProductForm(
    mode: "create" | "edit"
  ) {
    const isEdit = mode === "edit";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
        <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {isEdit
                  ? "Edit Product"
                  : "New Product"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {isEdit
                  ? "Update the product master information."
                  : "Create a product in the NextWare product master."}
              </p>
            </div>

            <button
              type="button"
              onClick={
                isEdit
                  ? closeEditForm
                  : closeCreateForm
              }
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          <form
            onSubmit={
              isEdit
                ? handleUpdateProduct
                : handleCreateProduct
            }
          >
            <div className="grid gap-5 px-6 py-6 md:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  SKU{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  maxLength={100}
                  value={form.sku}
                  onChange={(event) =>
                    updateForm(
                      "sku",
                      event.target.value
                    )
                  }
                  placeholder="e.g. NW-002"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Product Name{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  maxLength={255}
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Product name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  rows={3}
                  value={form.description ?? ""}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Optional product description"
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Barcode
                </label>

                <input
                  type="text"
                  maxLength={100}
                  value={form.barcode ?? ""}
                  onChange={(event) =>
                    updateForm(
                      "barcode",
                      event.target.value
                    )
                  }
                  placeholder="Optional barcode"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Unit of Measure
                </label>

                <input
                  type="text"
                  value="EA — Each"
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Cost Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice ?? ""}
                  onChange={(event) =>
                    updateForm(
                      "costPrice",
                      event.target.value === ""
                        ? null
                        : Number(
                            event.target.value
                          )
                    )
                  }
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Selling Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellingPrice ?? ""}
                  onChange={(event) =>
                    updateForm(
                      "sellingPrice",
                      event.target.value === ""
                        ? null
                        : Number(
                            event.target.value
                          )
                    )
                  }
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateForm(
                      "active",
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-700">
                    Active product
                  </span>

                  <span className="block text-xs text-slate-400">
                    Active products can be used in
                    future transactions.
                  </span>
                </span>
              </label>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 md:col-span-2">
                  <div className="flex gap-3">
                    <div className="mt-0.5 text-red-600">
                      <AlertIcon />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        Unable to save product
                      </p>

                      <p className="mt-1 text-xs leading-5 text-red-600">
                        {formError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={
                  isEdit
                    ? closeEditForm
                    : closeCreateForm
                }
                disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                  ? "Save Changes"
                  : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">

        {/* HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-400">
              Master Data / Products
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage products, SKUs, categories,
              units, pricing, and product status.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <PlusIcon />
            New Product
          </button>
        </div>

        {/* FILTERS */}
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row">
          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by product name, SKU, or barcode..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-slate-400"
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Product Catalog
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {loading
                  ? "Loading products..."
                  : `${filteredProducts.length} products`}
              </p>
            </div>

            {!loading && !error && (
              <button
                type="button"
                onClick={loadProducts}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Refresh
              </button>
            )}
          </div>

          {loading && (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />

              <p className="mt-4 text-sm text-slate-500">
                Loading products from NextWare...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertIcon />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-800">
                Unable to load products
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={loadProducts}
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-400">
                    <th className="px-5 py-3 font-medium">
                      SKU
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Product
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Category
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Unit
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Selling Price
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-16 text-center"
                      >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <SearchIcon />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-slate-700">
                          No products found
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Try changing your search or
                          status filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(
                      (product) => (
                        <tr
                          key={product.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                            {product.sku}
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm font-medium text-slate-800">
                              {product.name}
                            </div>

                            {product.description && (
                              <div className="mt-1 max-w-md truncate text-xs text-slate-400">
                                {product.description}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {product.categoryId ??
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            EA
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-medium text-slate-800">
                            {product.sellingPrice !==
                            null
                              ? `$${product.sellingPrice.toFixed(
                                  2
                                )}`
                              : "—"}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={
                                product.active
                                  ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                  : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                              }
                            >
                              {product.active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          {/* ACTION ICONS */}
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">

                              <IconButton
                                label="View product"
                                onClick={() =>
                                  router.push(
                                    `/products/view?id=${encodeURIComponent(
                                      product.id
                                    )}`
                                  )
                                }
                              >
                                <EyeIcon />
                              </IconButton>

                              <IconButton
                                label="Edit product"
                                onClick={() =>
                                  openEditForm(
                                    product
                                  )
                                }
                              >
                                <EditIcon />
                              </IconButton>

                              {product.active ? (
                                <IconButton
                                  label="Deactivate product"
                                  danger
                                  onClick={() =>
                                    openStatusDialog(
                                      product
                                    )
                                  }
                                >
                                  <TrashIcon />
                                </IconButton>
                              ) : (
                                <IconButton
                                  label="Activate product"
                                  onClick={() =>
                                    openStatusDialog(
                                      product
                                    )
                                  }
                                >
                                  <PowerIcon />
                                </IconButton>
                              )}

                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
              <p className="text-xs text-slate-400">
                Showing{" "}
                {filteredProducts.length} of{" "}
                {products.length} products
              </p>

              <p className="text-xs text-slate-400">
                {products.filter(
                  (product) => product.active
                ).length}{" "}
                active
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateForm &&
        renderProductForm("create")}

      {/* EDIT MODAL */}
      {showEditForm &&
        renderProductForm("edit")}

      {/* STATUS CONFIRMATION DIALOG */}
      {dialogType &&
        dialogType !== "success" &&
        dialogType !== "error" &&
        dialogProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">

              <div className="p-6">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    dialogType === "deactivate"
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {dialogType ===
                  "deactivate" ? (
                    <TrashIcon />
                  ) : (
                    <PowerIcon />
                  )}
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {dialogType ===
                  "deactivate"
                    ? "Deactivate product?"
                    : "Activate product?"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {dialogType ===
                  "deactivate"
                    ? `Are you sure you want to deactivate "${dialogProduct.name}"? The product will remain in the product master, but it will be marked inactive.`
                    : `Are you sure you want to activate "${dialogProduct.name}"? It will become available as an active product again.`}
                </p>

                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-slate-400">
                      SKU
                    </span>

                    <span className="font-semibold text-slate-700">
                      {dialogProduct.sku}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={actionLoading}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    confirmStatusChange
                  }
                  disabled={actionLoading}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    dialogType ===
                    "deactivate"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {actionLoading
                    ? "Processing..."
                    : dialogType ===
                      "deactivate"
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80] w-[calc(100%-3rem)] max-w-sm">
          <div
            className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${
              toast.type === "success"
                ? "border-emerald-200"
                : "border-red-200"
            }`}
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {toast.type ===
              "success" ? (
                <CheckIcon />
              ) : (
                <AlertIcon />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">
                {toast.type ===
                "success"
                  ? "Success"
                  : "Something went wrong"}
              </p>

              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setToast(null)
              }
              className="text-slate-400 hover:text-slate-700"
              aria-label="Close notification"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}