"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  activateCategory,
  Category,
  deactivateCategory,
  getCategories,
} from "@/lib/api";
import {
  getCurrentCompanyId,
  hasPermission,
} from "@/lib/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconButton } from "@/components/ui/IconButton";
import {
  AlertIcon,
  CloseIcon,
  EditIcon,
  EyeIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
} from "@/components/ui/icons";

type DialogType = "activate" | "deactivate" | null;

export default function CategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [loading, setLoading] = useState(true);
  const [error, setError] =
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

  const canView = hasPermission("CATEGORY_VIEW");
  const canCreate = hasPermission("CATEGORY_CREATE");
  const canUpdate = hasPermission("CATEGORY_UPDATE");
  const canDelete = hasPermission("CATEGORY_DELETE");

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

      const companyId = getCurrentCompanyId();

      if (!companyId) {
        throw new Error(
          "No authenticated company was found. Please sign in again."
        );
      }

      const data = await getCategories(companyId);

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

  function openStatusDialog(category: Category) {
    if (category.active && !canDelete) {
      setToast({
        type: "error",
        message:
          "You do not have permission to deactivate categories.",
      });
      return;
    }

    if (!category.active && !canUpdate) {
      setToast({
        type: "error",
        message:
          "You do not have permission to activate categories.",
      });
      return;
    }

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

    const companyId = getCurrentCompanyId();

    if (!companyId) {
      setToast({
        type: "error",
        message:
          "No authenticated company was found. Please sign in again.",
      });
      return;
    }

    if (
      dialogType === "deactivate" &&
      !canDelete
    ) {
      setToast({
        type: "error",
        message:
          "You do not have permission to deactivate categories.",
      });
      return;
    }

    if (
      dialogType === "activate" &&
      !canUpdate
    ) {
      setToast({
        type: "error",
        message:
          "You do not have permission to activate categories.",
      });
      return;
    }

    setActionLoading(true);

    try {
      if (dialogType === "deactivate") {
        await deactivateCategory(
          companyId,
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
            companyId,
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

  if (!canView) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <p className="text-sm font-semibold text-danger">
              Access denied
            </p>

            <p className="mt-1 text-sm text-danger">
              You do not have permission to view categories.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">

        {/* PAGE HEADER */}

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
                Organize the product master data into categories.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={() =>
                  router.push("/categories/new")
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <PlusIcon />
                New Category
              </button>
            )}
          </div>
        </div>

        {/* TOOLBAR */}

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
                placeholder="Search by name or description..."
                className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
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

        {/* LOADING */}

        {loading && (
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading categories...
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <div className="flex items-start gap-3">
              <div className="text-danger">
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
                  className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredCategories.length === 0 && (
            <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
              <h2 className="mt-4 text-base font-semibold text-ink">
                No categories found
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                {search ||
                statusFilter !== "All Statuses"
                  ? "No categories match your current search or filter."
                  : "Create your first category to get started."}
              </p>

              {!search &&
                statusFilter === "All Statuses" &&
                canCreate && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/categories/new")
                    }
                    className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    Create Category
                  </button>
                )}
            </div>
          )}

        {/* TABLE */}

        {!loading &&
          !error &&
          filteredCategories.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="border-b border-line bg-surface-hover">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Name
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Description
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line">
                    {filteredCategories.map(
                      (category) => (
                        <tr
                          key={category.id}
                          className="transition hover:bg-surface-hover"
                        >
                          <td className="px-5 py-4">
                            <span className="text-sm font-semibold text-ink">
                              {category.name}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-ink-secondary">
                            {category.description || "—"}
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
                                label="View"
                                onClick={() =>
                                  router.push(
                                    `/categories/view?id=${encodeURIComponent(
                                      category.id
                                    )}`
                                  )
                                }
                              >
                                <EyeIcon />
                              </IconButton>

                              {canUpdate && (
                                <IconButton
                                  label="Edit"
                                  onClick={() =>
                                    router.push(
                                      `/categories/view?id=${encodeURIComponent(
                                        category.id
                                      )}&edit=true`
                                    )
                                  }
                                >
                                  <EditIcon />
                                </IconButton>
                              )}

                              {((category.active &&
                                canDelete) ||
                                (!category.active &&
                                  canUpdate)) && (
                                <IconButton
                                  label={
                                    category.active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                  onClick={() =>
                                    openStatusDialog(
                                      category
                                    )
                                  }
                                >
                                  <PowerIcon />
                                </IconButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-line px-5 py-3 text-xs text-ink-muted">
                Showing{" "}
                <span className="font-semibold text-ink-secondary">
                  {filteredCategories.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-ink-secondary">
                  {categories.length}
                </span>{" "}
                categories
              </div>
            </div>
          )}

        {/* STATUS DIALOG */}

        {dialogType &&
          dialogCategory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-2xl">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      {dialogType === "deactivate"
                        ? "Deactivate Category"
                        : "Activate Category"}
                    </h2>

                    <p className="mt-1 text-xs text-ink-muted">
                      Category status
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={actionLoading}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-active hover:text-ink-secondary disabled:opacity-50"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="p-5">
                  <p className="text-sm leading-6 text-ink-secondary">
                    {dialogType === "deactivate"
                      ? `Are you sure you want to deactivate "${dialogCategory.name}"? The category will remain in the system and can be activated again later.`
                      : `Are you sure you want to activate "${dialogCategory.name}"?`}
                  </p>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeDialog}
                      disabled={actionLoading}
                      className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-surface-hover disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={confirmStatusChange}
                      disabled={actionLoading}
                      className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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
            </div>
          )}

        {/* TOAST */}

        {toast && (
          <div className="fixed bottom-6 right-6 z-[60]">
            <div
              className={`rounded-lg border px-4 py-3 shadow-lg ${
                toast.type === "success"
                  ? "border-success/30 bg-success-soft text-success"
                  : "border-danger/30 bg-danger-soft text-danger"
              }`}
            >
              <p className="text-sm font-medium">
                {toast.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
