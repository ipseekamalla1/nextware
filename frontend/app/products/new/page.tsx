"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { createProduct } from "@/lib/api";

const COMPANY_ID = "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

const UNIT_OF_MEASURE_ID = "00000000-0000-0000-0000-000000000001";

export default function NewProductPage() {
  const router = useRouter();

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [barcode, setBarcode] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      await createProduct({
        companyId: COMPANY_ID,
        categoryId: null,
        unitOfMeasureId: UNIT_OF_MEASURE_ID,
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim() || null,
        barcode: barcode.trim() || null,
        costPrice: costPrice ? Number(costPrice) : null,
        sellingPrice: sellingPrice ? Number(sellingPrice) : null,
        active,
      });

      router.push("/products");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create product."
      );
    } finally {
      setSaving(false);
    }
  }

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
            Master Data / Products / New Product
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            New Product
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create a new product in the NextWare product catalog.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Product Information
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Enter the basic information for this product.
              </p>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  SKU <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  required
                  maxLength={100}
                  placeholder="PRD-001"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Product Name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={255}
                  placeholder="Wireless Barcode Scanner"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Enter a description for the product..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Barcode
                </label>

                <input
                  type="text"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  maxLength={100}
                  placeholder="Optional barcode"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Unit of Measure
                </label>

                <input
                  type="text"
                  value="Each"
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Default unit for this first product form.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Cost Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={(event) => setCostPrice(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
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
                  value={sellingPrice}
                  onChange={(event) => setSellingPrice(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-medium text-slate-700">
                      Active product
                    </span>

                    <span className="block text-xs text-slate-400">
                      Allow this product to be used in NextWare.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="mx-5 mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-700">
                  Unable to create product
                </p>

                <p className="mt-1 text-xs text-red-600">
                  {error}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => router.push("/products")}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Product"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}