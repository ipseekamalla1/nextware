"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  createProduct,
  getProducts,
  Product,
  ProductCreateRequest,
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

  const [form, setForm] =
    useState<ProductCreateRequest>(initialForm);

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        const data = await getProducts(COMPANY_ID);

        if (cancelled) {
          return;
        }

        setProducts(data);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load products."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

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
    setCreateError(null);
    setForm({ ...initialForm });
    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (creating) {
      return;
    }

    setShowCreateForm(false);
    setCreateError(null);
    setForm({ ...initialForm });
  }

  async function handleCreateProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreating(true);
    setCreateError(null);

    try {
      const request: ProductCreateRequest = {
        companyId: COMPANY_ID,
        categoryId: null,
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

      setShowCreateForm(false);
      setForm({ ...initialForm });
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create product."
      );
    } finally {
      setCreating(false);
    }
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
              Manage products, SKUs, categories, units,
              and product status.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            + New Product
          </button>

        </div>

        {/* FILTERS */}
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row">

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products by name or SKU..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none"
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>

        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

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

          </div>

          {/* LOADING */}
          {loading && (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Loading products from NextWare...
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="px-5 py-12 text-center">

              <p className="text-sm font-medium text-red-600">
                Unable to load products
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={loadProducts}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Try Again
              </button>

            </div>
          )}

          {/* PRODUCT TABLE */}
          {!loading && !error && (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px] text-left">

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
                        className="px-5 py-12 text-center text-sm text-slate-500"
                      >
                        No products found.
                      </td>
                    </tr>

                  ) : (

                    filteredProducts.map((product) => (

                      <tr
                        key={product.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
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
                          {product.categoryId ?? "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          EA
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-medium text-slate-800">
                          {product.sellingPrice !== null
                            ? `$${product.sellingPrice.toFixed(2)}`
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

                        <td className="px-5 py-4 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/products/view?id=${encodeURIComponent(
                                  product.id
                                )}`
                              )
                            }
                            className="text-sm font-medium text-slate-500 hover:text-slate-900"
                          >
                            View
                          </button>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>
          )}

          {/* FOOTER */}
          {!loading && !error && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">

              <p className="text-xs text-slate-400">
                Showing {filteredProducts.length} of{" "}
                {products.length}
              </p>

            </div>
          )}

        </div>
      </div>

      {/* CREATE PRODUCT MODAL */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  New Product
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create a product in the NextWare product
                  master.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateForm}
                disabled={creating}
                className="text-xl text-slate-400 hover:text-slate-700 disabled:cursor-not-allowed"
              >
                ×
              </button>

            </div>

            <form onSubmit={handleCreateProduct}>

              <div className="grid gap-5 px-6 py-6 md:grid-cols-2">

                {/* SKU */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    SKU <span className="text-red-500">*</span>
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* NAME */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Product Name{" "}
                    <span className="text-red-500">*</span>
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* DESCRIPTION */}
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
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* BARCODE */}
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* UNIT */}
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

                {/* COST */}
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* SELLING */}
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* ACTIVE */}
                <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">

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

                  Active product

                </label>

                {/* ERROR */}
                {createError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 md:col-span-2">

                    <p className="text-sm font-medium text-red-700">
                      Unable to create product
                    </p>

                    <p className="mt-1 text-xs text-red-600">
                      {createError}
                    </p>

                  </div>
                )}

              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={creating}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating
                    ? "Creating..."
                    : "Create Product"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </AppShell>
  );
}