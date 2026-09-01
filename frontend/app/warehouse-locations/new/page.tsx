"use client";

import { useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  createWarehouseLocation,
  WarehouseLocationCreateRequest,
} from "@/lib/api";
import {
  getCurrentCompanyId,
  hasPermission,
} from "@/lib/auth";

const LOCATION_TYPES = [
  "RECEIVING",
  "STORAGE",
  "PICKING",
  "PACKING",
  "SHIPPING",
  "QUARANTINE",
  "DAMAGED",
];

function InputField({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
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
        placeholder={placeholder}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
      />
    </div>
  );
}

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

export default function NewWarehouseLocationPage() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const warehouseId =
    searchParams.get(
      "warehouseId"
    ) || "";

  const canCreate =
    hasPermission(
      "WAREHOUSE_LOCATION_CREATE"
    );

  const [form, setForm] =
    useState<WarehouseLocationCreateRequest>(
      {
        warehouseId,
        code: "",
        name: "",
        locationType:
          "STORAGE",
        active: true,
      }
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null
    );

  function updateField(
    field: keyof WarehouseLocationCreateRequest,
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

    if (!canCreate) {
      router.push("/403");
      return;
    }

    if (!warehouseId) {
      setError(
        "Warehouse ID is required."
      );
      return;
    }

    const currentCompanyId =
      getCurrentCompanyId();

    if (
      typeof currentCompanyId !== "string" ||
      currentCompanyId.trim() === ""
    ) {
      setError(
        "Your authenticated company could not be determined. Please sign in again."
      );
      return;
    }

    if (!form.code.trim()) {
      setError(
        "Location Code is required."
      );
      return;
    }

    if (!form.locationType) {
      setError(
        "Location Type is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const location =
        await createWarehouseLocation({
          warehouseId,
          code: form.code.trim(),
          name:
            form.name?.trim() ||
            null,
          locationType:
            form.locationType,
          active:
            form.active,
        });

      router.push(
        `/warehouse-locations/view?id=${encodeURIComponent(
          location.id
        )}&warehouseId=${encodeURIComponent(
          warehouseId
        )}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create warehouse location."
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
              You do not have permission to create warehouse locations.
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
              router.push(
                `/warehouse-locations?warehouseId=${encodeURIComponent(
                  warehouseId
                )}`
              )
            }
            className="mb-5 text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Back to Locations
          </button>

          <div className="mb-1 text-xs font-medium text-ink-muted">
            Master Data / Warehouse Locations / New
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">
            New Warehouse Location
          </h1>

          <p className="mt-1 text-sm text-ink-muted">
            Create a location within the selected warehouse.
          </p>
        </div>

        {!warehouseId && (
          <div className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger">
            Warehouse ID is missing. Return to the warehouse and open its locations.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Location Information"
              description="Define the warehouse location."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Location Code"
                value={form.code}
                onChange={(value) =>
                  updateField(
                    "code",
                    value
                  )
                }
                required
                placeholder="A-01-01"
              />

              <InputField
                label="Location Name"
                value={
                  form.name ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "name",
                    value
                  )
                }
                placeholder="Storage A-01-01"
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
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
                  onChange={(event) =>
                    updateField(
                      "locationType",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                  required
                >
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
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Status"
              description="Control whether this location is active."
            />

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={
                  form.active
                }
                onChange={(event) =>
                  updateField(
                    "active",
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-line-strong"
              />

              <div>
                <div className="text-sm font-medium text-ink-secondary">
                  Active location
                </div>

                <div className="text-xs text-ink-muted">
                  Active locations can be used for warehouse operations.
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
              onClick={() =>
                router.push(
                  `/warehouse-locations?warehouseId=${encodeURIComponent(
                    warehouseId
                  )}`
                )
              }
              disabled={saving}
              className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                !warehouseId
              }
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving
                ? "Creating..."
                : "Create Location"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}