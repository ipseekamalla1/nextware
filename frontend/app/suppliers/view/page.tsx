"use client";

import { useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  getSupplier,
  Supplier,
  SupplierCreateRequest,
  updateSupplier,
} from "@/lib/api";

const COMPANY_ID =
  "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

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

function EditIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function CheckIcon() {
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
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
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

function XIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
      />
    </div>
  );
}

function DisplayField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 text-sm text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

function toForm(
  supplier: Supplier
): SupplierCreateRequest {
  return {
    companyId: supplier.companyId,
    supplierCode: supplier.supplierCode,
    name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    addressLine1: supplier.addressLine1,
    addressLine2: supplier.addressLine2,
    city: supplier.city,
    state: supplier.state,
    postalCode: supplier.postalCode,
    country: supplier.country,
    active: supplier.active,
  };
}

export default function SupplierViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supplierId =
    searchParams.get("id");

  const editFromQuery =
    searchParams.get("edit") === "true";

  const [supplier, setSupplier] =
    useState<Supplier | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [showEdit, setShowEdit] =
    useState(editFromQuery);

  const [form, setForm] =
    useState<SupplierCreateRequest | null>(
      null
    );

  const [saving, setSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSupplier() {
      if (!supplierId) {
        setError("Supplier ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getSupplier(
          COMPANY_ID,
          supplierId
        );

        if (!cancelled) {
          setSupplier(data);
          setForm(toForm(data));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load supplier."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSupplier();

    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  function openEdit() {
    if (!supplier) {
      return;
    }

    setSaveError(null);
    setForm(toForm(supplier));
    setShowEdit(true);
  }

  function closeEdit() {
    if (saving) {
      return;
    }

    setShowEdit(false);
    setSaveError(null);

    if (supplier) {
      setForm(toForm(supplier));
    }
  }

  function updateField(
    field: keyof SupplierCreateRequest,
    value: string | boolean
  ) {
    setForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!supplierId || !form) {
      return;
    }

    if (!form.supplierCode.trim()) {
      setSaveError(
        "Supplier Code is required."
      );
      return;
    }

    if (!form.name.trim()) {
      setSaveError(
        "Supplier Name is required."
      );
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const updated =
        await updateSupplier(
          COMPANY_ID,
          supplierId,
          {
            ...form,
            companyId: COMPANY_ID,
            supplierCode:
              form.supplierCode.trim(),
            name: form.name.trim(),
            email:
              form.email?.trim() || null,
            phone:
              form.phone?.trim() || null,
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

      setSupplier(updated);
      setForm(toForm(updated));
      setShowEdit(false);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to update supplier."
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
              router.push("/suppliers")
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeftIcon />
            Back to Suppliers
          </button>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-400">
              Master Data / Suppliers / View
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Supplier Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage supplier information.
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />

            <p className="mt-4 text-sm text-slate-500">
              Loading supplier...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10">
            <div className="flex items-start gap-3">
              <div className="text-red-600">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Unable to load supplier
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/suppliers")
                  }
                  className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Back to Suppliers
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          supplier && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {supplier.name}
                    </h2>

                    <span
                      className={
                        supplier.active
                          ? "inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                          : "inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                      }
                    >
                      {supplier.active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-1 font-mono text-sm text-slate-400">
                    {supplier.supplierCode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  <EditIcon />
                  Edit Supplier
                </button>
              </div>

              <div className="space-y-8 p-6">
                <section>
                  <h3 className="mb-5 border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">
                    Supplier Information
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <DisplayField
                      label="Supplier Code"
                      value={
                        supplier.supplierCode
                      }
                    />

                    <DisplayField
                      label="Supplier Name"
                      value={supplier.name}
                    />

                    <DisplayField
                      label="Email"
                      value={supplier.email}
                    />

                    <DisplayField
                      label="Phone"
                      value={supplier.phone}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-5 border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">
                    Address
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <DisplayField
                      label="Address Line 1"
                      value={
                        supplier.addressLine1
                      }
                    />

                    <DisplayField
                      label="Address Line 2"
                      value={
                        supplier.addressLine2
                      }
                    />

                    <DisplayField
                      label="City"
                      value={supplier.city}
                    />

                    <DisplayField
                      label="Province / State"
                      value={supplier.state}
                    />

                    <DisplayField
                      label="Postal Code"
                      value={
                        supplier.postalCode
                      }
                    />

                    <DisplayField
                      label="Country"
                      value={supplier.country}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-5 border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">
                    Record Information
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <DisplayField
                      label="Status"
                      value={
                        supplier.active
                          ? "Active"
                          : "Inactive"
                      }
                    />

                    <DisplayField
                      label="Created"
                      value={new Date(
                        supplier.createdAt
                      ).toLocaleString()}
                    />

                    <DisplayField
                      label="Last Updated"
                      value={new Date(
                        supplier.updatedAt
                      ).toLocaleString()}
                    />
                  </div>
                </section>
              </div>
            </div>
          )}

        {showEdit &&
          supplier &&
          form && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 px-4 py-8">
              <div className="mx-auto w-full max-w-4xl rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Edit Supplier
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Update supplier information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={saving}
                    className="text-slate-400 hover:text-slate-700 disabled:opacity-50"
                  >
                    <XIcon />
                  </button>
                </div>

                <form
                  onSubmit={handleSave}
                  className="space-y-6 p-6"
                >
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">
                      Supplier Information
                    </h3>

                    <div className="grid gap-5 md:grid-cols-2">
                      <InputField
                        label="Supplier Code"
                        value={
                          form.supplierCode
                        }
                        onChange={(value) =>
                          updateField(
                            "supplierCode",
                            value
                          )
                        }
                      />

                      <InputField
                        label="Supplier Name"
                        value={form.name}
                        onChange={(value) =>
                          updateField(
                            "name",
                            value
                          )
                        }
                      />

                      <InputField
                        label="Email"
                        value={
                          form.email ?? ""
                        }
                        onChange={(value) =>
                          updateField(
                            "email",
                            value
                          )
                        }
                        type="email"
                      />

                      <InputField
                        label="Phone"
                        value={
                          form.phone ?? ""
                        }
                        onChange={(value) =>
                          updateField(
                            "phone",
                            value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">
                      Address
                    </h3>

                    <div className="grid gap-5 md:grid-cols-2">
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
                        value={form.city ?? ""}
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
                        value={
                          form.country ?? ""
                        }
                        onChange={(value) =>
                          updateField(
                            "country",
                            value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
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
                        className="h-4 w-4 rounded border-slate-300"
                      />

                      <span className="text-sm font-medium text-slate-700">
                        Active supplier
                      </span>
                    </label>
                  </div>

                  {saveError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="text-red-600">
                          <AlertIcon />
                        </div>

                        <div className="text-sm text-red-700">
                          {saveError}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      onClick={closeEdit}
                      disabled={saving}
                      className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      <CheckIcon />

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