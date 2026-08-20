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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconButton } from "@/components/ui/IconButton";
import {
  AlertIcon,
  CloseIcon,
  EditIcon,
  EyeIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
} from "@/components/ui/icons";

const COMPANY_ID =
  "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

type DialogType = "activate" | "deactivate" | null;

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
          <div className="mb-1 text-xs font-medium text-ink-muted">
            Master Data / Customers
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Customers
              </h1>

              <p className="mt-1 text-sm text-ink-muted">
                Manage customers used throughout NextWare.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/customers/new")
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <PlusIcon />
              New Customer
            </button>
          </div>
        </div>

        {/* TOOLBAR */}

        <div className="mb-5 rounded-xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by code, name, email or phone..."
                className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-ink-muted focus:border-primary-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary-400"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-slate-700" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading customers...
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10">
            <div className="flex items-start gap-3">
              <div className="text-danger">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-danger">
                  Unable to load customers
                </p>

                <p className="mt-1 text-sm text-danger">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadCustomers}
                  className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
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
            <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-active text-xl text-ink-muted">
                ♙
              </div>

              <h2 className="mt-4 text-base font-semibold text-ink">
                No customers found
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
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
                    className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
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
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="border-b border-line bg-surface-hover">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Customer Code
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Email
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Phone
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line">
                    {filteredCustomers.map(
                      (customer) => (
                        <tr
                          key={customer.id}
                          className="transition hover:bg-surface-hover"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-semibold text-ink">
                              {customer.customerCode}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm font-semibold text-ink">
                              {customer.name}
                            </div>

                            <div className="mt-0.5 text-xs text-ink-muted">
                              {customer.billingCity ||
                                "No city provided"}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-ink-secondary">
                            {customer.email || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-ink-secondary">
                            {customer.phone || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              active={customer.active}
                              className="px-3 py-1.5"
                            />
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

              <div className="border-t border-line px-5 py-3 text-xs text-ink-muted">
                Showing{" "}
                <span className="font-semibold text-ink-secondary">
                  {filteredCustomers.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-ink-secondary">
                  {customers.length}
                </span>{" "}
                customers
              </div>
            </div>
          )}

        {/* STATUS DIALOG */}

        {dialogType &&
          dialogCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-2xl">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      {dialogType === "deactivate"
                        ? "Deactivate Customer"
                        : "Activate Customer"}
                    </h2>

                    <p className="mt-1 text-xs text-ink-muted">
                      Customer status
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={actionLoading}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-active hover:text-ink-secondary disabled:opacity-50"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="p-5">
                  <p className="text-sm leading-6 text-ink-secondary">
                    {dialogType === "deactivate"
                      ? `Are you sure you want to deactivate "${dialogCustomer.name}"? The customer will remain in the system and can be activated again later.`
                      : `Are you sure you want to activate "${dialogCustomer.name}"?`}
                  </p>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeDialog}
                      disabled={actionLoading}
                      className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-surface-hover disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={confirmStatusChange}
                      disabled={actionLoading}
                      className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                  ? "rounded-lg border border-success/30 bg-surface px-4 py-3 text-sm font-medium text-success shadow-xl"
                  : "rounded-lg border border-danger/30 bg-surface px-4 py-3 text-sm font-medium text-danger shadow-xl"
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