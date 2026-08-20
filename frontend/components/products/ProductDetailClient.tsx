"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getProduct, Product } from "@/lib/api";

interface ProductDetailClientProps {
  productId: string;
}

export default function ProductDetailClient({
  productId,
}: ProductDetailClientProps) {
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);

        const data = await getProduct(productId);

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

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
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
              Master Data / Products
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Product Details
            </h1>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
            <p className="text-sm text-slate-500">
              Loading product...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !product) {
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
              Master Data / Products
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Product Details
            </h1>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-12 text-center">
            <p className="text-sm font-medium text-red-700">
              Unable to load product
            </p>

            <p className="mt-1 text-xs text-red-600">
              {error ?? "Product not found."}
            </p>

            <button
              type="button"
              onClick={() => router.push("/products")}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Back to Products
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Products
          </button>

          <div className="mb-1 text-xs font-medium text-slate-400">
            Master Data / Products / {product.sku}
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {product.name}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Product SKU: {product.sku}
              </p>
            </div>

            <span
              className={
                product.active
                  ? "w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                  : "w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
              }
            >
              {product.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* PRODUCT INFORMATION */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Product Information
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Detailed information for this product.
            </p>
          </div>

          <div className="grid gap-6 p-5 md:grid-cols-2">
            <DetailItem
              label="SKU"
              value={product.sku}
            />

            <DetailItem
              label="Product Name"
              value={product.name}
            />

            <DetailItem
              label="Barcode"
              value={product.barcode ?? "—"}
            />

            <DetailItem
              label="Unit of Measure"
              value="EA — Each"
            />

            <DetailItem
              label="Category"
              value={product.categoryId ?? "—"}
            />

            <DetailItem
              label="Status"
              value={product.active ? "Active" : "Inactive"}
            />

            <DetailItem
              label="Cost Price"
              value={
                product.costPrice !== null
                  ? `$${product.costPrice.toFixed(2)}`
                  : "—"
              }
            />

            <DetailItem
              label="Selling Price"
              value={
                product.sellingPrice !== null
                  ? `$${product.sellingPrice.toFixed(2)}`
                  : "—"
              }
            />

            <div className="md:col-span-2">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                Description
              </p>

              <p className="text-sm text-slate-700">
                {product.description ?? "No description provided."}
              </p>
            </div>
          </div>
        </div>

        {/* SYSTEM INFORMATION */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              System Information
            </h2>
          </div>

          <div className="grid gap-6 p-5 md:grid-cols-2">
            <DetailItem
              label="Product ID"
              value={product.id}
            />

            <DetailItem
              label="Company ID"
              value={product.companyId}
            />

            <DetailItem
              label="Unit of Measure ID"
              value={product.unitOfMeasureId}
            />

            <DetailItem
              label="Created At"
              value={formatDate(product.createdAt)}
            />

            <DetailItem
              label="Updated At"
              value={formatDate(product.updatedAt)}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}