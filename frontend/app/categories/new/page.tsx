"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  createCategory,
  CategoryCreateRequest,
} from "@/lib/api";
import { getCurrentCompanyId, hasPermission } from "@/lib/auth";

const initialForm: CategoryCreateRequest = {
  companyId: "",
  name: "",
  description: "",
  active: true,
};

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 border-b border-line pb-3">
      <h2 className="text-base font-semibold text-ink">
        {title}
      </h2>

      <p className="mt-1 text-xs text-ink-muted">
        {description}
      </p>
    </div>
  );
}

export default function NewCategoryPage() {
  const router = useRouter();

  const canCreate = hasPermission("CATEGORY_CREATE");

  const [form, setForm] =
    useState<CategoryCreateRequest>({
      ...initialForm,
    });

  const [saving, setSaving] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  function updateField(
    field: keyof CategoryCreateRequest,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Category Name is required.");
      return;
    }

    const companyId = getCurrentCompanyId();

    if (!companyId) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const category = await createCategory({
        ...form,
        companyId,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        active: form.active,
      });

      router.push(
        `/categories/view?id=${encodeURIComponent(category.id)}`
      );
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

  if (!canCreate) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <p className="text-sm font-semibold text-danger">
              Access denied
            </p>

            <p className="mt-1 text-sm text-danger">
              You do not have permission to create categories.
            </p>
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
            onClick={() => router.push("/categories")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Back to Categories
          </button>

          <div className="mb-1 text-xs font-medium text-ink-muted">
            Master Data / Categories / New
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">
            New Category
          </h1>

          <p className="mt-1 text-sm text-ink-muted">
            Create a new product category.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Category Information"
              description="Name and describe this category."
            />

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                  Category Name
                  <span className="text-danger"> *</span>
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  required
                  placeholder="Beverages"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                  Description
                </label>

                <textarea
                  value={form.description ?? ""}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  rows={3}
                  placeholder="Bottled and canned drinks"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Status"
              description="Control whether this category is active."
            />

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  updateField("active", event.target.checked)
                }
                className="h-4 w-4 rounded border-line-strong"
              />

              <div>
                <div className="text-sm font-medium text-ink-secondary">
                  Active category
                </div>

                <div className="text-xs text-ink-muted">
                  Active categories can be assigned to products.
                </div>
              </div>
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/categories")}
              disabled={saving}
              className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
