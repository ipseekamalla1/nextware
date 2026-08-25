"use client";

import {
  useEffect,
  useState,
  Suspense,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  getWarehouse,
  updateWarehouse,
  Warehouse,
  WarehouseCreateRequest,
} from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";

const COMPANY_ID =
  "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

function DisplayField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary-400"
      />
    </div>
  );
}

function toForm(
  warehouse: Warehouse
): WarehouseCreateRequest {
  return {
    companyId: warehouse.companyId,
    code: warehouse.code,
    name: warehouse.name,
    addressLine1: warehouse.addressLine1,
    addressLine2: warehouse.addressLine2,
    city: warehouse.city,
    state: warehouse.state,
    postalCode: warehouse.postalCode,
    country: warehouse.country,
    active: warehouse.active,
  };
}

function WarehouseViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const warehouseId =
    searchParams.get("id");

  const editFromQuery =
    searchParams.get("edit") === "true";

  const [warehouse, setWarehouse] =
    useState<Warehouse | null>(null);

  const [form, setForm] =
    useState<WarehouseCreateRequest | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showEdit, setShowEdit] =
    useState(editFromQuery);

  const [error, setError] =
    useState<string | null>(null);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
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

        const data = await getWarehouse(
          COMPANY_ID,
          warehouseId
        );

        setWarehouse(data);
        setForm(toForm(data));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load warehouse."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [warehouseId]);

  function updateField(
    field: keyof WarehouseCreateRequest,
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
    if (!warehouse) {
      return;
    }

    setForm(toForm(warehouse));
    setSaveError(null);
    setShowEdit(true);
  }

  function closeEdit() {
    if (saving) {
      return;
    }

    setShowEdit(false);
    setSaveError(null);

    if (warehouse) {
      setForm(toForm(warehouse));
    }
  }

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!warehouseId || !form) {
      return;
    }

    if (!form.code.trim()) {
      setSaveError(
        "Warehouse Code is required."
      );
      return;
    }

    if (!form.name.trim()) {
      setSaveError(
        "Warehouse Name is required."
      );
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const updated =
        await updateWarehouse(
          COMPANY_ID,
          warehouseId,
          {
            ...form,
            companyId: COMPANY_ID,
            code: form.code.trim(),
            name: form.name.trim(),
            addressLine1:
              form.addressLine1?.trim() ||
              null,
            addressLine2:
              form.addressLine2?.trim() ||
              null,
            city:
              form.city?.trim() || null,
            state:
              form.state?.trim() || null,
            postalCode:
              form.postalCode?.trim() ||
              null,
            country:
              form.country?.trim() || null,
            active: form.active,
          }
        );

      setWarehouse(updated);
      setForm(toForm(updated));
      setShowEdit(false);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to update warehouse."
      );
    } finally {
      setSaving(false);
    }
  }

  function openLocations() {
    if (!warehouseId) {
      return;
    }

    router.push(
      `/warehouse-locations?warehouseId=${encodeURIComponent(
        warehouseId
      )}`
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
            Master Data / Warehouses / View
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Warehouse Details
          </h1>

          <p className="mt-1 text-sm text-ink-muted">
            View and manage warehouse information.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-slate-700" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading warehouse...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10 text-danger">
            <p className="text-sm font-semibold">
              Unable to load warehouse
            </p>

            <p className="mt-1 text-sm">
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

        {!loading &&
          !error &&
          warehouse && (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-line px-6 py-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-ink">
                      {warehouse.name}
                    </h2>

                    <StatusBadge
                      active={warehouse.active}
                      className="px-3 py-1.5"
                    />
                  </div>

                  <p className="mt-1 font-mono text-sm text-ink-muted">
                    {warehouse.code}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openLocations}
                    className="rounded-lg border border-primary-600 bg-surface px-4 py-2.5 text-sm font-semibold text-primary-600 hover:bg-primary-50"
                  >
                    View Locations
                  </button>

                  <button
                    type="button"
                    onClick={openEdit}
                    className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    Edit Warehouse
                  </button>
                </div>
              </div>

              <div className="space-y-8 p-6">
                <section>
                  <h3 className="mb-5 border-b border-line pb-3 text-base font-semibold text-ink">
                    Warehouse Information
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <DisplayField
                      label="Warehouse Code"
                      value={warehouse.code}
                    />

                    <DisplayField
                      label="Warehouse Name"
                      value={warehouse.name}
                    />

                    <DisplayField
                      label="Status"
                      value={
                        warehouse.active
                          ? "Active"
                          : "Inactive"
                      }
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-5 border-b border-line pb-3 text-base font-semibold text-ink">
                    Address
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <DisplayField
                      label="Address Line 1"
                      value={
                        warehouse.addressLine1
                      }
                    />

                    <DisplayField
                      label="Address Line 2"
                      value={
                        warehouse.addressLine2
                      }
                    />

                    <DisplayField
                      label="City"
                      value={warehouse.city}
                    />

                    <DisplayField
                      label="Province / State"
                      value={warehouse.state}
                    />

                    <DisplayField
                      label="Postal Code"
                      value={
                        warehouse.postalCode
                      }
                    />

                    <DisplayField
                      label="Country"
                      value={
                        warehouse.country
                      }
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-5 border-b border-line pb-3 text-base font-semibold text-ink">
                    Record Information
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <DisplayField
                      label="Created"
                      value={new Date(
                        warehouse.createdAt
                      ).toLocaleString()}
                    />

                    <DisplayField
                      label="Last Updated"
                      value={new Date(
                        warehouse.updatedAt
                      ).toLocaleString()}
                    />

                    <DisplayField
                      label="Warehouse ID"
                      value={warehouse.id}
                    />
                  </div>
                </section>
              </div>
            </div>
          )}

        {showEdit &&
          warehouse &&
          form && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
              <div className="mx-auto w-full max-w-4xl rounded-xl bg-surface shadow-xl">
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">
                      Edit Warehouse
                    </h2>

                    <p className="mt-1 text-sm text-ink-muted">
                      Update warehouse information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={saving}
                    className="text-xl text-ink-muted hover:text-ink"
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
                      label="Warehouse Code"
                      value={form.code}
                      onChange={(value) =>
                        updateField(
                          "code",
                          value
                        )
                      }
                    />

                    <InputField
                      label="Warehouse Name"
                      value={form.name}
                      onChange={(value) =>
                        updateField(
                          "name",
                          value
                        )
                      }
                    />

                    <InputField
                      label="Address Line 1"
                      value={
                        form.addressLine1 ??
                        ""
                      }
                      onChange={(value) =>
                        updateField(
                          "addressLine1",
                          value
                        )
                      }
                    />

                    <InputField
                      label="Address Line 2"
                      value={
                        form.addressLine2 ??
                        ""
                      }
                      onChange={(value) =>
                        updateField(
                          "addressLine2",
                          value
                        )
                      }
                    />

                    <InputField
                      label="City"
                      value={
                        form.city ?? ""
                      }
                      onChange={(value) =>
                        updateField(
                          "city",
                          value
                        )
                      }
                    />

                    <InputField
                      label="Province / State"
                      value={
                        form.state ?? ""
                      }
                      onChange={(value) =>
                        updateField(
                          "state",
                          value
                        )
                      }
                    />

                    <InputField
                      label="Postal Code"
                      value={
                        form.postalCode ??
                        ""
                      }
                      onChange={(value) =>
                        updateField(
                          "postalCode",
                          value
                        )
                      }
                    />

                    <InputField
                      label="Country"
                      value={
                        form.country ??
                        ""
                      }
                      onChange={(value) =>
                        updateField(
                          "country",
                          value
                        )
                      }
                    />

                    <label className="flex items-center gap-3">
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
                            event.target
                              .checked
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm font-medium text-ink-secondary">
                        Active warehouse
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
                      onClick={closeEdit}
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

export default function WarehouseViewPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-8 text-sm text-ink-muted">
            Loading warehouse...
          </div>
        </AppShell>
      }
    >
      <WarehouseViewContent />
    </Suspense>
  );
}