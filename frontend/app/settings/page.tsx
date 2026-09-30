"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import AppShell from "@/components/layout/AppShell";
import { hasPermission } from "@/lib/auth";
import {
  getSettings,
  SettingsRecord,
  updateSettings,
} from "@/lib/settingsApi";

interface SettingsForm {
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

const CURRENCY_OPTIONS = [
  {
    value: "CAD",
    label: "CAD — Canadian Dollar",
  },
  {
    value: "USD",
    label: "USD — US Dollar",
  },
  {
    value: "EUR",
    label: "EUR — Euro",
  },
  {
    value: "GBP",
    label: "GBP — British Pound",
  },
  {
    value: "AUD",
    label: "AUD — Australian Dollar",
  },
];

const TIMEZONE_OPTIONS = [
  {
    value: "America/Toronto",
    label: "America/Toronto — Eastern Time",
  },
  {
    value: "America/Vancouver",
    label: "America/Vancouver — Pacific Time",
  },
  {
    value: "America/Edmonton",
    label: "America/Edmonton — Mountain Time",
  },
  {
    value: "America/Winnipeg",
    label: "America/Winnipeg — Central Time",
  },
  {
    value: "America/Halifax",
    label: "America/Halifax — Atlantic Time",
  },
  {
    value: "America/St_Johns",
    label: "America/St_Johns — Newfoundland Time",
  },
  {
    value: "UTC",
    label: "UTC — Coordinated Universal Time",
  },
];

const DATE_FORMAT_OPTIONS = [
  {
    value: "yyyy-MM-dd",
    label: "2026-09-29",
  },
  {
    value: "dd/MM/yyyy",
    label: "29/09/2026",
  },
  {
    value: "MM/dd/yyyy",
    label: "09/29/2026",
  },
  {
    value: "dd-MMM-yyyy",
    label: "29-Sep-2026",
  },
];

const TIME_FORMAT_OPTIONS = [
  {
    value: "HH:mm",
    label: "24-hour — 14:30",
  },
  {
    value: "hh:mm a",
    label: "12-hour — 02:30 PM",
  },
];

const DEFAULT_FORM: SettingsForm = {
  defaultCurrency: "CAD",
  timezone: "America/Toronto",
  dateFormat: "yyyy-MM-dd",
  timeFormat: "HH:mm",
};

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<SettingsRecord | null>(null);

