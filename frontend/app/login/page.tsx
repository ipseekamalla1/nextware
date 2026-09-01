"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  LoginRequest,
  getStoredSession,
} from "@/lib/auth";
import { DEFAULT_COMPANY_ID } from "@/lib/config";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    session,
    loading: authLoading,
  } = useAuth();

  const [companyId, setCompanyId] =
    useState(DEFAULT_COMPANY_ID);

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const storedSession =
      getStoredSession();

    if (storedSession) {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && session) {
      router.replace("/");
    }
  }, [
    authLoading,
    session,
    router,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    const trimmedCompanyId =
      companyId.trim();

    const trimmedUsername =
      username.trim();

    if (!trimmedCompanyId) {
      setError(
        "Company ID is required."
      );
      return;
    }

    if (!trimmedUsername) {
      setError(
        "Username is required."
      );
      return;
    }

    if (!password) {
      setError(
        "Password is required."
      );
      return;
    }

    const request: LoginRequest = {
      companyId: trimmedCompanyId,
      username: trimmedUsername,
      password,
    };

    try {
      setLoading(true);

      await login(request);

      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="grid min-h-screen lg:grid-cols-2">

        <section className="hidden bg-primary-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-bold text-primary-600 shadow-sm">
                NW
              </div>

              <div>
                <div className="text-lg font-bold tracking-tight text-white">
                  NextWare
                </div>

                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  ERP & WMS
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
              Wholesale operations
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white xl:text-5xl">
              Run your warehouse and wholesale business from one system.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-white/75">
              Manage products, customers, suppliers,
              warehouses, inventory, purchasing,
              sales, and fulfillment in NextWare.
            </p>
          </div>

          <div className="text-xs text-white/50">
            NextWare ERP & WMS
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">

            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white shadow-sm">
                  NW
                </div>

                <div>
                  <div className="text-lg font-bold tracking-tight text-ink">
                    NextWare
                  </div>

                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                    ERP & WMS
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-ink">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-ink-secondary">
                Sign in to your NextWare workspace.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3">
                <p className="text-sm font-medium text-danger">
                  {error}
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="companyId"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  Company ID
                </label>

                <input
                  id="companyId"
                  name="companyId"
                  type="text"
                  value={companyId}
                  onChange={(event) =>
                    setCompanyId(
                      event.target.value
                    )
                  }
                  autoComplete="organization"
                  disabled={loading}
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Company UUID"
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  Username
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  autoComplete="username"
                  disabled={loading}
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 pr-20 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:opacity-50"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-line pt-6">
              <p className="text-center text-xs text-ink-muted">
                Authorized NextWare users only.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}