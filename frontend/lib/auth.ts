export const AUTH_STORAGE_KEY = "nextware-auth";

export interface LoginRequest {
  companyId: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  companyId: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface AuthSession {
  token: string;
  userId: string;
  companyId: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

const API_BASE_URL = "http://localhost:8080";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getStoredSession(): AuthSession | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const session = JSON.parse(stored) as AuthSession;

    if (
      !session ||
      typeof session.token !== "string" ||
      typeof session.companyId !== "string" ||
      typeof session.username !== "string"
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function saveSession(
  authResponse: AuthResponse
): AuthSession {
  const session: AuthSession = {
    token: authResponse.token,
    userId: authResponse.userId,
    companyId: authResponse.companyId,
    username: authResponse.username,
    firstName: authResponse.firstName,
    lastName: authResponse.lastName,
    roles: authResponse.roles ?? [],
    permissions: authResponse.permissions ?? [],
  };

  if (isBrowser()) {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(session)
    );
  }

  return session;
}

export function clearSession(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return getStoredSession()?.token ?? null;
}

export function getCurrentCompanyId(): string | null {
  return getStoredSession()?.companyId ?? null;
}

export function getCurrentUser(): AuthSession | null {
  return getStoredSession();
}

export function hasRole(role: string): boolean {
  const session = getStoredSession();

  if (!session) {
    return false;
  }

  return session.roles.includes(role);
}

export function hasPermission(permission: string): boolean {
  const session = getStoredSession();

  if (!session) {
    return false;
  }

  return session.permissions.includes(permission);
}

export async function login(
  request: LoginRequest
): Promise<AuthSession> {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  let responseBody: unknown = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    if (
      responseBody &&
      typeof responseBody === "object" &&
      "message" in responseBody &&
      typeof responseBody.message === "string"
    ) {
      throw new Error(responseBody.message);
    }

    if (
      responseBody &&
      typeof responseBody === "object" &&
      "error" in responseBody &&
      typeof responseBody.error === "string"
    ) {
      throw new Error(responseBody.error);
    }

    if (response.status === 401) {
      throw new Error(
        "Invalid company, username, or password."
      );
    }

    throw new Error(
      `Login failed. Server returned ${response.status}.`
    );
  }

  if (
    !responseBody ||
    typeof responseBody !== "object"
  ) {
    throw new Error(
      "Login failed because the server returned an invalid response."
    );
  }

  const authResponse =
    responseBody as AuthResponse;

  if (
    typeof authResponse.token !== "string" ||
    !authResponse.token
  ) {
    throw new Error(
      "Login failed because the server did not return a JWT."
    );
  }

  return saveSession(authResponse);
}