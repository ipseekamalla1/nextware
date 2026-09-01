"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  activateWarehouseLocation,
  deactivateWarehouseLocation,
  getWarehouseLocations,
  WarehouseLocation,
} from "@/lib/api";
import { getCurrentCompanyId, hasPermission } from "@/lib/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconButton } from "@/components/ui/IconButton";
import {
  EditIcon,
  EyeIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
} from "@/components/ui/icons";

const LOCATION_TYPES = [
  "RECEIVING",
  "STORAGE",
  "PICKING",
  "PACKING",
  "SHIPPING",
  "QUARANTINE",
  "DAMAGED",
];

type DialogType = "activate" | "deactivate" | null;

export default function WarehouseLocationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const warehouseId = searchParams.get("warehouseId");

  const canView = hasPermission("WAREHOUSE_LOCATION_VIEW");
  const canCreate = hasPermission("WAREHOUSE_LOCATION_CREATE");
  const canUpdate = hasPermission("WAREHOUSE_LOCATION_UPDATE");
  const canDelete = hasPermission("WAREHOUSE_LOCATION_DELETE");

  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogType, setDialogType] =
    useState<DialogType>(null);

  const [dialogLocation, setDialogLocation] =
    useState<WarehouseLocation | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!canView) {
      return;
    }

    if (!warehouseId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setError(null);
        }

        const currentCompanyId = getCurrentCompanyId();

        if (
          typeof currentCompanyId !== "string" ||
          currentCompanyId.trim() === ""
        ) {
          if (!cancelled) {
            setError(
              "Your authenticated company could not be determined. Please sign in again."
            );
            setLoading(false);
          }

          return;
        }

        const data = await getWarehouseLocations(
          warehouseId
        );

        if (!cancelled) {
          setLocations(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load warehouse locations."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [warehouseId, canView]);

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

  const filteredLocations = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesSearch =
        normalizedSearch === "" ||
        location.code
          .toLowerCase()
          .includes(normalizedSearch) ||
        (location.name ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        location.locationType
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesType =
        typeFilter === "All Types" ||
        location.locationType === typeFilter;

      const matchesStatus =
        statusFilter === "All Statuses" ||
        (statusFilter === "Active" &&
          location.active) ||
        (statusFilter === "Inactive" &&
          !location.active);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    locations,
    search,
    typeFilter,
    statusFilter,
  ]);

  function openStatusDialog(
    location: WarehouseLocation
  ) {
    if (!canDelete) {
      return;
    }

    setDialogLocation(location);

    setDialogType(
      location.active
        ? "deactivate"
        : "activate"
    );
  }

  function closeDialog() {
    if (actionLoading) {
      return;
    }

    setDialogType(null);
    setDialogLocation(null);
  }

  async function confirmStatusChange() {
    if (
      !dialogLocation ||
      !dialogType ||
      !warehouseId ||
      !canDelete
    ) {
      return;
    }

    const currentCompanyId =
      getCurrentCompanyId();

    if (
      typeof currentCompanyId !== "string" ||
      currentCompanyId.trim() === ""
    ) {
      setToast({
        type: "error",
        message:
          "Your authenticated company could not be determined. Please sign in again.",
      });
      return;
    }

    try {
      setActionLoading(true);

      if (dialogType === "deactivate") {
        await deactivateWarehouseLocation(
          warehouseId,
          dialogLocation.id
        );

        setLocations((current) =>
          current.map((location) =>
            location.id === dialogLocation.id
              ? {
                  ...location,
                  active: false,
                }
              : location
          )
        );

        setToast({
          type: "success",
          message:
            "Warehouse location deactivated successfully.",
        });
      } else {
        const updated =
          await activateWarehouseLocation(
            warehouseId,
            dialogLocation.id
          );

        setLocations((current) =>
          current.map((location) =>
            location.id === dialogLocation.id
              ? updated
              : location
          )
        );

        setToast({
          type: "success",
          message:
            "Warehouse location activated successfully.",
        });
      }

      setDialogType(null);
      setDialogLocation(null);
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to update location status.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function openNewLocation() {
    if (!warehouseId) {
      setError(
        "Warehouse ID is missing."
      );
      return;
    }

    if (!canCreate) {
      router.push("/403");
      return;
    }

    router.push(
      `/warehouse-locations/new?warehouseId=${encodeURIComponent(
        warehouseId
      )}`
    );
  }

  function openView(locationId: string) {
    if (!warehouseId) {
      return;
    }

    if (!canView) {
      router.push("/403");
      return;
    }

    router.push(
      `/warehouse-locations/view?id=${encodeURIComponent(
        locationId
      )}&warehouseId=${encodeURIComponent(
        warehouseId
      )}`
    );
  }

  function openEdit(locationId: string) {
    if (!warehouseId) {
      return;
    }

    if (!canUpdate) {
      router.push("/403");
      return;
    }

    router.push(
      `/warehouse-locations/view?id=${encodeURIComponent(
        locationId
      )}&warehouseId=${encodeURIComponent(
        warehouseId
      )}&edit=true`
    );
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
              You do not have permission to view warehouse locations.
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
            onClick={() =>
              router.push("/warehouses")
            }
            className="mb-5 text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Back to Warehouses
          </button>

          <div className="mb-1 text-xs font-medium text-ink-muted">
            Master Data / Warehouses / Locations
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Warehouse Locations
              </h1>

              <p className="mt-1 text-sm text-ink-muted">
                Manage receiving, storage, picking,
                packing and shipping locations.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={openNewLocation}
                disabled={!warehouseId}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusIcon />
                New Location
              </button>
            )}
          </div>
        </div>

        {warehouseId && (
          <div className="mb-5 rounded-xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
                  <SearchIcon />
                </div>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search locations..."
                  className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value
                  )
                }
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
              >
                <option>
                  All Types
                </option>

                {LOCATION_TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
              >
                <option>
                  All Statuses
                </option>

                <option>
                  Active
                </option>

                <option>
                  Inactive
                </option>
              </select>
            </div>
          </div>
        )}

        {!warehouseId && (
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <h2 className="text-base font-semibold text-ink">
              Select a warehouse
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
              Locations are managed per warehouse. Choose a warehouse to
              view and manage its locations.
            </p>

            <button
              type="button"
              onClick={() => router.push("/warehouses")}
              className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Go to Warehouses
            </button>
          </div>
        )}

        {warehouseId && loading && (
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading warehouse locations...
            </p>
          </div>
        )}

        {warehouseId && !loading && error && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <p className="text-sm font-semibold text-danger">
              Unable to load warehouse locations
            </p>

            <p className="mt-1 text-sm text-danger">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/warehouses")
              }
              className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Back to Warehouses
            </button>
          </div>
        )}

        {warehouseId &&
          !loading &&
          !error &&
          filteredLocations.length === 0 && (
            <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
              <h2 className="text-base font-semibold text-ink">
                No warehouse locations found
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                {search ||
                typeFilter !== "All Types" ||
                statusFilter !==
                  "All Statuses"
                  ? "No locations match your current filters."
                  : "Create your first warehouse location to get started."}
              </p>

              {!search &&
                typeFilter ===
                  "All Types" &&
                statusFilter ===
                  "All Statuses" &&
                canCreate && (
                  <button
                    type="button"
                    onClick={
                      openNewLocation
                    }
                    className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    Create Location
                  </button>
                )}
            </div>
          )}

        {warehouseId &&
          !loading &&
          !error &&
          filteredLocations.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="border-b border-line bg-surface-hover">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Code
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Name
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Location Type
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
                    {filteredLocations.map(
                      (location) => (
                        <tr
                          key={location.id}
                          className="transition hover:bg-surface-hover"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-medium text-ink-secondary">
                              {location.code}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-semibold text-ink">
                              {location.name ||
                                "—"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-md bg-surface-active px-2.5 py-1 text-xs font-medium text-ink-secondary">
                              {
                                location.locationType
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              active={
                                location.active
                              }
                              className="px-3 py-1.5"
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {canView && (
                                <IconButton
                                  label="View"
                                  onClick={() =>
                                    openView(
                                      location.id
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
                                    openEdit(
                                      location.id
                                    )
                                  }
                                >
                                  <EditIcon />
                                </IconButton>
                              )}

                              {canDelete && (
                                <IconButton
                                  label={
                                    location.active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                  onClick={() =>
                                    openStatusDialog(
                                      location
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

        {dialogType &&
          dialogLocation &&
          canDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-ink">
                  {dialogType ===
                  "deactivate"
                    ? "Deactivate Location"
                    : "Activate Location"}
                </h2>

                <p className="mt-2 text-sm text-ink-muted">
                  Are you sure you want to{" "}
                  {dialogType ===
                  "deactivate"
                    ? "deactivate"
                    : "activate"}{" "}
                  location{" "}
                  <strong>
                    {dialogLocation.code}
                  </strong>
                  ?
                </p>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={actionLoading}
                    className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      confirmStatusChange
                    }
                    disabled={actionLoading}
                    className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Saving..."
                      : dialogType ===
                        "deactivate"
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          )}

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-line bg-surface px-4 py-3 shadow-lg">
            <p
              className={`text-sm ${
                toast.type === "success"
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              {toast.message}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}