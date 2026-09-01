
"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  getCurrentCompanyId,
  hasPermission,
} from "@/lib/auth";
import {
  getWarehouseLocation,
  updateWarehouseLocation,
  WarehouseLocation,
  WarehouseLocationCreateRequest,
} from "@/lib/api";

function requireCompanyId(): string {
  const companyId = getCurrentCompanyId();

  if (
    typeof companyId !== "string" ||
    companyId.trim() === ""
  ) {
    throw new Error(
      "Company context is unavailable. Please sign in again."
    );
  }

  return companyId;
}

function DisplayField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </div>
  );
}

function toForm(location: WarehouseLocation) {
  return {
    code: location.code ?? "",
    name: location.name ?? "",
    locationType:
      location.locationType ?? "STORAGE",
    active: location.active ?? true,
  };
}

function WarehouseLocationViewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const locationId = searchParams.get("id");
  const warehouseId =
    searchParams.get("warehouseId");
  const editParam =
    searchParams.get("edit") === "true";

  const [location, setLocation] =
    useState<WarehouseLocation | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] =
    useState(editParam);

  const [form, setForm] = useState({
    code: "",
    name: "",
    locationType: "STORAGE",
    active: true,
  });

  const canView = useMemo(
    () =>
      hasPermission(
        "WAREHOUSE_LOCATION_VIEW"
      ),
    []
  );

  const canUpdate = useMemo(
    () =>
      hasPermission(
        "WAREHOUSE_LOCATION_UPDATE"
      ),
    []
  );

  useEffect(() => {
    if (
      !canView ||
      !warehouseId ||
      !locationId
    ) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        requireCompanyId();

        const data =
          await getWarehouseLocation(
            warehouseId,
            locationId
          );

        if (cancelled) {
          return;
        }

        setLocation(data);
        setForm(toForm(data));
        setError("");
        setLoading(false);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load warehouse location."
        );

        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    canView,
    warehouseId,
    locationId,
  ]);

  const handleSave = async () => {
    if (
      !warehouseId ||
      !locationId ||
      !canUpdate
    ) {
      return;
    }

    try {
      requireCompanyId();

      setSaving(true);
      setError("");

      const request: WarehouseLocationCreateRequest =
        {
          warehouseId,
          code: form.code.trim(),
          name: form.name.trim() || null,
          locationType: form.locationType,
          active: form.active,
        };

      const updated =
        await updateWarehouseLocation(
          warehouseId,
          locationId,
          request
        );

      setLocation(updated);
      setForm(toForm(updated));
      setEditOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update warehouse location."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">
              Access Denied
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              You do not have permission to view
              warehouse locations.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/warehouses")
              }
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Back to Warehouses
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!warehouseId || !locationId) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">
              Invalid Warehouse Location
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              The warehouse location information
              is missing.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/warehouses")
              }
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Back to Warehouses
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/warehouse-locations?warehouseId=${encodeURIComponent(
                      warehouseId
                    )}`
                  )
                }
                className="mb-3 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                ← Back to Locations
              </button>

              <h1 className="text-2xl font-semibold text-slate-900">
                Warehouse Location
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View warehouse location details.
              </p>
            </div>

            {location &&
              canUpdate &&
              !editOpen && (
                <button
                  type="button"
                  onClick={() =>
                    setEditOpen(true)
                  }
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Edit Location
                </button>
              )}
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                Loading warehouse location...
              </p>
            </div>
          ) : !location ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Warehouse location not found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                The requested warehouse location
                could not be found.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Location Information
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Basic information about this
                      warehouse location.
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      location.active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {location.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <DisplayField
                    label="Code"
                    value={location.code}
                  />

                  <DisplayField
                    label="Name"
                    value={location.name}
                  />

                  <DisplayField
                    label="Location Type"
                    value={
                      location.locationType
                    }
                  />

                  <DisplayField
                    label="Status"
                    value={
                      location.active
                        ? "Active"
                        : "Inactive"
                    }
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Warehouse
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Warehouse associated with this
                  location.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <DisplayField
                    label="Warehouse ID"
                    value={location.warehouseId}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Record Information
                </h2>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <DisplayField
                    label="Location ID"
                    value={location.id}
                  />

                  <DisplayField
                    label="Created At"
                    value={
                      location.createdAt
                        ? new Date(
                            location.createdAt
                          ).toLocaleString()
                        : null
                    }
                  />

                  <DisplayField
                    label="Updated At"
                    value={
                      location.updatedAt
                        ? new Date(
                            location.updatedAt
                          ).toLocaleString()
                        : null
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {editOpen &&
            location &&
            canUpdate && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Edit Location
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Update warehouse location
                      information.
                    </p>
                  </div>

                  <div className="space-y-5 px-6 py-5">
                    <InputField
                      label="Code"
                      value={form.code}
                      onChange={(value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            code: value,
                          })
                        )
                      }
                      required
                    />

                    <InputField
                      label="Name"
                      value={form.name}
                      onChange={(value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            name: value,
                          })
                        )
                      }
                    />

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Location Type
                      </label>

                      <select
                        value={
                          form.locationType
                        }
                        onChange={(event) =>
                          setForm(
                            (current) => ({
                              ...current,
                              locationType:
                                event.target
                                  .value,
                            })
                          )
                        }
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="RECEIVING">
                          Receiving
                        </option>

                        <option value="STORAGE">
                          Storage
                        </option>

                        <option value="PICKING">
                          Picking
                        </option>

                        <option value="PACKING">
                          Packing
                        </option>

                        <option value="SHIPPING">
                          Shipping
                        </option>

                        <option value="QUARANTINE">
                          Quarantine
                        </option>

                        <option value="DAMAGED">
                          Damaged
                        </option>
                      </select>
                    </div>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(event) =>
                          setForm(
                            (current) => ({
                              ...current,
                              active:
                                event.target
                                  .checked,
                            })
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />

                      <span className="text-sm font-medium text-slate-700">
                        Active
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setEditOpen(false)
                      }
                      disabled={saving}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={
                        saving ||
                        !form.code.trim()
                      }
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </AppShell>
  );
}

export default function WarehouseLocationViewPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-6">
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                Loading warehouse location...
              </p>
            </div>
          </div>
        </AppShell>
      }
    >
      <WarehouseLocationViewPageContent />
    </Suspense>
  );
}

