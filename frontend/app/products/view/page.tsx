"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  getProduct,
  updateProduct,
  Product,
  ProductCreateRequest,
} from "@/lib/api";

const COMPANY_ID = "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

const UNIT_OF_MEASURE_ID =
  "a938839d-ca27-4a60-b25b-038a41b34236";

/* =========================================================
   ICONS
========================================================= */

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function CheckIcon() {
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
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function XIcon() {
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
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ProductViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = searchParams.get("id");

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     EDIT STATE
  ======================================================= */

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editForm, setEditForm] =
    useState<ProductCreateRequest | null>(null);

  const [updating, setUpdating] =
    useState(false);

  const [updateError, setUpdateError] =
    useState<string | null>(null);

  const [updateSuccess, setUpdateSuccess] =
    useState(false);

  /* =======================================================
     LOAD PRODUCT
  ======================================================= */

  async function loadProduct() {
    if (!productId) {
      setError("Product ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getProduct(
        COMPANY_ID,
        productId
      );

      setProduct(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load product."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialProduct() {
      if (!productId) {
        if (!cancelled) {
          setError("Product ID is missing.");
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getProduct(
          COMPANY_ID,
          productId
        );

        if (!cancelled) {
          setProduct(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load product."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  function openEditModal() {
    if (!product) {
      return;
    }

    setUpdateError(null);
    setUpdateSuccess(false);

    setEditForm({
      companyId: product.companyId,
      categoryId: product.categoryId,
      unitOfMeasureId:
        product.unitOfMeasureId ||
        UNIT_OF_MEASURE_ID,
      sku: product.sku,
      name: product.name,
      description: product.description,
      barcode: product.barcode,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      active: product.active,
    });

    setShowEditModal(true);
  }

  /* =======================================================
     CLOSE EDIT
  ======================================================= */

  function closeEditModal() {
    if (updating) {
      return;
    }

    setShowEditModal(false);
    setUpdateError(null);
    setUpdateSuccess(false);
    setEditForm(null);
  }

  /* =======================================================
     UPDATE FORM
  ======================================================= */

  function updateEditForm(
    field: keyof ProductCreateRequest,
    value: string | boolean | number | null
  ) {
    setEditForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  /* =======================================================
     SAVE EDIT
  ======================================================= */

  async function handleUpdateProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!productId || !editForm) {
      return;
    }

    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const request: ProductCreateRequest = {
        companyId: COMPANY_ID,

        categoryId:
          editForm.categoryId || null,

        unitOfMeasureId:
          editForm.unitOfMeasureId ||
          UNIT_OF_MEASURE_ID,

        sku: editForm.sku.trim(),

        name: editForm.name.trim(),

        description:
          editForm.description?.trim() || null,

        barcode:
          editForm.barcode?.trim() || null,

        costPrice:
          editForm.costPrice === null ||
          editForm.costPrice === undefined
            ? null
            : Number(editForm.costPrice),

        sellingPrice:
          editForm.sellingPrice === null ||
          editForm.sellingPrice === undefined
            ? null
            : Number(editForm.sellingPrice),

        active: editForm.active,
      };

      const updatedProduct =
        await updateProduct(
          COMPANY_ID,
          productId,
          request
        );

      setProduct(updatedProduct);

      setUpdateSuccess(true);

      /*
       * Keep the success message visible briefly,
       * then close the edit dialog.
       */
      setTimeout(() => {
        setShowEditModal(false);
        setEditForm(null);
        setUpdateSuccess(false);
      }, 900);
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : "Failed to update product."
      );
    } finally {
      setUpdating(false);
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AppShell>
      <div className="p-6 lg:p-8">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-6">

          <button
            type="button"
            onClick={() =>
              router.push("/products")
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeftIcon />
            Back to Products
          </button>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>
              <div className="mb-1 text-xs font-medium text-slate-400">
                Master Data / Products / View
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Product Details
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage detailed product master
                information.
              </p>
            </div>

          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />

            <p className="mt-4 text-sm text-slate-500">
              Loading product...
            </p>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10">

            <div className="flex items-start gap-3">

              <div className="text-red-600">
                <AlertIcon />
              </div>

              <div>

                <p className="text-sm font-semibold text-red-700">
                  Unable to load product
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/products")
                  }
                  className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Back to Products
                </button>

              </div>
            </div>
          </div>
        )}

        {/* =================================================
            PRODUCT DETAILS
        ================================================= */}

        {!loading && !error && product && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {/* PRODUCT HEADER */}

            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">

              <div>

                <h2 className="text-lg font-semibold text-slate-900">
                  {product.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  SKU: {product.sku}
                </p>

              </div>

              <div className="flex items-center gap-3">

                {/* STATUS */}

                <span
                  className={
                    product.active
                      ? "inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                      : "inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                  }
                >
                  {product.active
                    ? "Active"
                    : "Inactive"}
                </span>

                {/* EDIT BUTTON */}

                <button
                  type="button"
                  onClick={openEditModal}
                  title="Edit product"
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  <EditIcon />
                  Edit Product
                </button>

              </div>

            </div>

            {/* DETAILS */}

            <div className="grid gap-x-8 gap-y-7 p-6 md:grid-cols-2">

              {/* SKU */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  SKU
                </p>

                <p className="mt-1.5 text-sm font-semibold text-slate-800">
                  {product.sku}
                </p>
              </div>

              {/* PRODUCT NAME */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Product Name
                </p>

                <p className="mt-1.5 text-sm font-semibold text-slate-800">
                  {product.name}
                </p>
              </div>

              {/* DESCRIPTION */}

              <div className="md:col-span-2">

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-1.5 text-sm leading-6 text-slate-700">
                  {product.description ||
                    "No description provided."}
                </p>

              </div>

              {/* BARCODE */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Barcode
                </p>

                <p className="mt-1.5 text-sm text-slate-700">
                  {product.barcode || "—"}
                </p>

              </div>

              {/* UNIT */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Unit of Measure
                </p>

                <p className="mt-1.5 text-sm text-slate-700">
                  EA — Each
                </p>

              </div>

              {/* COST */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Cost Price
                </p>

                <p className="mt-1.5 text-sm font-semibold text-slate-800">
                  {product.costPrice !== null
                    ? `$${product.costPrice.toFixed(
                        2
                      )}`
                    : "—"}
                </p>

              </div>

              {/* SELLING */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Selling Price
                </p>

                <p className="mt-1.5 text-sm font-semibold text-slate-800">
                  {product.sellingPrice !== null
                    ? `$${product.sellingPrice.toFixed(
                        2
                      )}`
                    : "—"}
                </p>

              </div>

              {/* CATEGORY */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Category
                </p>

                <p className="mt-1.5 text-sm text-slate-700">
                  {product.categoryId || "—"}
                </p>

              </div>

              {/* STATUS */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <div className="mt-1.5">

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

                </div>

              </div>

              {/* CREATED */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Created
                </p>

                <p className="mt-1.5 text-sm text-slate-700">
                  {new Date(
                    product.createdAt
                  ).toLocaleString()}
                </p>

              </div>

              {/* UPDATED */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Last Updated
                </p>

                <p className="mt-1.5 text-sm text-slate-700">
                  {new Date(
                    product.updatedAt
                  ).toLocaleString()}
                </p>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex justify-between border-t border-slate-200 px-6 py-4">

              <button
                type="button"
                onClick={() =>
                  router.push("/products")
                }
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Back to Products
              </button>

              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <EditIcon />
                Edit Product
              </button>

            </div>

          </div>
        )}

      </div>

      {/* =====================================================
          EDIT PRODUCT MODAL
      ===================================================== */}

      {showEditModal && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !updating
            ) {
              closeEditModal();
            }
          }}
        >

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <EditIcon />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Edit Product
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Update product master information.
                    </p>
                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={updating}
                title="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XIcon />
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={handleUpdateProduct}>

              <div className="grid gap-5 px-6 py-6 md:grid-cols-2">

                {/* SKU */}

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
                    value={editForm.sku}
                    onChange={(event) =>
                      updateEditForm(
                        "sku",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                </div>

                {/* NAME */}

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
                    value={editForm.name}
                    onChange={(event) =>
                      updateEditForm(
                        "name",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                </div>

                {/* DESCRIPTION */}

                <div className="md:col-span-2">

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    rows={3}
                    value={
                      editForm.description ?? ""
                    }
                    onChange={(event) =>
                      updateEditForm(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Optional product description"
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                    value={
                      editForm.barcode ?? ""
                    }
                    onChange={(event) =>
                      updateEditForm(
                        "barcode",
                        event.target.value
                      )
                    }
                    placeholder="Optional barcode"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                    value={
                      editForm.costPrice ?? ""
                    }
                    onChange={(event) =>
                      updateEditForm(
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

                {/* SELLING PRICE */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Selling Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      editForm.sellingPrice ?? ""
                    }
                    onChange={(event) =>
                      updateEditForm(
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

                {/* ACTIVE */}

                <div className="md:col-span-2">

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100">

                    <input
                      type="checkbox"
                      checked={
                        editForm.active
                      }
                      onChange={(event) =>
                        updateEditForm(
                          "active",
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    <div>

                      <p className="text-sm font-medium text-slate-700">
                        Active Product
                      </p>

                      <p className="text-xs text-slate-400">
                        Product can be used in active
                        inventory operations.
                      </p>

                    </div>

                  </label>

                </div>

                {/* ERROR */}

                {updateError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 md:col-span-2">

                    <div className="flex items-start gap-3">

                      <div className="mt-0.5 text-red-600">
                        <AlertIcon />
                      </div>

                      <div>

                        <p className="text-sm font-semibold text-red-700">
                          Unable to update product
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-600">
                          {updateError}
                        </p>

                      </div>

                    </div>

                  </div>
                )}

                {/* SUCCESS */}

                {updateSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 md:col-span-2">

                    <div className="flex items-center gap-3">

                      <div className="text-emerald-600">
                        <CheckIcon />
                      </div>

                      <div>

                        <p className="text-sm font-semibold text-emerald-700">
                          Product updated successfully
                        </p>

                        <p className="mt-0.5 text-xs text-emerald-600">
                          Your product information has been
                          saved.
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              </div>

              {/* =================================================
                  MODAL FOOTER
              ================================================= */}

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={updating}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    updating ||
                    updateSuccess
                  }
                  className="inline-flex min-w-[145px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {updating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon />
                      Save Changes
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </AppShell>
  );
}