  const [form, setForm] =
    useState<SettingsForm>(DEFAULT_FORM);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [formError, setFormError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const canView =
    hasPermission("COMPANY_VIEW");

  const canUpdate =
    hasPermission("COMPANY_UPDATE");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      if (!canView) {
        if (!cancelled) {
          setLoading(false);
          setError(
            "You do not have permission to view company settings."
          );
        }

        return;
      }

      try {
        const data = await getSettings();

        if (cancelled) {
          return;
        }

        setSettings(data);

        setForm({
          defaultCurrency:
            data.defaultCurrency ?? "CAD",
          timezone:
            data.timezone ??
            "America/Toronto",
          dateFormat:
            data.dateFormat ??
            "yyyy-MM-dd",
          timeFormat:
            data.timeFormat ??
            "HH:mm",
        });

        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load settings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [canView]);

  function updateForm(
    field: keyof SettingsForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFormError(null);
    setSuccess(null);
  }

  function resetForm() {
    if (!settings) {
      return;
    }

    setForm({
      defaultCurrency:
        settings.defaultCurrency,
      timezone:
        settings.timezone,
      dateFormat:
        settings.dateFormat,
      timeFormat:
        settings.timeFormat,
    });

    setFormError(null);
    setSuccess(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canUpdate) {
      setFormError(
        "You do not have permission to update company settings."
      );

      return;
    }

    if (!form.defaultCurrency.trim()) {
      setFormError(
        "Default currency is required."
      );

      return;
    }

    if (!form.timezone.trim()) {
      setFormError(
        "Timezone is required."
      );

      return;
    }

    if (!form.dateFormat.trim()) {
      setFormError(
        "Date format is required."
      );

      return;
    }

    if (!form.timeFormat.trim()) {
      setFormError(
        "Time format is required."
      );

      return;
    }

    setSaving(true);
    setFormError(null);
    setSuccess(null);

    try {
      const updated =
        await updateSettings({
          defaultCurrency:
            form.defaultCurrency
              .trim()
              .toUpperCase(),
          timezone:
            form.timezone.trim(),
          dateFormat:
            form.dateFormat.trim(),
          timeFormat:
            form.timeFormat.trim(),
        });

      setSettings(updated);

      setForm({
        defaultCurrency:
          updated.defaultCurrency,
        timezone:
          updated.timezone,
        dateFormat:
          updated.dateFormat,
        timeFormat:
          updated.timeFormat,
      });

      setSuccess(
        "Settings saved successfully."
      );
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canView && !loading) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8">
          <div className="mx-auto max-w-4xl rounded-xl border border-danger/30 bg-danger-soft p-6">
            <h1 className="text-lg font-semibold text-danger">
              Access Denied
            </h1>

            <p className="mt-2 text-sm text-danger">
              You do not have permission to view
              company settings.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <div className="mb-1 text-xs font-medium text-ink-muted">
              System / Settings
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Settings
            </h1>

            <p className="mt-1 text-sm text-ink-muted">
              Manage company-wide regional and
              formatting preferences used by
              Nextware.
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />

              <p className="mt-4 text-sm text-ink-muted">
                Loading settings...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-danger/30 bg-danger-soft px-5 py-4">
              <p className="text-sm font-semibold text-danger">
                Unable to load settings
              </p>

              <p className="mt-1 text-sm text-danger">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="mt-4 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <section className="rounded-xl border border-line bg-surface shadow-sm">
                <div className="border-b border-line px-6 py-5">
                  <h2 className="text-base font-semibold text-ink">
                    Regional Settings
                  </h2>

                  <p className="mt-1 text-xs text-ink-muted">
                    These preferences apply to the
                    authenticated company.
                  </p>
                </div>

                <div className="px-6 py-6">
                  {formError && (
                    <div className="mb-5 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3">
                      <p className="text-sm text-danger">
                        {formError}
                      </p>
                    </div>
                  )}

                  {success && (
                    <div className="mb-5 rounded-lg border border-success/30 bg-success-soft px-4 py-3">
                      <p className="text-sm font-medium text-success">
                        {success}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="defaultCurrency"
                        className="mb-1.5 block text-sm font-medium text-ink-secondary"
                      >
                        Default Currency
                      </label>

                      <select
                        id="defaultCurrency"
                        value={
                          form.defaultCurrency
                        }
                        disabled={
                          !canUpdate || saving
                        }
                        onChange={(event) =>
                          updateForm(
                            "defaultCurrency",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-surface-hover"
                      >
                        {CURRENCY_OPTIONS.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>

                      <p className="mt-1.5 text-xs text-ink-muted">
                        Used as the company&apos;s
                        default currency.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="timezone"
                        className="mb-1.5 block text-sm font-medium text-ink-secondary"
                      >
                        Timezone
                      </label>

                      <select
                        id="timezone"
                        value={form.timezone}
                        disabled={
                          !canUpdate || saving
                        }
                        onChange={(event) =>
                          updateForm(
                            "timezone",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-surface-hover"
                      >
                        {TIMEZONE_OPTIONS.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>

                      <p className="mt-1.5 text-xs text-ink-muted">
                        Controls the company&apos;s
                        preferred local timezone.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-line bg-surface shadow-sm">
                <div className="border-b border-line px-6 py-5">
                  <h2 className="text-base font-semibold text-ink">
                    Display Formats
                  </h2>

                  <p className="mt-1 text-xs text-ink-muted">
                    Choose how dates and times are
                    displayed throughout the
                    application.
                  </p>
                </div>

                <div className="px-6 py-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="dateFormat"
                        className="mb-1.5 block text-sm font-medium text-ink-secondary"
                      >
                        Date Format
                      </label>

                      <select
                        id="dateFormat"
                        value={form.dateFormat}
                        disabled={
                          !canUpdate || saving
                        }
                        onChange={(event) =>
                          updateForm(
                            "dateFormat",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-surface-hover"
                      >
                        {DATE_FORMAT_OPTIONS.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {option.value} —{" "}
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="timeFormat"
                        className="mb-1.5 block text-sm font-medium text-ink-secondary"
                      >
                        Time Format
                      </label>

                      <select
                        id="timeFormat"
                        value={form.timeFormat}
                        disabled={
                          !canUpdate || saving
                        }
                        onChange={(event) =>
                          updateForm(
                            "timeFormat",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-surface-hover"
                      >
                        {TIME_FORMAT_OPTIONS.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-line bg-surface shadow-sm">
                <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      Save Changes
                    </h2>

                    <p className="mt-1 text-xs text-ink-muted">
                      Settings are stored for the
                      current authenticated company.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={
                        !canUpdate || saving
                      }
                      className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reset
                    </button>

                    <button
                      type="submit"
                      disabled={
                        !canUpdate || saving
                      }
                      className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : "Save Settings"}
                    </button>
                  </div>
                </div>
              </section>

              {settings && (
                <div className="px-1 text-xs text-ink-muted">
                  Last updated{" "}
                  {new Intl.DateTimeFormat(
                    "en-CA",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  ).format(
                    new Date(
                      settings.updatedAt
                    )
                  )}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}