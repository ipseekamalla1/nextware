import {
  clearSession,
  getAccessToken,
} from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

function redirectToLogin(): void {
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/login"
  ) {
    window.location.replace("/login");
  }
}

function redirectToForbidden(): void {
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/403"
  ) {
    window.location.replace("/403");
  }
}

export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();

  const headers = new Headers(
    options.headers
  );

  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401) {
    clearSession();
    redirectToLogin();

    return response;
  }

  if (response.status === 403) {
    redirectToForbidden();

    return response;
  }

  return response;
}