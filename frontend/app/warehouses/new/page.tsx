"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  createWarehouse,
  WarehouseCreateRequest,
} from "@/lib/api";

const COMPANY_ID =
  "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

const initialForm: WarehouseCreateRequest = {
  companyId: COMPANY_ID,
  code: "",
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Canada",
  active: true,
};

function InputField({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
        {label}
        {required && (
          <span className="text-danger"> *</span>
        )}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
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

export default function NewWarehousePage() {
  const router = useRouter();

  const [form, setForm] =
    useState<WarehouseCreateRequest>({
      ...initialForm,
    });

  const [saving, setSaving] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  function updateField(
    field: keyof WarehouseCreateRequest,
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

    if (!form.code.trim()) {
      setError("Warehouse Code is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Warehouse Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const warehouse =
        await createWarehouse({
          ...form,
          companyId: COMPANY_ID,
          code: form.code.trim(),
          name: form.name.trim(),
          addressLine1:
            form.addressLine1?.trim() || null,
          addressLine2:
            form.addressLine2?.trim() || null,
          city: form.city?.trim() || null,
          state: form.state?.trim() || null,
          postalCode:
            form.postalCode?.trim() || null,
          country:
            form.country?.trim() || null,
          active: form.active,
        });

      router.push(
        `/warehouses/view?id=${encodeURIComponent(
          warehouse.id
        )}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create warehouse."
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
              router.push("/warehouses")
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Back to Warehouses
          </button>

          <div className="mb-1 text-xs font-medium text-ink-muted">
            Master Data / Warehouses / New
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">
            New Warehouse
          </h1>

          <p className="mt-1 text-sm text-ink-muted">
            Create a new warehouse record.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Warehouse Information"
              description="Basic warehouse identification."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Warehouse Code"
                value={form.code}
                onChange={(value) =>
                  updateField("code", value)
                }
                required
                placeholder="WH-001"
              />

              <InputField
                label="Warehouse Name"
                value={form.name}
                onChange={(value) =>
                  updateField("name", value)
                }
                required
                placeholder="Main Warehouse"
              />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Address"
              description="Warehouse physical address."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <InputField
                  label="Address Line 1"
                  value={form.addressLine1 ?? ""}
                  onChange={(value) =>
                    updateField(
                      "addressLine1",
                      value
                    )
                  }
                  placeholder="123 Industrial Road"
                />
              </div>

              <div className="md:col-span-2">
                <InputField
                  label="Address Line 2"
                  value={form.addressLine2 ?? ""}
                  onChange={(value) =>
                    updateField(
                      "addressLine2",
                      value
                    )
                  }
                />
              </div>

              <InputField
                label="City"
                value={form.city ?? ""}
                onChange={(value) =>
                  updateField("city", value)
                }
                placeholder="Milton"
              />

              <InputField
                label="Province / State"
                value={form.state ?? ""}
                onChange={(value) =>
                  updateField("state", value)
                }
                placeholder="Ontario"
              />

              <InputField
                label="Postal Code"
                value={form.postalCode ?? ""}
                onChange={(value) =>
                  updateField(
                    "postalCode",
                    value
                  )
                }
                placeholder="L9T 1A1"
              />

              <InputField
                label="Country"
                value={form.country ?? ""}
                onChange={(value) =>
                  updateField(
                    "country",
                    value
                  )
                }
                placeholder="Canada"
              />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Status"
              description="Control whether this warehouse is active."
            />

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.active}
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
                  Active warehouse
                </div>

                <div className="text-xs text-ink-muted">
                  Active warehouses can be used for
                  inventory operations.
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
                router.push("/warehouses")
              }
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
                ? "Creating..."
                : "Create Warehouse"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}