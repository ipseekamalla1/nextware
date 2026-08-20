"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  activateCategory,
  createCategory,
  deactivateCategory,
  getCategories,
  updateCategory,
  Category,
  CategoryCreateRequest,
} from "@/lib/api";

const COMPANY_ID =
  "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

const initialForm: CategoryCreateRequest = {
  companyId: COMPANY_ID,
  name: "",
  description: "",
  active: true,
};

type DialogType =
  | "deactivate"
  | "activate"
  | null;

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

export default function CategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] =
    useState<Category[]>([]);

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
    useState<CategoryCreateRequest>({
      ...initialForm,
    });

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  const [dialogType, setDialogType] =
    useState<DialogType>(null);

  const [dialogCategory, setDialogCategory] =
    useState<Category | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadCategories();
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

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);

      const data = await getCategories(COMPANY_ID);

      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        category.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (category.description ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        (statusFilter === "Active" &&
          category.active) ||
        (statusFilter === "Inactive" &&
          !category.active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  function openCreateForm() {
    setForm({
      ...initialForm,
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
      ...initialForm,
    });
  }

  function openEditForm(category: Category) {
    setEditingCategory(category);

    setForm({
      companyId: category.companyId,
      name: category.name,
      description: category.description,
      active: category.active,
    });

    setFormError(null);
    setShowEditForm(true);
  }

  function closeEditForm() {
    if (saving) {
      return;
    }

    setShowEditForm(false);
    setEditingCategory(null);
    setFormError(null);

    setForm({
      ...initialForm,
    });
  }

  function updateForm(
    field: keyof CategoryCreateRequest,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateCategory(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError(
        "Category Name is required."
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await createCategory({
        companyId: COMPANY_ID,
        name: form.name.trim(),
        description:
          form.description?.trim() || null,
        active: form.active,
      });

      await loadCategories();

      closeCreateForm();

      setToast({
        type: "success",
        message:
          "Category created successfully.",
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateCategory(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingCategory) {
      return;
    }

    if (!form.name.trim()) {
      setFormError(
        "Category Name is required."
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await updateCategory(
        COMPANY_ID,
        editingCategory.id,
        {
          companyId: COMPANY_ID,
          name: form.name.trim(),
          description:
            form.description?.trim() || null,
          active: form.active,
        }
      );

      await loadCategories();

      closeEditForm();

      setToast({
        type: "success",
        message:
          "Category updated successfully.",
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to update category."
      );
    } finally {
      setSaving(false);
    }
  }

  function openStatusDialog(category: Category) {
    setDialogCategory(category);

    setDialogType(
      category.active
        ? "deactivate"
        : "activate"
    );
  }

  function closeDialog() {
    if (actionLoading) {
      return;
    }

    setDialogType(null);
    setDialogCategory(null);
  }

  async function confirmStatusChange() {
    if (!dialogCategory || !dialogType) {
      return;
    }

    setActionLoading(true);

    try {
      if (dialogType === "deactivate") {
        await deactivateCategory(
          COMPANY_ID,
          dialogCategory.id
        );

        setCategories((current) =>
          current.map((category) =>
            category.id === dialogCategory.id
              ? {
                  ...category,
                  active: false,
                }
              : category
          )
        );

        setToast({
          type: "success",
          message:
            "Category deactivated successfully.",
        });
      } else {
        const updatedCategory =
          await activateCategory(
            COMPANY_ID,
            dialogCategory
          );

        setCategories((current) =>
          current.map((category) =>
            category.id === dialogCategory.id
              ? updatedCategory
              : category
          )
        );

        setToast({
          type: "success",
          message:
            "Category activated successfully.",
        });
      }

      closeDialog();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to change category status.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function navigateToCategory(
    category: Category
  ) {
    router.push(
      `/categories/view?id=${encodeURIComponent(
        category.id
      )}`
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-6">
          <div className="mb-1 text-xs font-medium text-slate-400">
            Master Data / Categories
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Categories
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage product categories used throughout NextWare.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <PlusIcon />
              New Category
            </button>
          </div>
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search categories..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="pt-0.5 text-red-600">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Unable to load categories
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadCategories}
                  className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            TABLE
        ================================================= */}

        {!error && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {loading ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />

                <p className="mt-4 text-sm text-slate-500">
                  Loading categories...
                </p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <SearchIcon />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  No categories found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {search || statusFilter !== "All Statuses"
                    ? "Try changing your search or status filter."
                    : "Create your first category to get started."}
                </p>

                {!search &&
                  statusFilter ===
                    "All Statuses" && (
                    <button
                      type="button"
                      onClick={openCreateForm}
                      className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                      Create Category
                    </button>
                  )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Category Name
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Description
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.map(
                      (category) => (
                        <tr
                          key={category.id}
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                navigateToCategory(
                                  category
                                )
                              }
                              className="text-left text-sm font-semibold text-slate-800 hover:text-slate-950 hover:underline"
                            >
                              {category.name}
                            </button>
                          </td>

                          <td className="max-w-md px-5 py-4">
                            <p className="truncate text-sm text-slate-500">
                              {category.description ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={
                                category.active
                                  ? "inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                                  : "inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                              }
                            >
                              {category.active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <IconButton
                                label="View category"
                                onClick={() =>
                                  navigateToCategory(
                                    category
                                  )
                                }
                              >
                                <EyeIcon />
                              </IconButton>

                              <IconButton
                                label="Edit category"
                                onClick={() =>
                                  openEditForm(
                                    category
                                  )
                                }
                              >
                                <EditIcon />
                              </IconButton>

                              <IconButton
                                label={
                                  category.active
                                    ? "Deactivate category"
                                    : "Activate category"
                                }
                                onClick={() =>
                                  openStatusDialog(
                                    category
                                  )
                                }
                                danger={
                                  category.active
                                }
                              >
                                <PowerIcon />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading &&
              filteredCategories.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
                  <p className="text-xs text-slate-400">
                    Showing{" "}
                    <span className="font-medium text-slate-600">
                      {filteredCategories.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-slate-600">
                      {categories.length}
                    </span>{" "}
                    categories
                  </p>
                </div>
              )}
          </div>
        )}

        {/* =================================================
            TOAST
        ================================================= */}

        {toast && (
          <div className="fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-40px))]">
            <div
              className={`rounded-xl border bg-white px-4 py-3 shadow-xl ${
                toast.type === "success"
                  ? "border-emerald-200"
                  : "border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={
                    toast.type === "success"
                      ? "text-emerald-600"
                      : "text-red-600"
                  }
                >
                  {toast.type === "success" ? (
                    <CheckIcon />
                  ) : (
                    <AlertIcon />
                  )}
                </div>

                <p className="flex-1 text-sm font-medium text-slate-700">
                  {toast.message}
                </p>

                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            CREATE MODAL
        ================================================= */}

        {showCreateForm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    New Category
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Create a new product category.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleCreateCategory}>
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
                      value={form.name}
                      onChange={(event) =>
                        updateForm(
                          "name",
                          event.target.value
                        )
                      }
                      required
                      maxLength={150}
                      autoFocus
                      placeholder="e.g. Electronics"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Description
                    </label>

                    <textarea
                      value={
                        form.description ?? ""
                      }
                      onChange={(event) =>
                        updateForm(
                          "description",
                          event.target.value
                        )
                      }
                      maxLength={500}
                      rows={4}
                      placeholder="Enter a description for this category..."
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-3">
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
                        Active category
                      </span>

                      <span className="block text-xs text-slate-400">
                        Allow this category to be used in NextWare.
                      </span>
                    </span>
                  </label>

                  {formError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-sm font-medium text-red-700">
                        Unable to create category
                      </p>

                      <p className="mt-1 text-xs text-red-600">
                        {formError}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
                  <button
                    type="button"
                    onClick={closeCreateForm}
                    disabled={saving}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Creating..."
                      : "Create Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================
            EDIT MODAL
        ================================================= */}

        {showEditForm && editingCategory && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Edit Category
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Update category information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditForm}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleUpdateCategory}>
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
                      value={form.name}
                      onChange={(event) =>
                        updateForm(
                          "name",
                          event.target.value
                        )
                      }
                      required
                      maxLength={150}
                      autoFocus
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Description
                    </label>

                    <textarea
                      value={
                        form.description ?? ""
                      }
                      onChange={(event) =>
                        updateForm(
                          "description",
                          event.target.value
                        )
                      }
                      maxLength={500}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-3">
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
                        Active category
                      </span>

                      <span className="block text-xs text-slate-400">
                        Inactive categories remain in the database but are not active.
                      </span>
                    </span>
                  </label>

                  {formError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-sm font-medium text-red-700">
                        Unable to update category
                      </p>

                      <p className="mt-1 text-xs text-red-600">
                        {formError}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
                  <button
                    type="button"
                    onClick={closeEditForm}
                    disabled={saving}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================
            STATUS CONFIRMATION
        ================================================= */}

        {dialogType && dialogCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <PowerIcon />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {dialogType === "deactivate"
                        ? "Deactivate Category"
                        : "Activate Category"}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {dialogType === "deactivate"
                        ? `Are you sure you want to deactivate "${dialogCategory.name}"?`
                        : `Are you sure you want to activate "${dialogCategory.name}"?`}
                    </p>

                    {dialogType ===
                      "deactivate" && (
                      <p className="mt-2 text-xs text-slate-400">
                        The category will remain in the database and can be activated again later.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={actionLoading}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmStatusChange}
                  disabled={actionLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>
    </AppShell>
  );
}