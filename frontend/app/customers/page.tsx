"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  activateCustomer,
  Customer,
  deactivateCustomer,
  getCustomers,
} from "@/lib/api";

const COMPANY_ID =
  "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

type DialogType = "activate" | "deactivate" | null;

function EyeIcon() {
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
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EditIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function PowerIcon() {
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
      <path d="M12 2v10" />
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function PlusIcon() {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
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
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
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

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        {children}
      </button>

      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [dialogType, setDialogType] =
    useState<DialogType>(null);

  const [dialogCustomer, setDialogCustomer] =
    useState<Customer | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

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

  async function loadCustomers() {
    try {
      setLoading(true);
      setError(null);

      const data = await getCustomers(COMPANY_ID);

      setCustomers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        customer.customerCode
          .toLowerCase()
          .includes(normalizedSearch) ||
        customer.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (customer.email ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (customer.phone ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        (statusFilter === "Active" &&
          customer.active) ||
        (statusFilter === "Inactive" &&
          !customer.active);

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  function openStatusDialog(customer: Customer) {
    setDialogCustomer(customer);

    setDialogType(
      customer.active
        ? "deactivate"
        : "activate"
    );
  }

  function closeDialog() {
    if (actionLoading) {
      return;
    }

    setDialogType(null);
    setDialogCustomer(null);
  }

  async function confirmStatusChange() {
    if (!dialogCustomer || !dialogType) {
      return;
    }

    setActionLoading(true);

    try {
      if (dialogType === "deactivate") {
        await deactivateCustomer(
          COMPANY_ID,
          dialogCustomer.id
        );

        setCustomers((current) =>
          current.map((customer) =>
            customer.id === dialogCustomer.id
              ? {
                  ...customer,
                  active: false,
                }
              : customer
          )
        );

        setToast({
          type: "success",
          message:
            "Customer deactivated successfully.",
        });
      } else {
        const updatedCustomer =
          await activateCustomer(
            COMPANY_ID,
            dialogCustomer
          );

        setCustomers((current) =>
          current.map((customer) =>
            customer.id === dialogCustomer.id
              ? updatedCustomer
              : customer
          )
        );

        setToast({
          type: "success",
          message:
            "Customer activated successfully.",
        });
      }

      closeDialog();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to change customer status.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">

        {/* PAGE HEADER */}

        <div className="mb-6">
          <div className="mb-1 text-xs font-medium text-slate-400">
            Master Data / Customers
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Customers
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage customers used throughout NextWare.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/customers/new")
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <PlusIcon />
              New Customer
            </button>
          </div>
        </div>

        {/* TOOLBAR */}

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by code, name, email or phone..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />

            <p className="mt-4 text-sm text-slate-500">
              Loading customers...
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
                  Unable to load customers
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadCustomers}
                  className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredCustomers.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                ♙
              </div>

              <h2 className="mt-4 text-base font-semibold text-slate-900">
                No customers found
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {search || statusFilter !== "All Statuses"
                  ? "No customers match your current search or filter."
                  : "Create your first customer to get started."}
              </p>

              {!search &&
                statusFilter === "All Statuses" && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/customers/new")
                    }
                    className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Create Customer
                  </button>
                )}
            </div>
          )}

        {/* TABLE */}

        {!loading &&
          !error &&
          filteredCustomers.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Customer Code
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Email
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Phone
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map(
                      (customer) => (
                        <tr
                          key={customer.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-semibold text-slate-800">
                              {customer.customerCode}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm font-semibold text-slate-800">
                              {customer.name}
                            </div>

                            <div className="mt-0.5 text-xs text-slate-400">
                              {customer.billingCity ||
                                "No city provided"}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {customer.email || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {customer.phone || "—"}
                          </td>

                          <td className="px-5 py-4">
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
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <IconButton
                                label="View"
                                onClick={() =>
                                  router.push(
                                    `/customers/view?id=${encodeURIComponent(
                                      customer.id
                                    )}`
                                  )
                                }
                              >
                                <EyeIcon />
                              </IconButton>

                              <IconButton
                                label="Edit"
                                onClick={() =>
                                  router.push(
                                    `/customers/view?id=${encodeURIComponent(
                                      customer.id
                                    )}&edit=true`
                                  )
                                }
                              >
                                <EditIcon />
                              </IconButton>

                              <IconButton
                                label={
                                  customer.active
                                    ? "Deactivate"
                                    : "Activate"
                                }
                                onClick={() =>
                                  openStatusDialog(
                                    customer
                                  )
                                }
                              >
                                <PowerIcon />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-600">
                  {filteredCustomers.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-600">
                  {customers.length}
                </span>{" "}
                customers
              </div>
            </div>
          )}

        {/* STATUS DIALOG */}

        {dialogType &&
          dialogCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {dialogType === "deactivate"
                        ? "Deactivate Customer"
                        : "Activate Customer"}
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Customer status
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={actionLoading}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="p-5">
                  <p className="text-sm leading-6 text-slate-600">
                    {dialogType === "deactivate"
                      ? `Are you sure you want to deactivate "${dialogCustomer.name}"? The customer will remain in the system and can be activated again later.`
                      : `Are you sure you want to activate "${dialogCustomer.name}"?`}
                  </p>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeDialog}
                      disabled={actionLoading}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={confirmStatusChange}
                      disabled={actionLoading}
                      className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Processing..."
                        : dialogType === "deactivate"
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* TOAST */}

        {toast && (
          <div className="fixed bottom-5 right-5 z-[60]">
            <div
              className={
                toast.type === "success"
                  ? "rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-xl"
                  : "rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 shadow-xl"
              }
            >
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}