"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  createCustomer,
  CustomerCreateRequest,
} from "@/lib/api";

const COMPANY_ID =
  "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

const initialForm: CustomerCreateRequest = {
  companyId: COMPANY_ID,
  customerCode: "",
  name: "",
  email: "",
  phone: "",

  billingAddressLine1: "",
  billingAddressLine2: "",
  billingCity: "",
  billingState: "",
  billingPostalCode: "",
  billingCountry: "Canada",

  shippingAddressLine1: "",
  shippingAddressLine2: "",
  shippingCity: "",
  shippingState: "",
  shippingPostalCode: "",
  shippingCountry: "Canada",

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

export default function NewCustomerPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<CustomerCreateRequest>({
      ...initialForm,
    });

  const [saving, setSaving] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  function updateField(
    field: keyof CustomerCreateRequest,
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

    if (!form.customerCode.trim()) {
      setError("Customer Code is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Customer Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const customer =
        await createCustomer({
          ...form,
          companyId: COMPANY_ID,
          customerCode:
            form.customerCode.trim(),
          name: form.name.trim(),
          email:
            form.email?.trim() || null,
          phone:
            form.phone?.trim() || null,

          billingAddressLine1:
            form.billingAddressLine1?.trim() ||
            null,
          billingAddressLine2:
            form.billingAddressLine2?.trim() ||
            null,
          billingCity:
            form.billingCity?.trim() || null,
          billingState:
            form.billingState?.trim() || null,
          billingPostalCode:
            form.billingPostalCode?.trim() ||
            null,
          billingCountry:
            form.billingCountry?.trim() ||
            null,

          shippingAddressLine1:
            form.shippingAddressLine1?.trim() ||
            null,
          shippingAddressLine2:
            form.shippingAddressLine2?.trim() ||
            null,
          shippingCity:
            form.shippingCity?.trim() || null,
          shippingState:
            form.shippingState?.trim() || null,
          shippingPostalCode:
            form.shippingPostalCode?.trim() ||
            null,
          shippingCountry:
            form.shippingCountry?.trim() ||
            null,

          active: form.active,
        });

      router.push(
        `/customers/view?id=${encodeURIComponent(
          customer.id
        )}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create customer."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">

        {/* HEADER */}

        <div className="mb-6">
          <button
            type="button"
            onClick={() =>
              router.push("/customers")
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink"
          >
            <ArrowLeftIcon />
            Back to Customers
          </button>

          <div>
            <div className="mb-1 text-xs font-medium text-ink-muted">
              Master Data / Customers / New
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-ink">
              New Customer
            </h1>

            <p className="mt-1 text-sm text-ink-muted">
              Create a new customer record.
            </p>
          </div>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* BASIC INFORMATION */}

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Customer Information"
              description="Basic customer identification and contact information."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Customer Code"
                value={form.customerCode}
                onChange={(value) =>
                  updateField(
                    "customerCode",
                    value
                  )
                }
                required
                placeholder="CUST-001"
              />

              <InputField
                label="Customer Name"
                value={form.name}
                onChange={(value) =>
                  updateField("name", value)
                }
                required
                placeholder="Customer name"
              />

              <InputField
                label="Email"
                value={form.email ?? ""}
                onChange={(value) =>
                  updateField("email", value)
                }
                type="email"
                placeholder="customer@example.com"
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

          {/* BILLING */}

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Billing Address"
              description="Customer billing address."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <InputField
                  label="Address Line 1"
                  value={
                    form.billingAddressLine1 ??
                    ""
                  }
                  onChange={(value) =>
                    updateField(
                      "billingAddressLine1",
                      value
                    )
                  }
                />
              </div>

              <div className="md:col-span-2">
                <InputField
                  label="Address Line 2"
                  value={
                    form.billingAddressLine2 ??
                    ""
                  }
                  onChange={(value) =>
                    updateField(
                      "billingAddressLine2",
                      value
                    )
                  }
                />
              </div>

              <InputField
                label="City"
                value={form.billingCity ?? ""}
                onChange={(value) =>
                  updateField(
                    "billingCity",
                    value
                  )
                }
              />

              <InputField
                label="Province / State"
                value={
                  form.billingState ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "billingState",
                    value
                  )
                }
              />

              <InputField
                label="Postal Code"
                value={
                  form.billingPostalCode ??
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "billingPostalCode",
                    value
                  )
                }
              />

              <InputField
                label="Country"
                value={
                  form.billingCountry ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "billingCountry",
                    value
                  )
                }
              />
            </div>
          </div>

          {/* SHIPPING */}

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Shipping Address"
              description="Customer shipping and delivery address."
            />

            <div className="mb-5">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    form.shippingAddressLine1 ===
                      form.billingAddressLine1 &&
                    form.shippingAddressLine2 ===
                      form.billingAddressLine2 &&
                    form.shippingCity ===
                      form.billingCity &&
                    form.shippingState ===
                      form.billingState &&
                    form.shippingPostalCode ===
                      form.billingPostalCode &&
                    form.shippingCountry ===
                      form.billingCountry
                  }
                  onChange={(event) => {
                    if (
                      event.target.checked
                    ) {
                      setForm((current) => ({
                        ...current,
                        shippingAddressLine1:
                          current.billingAddressLine1,
                        shippingAddressLine2:
                          current.billingAddressLine2,
                        shippingCity:
                          current.billingCity,
                        shippingState:
                          current.billingState,
                        shippingPostalCode:
                          current.billingPostalCode,
                        shippingCountry:
                          current.billingCountry,
                      }));
                    }
                  }}
                  className="h-4 w-4 rounded border-line-strong"
                />

                <span className="text-sm font-medium text-ink-secondary">
                  Same as billing address
                </span>
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <InputField
                  label="Address Line 1"
                  value={
                    form.shippingAddressLine1 ??
                    ""
                  }
                  onChange={(value) =>
                    updateField(
                      "shippingAddressLine1",
                      value
                    )
                  }
                />
              </div>

              <div className="md:col-span-2">
                <InputField
                  label="Address Line 2"
                  value={
                    form.shippingAddressLine2 ??
                    ""
                  }
                  onChange={(value) =>
                    updateField(
                      "shippingAddressLine2",
                      value
                    )
                  }
                />
              </div>

              <InputField
                label="City"
                value={
                  form.shippingCity ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "shippingCity",
                    value
                  )
                }
              />

              <InputField
                label="Province / State"
                value={
                  form.shippingState ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "shippingState",
                    value
                  )
                }
              />

              <InputField
                label="Postal Code"
                value={
                  form.shippingPostalCode ??
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "shippingPostalCode",
                    value
                  )
                }
              />

              <InputField
                label="Country"
                value={
                  form.shippingCountry ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "shippingCountry",
                    value
                  )
                }
              />
            </div>
          </div>

          {/* STATUS */}

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <SectionTitle
              title="Status"
              description="Control whether this customer is currently active."
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
                  Active customer
                </div>

                <div className="text-xs text-ink-muted">
                  Active customers are available for business transactions.
                </div>
              </div>
            </label>
          </div>

          {/* ERROR */}

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

          {/* ACTIONS */}

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                router.push("/customers")
              }
              disabled={saving}
              className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-surface-hover disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                "Creating..."
              ) : (
                <>
                  <CheckIcon />
                  Create Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}