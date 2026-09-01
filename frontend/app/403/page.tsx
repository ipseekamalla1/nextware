"use client";

import { useRouter } from "next/navigation";
import {
  useAuth,
} from "@/components/auth/AuthProvider";

export default function ForbiddenPage() {
  const router = useRouter();

  const {
    session,
    logout,
  } = useAuth();

  const displayName =
    [
      session?.firstName,
      session?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    session?.username ||
    "User";

  const initials =
    [
      session?.firstName?.[0],
      session?.lastName?.[0],
    ]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    session?.username
      ?.slice(0, 2)
      .toUpperCase() ||
    "NW";

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white">
                NW
              </div>

              <div>
                <div className="text-sm font-bold tracking-tight text-ink">
                  Nextware
                </div>

                <div className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                  ERP & WMS
                </div>
              </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-active text-xs font-semibold text-ink-secondary">
              {initials}
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-xl font-bold text-danger">
              403
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Access denied
            </h1>

            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              Your account is authenticated, but you do not have permission
              to access this area of Nextware.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-canvas p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Signed in as
            </div>

            <div className="mt-1 text-sm font-semibold text-ink">
              {displayName}
            </div>

            <div className="mt-0.5 text-xs text-ink-muted">
              {session?.username}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Back to dashboard
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-surface-hover hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}