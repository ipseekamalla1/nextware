"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getProduct, Product } from "@/lib/api";

const COMPANY_ID = "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

export default function ProductViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = searchParams.get("id");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getProduct(COMPANY_ID, productId);

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

    loadProduct();
  }, [productId]);

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Products
          </button>

          <div className="mb-1 text-xs font-medium text-slate-400">
            Master Data / Products / View
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Product Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View product information from the NextWare product master.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-slate-500">
              Loading product...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8">
            <p className="text-sm font-semibold text-red-700">
              Unable to load product
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => router.push("/products")}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Back to Products
            </button>
          </div>
        )}

        {!loading && !error && product && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {product.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  SKU: {product.sku}
                </p>
              </div>

              <span
                className={
                  product.active
                    ? "rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                    : "rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                }
              >
                {product.active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  SKU
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {product.sku}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Product Name
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {product.name}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {product.description || "No description provided."}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Barcode
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {product.barcode || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Unit of Measure
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {product.unitOfMeasureId}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Cost Price
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {product.costPrice !== null
                    ? `$${product.costPrice.toFixed(2)}`
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Selling Price
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {product.sellingPrice !== null
                    ? `$${product.sellingPrice.toFixed(2)}`
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Category
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {product.categoryId || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {product.active ? "Active" : "Inactive"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Created
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {new Date(product.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Last Updated
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {new Date(product.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => router.push("/products")}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Back to Products
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}