"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
AlertIcon,
CheckIcon,
CloseIcon,
EditIcon,
EyeIcon,
PlusIcon,
PowerIcon,
SearchIcon,
TrashIcon,
} from "@/components/ui/icons";
import {
activateProduct,
Category,
createProduct,
deactivateProduct,
getCategories,
getProducts,
getUnitsOfMeasure,
Product,
ProductCreateRequest,
UnitOfMeasure,
updateProduct,
} from "@/lib/api";
import { getCurrentCompanyId, hasPermission } from "@/lib/auth";

type DialogType = "deactivate" | "activate" | null;

export default function ProductsPage() {
const router = useRouter();

const companyId = getCurrentCompanyId();
const canView = hasPermission("PRODUCT_VIEW");
const canCreate = hasPermission("PRODUCT_CREATE");
const canUpdate = hasPermission("PRODUCT_UPDATE");
const canDelete = hasPermission("PRODUCT_DELETE");

const [products, setProducts] = useState<Product[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [units, setUnits] = useState<UnitOfMeasure[]>([]);

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All Statuses");

const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const [showCreateForm, setShowCreateForm] = useState(false);
const [showEditForm, setShowEditForm] = useState(false);

const [form, setForm] = useState<ProductCreateRequest>({
companyId: companyId ?? "",
categoryId: null,
unitOfMeasureId: "",
sku: "",
name: "",
description: "",
barcode: "",
costPrice: null,
sellingPrice: null,
active: true,
});

const [editingProduct, setEditingProduct] = useState<Product | null>(null);

const [saving, setSaving] = useState(false);
const [formError, setFormError] = useState<string | null>(null);

const [dialogType, setDialogType] = useState<DialogType>(null);
const [dialogProduct, setDialogProduct] = useState<Product | null>(null);
const [actionLoading, setActionLoading] = useState(false);

const [toast, setToast] = useState<{
type: "success" | "error";
message: string;
} | null>(null);

useEffect(() => {
  if (!canView || !companyId) {
    return;
  }

  loadAll();
}, [canView, companyId]);
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

async function loadAll() {
if (!companyId || !canView) {
return;
}


try {
  setLoading(true);
  setError(null);

  const [productData, categoryData, unitData] = await Promise.all([
    getProducts(companyId),
    getCategories(companyId),
    getUnitsOfMeasure(companyId),
  ]);

  setProducts(productData);
  setCategories(categoryData);
  setUnits(unitData);
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Failed to load products."
  );
} finally {
  setLoading(false);
}


}

async function loadProducts() {
if (!companyId || !canView) {
return;
}


try {
  setLoading(true);
  setError(null);

  const data = await getProducts(companyId);

  setProducts(data);
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Failed to load products."
  );
} finally {
  setLoading(false);
}


}

const categoryMap = useMemo(() => {
return new Map(categories.map((category) => [category.id, category]));
}, [categories]);

const unitMap = useMemo(() => {
return new Map(units.map((unit) => [unit.id, unit]));
}, [units]);

