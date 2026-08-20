"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  getWarehouseLocation,
  updateWarehouseLocation,
  WarehouseLocation,
  WarehouseLocationCreateRequest,
} from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";

const LOCATION_TYPES = [
  "RECEIVING",
  "STORAGE",
  "PICKING",
  "PACKING",
  "SHIPPING",
  "QUARANTINE",
  "DAMAGED",
];

function DisplayField({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | null
    | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>

      <p className="mt-1.5 text-sm text-ink-secondary">
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
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}

        {required && (
          <span className="text-danger">
            {" "}
            *
          </span>
        )}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        required={required}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary-400"
      />
    </div>
  );
}

function toForm(
  location: WarehouseLocation
): WarehouseLocationCreateRequest {
  return {
    warehouseId:
      location.warehouseId,
    code: location.code,
    name: location.name,
    locationType:
      location.locationType,
    active: location.active,
  };
}

function WarehouseLocationViewContent() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const locationId =
    searchParams.get("id");

  const warehouseId =
    searchParams.get(
      "warehouseId"
    );

  const editFromQuery =
    searchParams.get(
      "edit"
    ) === "true";

  const [
    location,
    setLocation,
  ] =
    useState<WarehouseLocation | null>(
      null
    );

  const [form, setForm] =
    useState<WarehouseLocationCreateRequest | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showEdit, setShowEdit] =
    useState(editFromQuery);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [saveError, setSaveError] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    async function load() {
      if (!locationId) {
        setError(
          "Location ID is missing."
        );
        setLoading(false);
        return;
      }

      if (!warehouseId) {
        setError(
          "Warehouse ID is missing."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data =
          await getWarehouseLocation(
            warehouseId,
            locationId
          );

        setLocation(data);
        setForm(toForm(data));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load warehouse location."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [
    locationId,
    warehouseId,
  ]);

  function updateField(
    field: keyof WarehouseLocationCreateRequest,
    value: string | boolean
  ) {
    setForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  }

  function openEdit() {
    if (!location) {
      return;
    }

    setForm(toForm(location));
    setSaveError(null);
    setShowEdit(true);
  }

  function closeEdit() {
    if (saving) {
      return;
    }

    setShowEdit(false);
    setSaveError(null);

    if (location) {
      setForm(
        toForm(location)
      );
    }
  }

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !locationId ||
      !warehouseId ||
      !form
    ) {
      return;
    }

    if (!form.code.trim()) {
      setSaveError(
        "Location Code is required."
      );
      return;
    }

    if (!form.locationType) {
      setSaveError(
        "Location Type is required."
      );
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const updated =
        await updateWarehouseLocation(
          warehouseId,
          locationId,
          {
            warehouseId,
            code:
              form.code.trim(),
            name:
              form.name?.trim() ||
              null,
            locationType:
              form.locationType,
            active:
              form.active,
          }
        );

      setLocation(updated);
      setForm(
        toForm(updated)
      );
      setShowEdit(false);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to update warehouse location."
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
            onClick={() =>
              router.push(
                `/warehouse-locations?warehouseId=${encodeURIComponent(
                  warehouseId || ""
                )}`
              )
            }
            className="mb-5 text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Back to Locations
          </button>

          <div className="mb-1 text-xs font-medium text-ink-muted">
            Master Data / Warehouse Locations / View
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Warehouse Location Details
          </h1>

          <p className="mt-1 text-sm text-ink-muted">
            View and manage warehouse location information.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-slate-700" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading warehouse location...
            </p>
          </div>
        )}

        {!loading &&
          error && (
            <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10 text-danger">
              <p className="text-sm font-semibold">
                Unable to load warehouse location
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/warehouse-locations?warehouseId=${encodeURIComponent(
                      warehouseId || ""
                    )}`
                  )
                }
                className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Back to Locations
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          location && (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-line px-6 py-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-ink">
                      {location.name ||
                        location.code}
                    </h2>

                    <StatusBadge
                      active={
                        location.active
                      }
                      className="px-3 py-1.5"
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="font-mono text-sm text-ink-muted">
                      {location.code}
                    </span>

                    <span className="text-ink-muted">
                      •
                    </span>

                    <span className="text-sm text-ink-muted">
                      {
                        location.locationType
                      }
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openEdit}
                  className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Edit Location
                </button>
              </div>

              <div className="space-y-8 p-6">
                <section>
                  <h3 className="mb-5 border-b border-line pb-3 text-base font-semibold text-ink">
                    Location Information
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <DisplayField
                      label="Location Code"
                      value={
                        location.code
                      }
                    />

                    <DisplayField
                      label="Location Name"
                      value={
                        location.name
                      }
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
                </section>

                <section>
                  <h3 className="mb-5 border-b border-line pb-3 text-base font-semibold text-ink">
                    Warehouse
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    <DisplayField
                      label="Warehouse ID"
                      value={
                        location.warehouseId
                      }
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-5 border-b border-line pb-3 text-base font-semibold text-ink">
                    Record Information
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    <DisplayField
                      label="Created"
                      value={
                        location.createdAt
                          ? new Date(
                              location.createdAt
                            ).toLocaleString()
                          : null
                      }
                    />

                    <DisplayField
                      label="Last Updated"
                      value={
                        location.updatedAt
                          ? new Date(
                              location.updatedAt
                            ).toLocaleString()
                          : null
                      }
                    />
                  </div>
                </section>
              </div>
            </div>
          )}

        {showEdit &&
          location &&
          form && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
              <div className="mx-auto w-full max-w-2xl rounded-xl bg-surface shadow-xl">
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">
                      Edit Warehouse Location
                    </h2>

                    <p className="mt-1 text-sm text-ink-muted">
                      Update location information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeEdit
                    }
                    disabled={saving}
                    className="text-2xl text-ink-muted hover:text-ink disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={handleSave}
                  className="space-y-6 p-6"
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <InputField
                      label="Location Code"
                      value={
                        form.code
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "code",
                          value
                        )
                      }
                      required
                    />

                    <InputField
                      label="Location Name"
                      value={
                        form.name ??
                        ""
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "name",
                          value
                        )
                      }
                    />

                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                        Location Type
                        <span className="text-danger">
                          {" "}
                          *
                        </span>
                      </label>

                      <select
                        value={
                          form.locationType
                        }
                        onChange={(
                          event
                        ) =>
                          updateField(
                            "locationType",
                            event
                              .target
                              .value
                          )
                        }
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                        required
                      >
                        {LOCATION_TYPES.map(
                          (
                            type
                          ) => (
                            <option
                              key={
                                type
                              }
                              value={
                                type
                              }
                            >
                              {
                                type
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <label className="flex items-center gap-3 self-end pb-2">
                      <input
                        type="checkbox"
                        checked={
                          form.active
                        }
                        onChange={(
                          event
                        ) =>
                          updateField(
                            "active",
                            event
                              .target
                              .checked
                          )
                        }
                        className="h-4 w-4 rounded border-line-strong"
                      />

                      <span className="text-sm font-medium text-ink-secondary">
                        Active location
                      </span>
                    </label>
                  </div>

                  {saveError && (
                    <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                      {saveError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={
                        closeEdit
                      }
                      disabled={
                        saving
                      }
                      className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        saving
                      }
                      className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
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
      </div>
    </AppShell>
  );
}

export default function WarehouseLocationViewPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-8 text-sm text-ink-muted">
            Loading warehouse location...
          </div>
        </AppShell>
      }
    >
      <WarehouseLocationViewContent />
    </Suspense>
  );
}