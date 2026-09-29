"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import AppShell from "@/components/layout/AppShell";
import {
  getCurrentCompanyId,
  hasPermission,
} from "@/lib/auth";
import {
  AuditRecord,
  getAuditLogs,
} from "@/lib/auditApi";

function formatDateTime(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatValue(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase(),
    );
}

function actionClass(
  action: string,
): string {
  switch (action) {
    case "CREATE":
    case "UPLOAD":
    case "RECEIVE":
    case "COMPLETE":
      return "bg-success/10 text-success";

    case "UPDATE":
    case "EDIT":
    case "SUBMIT":
    case "APPROVE":
      return "bg-warning/10 text-warning";

    case "DELETE":
    case "CANCEL":
      return "bg-danger/10 text-danger";

    case "LOGIN":
    case "LOGOUT":
      return "bg-primary-600/10 text-primary-600";

    default:
      return "bg-surface-active text-ink-secondary";
  }
}

function EmptyState({
  hasFilters,
}: {
  hasFilters: boolean;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-active text-ink-muted">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="M12 3v18" />
          <path d="M5 8h14" />
          <path d="M5 16h14" />
          <circle
            cx="12"
            cy="8"
            r="2"
          />
          <circle
            cx="12"
            cy="16"
            r="2"
          />
        </svg>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-ink">
        {hasFilters
          ? "No matching audit records"
          : "No audit records yet"}
      </h3>

      <p className="mx-auto mt-1 max-w-lg text-sm text-ink-muted">
        {hasFilters
          ? "Try changing or clearing the selected filters."
          : "System activity recorded for your company will appear here."}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-line border-t-[#DDA15E]" />

      <p className="mt-3 text-sm text-ink-muted">
        Loading audit records...
      </p>
    </div>
  );
}

function AccessDenied() {
  return (
    <AppShell>
      <div className="p-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>

          <h1 className="mt-4 text-lg font-semibold text-ink">
            Access denied
          </h1>

          <p className="mt-2 text-sm text-ink-muted">
            Your account does not have permission to
            view audit information.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function CompanyUnavailable() {
  return (
    <AppShell>
      <div className="p-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="M12 3v18" />
              <path d="M5 8h14" />
              <path d="M5 16h14" />
            </svg>
          </div>

          <h1 className="mt-4 text-lg font-semibold text-ink">
            Company context unavailable
          </h1>

          <p className="mt-2 text-sm text-ink-muted">
            Please sign in again to access audit
            information.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export default function AuditPage() {
  const companyId = getCurrentCompanyId();
  const canView = hasPermission("AUDIT_VIEW");

  const [
    records,
    setRecords,
  ] = useState<AuditRecord[]>([]);

  const [action, setAction] =
    useState("");

  const [entityType, setEntityType] =
    useState("");

  const [entityId, setEntityId] =
    useState("");

  const [userId, setUserId] =
    useState("");

  const [from, setFrom] =
    useState("");

  const [to, setTo] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  async function loadAudit(
    showInitialLoading = false,
  ) {
    if (!companyId || !canView) {
      return;
    }

    if (showInitialLoading) {
      setInitialLoading(true);
    }

    setLoading(true);
    setError(null);

    try {
      const result =
        await getAuditLogs({
          action:
            action || undefined,
          entityType:
            entityType || undefined,
          entityId:
            entityId || undefined,
          userId:
            userId || undefined,
          from:
            from
              ? `${from}T00:00:00Z`
              : undefined,
          to:
            to
              ? `${to}T23:59:59.999Z`
              : undefined,
        });

      setRecords(result);
      setLastUpdated(
        new Date().toISOString(),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load audit records.",
      );
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    if (!companyId || !canView) {
      setInitialLoading(false);
      return;
    }

    void loadAudit(true);
    // Audit should load once when the authenticated
    // company/permission context becomes available.
    // Filter changes are intentionally controlled
    // by the Run Audit button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, canView]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      from &&
      to &&
      from > to
    ) {
      setError(
        "The From date cannot be after the To date.",
      );
      return;
    }

    void loadAudit();
  }

  function clearFilters() {
    setAction("");
    setEntityType("");
    setEntityId("");
    setUserId("");
    setFrom("");
    setTo("");
    setSearch("");
    setError(null);

    window.setTimeout(() => {
      void getAuditLogs().then(
        (result) => {
          setRecords(result);
          setLastUpdated(
            new Date().toISOString(),
          );
        },
        (loadError) => {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load audit records.",
          );
        },
      );
    }, 0);
  }

  const filteredRecords = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return records;
    }

    return records.filter(
      (record) =>
        [
          record.action,
          record.entityType,
          record.entityId ?? "",
          record.userId,
          record.details ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
    );
  }, [records, search]);

  const hasFilters =
    Boolean(
      action ||
        entityType ||
        entityId ||
        userId ||
        from ||
        to ||
        search,
    );

  const uniqueUsers = useMemo(
    () =>
      new Set(
        records.map(
          (record) => record.userId,
        ),
      ).size,
    [records],
  );

  const uniqueEntities = useMemo(
    () =>
      new Set(
        records.map(
          (record) =>
            record.entityType,
        ),
      ).size,
    [records],
  );

  if (!companyId) {
    return <CompanyUnavailable />;
  }

  if (!canView) {
    return <AccessDenied />;
  }

  return (
    <AppShell>
      <div className="min-h-full bg-canvas">
        <div className="border-b border-line bg-surface">
          <div className="px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-ink">
                  Audit
                </h1>

                <p className="mt-1 text-sm text-ink-muted">
                  System activity and accountability
                  history for your company.
                </p>
              </div>

              {lastUpdated && (
                <div className="text-xs text-ink-muted">
                  Last updated{" "}
                  {formatDateTime(
                    lastUpdated,
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mx-auto max-w-[1600px] space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Records
                </div>

                <div className="mt-2 text-2xl font-bold text-ink">
                  {records.length.toLocaleString()}
                </div>

                <div className="mt-1 text-xs text-ink-muted">
                  Matching audit records
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Users
                </div>

                <div className="mt-2 text-2xl font-bold text-ink">
                  {uniqueUsers.toLocaleString()}
                </div>

                <div className="mt-1 text-xs text-ink-muted">
                  Users represented in results
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Entity Types
                </div>

                <div className="mt-2 text-2xl font-bold text-ink">
                  {uniqueEntities.toLocaleString()}
                </div>

                <div className="mt-1 text-xs text-ink-muted">
                  Types represented in results
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Access
                </div>

                <div className="mt-2 text-lg font-bold text-ink">
                  View only
                </div>

                <div className="mt-1 text-xs text-ink-muted">
                  Audit records cannot be edited here
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-ink">
                  Audit filters
                </h2>

                <p className="mt-1 text-xs text-ink-muted">
                  Filter system activity by action,
                  entity, user, or date range.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Action
                    </label>

                    <select
                      value={action}
                      onChange={(event) =>
                        setAction(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    >
                      <option value="">
                        All actions
                      </option>

                      <option value="CREATE">
                        Create
                      </option>

                      <option value="UPDATE">
                        Update
                      </option>

                      <option value="DELETE">
                        Delete
                      </option>

                      <option value="UPLOAD">
                        Upload
                      </option>

                      <option value="RECEIVE">
                        Receive
                      </option>

                      <option value="COMPLETE">
                        Complete
                      </option>

                      <option value="SUBMIT">
                        Submit
                      </option>

                      <option value="APPROVE">
                        Approve
                      </option>

                      <option value="CANCEL">
                        Cancel
                      </option>

                      <option value="LOGIN">
                        Login
                      </option>

                      <option value="LOGOUT">
                        Logout
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Entity Type
                    </label>

                    <input
                      type="text"
                      value={entityType}
                      onChange={(event) =>
                        setEntityType(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. PRODUCT"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink uppercase outline-none placeholder:normal-case placeholder:text-ink-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Entity ID
                    </label>

                    <input
                      type="text"
                      value={entityId}
                      onChange={(event) =>
                        setEntityId(
                          event.target.value,
                        )
                      }
                      placeholder="UUID"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      User ID
                    </label>

                    <input
                      type="text"
                      value={userId}
                      onChange={(event) =>
                        setUserId(
                          event.target.value,
                        )
                      }
                      placeholder="UUID"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      From
                    </label>

                    <input
                      type="date"
                      value={from}
                      onChange={(event) =>
                        setFrom(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      To
                    </label>

                    <input
                      type="date"
                      value={to}
                      onChange={(event) =>
                        setTo(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  <div className="flex items-end gap-2 md:col-span-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#DDA15E] px-4 py-2.5 text-sm font-semibold text-[#283618] shadow-sm transition hover:bg-[#BC6C25] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading
                        ? "Loading..."
                        : "Run Audit"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      disabled={loading}
                      className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Search results
                  </label>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search action, entity, user ID, entity ID, or details..."
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
                  >
                    {error}
                  </div>
                )}
              </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    Activity history
                  </h2>

                  <p className="mt-1 text-xs text-ink-muted">
                    {filteredRecords.length.toLocaleString()}{" "}
                    record
                    {filteredRecords.length === 1
                      ? ""
                      : "s"}{" "}
                    shown
                  </p>
                </div>

                {hasFilters && (
                  <span className="inline-flex w-fit rounded-full bg-surface-active px-2.5 py-1 text-xs font-semibold text-ink-secondary">
                    Filters active
                  </span>
                )}
              </div>

              {initialLoading ? (
                <LoadingState />
              ) : filteredRecords.length === 0 ? (
                <EmptyState
                  hasFilters={hasFilters}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left">
                    <thead>
                      <tr className="border-b border-line bg-surface-active text-xs uppercase tracking-wide text-ink-muted">
                        <th className="px-5 py-3">
                          Date & Time
                        </th>

                        <th className="px-5 py-3">
                          Action
                        </th>

                        <th className="px-5 py-3">
                          Entity
                        </th>

                        <th className="px-5 py-3">
                          Entity ID
                        </th>

                        <th className="px-5 py-3">
                          User ID
                        </th>

                        <th className="px-5 py-3">
                          Details
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRecords.map(
                        (record) => (
                          <tr
                            key={record.id}
                            className="border-b border-line last:border-0 hover:bg-surface-hover"
                          >
                            <td className="whitespace-nowrap px-5 py-4 text-sm text-ink-secondary">
                              {formatDateTime(
                                record.createdAt,
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${actionClass(
                                  record.action,
                                )}`}
                              >
                                {formatValue(
                                  record.action,
                                )}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <div className="text-sm font-semibold text-ink">
                                {formatValue(
                                  record.entityType,
                                )}
                              </div>
                            </td>

                            <td className="max-w-[240px] px-5 py-4">
                              <div
                                className="truncate font-mono text-xs text-ink-muted"
                                title={
                                  record.entityId ??
                                  undefined
                                }
                              >
                                {record.entityId ??
                                  "—"}
                              </div>
                            </td>

                            <td className="max-w-[240px] px-5 py-4">
                              <div
                                className="truncate font-mono text-xs text-ink-muted"
                                title={
                                  record.userId
                                }
                              >
                                {record.userId}
                              </div>
                            </td>

                            <td className="max-w-[420px] px-5 py-4">
                              <div
                                className="truncate text-sm text-ink-secondary"
                                title={
                                  record.details ??
                                  undefined
                                }
                              >
                                {record.details ??
                                  "—"}
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}