const filteredProducts = useMemo(() => {
const normalizedSearch = search.trim().toLowerCase();


return products.filter((product) => {
  const matchesSearch =
    normalizedSearch.length === 0 ||
    product.name.toLowerCase().includes(normalizedSearch) ||
    product.sku.toLowerCase().includes(normalizedSearch) ||
    (product.barcode ?? "").toLowerCase().includes(normalizedSearch);

  const matchesStatus =
    statusFilter === "All Statuses" ||
    (statusFilter === "Active" && product.active) ||
    (statusFilter === "Inactive" && !product.active);

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
if (!canCreate || !companyId) {
return;
}


setForm({
  companyId,
  categoryId: null,
  unitOfMeasureId: units[0]?.id ?? "",
  sku: "",
  name: "",
  description: "",
  barcode: "",
  costPrice: null,
  sellingPrice: null,
  active: true,
});

setFormError(null);
setShowCreateForm(true);


}

function closeCreateForm() {
if (saving) {
return;
}


setShowCreateForm(false);
setFormError(null);

setForm({
  companyId: companyId ?? "",
  categoryId: null,
  unitOfMeasureId: "",
  sku: "",
  name: "",
  description: "",
  barcode: "",
  costPrice: null,
  sellingPrice: null,
  active: true,
});


}

function openEditForm(product: Product) {
if (!canUpdate || !companyId) {
return;
}


setEditingProduct(product);

setForm({
  companyId,
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

setForm({
  companyId: companyId ?? "",
  categoryId: null,
  unitOfMeasureId: "",
  sku: "",
  name: "",
  description: "",
  barcode: "",
  costPrice: null,
  sellingPrice: null,
  active: true,
});


}

async function handleCreateProduct(
event: React.FormEvent<HTMLFormElement>
) {
event.preventDefault();


if (!canCreate) {
  setFormError("You do not have permission to create products.");
  return;
}

if (!companyId) {
  setFormError("No authenticated company context is available.");
  return;
}

if (!form.sku.trim() || !form.name.trim()) {
  setFormError("SKU and Product Name are required.");
  return;
}

if (!form.unitOfMeasureId) {
  setFormError("Unit of Measure is required.");
  return;
}

setSaving(true);
setFormError(null);

try {
  const request: ProductCreateRequest = {
    companyId,
    categoryId: form.categoryId || null,
    unitOfMeasureId: form.unitOfMeasureId,
    sku: form.sku.trim(),
    name: form.name.trim(),
    description: form.description?.trim() || null,
    barcode: form.barcode?.trim() || null,
    costPrice:
      form.costPrice === null || form.costPrice === undefined
        ? null
        : Number(form.costPrice),
    sellingPrice:
      form.sellingPrice === null || form.sellingPrice === undefined
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
    err instanceof Error ? err.message : "Failed to create product."
  );
} finally {
  setSaving(false);
}


}

async function handleUpdateProduct(
event: React.FormEvent<HTMLFormElement>
) {
event.preventDefault();


if (!canUpdate) {
  setFormError("You do not have permission to update products.");
  return;
}

if (!companyId) {
  setFormError("No authenticated company context is available.");
  return;
}

if (!editingProduct) {
  return;
}

if (!form.sku.trim() || !form.name.trim()) {
  setFormError("SKU and Product Name are required.");
  return;
}

if (!form.unitOfMeasureId) {
  setFormError("Unit of Measure is required.");
  return;
}

setSaving(true);
setFormError(null);

try {
  const request: ProductCreateRequest = {
    companyId,
    categoryId: form.categoryId || null,
    unitOfMeasureId: form.unitOfMeasureId,
    sku: form.sku.trim(),
    name: form.name.trim(),
    description: form.description?.trim() || null,
    barcode: form.barcode?.trim() || null,
    costPrice:
      form.costPrice === null || form.costPrice === undefined
        ? null
        : Number(form.costPrice),
    sellingPrice:
      form.sellingPrice === null || form.sellingPrice === undefined
        ? null
        : Number(form.sellingPrice),
    active: form.active,
  };

  await updateProduct(companyId, editingProduct.id, request);

  await loadProducts();

  closeEditForm();

  setToast({
    type: "success",
    message: "Product updated successfully.",
  });
} catch (err) {
  setFormError(
    err instanceof Error ? err.message : "Failed to update product."
  );
} finally {
  setSaving(false);
}


}

function openStatusDialog(product: Product) {
if (!canDelete) {
return;
}


setDialogProduct(product);
setDialogType(product.active ? "deactivate" : "activate");


}

function closeDialog() {
if (actionLoading) {
return;
}


setDialogType(null);
setDialogProduct(null);


}

async function confirmStatusChange() {
if (!canDelete) {
setToast({
type: "error",
message: "You do not have permission to change product status.",
});
return;
}


if (!companyId || !dialogProduct || !dialogType) {
  return;
}

setActionLoading(true);

try {
  if (dialogType === "deactivate") {
    await deactivateProduct(companyId, dialogProduct.id);

    setProducts((current) =>
      current.map((product) =>
        product.id === dialogProduct.id
          ? { ...product, active: false }
          : product
      )
    );

    setToast({
      type: "success",
      message: `${dialogProduct.name} has been deactivated.`,
    });
  } else if (dialogType === "activate") {
    const updatedProduct = await activateProduct(
      companyId,
      dialogProduct
    );

    setProducts((current) =>
      current.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
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

function renderProductForm(mode: "create" | "edit") {
const isEdit = mode === "edit";


return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            {isEdit ? "Edit Product" : "New Product"}
          </h2>

          <p className="mt-1 text-xs text-ink-muted">
            {isEdit
              ? "Update the product master information."
              : "Create a product in the NextWare product master."}
          </p>
        </div>

        <button
          type="button"
          onClick={isEdit ? closeEditForm : closeCreateForm}
          disabled={saving}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-active hover:text-ink-secondary disabled:cursor-not-allowed"
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      <form onSubmit={isEdit ? handleUpdateProduct : handleCreateProduct}>
        <div className="px-6 py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Basic Information
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                SKU <span className="text-danger">*</span>
              </label>

              <input
                type="text"
                required
                maxLength={100}
                value={form.sku}
                onChange={(event) =>
                  updateForm("sku", event.target.value)
                }
                placeholder="e.g. NW-002"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                Product Name <span className="text-danger">*</span>
              </label>

              <input
                type="text"
                required
                maxLength={255}
                value={form.name}
                onChange={(event) =>
                  updateForm("name", event.target.value)
                }
                placeholder="Product name"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                Description
              </label>

              <textarea
                rows={3}
                value={form.description ?? ""}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Optional product description"
                className="w-full resize-none rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                Barcode
              </label>

              <input
                type="text"
                maxLength={100}
                value={form.barcode ?? ""}
                onChange={(event) =>
                  updateForm("barcode", event.target.value)
                }
                placeholder="Optional barcode"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <p className="mb-3 mt-7 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Classification
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                Category
              </label>

              <select
                value={form.categoryId ?? ""}
                onChange={(event) =>
                  updateForm("categoryId", event.target.value || null)
                }
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                Unit of Measure <span className="text-danger">*</span>
              </label>

              <select
                required
                value={form.unitOfMeasureId}
                onChange={(event) =>
                  updateForm("unitOfMeasureId", event.target.value)
                }
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="" disabled>
                  Select a unit
                </option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} — {unit.name}
                  </option>
                ))}
              </select>

              {units.length === 0 && (
                <p className="mt-1.5 text-xs text-warning">
                  No units of measure exist yet for this company.
                </p>
              )}
            </div>
          </div>

          <p className="mb-3 mt-7 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Pricing
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
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
                      : Number(event.target.value)
                  )
                }
                placeholder="0.00"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
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
                      : Number(event.target.value)
                  )
                }
                placeholder="0.00"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-line bg-surface-hover px-4 py-3 md:col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  updateForm("active", event.target.checked)
                }
                className="h-4 w-4 rounded border-line-strong text-primary-600 focus:ring-primary-200"
              />

              <span>
                <span className="block text-sm font-medium text-ink-secondary">
                  Active product
                </span>

                <span className="block text-xs text-ink-muted">
                  Active products can be used in future transactions.
                </span>
              </span>
            </label>
          </div>

          {formError && (
            <div className="mt-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3">
              <div className="flex gap-3">
                <div className="mt-0.5 text-danger">
                  <AlertIcon />
                </div>

                <div>
                  <p className="text-sm font-semibold text-danger">
                    Unable to save product
                  </p>

                  <p className="mt-1 text-xs leading-5 text-danger">
                    {formError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={isEdit ? closeEditForm : closeCreateForm}
            disabled={saving}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-secondary transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
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

if (!canView) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-12 text-center"> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger"> <AlertIcon /> </div>


        <h1 className="mt-4 text-lg font-semibold text-ink">
          Access Denied
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">
          You do not have permission to view products.
        </p>
      </div>
    </div>
  </AppShell>
);


}

if (!companyId) {
return ( <AppShell> <div className="p-6 lg:p-8"> <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-12 text-center"> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger"> <AlertIcon /> </div>


        <h1 className="mt-4 text-lg font-semibold text-ink">
          Company Context Unavailable
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">
          No authenticated company context is available for this session.
          Please sign in again.
        </p>
      </div>
    </div>
  </AppShell>
);


}

return ( <AppShell> <div className="p-6 lg:p-8">
{/* HEADER */} <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"> <div> <div className="mb-1 text-xs font-medium text-ink-muted">
Master Data / Products </div>


        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Products
        </h1>

        <p className="mt-1 text-sm text-ink-muted">
          Manage products, SKUs, categories, units, pricing, and product
          status.
        </p>
      </div>

      {canCreate && (
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          <PlusIcon />
          New Product
        </button>
      )}
    </div>

    {/* FILTERS */}
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 md:flex-row">
      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
          <SearchIcon />
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by product name, SKU, or barcode..."
          className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-ink-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
      >
        <option>All Statuses</option>
        <option>Active</option>
        <option>Inactive</option>
      </select>
    </div>

    {/* TABLE */}
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Product Catalog
          </h2>

          <p className="mt-1 text-xs text-ink-muted">
            {loading
              ? "Loading products..."
              : `${filteredProducts.length} products`}
          </p>
        </div>

        {!loading && !error && (
          <button
            type="button"
            onClick={loadAll}
            className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-secondary transition hover:bg-surface-hover hover:text-ink"
          >
            Refresh
          </button>
        )}
      </div>

      {loading && (
        <div className="px-5 py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />

          <p className="mt-4 text-sm text-ink-muted">
            Loading products from NextWare...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="px-5 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertIcon />
          </div>

          <p className="mt-4 text-sm font-semibold text-ink">
            Unable to load products
          </p>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-ink-muted">
            {error}
          </p>

          <button
            type="button"
            onClick={loadAll}
            className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface-hover text-xs text-ink-muted">
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 text-right font-medium">
                  Selling Price
                </th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-active text-ink-muted">
                      <SearchIcon />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-ink-secondary">
                      No products found
                    </p>

                    <p className="mt-1 text-xs text-ink-muted">
                      Try changing your search or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const category = product.categoryId
                    ? categoryMap.get(product.categoryId)
                    : undefined;

                  const unit = unitMap.get(product.unitOfMeasureId);

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-line last:border-0 hover:bg-surface-hover/70"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-ink">
                        {product.sku}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-ink">
                          {product.name}
                        </div>

                        {product.description && (
                          <div className="mt-1 max-w-md truncate text-xs text-ink-muted">
                            {product.description}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-ink-muted">
                        {category ? category.name : "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-ink-muted">
                        {unit ? unit.code : "—"}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-medium text-ink">
                        {product.sellingPrice !== null
                          ? `$${product.sellingPrice.toFixed(2)}`
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge active={product.active} />
                      </td>

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

                          {canUpdate && (
                            <IconButton
                              label="Edit product"
                              onClick={() => openEditForm(product)}
                            >
                              <EditIcon />
                            </IconButton>
                          )}

                          {canDelete &&
                            (product.active ? (
                              <IconButton
                                label="Deactivate product"
                                danger
                                onClick={() => openStatusDialog(product)}
                              >
                                <TrashIcon />
                              </IconButton>
                            ) : (
                              <IconButton
                                label="Activate product"
                                onClick={() => openStatusDialog(product)}
                              >
                                <PowerIcon />
                              </IconButton>
                            ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <p className="text-xs text-ink-muted">
            Showing {filteredProducts.length} of {products.length} products
          </p>

          <p className="text-xs text-ink-muted">
            {products.filter((product) => product.active).length} active
          </p>
        </div>
      )}
    </div>
  </div>

  {/* CREATE MODAL */}
  {showCreateForm && renderProductForm("create")}

  {/* EDIT MODAL */}
  {showEditForm && renderProductForm("edit")}

  {/* STATUS CONFIRMATION DIALOG */}
  {dialogType && dialogProduct && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="p-6">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              dialogType === "deactivate"
                ? "bg-danger-soft text-danger"
                : "bg-success-soft text-success"
            }`}
          >
            {dialogType === "deactivate" ? <TrashIcon /> : <PowerIcon />}
          </div>

          <h2 className="mt-5 text-lg font-semibold text-ink">
            {dialogType === "deactivate"
              ? "Deactivate product?"
              : "Activate product?"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {dialogType === "deactivate"
              ? `Are you sure you want to deactivate "${dialogProduct.name}"? The product will remain in the product master, but it will be marked inactive.`
              : `Are you sure you want to activate "${dialogProduct.name}"? It will become available as an active product again.`}
          </p>

          <div className="mt-4 rounded-lg bg-surface-hover px-4 py-3">
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-ink-muted">SKU</span>

              <span className="font-semibold text-ink-secondary">
                {dialogProduct.sku}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={closeDialog}
            disabled={actionLoading}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-secondary transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirmStatusChange}
            disabled={actionLoading}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              dialogType === "deactivate"
                ? "bg-danger hover:opacity-90"
                : "bg-success hover:opacity-90"
            }`}
          >
            {actionLoading
              ? "Processing..."
              : dialogType === "deactivate"
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
        className={`flex items-start gap-3 rounded-xl border bg-surface p-4 shadow-xl ${
          toast.type === "success"
            ? "border-success/30"
            : "border-danger/30"
        }`}
      >
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            toast.type === "success"
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger"
          }`}
        >
          {toast.type === "success" ? <CheckIcon /> : <AlertIcon />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            {toast.type === "success" ? "Success" : "Something went wrong"}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-ink-muted">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setToast(null)}
          className="text-ink-muted hover:text-ink-secondary"
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
