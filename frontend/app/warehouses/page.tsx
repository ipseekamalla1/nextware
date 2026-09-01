"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  activateWarehouse,
  deactivateWarehouse,
  getWarehouses,
  Warehouse,
} from "@/lib/api";
import { getCurrentCompanyId, hasPermission } from "@/lib/auth";
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

export default function WarehousesPage() {
  const router = useRouter();

  const companyId = getCurrentCompanyId();
  const canView = hasPermission("WAREHOUSE_VIEW");
  const canCreate = hasPermission("WAREHOUSE_CREATE");
  const canUpdate = hasPermission("WAREHOUSE_UPDATE");
  const canDelete = hasPermission("WAREHOUSE_DELETE");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogType, setDialogType] =
    useState<DialogType>(null);
  const [dialogWarehouse, setDialogWarehouse] =
    useState<Warehouse | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!canView || !companyId) return;

    loadWarehouses();
  }, [canView, companyId]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(
      () => setToast(null),
      4000
    );

    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadWarehouses() {
    if (!companyId || !canView) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getWarehouses(companyId);

      setWarehouses(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load warehouses."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredWarehouses = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return warehouses.filter((warehouse) => {
      const location = [
        warehouse.city,
        warehouse.state,
        warehouse.country,
      ]
        .filter(Boolean)
        .join(" ");

      const matchesSearch =
        normalizedSearch.length === 0 ||
        warehouse.code
          .toLowerCase()
          .includes(normalizedSearch) ||
        warehouse.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        location
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        (statusFilter === "Active" &&
          warehouse.active) ||
        (statusFilter === "Inactive" &&
          !warehouse.active);

      return matchesSearch && matchesStatus;
    });
  }, [warehouses, search, statusFilter]);

  function openStatusDialog(
    warehouse: Warehouse
  ) {
    if (!canDelete) return;

    setDialogWarehouse(warehouse);
    setDialogType(
      warehouse.active
        ? "deactivate"
        : "activate"
    );
  }

  function closeDialog() {
    if (actionLoading) return;

    setDialogType(null);
    setDialogWarehouse(null);
  }

  async function confirmStatusChange() {
    if (
      !dialogWarehouse ||
      !dialogType ||
      !companyId ||
      !canDelete
    ) {
      return;
    }

    setActionLoading(true);

    try {
      if (dialogType === "deactivate") {
        await deactivateWarehouse(
          companyId,
          dialogWarehouse.id
        );

        setWarehouses((current) =>
          current.map((warehouse) =>
            warehouse.id === dialogWarehouse.id
              ? {
                  ...warehouse,
                  active: false,
                }
              : warehouse
          )
        );

        setToast({
          type: "success",
          message:
            "Warehouse deactivated successfully.",
        });
      } else {
        const updated =
          await activateWarehouse(
            companyId,
            dialogWarehouse.id
          );

        setWarehouses((current) =>
          current.map((warehouse) =>
            warehouse.id === dialogWarehouse.id
              ? updated
              : warehouse
          )
        );

        setToast({
          type: "success",
          message:
            "Warehouse activated successfully.",
        });
      }

      closeDialog();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to change warehouse status.",
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
              You do not have permission to view warehouses.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!companyId) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <p className="text-sm font-semibold text-danger">
              Company context unavailable
            </p>

            <p className="mt-1 text-sm text-danger">
              Your authenticated company could not be determined.
              Please sign in again.
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
          <div className="mb-1 text-xs font-medium text-ink-muted">
            Master Data / Warehouses
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Warehouses
              </h1>

              <p className="mt-1 text-sm text-ink-muted">
                Manage warehouses used to store and
                manage inventory.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={() =>
                  router.push("/warehouses/new")
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <PlusIcon />
                New Warehouse
              </button>
            )}
          </div>
        </div>

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
                placeholder="Search by code, name or location..."
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

        {loading && (
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-slate-700" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading warehouses...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <div className="flex items-start gap-3">
              <div className="text-danger">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-danger">
                  Unable to load warehouses
                </p>

                <p className="mt-1 text-sm text-danger">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadWarehouses}
                  className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          filteredWarehouses.length === 0 && (
            <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-active text-xl text-ink-muted">
                W
              </div>

              <h2 className="mt-4 text-base font-semibold text-ink">
                No warehouses found
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                {search ||
                statusFilter !== "All Statuses"
                  ? "No warehouses match your current search or filter."
                  : "Create your first warehouse to get started."}
              </p>

              {!search &&
                statusFilter ===
                  "All Statuses" &&
                canCreate && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/warehouses/new")
                    }
                    className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    Create Warehouse
                  </button>
                )}
            </div>
          )}

        {!loading &&
          !error &&
          filteredWarehouses.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="border-b border-line bg-surface-hover">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Code
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Warehouse
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Address
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
                    {filteredWarehouses.map(
                      (warehouse) => (
                        <tr
                          key={warehouse.id}
                          className="transition hover:bg-surface-hover"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-medium text-ink-secondary">
                              {warehouse.code}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm font-semibold text-ink">
                              {warehouse.name}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-ink-secondary">
                            {warehouse.addressLine1 ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-ink-secondary">
                            {[
                              warehouse.city,
                              warehouse.state,
                              warehouse.country,
                            ]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              active={warehouse.active}
                              className="px-3 py-1.5"
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {canView && (
                                <IconButton
                                  label="View"
                                  onClick={() =>
                                    router.push(
                                      `/warehouses/view?id=${encodeURIComponent(
                                        warehouse.id
                                      )}`
                                    )
                                  }
                                >
                                  <EyeIcon />
                                </IconButton>
                              )}

                              {canUpdate && (
                                <IconButton
                                  label="Edit"
                                  onClick={() =>
                                    router.push(
                                      `/warehouses/view?id=${encodeURIComponent(
                                        warehouse.id
                                      )}&edit=true`
                                    )
                                  }
                                >
                                  <EditIcon />
                                </IconButton>
                              )}

                              {canDelete && (
                                <IconButton
                                  label={
                                    warehouse.active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                  onClick={() =>
                                    openStatusDialog(
                                      warehouse
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
            </div>
          )}

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
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        )}

        {dialogType && dialogWarehouse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    {dialogType === "deactivate"
                      ? "Deactivate Warehouse"
                      : "Activate Warehouse"}
                  </h2>

                  <p className="mt-1 text-sm text-ink-muted">
                    {dialogType === "deactivate"
                      ? `Deactivate ${dialogWarehouse.name}?`
                      : `Activate ${dialogWarehouse.name}?`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={actionLoading}
                  className="text-ink-muted hover:text-ink-secondary disabled:opacity-50"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={actionLoading}
                  className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmStatusChange}
                  disabled={actionLoading}
                  className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading
                    ? "Saving..."
                    : dialogType === "deactivate"
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