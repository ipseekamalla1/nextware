"use client";

import { useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  Customer,
  CustomerCreateRequest,
  getCustomer,
  updateCustomer,
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

export default function CustomerViewPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const customerId =
    searchParams.get("id");

  const editFromQuery =
    searchParams.get("edit") === "true";

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [showEdit, setShowEdit] =
    useState(editFromQuery);

  const [form, setForm] =
    useState<CustomerCreateRequest | null>(
      null
    );

  const [saving, setSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomer() {
      if (!customerId) {
        setError("Customer ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getCustomer(
          COMPANY_ID,
          customerId
        );

        if (!cancelled) {
          setCustomer(data);

          setForm({
            companyId: data.companyId,
            customerCode: data.customerCode,
            name: data.name,
            email: data.email,
            phone: data.phone,

            billingAddressLine1:
              data.billingAddressLine1,
            billingAddressLine2:
              data.billingAddressLine2,
            billingCity:
              data.billingCity,
            billingState:
              data.billingState,
            billingPostalCode:
              data.billingPostalCode,
            billingCountry:
              data.billingCountry,

            shippingAddressLine1:
              data.shippingAddressLine1,
            shippingAddressLine2:
              data.shippingAddressLine2,
            shippingCity:
              data.shippingCity,
            shippingState:
              data.shippingState,
            shippingPostalCode:
              data.shippingPostalCode,
            shippingCountry:
              data.shippingCountry,

            active: data.active,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load customer."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCustomer();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  function openEdit() {
    if (!customer) {
      return;
    }

    setSaveError(null);

    setForm({
      companyId: customer.companyId,
      customerCode: customer.customerCode,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,

      billingAddressLine1:
        customer.billingAddressLine1,
      billingAddressLine2:
        customer.billingAddressLine2,
      billingCity:
        customer.billingCity,
      billingState:
        customer.billingState,
      billingPostalCode:
        customer.billingPostalCode,
      billingCountry:
        customer.billingCountry,

      shippingAddressLine1:
        customer.shippingAddressLine1,
      shippingAddressLine2:
        customer.shippingAddressLine2,
      shippingCity:
        customer.shippingCity,
      shippingState:
        customer.shippingState,
      shippingPostalCode:
        customer.shippingPostalCode,
      shippingCountry:
        customer.shippingCountry,

      active: customer.active,
    });

    setShowEdit(true);
  }

  function closeEdit() {
    if (saving) {
      return;
    }

    setShowEdit(false);
    setSaveError(null);

    if (customer) {
      setForm({
        companyId: customer.companyId,
        customerCode: customer.customerCode,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,

        billingAddressLine1:
          customer.billingAddressLine1,
        billingAddressLine2:
          customer.billingAddressLine2,
        billingCity:
          customer.billingCity,
        billingState:
          customer.billingState,
        billingPostalCode:
          customer.billingPostalCode,
        billingCountry:
          customer.billingCountry,

        shippingAddressLine1:
          customer.shippingAddressLine1,
        shippingAddressLine2:
          customer.shippingAddressLine2,
        shippingCity:
          customer.shippingCity,
        shippingState:
          customer.shippingState,
        shippingPostalCode:
          customer.shippingPostalCode,
        shippingCountry:
          customer.shippingCountry,

        active: customer.active,
      });
    }
  }

  function updateField(
    field: keyof CustomerCreateRequest,
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

    if (!customerId || !form) {
      return;
    }

    if (!form.customerCode.trim()) {
      setSaveError(
        "Customer Code is required."
      );
      return;
    }

    if (!form.name.trim()) {
      setSaveError(
        "Customer Name is required."
      );
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const updated =
        await updateCustomer(
          COMPANY_ID,
          customerId,
          {
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
          }
        );

      setCustomer(updated);

      setForm({
        companyId: updated.companyId,
        customerCode:
          updated.customerCode,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,

        billingAddressLine1:
          updated.billingAddressLine1,
        billingAddressLine2:
          updated.billingAddressLine2,
        billingCity:
          updated.billingCity,
        billingState:
          updated.billingState,
        billingPostalCode:
          updated.billingPostalCode,
        billingCountry:
          updated.billingCountry,

        shippingAddressLine1:
          updated.shippingAddressLine1,
        shippingAddressLine2:
          updated.shippingAddressLine2,
        shippingCity:
          updated.shippingCity,
        shippingState:
          updated.shippingState,
        shippingPostalCode:
          updated.shippingPostalCode,
        shippingCountry:
          updated.shippingCountry,

        active: updated.active,
      });

      setShowEdit(false);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to update customer."
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
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeftIcon />
            Back to Customers
          </button>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-400">
              Master Data / Customers / View
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Customer Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage customer information.
            </p>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />

            <p className="mt-4 text-sm text-slate-500">
              Loading customer...
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10">
            <div className="flex items-start gap-3">
              <div className="text-red-600">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Unable to load customer
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/customers")
                  }
                  className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Back to Customers
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS */}

        {!loading &&
          !error &&
          customer && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {customer.name}
                    </h2>

                    <span
                      className={
                        customer.active
                          ? "inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                          : "inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                      }
                    >
                      {customer.active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-1 font-mono text-sm text-slate-400">
                    {customer.customerCode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  <EditIcon />
                  Edit Customer
                </button>
              </div>

              <div className="grid gap-x-8 gap-y-8 p-6 md:grid-cols-2">

                <div>
                  <h3 className="mb-5 text-sm font-semibold text-slate-900">
                    Contact Information
                  </h3>

                  <div className="grid gap-5">
                    <DisplayField
                      label="Customer Code"
                      value={
                        customer.customerCode
                      }
                    />

                    <DisplayField
                      label="Customer Name"
                      value={customer.name}
                    />

                    <DisplayField
                      label="Email"
                      value={customer.email}
                    />

                    <DisplayField
                      label="Phone"
                      value={customer.phone}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="mb-5 text-sm font-semibold text-slate-900">
                    Billing Address
                  </h3>

                  <div className="grid gap-5">
                    <DisplayField
                      label="Address Line 1"
                      value={
                        customer.billingAddressLine1
                      }
                    />

                    <DisplayField
                      label="Address Line 2"
                      value={
                        customer.billingAddressLine2
                      }
                    />

                    <DisplayField
                      label="City"
                      value={
                        customer.billingCity
                      }
                    />

                    <DisplayField
                      label="Province / State"
                      value={
                        customer.billingState
                      }
                    />

                    <DisplayField
                      label="Postal Code"
                      value={
                        customer.billingPostalCode
                      }
                    />

                    <DisplayField
                      label="Country"
                      value={
                        customer.billingCountry
                      }
                    />
                  </div>
                </div>

                <div>
                  <h3 className="mb-5 text-sm font-semibold text-slate-900">
                    Shipping Address
                  </h3>

                  <div className="grid gap-5">
                    <DisplayField
                      label="Address Line 1"
                      value={
                        customer.shippingAddressLine1
                      }
                    />

                    <DisplayField
                      label="Address Line 2"
                      value={
                        customer.shippingAddressLine2
                      }
                    />

                    <DisplayField
                      label="City"
                      value={
                        customer.shippingCity
                      }
                    />

                    <DisplayField
                      label="Province / State"
                      value={
                        customer.shippingState
                      }
                    />

                    <DisplayField
                      label="Postal Code"
                      value={
                        customer.shippingPostalCode
                      }
                    />

                    <DisplayField
                      label="Country"
                      value={
                        customer.shippingCountry
                      }
                    />
                  </div>
                </div>

                <div>
                  <h3 className="mb-5 text-sm font-semibold text-slate-900">
                    Record Information
                  </h3>

                  <div className="grid gap-5">
                    <DisplayField
                      label="Status"
                      value={
                        customer.active
                          ? "Active"
                          : "Inactive"
                      }
                    />

                    <DisplayField
                      label="Created"
                      value={new Date(
                        customer.createdAt
                      ).toLocaleString()}
                    />

                    <DisplayField
                      label="Last Updated"
                      value={new Date(
                        customer.updatedAt
                      ).toLocaleString()}
                    />

                    <DisplayField
                      label="Customer ID"
                      value={customer.id}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* EDIT MODAL */}

        {showEdit &&
          form &&
          customer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
              <div className="my-8 w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">

                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Edit Customer
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Update customer information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={saving}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  >
                    <XIcon />
                  </button>
                </div>

                <form onSubmit={handleSave}>
                  <div className="max-h-[75vh] overflow-y-auto p-5">

                    {/* BASIC */}

                    <div className="mb-6">
                      <h3 className="mb-4 text-sm font-semibold text-slate-900">
                        Customer Information
                      </h3>

                      <div className="grid gap-5 md:grid-cols-2">
                        <InputField
                          label="Customer Code"
                          value={
                            form.customerCode
                          }
                          onChange={(value) =>
                            updateField(
                              "customerCode",
                              value
                            )
                          }
                        />

                        <InputField
                          label="Customer Name"
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

                    {/* BILLING */}

                    <div className="mb-6 border-t border-slate-200 pt-6">
                      <h3 className="mb-4 text-sm font-semibold text-slate-900">
                        Billing Address
                      </h3>

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
                          value={
                            form.billingCity ??
                            ""
                          }
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
                            form.billingState ??
                            ""
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
                            form.billingCountry ??
                            ""
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

                    <div className="mb-6 border-t border-slate-200 pt-6">
                      <h3 className="mb-4 text-sm font-semibold text-slate-900">
                        Shipping Address
                      </h3>

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
                            form.shippingCity ??
                            ""
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
                            form.shippingState ??
                            ""
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
                            form.shippingCountry ??
                            ""
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

                    <div className="border-t border-slate-200 pt-6">
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

                        <div>
                          <div className="text-sm font-medium text-slate-700">
                            Active customer
                          </div>

                          <div className="text-xs text-slate-400">
                            Inactive customers remain stored and can be activated later.
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* ERROR */}

                    {saveError && (
                      <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="text-red-600">
                            <AlertIcon />
                          </div>

                          <p className="text-sm text-red-700">
                            {saveError}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* MODAL FOOTER */}

                  <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
                    <button
                      type="button"
                      onClick={closeEdit}
                      disabled={saving}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        "Saving..."
                      ) : (
                        <>
                          <CheckIcon />
                          Save Changes
                        </>
                      )}
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