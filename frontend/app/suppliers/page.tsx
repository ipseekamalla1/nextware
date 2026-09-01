
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  activateSupplier,
  deactivateSupplier,
  getSuppliers,
  Supplier,
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

export default function SuppliersPage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [dialogType, setDialogType] =
    useState<DialogType>(null);

  const [dialogSupplier, setDialogSupplier] =
    useState<Supplier | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const canCreate = hasPermission("SUPPLIER_CREATE");
  const canUpdate = hasPermission("SUPPLIER_UPDATE");
  const canDelete = hasPermission("SUPPLIER_DELETE");

  useEffect(() => {
    loadSuppliers();
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

  async function loadSuppliers() {
    try {
      setLoading(true);
      setError(null);

      const companyId = getCurrentCompanyId();

      if (!companyId) {
        throw new Error(
          "No authenticated company was found. Please sign in again."
        );
      }

      const data = await getSuppliers(companyId);

      setSuppliers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load suppliers."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        supplier.supplierCode
          .toLowerCase()
          .includes(normalizedSearch) ||
        supplier.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (supplier.email ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (supplier.phone ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        (statusFilter === "Active" &&
          supplier.active) ||
        (statusFilter === "Inactive" &&
          !supplier.active);

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  function openStatusDialog(supplier: Supplier) {
    if (supplier.active && !canDelete) {
      setToast({
        type: "error",
        message:
          "You do not have permission to deactivate suppliers.",
      });
      return;
    }

    if (!supplier.active && !canUpdate) {
      setToast({
        type: "error",
        message:
          "You do not have permission to activate suppliers.",
      });
      return;
    }

    setDialogSupplier(supplier);

    setDialogType(
      supplier.active
        ? "deactivate"
        : "activate"
    );
  }

  function closeDialog() {
    if (actionLoading) {
      return;
    }

    setDialogType(null);
    setDialogSupplier(null);
  }

  async function confirmStatusChange() {
    if (!dialogSupplier || !dialogType) {
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
          "You do not have permission to deactivate suppliers.",
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
          "You do not have permission to activate suppliers.",
      });
      return;
    }

    setActionLoading(true);

    try {
      if (dialogType === "deactivate") {
        await deactivateSupplier(
          companyId,
          dialogSupplier.id
        );

        setSuppliers((current) =>
          current.map((supplier) =>
            supplier.id === dialogSupplier.id
              ? {
                  ...supplier,
                  active: false,
                }
              : supplier
          )
        );

        setToast({
          type: "success",
          message:
            "Supplier deactivated successfully.",
        });
      } else {
        const updatedSupplier =
          await activateSupplier(
            companyId,
            dialogSupplier.id
          );

        setSuppliers((current) =>
          current.map((supplier) =>
            supplier.id === dialogSupplier.id
              ? updatedSupplier
              : supplier
          )
        );

        setToast({
          type: "success",
          message:
            "Supplier activated successfully.",
        });
      }

      closeDialog();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to change supplier status.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">

        {/* PAGE HEADER */}

        <div className="mb-6">
          <div className="mb-1 text-xs font-medium text-ink-muted">
            Master Data / Suppliers
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Suppliers
              </h1>

              <p className="mt-1 text-sm text-ink-muted">
                Manage suppliers used throughout Nextware.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={() =>
                  router.push("/suppliers/new")
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <PlusIcon />
                New Supplier
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
                placeholder="Search by code, name, email or phone..."
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
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-slate-700" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading suppliers...
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
                  Unable to load suppliers
                </p>

                <p className="mt-1 text-sm text-danger">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadSuppliers}
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
          filteredSuppliers.length === 0 && (
            <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-active text-xl text-ink-muted">
                ♙
              </div>

              <h2 className="mt-4 text-base font-semibold text-ink">
                No suppliers found
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                {search ||
                statusFilter !== "All Statuses"
                  ? "No suppliers match your current search or filter."
                  : "Create your first supplier to get started."}
              </p>

              {!search &&
                statusFilter === "All Statuses" &&
                canCreate && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/suppliers/new")
                    }
                    className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    Create Supplier
                  </button>
                )}
            </div>
          )}

        {/* TABLE */}

        {!loading &&
          !error &&
          filteredSuppliers.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="border-b border-line bg-surface-hover">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Supplier Code
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Supplier
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Email
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Phone
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Location
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
                    {filteredSuppliers.map(
                      (supplier) => (
                        <tr
                          key={supplier.id}
                          className="transition hover:bg-surface-hover"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-medium text-ink-secondary">
                              {supplier.supplierCode}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm font-semibold text-ink">
                              {supplier.name}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-ink-secondary">
                            {supplier.email || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-ink-secondary">
                            {supplier.phone || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-ink-secondary">
                            {[
                              supplier.city,
                              supplier.state,
                            ]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              active={supplier.active}
                              className="px-3 py-1.5"
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <IconButton
                                label="View"
                                onClick={() =>
                                  router.push(
                                    `/suppliers/view?id=${encodeURIComponent(
                                      supplier.id
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
                                      `/suppliers/view?id=${encodeURIComponent(
                                        supplier.id
                                      )}&edit=true`
                                    )
                                  }
                                >
                                  <EditIcon />
                                </IconButton>
                              )}

                              {((supplier.active &&
                                canDelete) ||
                                (!supplier.active &&
                                  canUpdate)) && (
                                <IconButton
                                  label={
                                    supplier.active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                  onClick={() =>
                                    openStatusDialog(
                                      supplier
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
                  {filteredSuppliers.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-ink-secondary">
                  {suppliers.length}
                </span>{" "}
                suppliers
              </div>
            </div>
          )}

        {/* STATUS DIALOG */}

        {dialogType &&
          dialogSupplier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-2xl">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      {dialogType === "deactivate"
                        ? "Deactivate Supplier"
                        : "Activate Supplier"}
                    </h2>

                    <p className="mt-1 text-xs text-ink-muted">
                      Supplier status
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
                      ? `Are you sure you want to deactivate "${dialogSupplier.name}"? The supplier will remain in the system and can be activated again later.`
                      : `Are you sure you want to activate "${dialogSupplier.name}"?`}
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
          <div className="fixed bottom-6 right-6 z-50 max-w-sm">
            <div
              className={
                toast.type === "success"
                  ? "flex items-start gap-3 rounded-xl border border-success/30 bg-surface px-4 py-3 shadow-lg"
                  : "flex items-start gap-3 rounded-xl border border-danger/30 bg-surface px-4 py-3 shadow-lg"
              }
            >
              <div
                className={
                  toast.type === "success"
                    ? "text-success"
                    : "text-danger"
                }
              >
                <AlertIcon />
              </div>

              <p className="flex-1 text-sm text-ink-secondary">
                {toast.message}
              </p>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-ink-muted hover:text-ink-secondary"
                aria-label="Close notification"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

