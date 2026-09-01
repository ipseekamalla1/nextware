"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { authFetch } from "@/lib/authFetch";
import {
  getCurrentCompanyId,
  hasPermission,
} from "@/lib/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconButton } from "@/components/ui/IconButton";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
} from "@/components/ui/icons";

const API_BASE_URL = "http://localhost:8080";

interface UnitOfMeasure {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UnitForm {
  code: string;
  name: string;
  description: string;
  active: boolean;
}

type DialogType = "activate" | "deactivate" | null;

const emptyForm: UnitForm = {
  code: "",
  name: "",
  description: "",
  active: true,
};

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] =
    useState<UnitOfMeasure | null>(null);

  const [form, setForm] =
    useState<UnitForm>({ ...emptyForm });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);

  const [dialogType, setDialogType] =
    useState<DialogType>(null);

  const [dialogUnit, setDialogUnit] =
    useState<UnitOfMeasure | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const canView =
    hasPermission("UNIT_OF_MEASURE_VIEW");

  const canCreate =
    hasPermission("UNIT_OF_MEASURE_CREATE");

  const canUpdate =
    hasPermission("UNIT_OF_MEASURE_UPDATE");

  const canDelete =
    hasPermission("UNIT_OF_MEASURE_DELETE");

  useEffect(() => {
    loadUnits();
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

  async function getCompanyId(): Promise<string> {
    const companyId = getCurrentCompanyId();

    if (!companyId) {
      throw new Error(
        "No authenticated company was found."
      );
    }

    return companyId;
  }

  async function parseError(
    response: Response,
    fallback: string
  ): Promise<string> {
    try {
      const body = await response.json();

      if (typeof body?.message === "string") {
        return body.message;
      }

      if (typeof body?.error === "string") {
        return body.error;
      }
    } catch {
      // Ignore invalid error response.
    }

    return fallback;
  }

  async function loadUnits() {
    if (!hasPermission("UNIT_OF_MEASURE_VIEW")) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const companyId = await getCompanyId();

      const response = await authFetch(
        `${API_BASE_URL}/api/unit-of-measures?companyId=${encodeURIComponent(
          companyId
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          await parseError(
            response,
            `Failed to load units of measure: ${response.status}`
          )
        );
      }

      const data =
        (await response.json()) as UnitOfMeasure[];

      setUnits(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load units of measure."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredUnits = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return units.filter((unit) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        unit.code
          .toLowerCase()
          .includes(normalizedSearch) ||
        unit.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (unit.description ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        (statusFilter === "Active" &&
          unit.active) ||
        (statusFilter === "Inactive" &&
          !unit.active);

      return matchesSearch && matchesStatus;
    });
  }, [units, search, statusFilter]);

  function openCreateForm() {
    setEditingUnit(null);
    setForm({ ...emptyForm });
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(unit: UnitOfMeasure) {
    setEditingUnit(unit);

    setForm({
      code: unit.code,
      name: unit.name,
      description: unit.description ?? "",
      active: unit.active,
    });

    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingUnit(null);
    setForm({ ...emptyForm });
    setFormError(null);
  }

  function updateForm(
    field: keyof UnitForm,
    value: string | boolean
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

    if (editingUnit && !canUpdate) {
      setFormError(
        "You do not have permission to update units of measure."
      );
      return;
    }

    if (!editingUnit && !canCreate) {
      setFormError(
        "You do not have permission to create units of measure."
      );
      return;
    }

    if (!form.code.trim()) {
      setFormError("Unit code is required.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Unit name is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const companyId = await getCompanyId();

      const payload = {
        companyId,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description:
          form.description.trim() || null,
        active: form.active,
      };

      const url = editingUnit
        ? `${API_BASE_URL}/api/unit-of-measures/${encodeURIComponent(
            editingUnit.id
          )}?companyId=${encodeURIComponent(companyId)}`
        : `${API_BASE_URL}/api/unit-of-measures`;

      const response = await authFetch(url, {
        method: editingUnit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          await parseError(
            response,
            editingUnit
              ? `Failed to update unit: ${response.status}`
              : `Failed to create unit: ${response.status}`
          )
        );
      }

      const saved =
        (await response.json()) as UnitOfMeasure;

      setUnits((current) => {
        if (!editingUnit) {
          return [...current, saved].sort(
            (a, b) =>
              a.name.localeCompare(b.name)
          );
        }

        return current
          .map((unit) =>
            unit.id === saved.id
              ? saved
              : unit
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          );
      });

      closeForm();

      setToast({
        type: "success",
        message: editingUnit
          ? "Unit of measure updated successfully."
          : "Unit of measure created successfully.",
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "The unit of measure could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  function openStatusDialog(
    unit: UnitOfMeasure
  ) {
    if (unit.active && !canDelete) {
      setToast({
        type: "error",
        message:
          "You do not have permission to deactivate units of measure.",
      });
      return;
    }

    if (!unit.active && !canUpdate) {
      setToast({
        type: "error",
        message:
          "You do not have permission to activate units of measure.",
      });
      return;
    }

    setDialogUnit(unit);
    setDialogType(
      unit.active
        ? "deactivate"
        : "activate"
    );
  }

  function closeDialog() {
    if (actionLoading) {
      return;
    }

    setDialogUnit(null);
    setDialogType(null);
  }

  async function confirmStatusChange() {
    if (!dialogUnit || !dialogType) {
      return;
    }

    setActionLoading(true);

    try {
      const companyId = await getCompanyId();

      if (dialogType === "deactivate") {
        const response = await authFetch(
          `${API_BASE_URL}/api/unit-of-measures/${encodeURIComponent(
            dialogUnit.id
          )}?companyId=${encodeURIComponent(companyId)}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error(
            await parseError(
              response,
              `Failed to deactivate unit: ${response.status}`
            )
          );
        }

        setUnits((current) =>
          current.map((unit) =>
            unit.id === dialogUnit.id
              ? {
                  ...unit,
                  active: false,
                }
              : unit
          )
        );

        setToast({
          type: "success",
          message: `${dialogUnit.name} has been deactivated.`,
        });
      } else {
        const response = await authFetch(
          `${API_BASE_URL}/api/unit-of-measures/${encodeURIComponent(
            dialogUnit.id
          )}?companyId=${encodeURIComponent(companyId)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              companyId,
              code: dialogUnit.code,
              name: dialogUnit.name,
              description:
                dialogUnit.description,
              active: true,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            await parseError(
              response,
              `Failed to activate unit: ${response.status}`
            )
          );
        }

        const updated =
          (await response.json()) as UnitOfMeasure;

        setUnits((current) =>
          current.map((unit) =>
            unit.id === updated.id
              ? updated
              : unit
          )
        );

        setToast({
          type: "success",
          message: `${dialogUnit.name} has been activated.`,
        });
      }

      closeDialog();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "The unit status could not be changed.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (!canView && !loading) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-danger/30 bg-danger-soft p-6">
            <h1 className="text-lg font-semibold text-danger">
              Access Denied
            </h1>

            <p className="mt-2 text-sm text-danger">
              You do not have permission to view units of
              measure.
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
          <div className="mb-1 text-xs font-medium text-ink-muted">
            Master Data / Units of Measure
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Units of Measure
              </h1>

              <p className="mt-1 text-sm text-ink-muted">
                Manage the units used by products, inventory,
                purchasing and sales.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <PlusIcon />
                New Unit
              </button>
            )}
          </div>
        </div>

        {toast && (
          <div
            className={`mb-5 rounded-xl border px-5 py-4 ${
              toast.type === "success"
                ? "border-success/30 bg-success-soft"
                : "border-danger/30 bg-danger-soft"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                toast.type === "success"
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              {toast.message}
            </p>
          </div>
        )}

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
                placeholder="Search units..."
                className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-ink-muted focus:border-primary-400"
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

        {!loading && error && (
          <div className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="pt-0.5 text-danger">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-danger">
                  Unable to load units of measure
                </p>

                <p className="mt-1 text-sm text-danger">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadUnits}
                  className="mt-3 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {!error && (
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
            {loading ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-slate-700" />

                <p className="mt-4 text-sm text-ink-muted">
                  Loading units of measure...
                </p>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-active text-ink-muted">
                  <SearchIcon />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-ink">
                  No units found
                </h3>

                <p className="mt-1 text-sm text-ink-muted">
                  {search ||
                  statusFilter !== "All Statuses"
                    ? "Try changing your search or status filter."
                    : "Create your first unit of measure to get started."}
                </p>

                {!search &&
                  statusFilter ===
                    "All Statuses" &&
                  canCreate && (
                    <button
                      type="button"
                      onClick={openCreateForm}
                      className="mt-4 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                      Create Unit
                    </button>
                  )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-line bg-surface-hover">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Code
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Name
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Description
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUnits.map(
                      (unit) => (
                        <tr
                          key={unit.id}
                          className="border-b border-line last:border-b-0 hover:bg-surface-hover"
                        >
                          <td className="px-5 py-4">
                            <span className="rounded-md bg-surface-active px-2.5 py-1 font-mono text-xs font-semibold text-ink-secondary">
                              {unit.code}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-ink">
                              {unit.name}
                            </p>
                          </td>

                          <td className="max-w-md px-5 py-4">
                            <p className="truncate text-sm text-ink-muted">
                              {unit.description ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              active={unit.active}
                              className="px-3 py-1.5"
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {canUpdate && (
                                <IconButton
                                  label="Edit unit"
                                  onClick={() =>
                                    openEditForm(
                                      unit
                                    )
                                  }
                                >
                                  <EditIcon />
                                </IconButton>
                              )}

                              {(unit.active
                                ? canDelete
                                : canUpdate) && (
                                <IconButton
                                  label={
                                    unit.active
                                      ? "Deactivate unit"
                                      : "Activate unit"
                                  }
                                  onClick={() =>
                                    openStatusDialog(
                                      unit
                                    )
                                  }
                                >
                                  <PowerIcon />
                                </IconButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-line px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    {editingUnit
                      ? "Edit Unit of Measure"
                      : "New Unit of Measure"}
                  </h2>

                  <p className="mt-1 text-xs text-ink-muted">
                    Define a reusable unit for product and
                    inventory transactions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-active hover:text-ink-secondary disabled:cursor-not-allowed"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-6 py-6">
                  {formError && (
                    <div className="mb-5 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3">
                      <p className="text-sm text-danger">
                        {formError}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                        Code{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        required
                        maxLength={30}
                        value={form.code}
                        disabled={saving}
                        onChange={(event) =>
                          updateForm(
                            "code",
                            event.target.value
                          )
                        }
                        placeholder="e.g. EA"
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-surface-hover"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                        Name{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={form.name}
                        disabled={saving}
                        onChange={(event) =>
                          updateForm(
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Each"
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-surface-hover"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                        Description
                      </label>

                      <textarea
                        rows={3}
                        maxLength={255}
                        value={form.description}
                        disabled={saving}
                        onChange={(event) =>
                          updateForm(
                            "description",
                            event.target.value
                          )
                        }
                        placeholder="Optional description"
                        className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-surface-hover"
                      />
                    </div>

                    <label className="flex items-center gap-3 md:col-span-2">
                      <input
                        type="checkbox"
                        checked={form.active}
                        disabled={saving}
                        onChange={(event) =>
                          updateForm(
                            "active",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-line text-primary-600 focus:ring-primary-500"
                      />

                      <span className="text-sm font-medium text-ink-secondary">
                        Active
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-surface-hover disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingUnit
                      ? "Save Changes"
                      : "Create Unit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {dialogUnit && dialogType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-2xl">
              <div className="px-6 py-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-active text-ink-secondary">
                  {dialogType ===
                  "deactivate" ? (
                    <PowerIcon />
                  ) : (
                    <CheckIcon />
                  )}
                </div>

                <h2 className="text-lg font-semibold text-ink">
                  {dialogType ===
                  "deactivate"
                    ? "Deactivate Unit?"
                    : "Activate Unit?"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {dialogType ===
                  "deactivate"
                    ? `Are you sure you want to deactivate ${dialogUnit.name} (${dialogUnit.code})? Existing records will remain intact.`
                    : `Activate ${dialogUnit.name} (${dialogUnit.code}) again?`}
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={actionLoading}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-hover disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmStatusChange}
                  disabled={actionLoading}
                  className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading
                    ? "Processing..."
                    : dialogType ===
                      "deactivate"
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}