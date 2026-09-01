"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  createSupplier,
  SupplierCreateRequest,
} from "@/lib/api";
import {
  getCurrentCompanyId,
  hasPermission,
} from "@/lib/auth";

const initialForm: SupplierCreateRequest = {
  companyId: "",
  supplierCode: "",
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Canada",
  active: true,
};

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
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

function InputField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
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
        type={type}
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

export default function NewSupplierPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<SupplierCreateRequest>({
      ...initialForm,
    });

  const [saving, setSaving] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const canCreate = hasPermission(
    "SUPPLIER_CREATE"
  );

  function updateField(
    field: keyof SupplierCreateRequest,
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
      setError(
        "You do not have permission to create suppliers."
      );
      return;
    }

    const companyId = getCurrentCompanyId();

    if (!companyId) {
      setError(
        "Your authenticated company could not be determined. Please sign in again."
      );
      return;
    }

    if (!form.supplierCode.trim()) {
      setError("Supplier Code is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Supplier Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supplier =
        await createSupplier({
          ...form,
          companyId,
          supplierCode:
            form.supplierCode.trim(),
          name: form.name.trim(),
          email:
            form.email?.trim() || null,
          phone:
            form.phone?.trim() || null,
          addressLine1:
            form.addressLine1?.trim() || null,
          addressLine2:
            form.addressLine2?.trim() || null,
          city:
            form.city?.trim() || null,
          state:
            form.state?.trim() || null,
          postalCode:
            form.postalCode?.trim() || null,
          country:
            form.country?.trim() || null,
          active: form.active,
        });

      router.push(
        `/suppliers/view?id=${encodeURIComponent(
          supplier.id
        )}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create supplier."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canCreate) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <button
            type="button"
            onClick={() =>
              router.push("/suppliers")
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink"
          >
            <ArrowLeftIcon />
            Back to Suppliers
          </button>

          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <div className="flex items-start gap-3">
              <div className="text-danger">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-danger">
                  Access Denied
                </p>

                <p className="mt-1 text-sm text-danger">
                  You do not have permission to create suppliers.
                </p>
              </div>
            </div>
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
              router.push("/suppliers")
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink"
          >
            <ArrowLeftIcon />
            Back to Suppliers
          </button>

          <div>
            <div className="mb-1 text-xs font-medium text-ink-muted">
              Master Data / Suppliers / New
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-ink">
              New Supplier
            </h1>

            <p className="mt-1 text-sm text-ink-muted">
              Create a new supplier record.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Supplier Information"
              description="Basic supplier identification and contact information."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Supplier Code"
                value={form.supplierCode}
                onChange={(value) =>
                  updateField(
                    "supplierCode",
                    value
                  )
                }
                required
                placeholder="SUP-001"
              />

              <InputField
                label="Supplier Name"
                value={form.name}
                onChange={(value) =>
                  updateField("name", value)
                }
                required
                placeholder="Supplier name"
              />

              <InputField
                label="Email"
                value={form.email ?? ""}
                onChange={(value) =>
                  updateField("email", value)
                }
                type="email"
                placeholder="supplier@example.com"
              />

              <InputField
                label="Phone"
                value={form.phone ?? ""}
                onChange={(value) =>
                  updateField("phone", value)
                }
                placeholder="905-555-1234"
              />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Address"
              description="Supplier mailing and business address."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <InputField
                  label="Address Line 1"
                  value={
                    form.addressLine1 ?? ""
                  }
                  onChange={(value) =>
                    updateField(
                      "addressLine1",
                      value
                    )
                  }
                />
              </div>

              <div className="md:col-span-2">
                <InputField
                  label="Address Line 2"
                  value={
                    form.addressLine2 ?? ""
                  }
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
              />

              <InputField
                label="Province / State"
                value={form.state ?? ""}
                onChange={(value) =>
                  updateField("state", value)
                }
              />

              <InputField
                label="Postal Code"
                value={
                  form.postalCode ?? ""
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
                value={form.country ?? ""}
                onChange={(value) =>
                  updateField(
                    "country",
                    value
                  )
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Status"
              description="Control whether this supplier is currently active."
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
                  Active supplier
                </div>

                <div className="text-xs text-ink-muted">
                  Active suppliers are available for business transactions.
                </div>
              </div>
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger-soft px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="text-danger">
                  <AlertIcon />
                </div>

                <div className="text-sm text-danger">
                  {error}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                router.push("/suppliers")
              }
              disabled={saving}
              className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-surface-hover disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              <CheckIcon />
              {saving
                ? "Creating..."
                : "Create Supplier"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}