"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { createCategory } from "@/lib/api";

const COMPANY_ID =
  "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

export default function NewCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Category Name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await createCategory({
        companyId: COMPANY_ID,
        name: name.trim(),
        description:
          description.trim() || null,
        active,
      });

      router.push("/categories");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create category."
      );
    } finally {
      setSaving(false);
    }
  }

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
              router.push("/categories")
            }
            className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Categories
          </button>

          <div className="mb-1 text-xs font-medium text-slate-400">
            Master Data / Categories / New Category
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            New Category
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create a new product category in the NextWare catalog.
          </p>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-slate-200 bg-white">

            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Category Information
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Enter the basic information for this category.
              </p>
            </div>

            <div className="grid gap-5 p-5">

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Category Name{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  maxLength={150}
                  placeholder="e.g. Electronics"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  maxLength={500}
                  rows={5}
                  placeholder="Enter a description for this category..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) =>
                    setActive(
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-700">
                    Active category
                  </span>

                  <span className="block text-xs text-slate-400">
                    Allow this category to be used in NextWare.
                  </span>
                </span>
              </label>
            </div>

            {error && (
              <div className="mx-5 mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-700">
                  Unable to create category
                </p>

                <p className="mt-1 text-xs text-red-600">
                  {error}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  router.push("/categories")
                }
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
                {saving
                  ? "Creating..."
                  : "Create Category"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}