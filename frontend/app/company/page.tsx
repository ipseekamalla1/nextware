
"use client";

import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { authFetch } from "@/lib/authFetch";
import {
  getCurrentCompanyId,
  hasPermission,
} from "@/lib/auth";

interface Company {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CompanyForm {
  name: string;
  legalName: string;
  email: string;
  phone: string;
}

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);

  const [form, setForm] = useState<CompanyForm>({
    name: "",
    legalName: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const canView = hasPermission("COMPANY_VIEW");
  const canUpdate = hasPermission("COMPANY_UPDATE");

  useEffect(() => {
    loadCompany();
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

  async function loadCompany() {
    const companyId = getCurrentCompanyId();

    if (!companyId) {
      setError("No authenticated company was found.");
      setLoading(false);
      return;
    }

    if (!hasPermission("COMPANY_VIEW")) {
      setError("You do not have permission to view company information.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await authFetch(
        `/api/companies/${encodeURIComponent(companyId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        let message = `Failed to load company: ${response.status}`;

        try {
          const body = await response.json();

          if (typeof body?.message === "string") {
            message = body.message;
          } else if (typeof body?.error === "string") {
            message = body.error;
          }
        } catch {
          // Ignore invalid error response.
        }

        throw new Error(message);
      }

      const data = (await response.json()) as Company;

      setCompany(data);

      setForm({
        name: data.name ?? "",
        legalName: data.legalName ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load company information."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateForm(
    field: keyof CompanyForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!company) {
      return;
    }

    if (!canUpdate) {
      setFormError(
        "You do not have permission to update company information."
      );
      return;
    }

    if (!form.name.trim()) {
      setFormError("Company name is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const response = await authFetch(
        `/api/companies/${encodeURIComponent(company.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            legalName: form.legalName.trim() || null,
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            active: company.active,
          }),
        }
      );

      if (!response.ok) {
        let message = `Failed to update company: ${response.status}`;

        try {
          const body = await response.json();

          if (typeof body?.message === "string") {
            message = body.message;
          } else if (typeof body?.error === "string") {
            message = body.error;
          }
        } catch {
          // Ignore invalid error response.
        }

        throw new Error(message);
      }

      const updated = (await response.json()) as Company;

      setCompany(updated);

      setForm({
        name: updated.name ?? "",
        legalName: updated.legalName ?? "",
        email: updated.email ?? "",
        phone: updated.phone ?? "",
      });

      setToast("Company information updated successfully.");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to update company information."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canView && !loading) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="mx-auto max-w-3xl rounded-xl border border-danger/30 bg-danger-soft p-6">
            <h1 className="text-lg font-semibold text-danger">
              Access Denied
            </h1>

            <p className="mt-2 text-sm text-danger">
              You do not have permission to view company information.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <div className="mb-1 text-xs font-medium text-ink-muted">
              Master Data / Company
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Company
            </h1>

            <p className="mt-1 text-sm text-ink-muted">
              Manage the company information associated with this
              authenticated Nextware account.
            </p>
          </div>

          {toast && (
            <div className="mb-5 rounded-xl border border-success/30 bg-success-soft px-5 py-4">
              <p className="text-sm font-medium text-success">
                {toast}
              </p>
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-slate-700" />

              <p className="mt-4 text-sm text-ink-muted">
                Loading company information...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-danger/30 bg-danger-soft px-5 py-4">
              <p className="text-sm font-semibold text-danger">
                Unable to load company
              </p>

              <p className="mt-1 text-sm text-danger">
                {error}
              </p>

              <button
                type="button"
                onClick={loadCompany}
                className="mt-4 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Try Again
              </button>
            </div>
          ) : company ? (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-line bg-surface shadow-sm"
            >
              <div className="border-b border-line px-6 py-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      Company Information
                    </h2>

                    <p className="mt-1 text-xs text-ink-muted">
                      Changes apply to the currently authenticated
                      company only.
                    </p>
                  </div>

                  <div
                    className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                      company.active
                        ? "bg-success-soft text-success"
                        : "bg-danger-soft text-danger"
                    }`}
                  >
                    {company.active ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                {formError && (
                  <div className="mb-5 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3">
                    <p className="text-sm text-danger">
                      {formError}
                    </p>
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Company Name{" "}
                      <span className="text-danger">*</span>
                    </label>

                    <input
                      type="text"
                      required
                      maxLength={255}
                      value={form.name}
                      disabled={!canUpdate || saving}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-surface-hover"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Legal Name
                    </label>

                    <input
                      type="text"
                      maxLength={255}
                      value={form.legalName}
                      disabled={!canUpdate || saving}
                      onChange={(event) =>
                        updateForm(
                          "legalName",
                          event.target.value
                        )
                      }
                      placeholder="Optional legal company name"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-surface-hover"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Email
                    </label>

                    <input
                      type="email"
                      maxLength={255}
                      value={form.email}
                      disabled={!canUpdate || saving}
                      onChange={(event) =>
                        updateForm(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="company@example.com"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-surface-hover"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                      Phone
                    </label>

                    <input
                      type="text"
                      maxLength={50}
                      value={form.phone}
                      disabled={!canUpdate || saving}
                      onChange={(event) =>
                        updateForm(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="Company phone number"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-surface-hover"
                    />
                  </div>
                </div>

                <div className="mt-7 rounded-lg border border-line bg-surface-hover px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Company ID
                  </div>

                  <div className="mt-1 break-all font-mono text-xs text-ink-secondary">
                    {company.id}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-muted">
                  Company creation is intentionally handled outside
                  the normal authenticated company-scoped API.
                </p>

                {canUpdate && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

