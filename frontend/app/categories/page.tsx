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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconButton } from "@/components/ui/IconButton";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  EyeIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
} from "@/components/ui/icons";

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
          <div className="mb-1 text-xs font-medium text-ink-muted">
            Master Data / Categories
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Categories
              </h1>

              <p className="mt-1 text-sm text-ink-muted">
                Manage product categories used throughout NextWare.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <PlusIcon />
              New Category
            </button>
          </div>
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="mb-5 rounded-xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search categories..."
                className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-ink-muted focus:border-primary-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
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
          <div className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="pt-0.5 text-danger">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-danger">
                  Unable to load categories
                </p>

                <p className="mt-1 text-sm text-danger">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadCategories}
                  className="mt-3 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
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
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">

            {loading ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-slate-700" />

                <p className="mt-4 text-sm text-ink-muted">
                  Loading categories...
                </p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-active text-ink-muted">
                  <SearchIcon />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-ink">
                  No categories found
                </h3>

                <p className="mt-1 text-sm text-ink-muted">
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
                      className="mt-4 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                      Create Category
                    </button>
                  )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-line bg-surface-hover">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Category Name
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Description
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.map(
                      (category) => (
                        <tr
                          key={category.id}
                          className="border-b border-line last:border-b-0 hover:bg-surface-hover"
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                navigateToCategory(
                                  category
                                )
                              }
                              className="text-left text-sm font-semibold text-ink hover:text-ink hover:underline"
                            >
                              {category.name}
                            </button>
                          </td>

                          <td className="max-w-md px-5 py-4">
                            <p className="truncate text-sm text-ink-muted">
                              {category.description ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              active={category.active}
                              className="px-3 py-1.5"
                            />
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
                <div className="border-t border-line bg-surface-hover px-5 py-3">
                  <p className="text-xs text-ink-muted">
                    Showing{" "}
                    <span className="font-medium text-ink-secondary">
                      {filteredCategories.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-ink-secondary">
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
              className={`rounded-xl border bg-surface px-4 py-3 shadow-xl ${
                toast.type === "success"
                  ? "border-success/30"
                  : "border-danger/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={
                    toast.type === "success"
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  {toast.type === "success" ? (
                    <CheckIcon />
                  ) : (
                    <AlertIcon />
                  )}
                </div>

                <p className="flex-1 text-sm font-medium text-ink-secondary">
                  {toast.message}
                </p>

                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="text-ink-muted hover:text-ink-secondary"
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
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-ink">
                    New Category
                  </h2>

                  <p className="mt-1 text-xs text-ink-muted">
                    Create a new product category.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-active hover:text-ink-secondary disabled:opacity-50"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleCreateCategory}>
                <div className="grid gap-5 p-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Category Name{" "}
                      <span className="text-danger">
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
                      className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
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
                      className="w-full resize-none rounded-lg border border-line px-3 py-2.5 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
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
                      className="h-4 w-4 rounded border-line-strong"
                    />

                    <span>
                      <span className="block text-sm font-medium text-ink-secondary">
                        Active category
                      </span>

                      <span className="block text-xs text-ink-muted">
                        Allow this category to be used in NextWare.
                      </span>
                    </span>
                  </label>

                  {formError && (
                    <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3">
                      <p className="text-sm font-medium text-danger">
                        Unable to create category
                      </p>

                      <p className="mt-1 text-xs text-danger">
                        {formError}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
                  <button
                    type="button"
                    onClick={closeCreateForm}
                    disabled={saving}
                    className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-hover disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-ink">
                    Edit Category
                  </h2>

                  <p className="mt-1 text-xs text-ink-muted">
                    Update category information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditForm}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-active hover:text-ink-secondary disabled:opacity-50"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleUpdateCategory}>
                <div className="grid gap-5 p-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Category Name{" "}
                      <span className="text-danger">
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
                      className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
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
                      className="w-full resize-none rounded-lg border border-line px-3 py-2.5 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
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
                      className="h-4 w-4 rounded border-line-strong"
                    />

                    <span>
                      <span className="block text-sm font-medium text-ink-secondary">
                        Active category
                      </span>

                      <span className="block text-xs text-ink-muted">
                        Inactive categories remain in the database but are not active.
                      </span>
                    </span>
                  </label>

                  {formError && (
                    <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3">
                      <p className="text-sm font-medium text-danger">
                        Unable to update category
                      </p>

                      <p className="mt-1 text-xs text-danger">
                        {formError}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
                  <button
                    type="button"
                    onClick={closeEditForm}
                    disabled={saving}
                    className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-hover disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-2xl">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-active text-ink-secondary">
                    <PowerIcon />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      {dialogType === "deactivate"
                        ? "Deactivate Category"
                        : "Activate Category"}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      {dialogType === "deactivate"
                        ? `Are you sure you want to deactivate "${dialogCategory.name}"?`
                        : `Are you sure you want to activate "${dialogCategory.name}"?`}
                    </p>

                    {dialogType ===
                      "deactivate" && (
                      <p className="mt-2 text-xs text-ink-muted">
                        The category will remain in the database and can be activated again later.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={actionLoading}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-hover disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmStatusChange}
                  disabled={actionLoading}
                  className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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