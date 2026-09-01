/**
 * Central runtime configuration for the Nextware frontend.
 *
 * Values come from NEXT_PUBLIC_* environment variables resolved at build time,
 * so local development and the packaged Tauri desktop build can target
 * different backend hosts without code changes.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/**
 * Optional local-development convenience: pre-fills the company field on the
 * sign-in screen. Leave unset in committed config — never ship a real tenant id.
 */
export const DEFAULT_COMPANY_ID =
  process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID ?? "";
