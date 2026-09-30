import { authFetch } from "@/lib/authFetch";

export interface SettingsRecord {
  companyId: string;
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsUpdateRequest {
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

async function getErrorMessage(
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

    if (
      Array.isArray(body?.errors) &&
      body.errors.length > 0
    ) {
      return body.errors
        .map((error: unknown) => {
          if (
            typeof error === "object" &&
            error !== null &&
            "defaultMessage" in error &&
            typeof error.defaultMessage === "string"
          ) {
            return error.defaultMessage;
          }

          return null;
        })
        .filter(Boolean)
        .join(", ");
    }
  } catch {
    // Ignore invalid error responses.
  }

  return fallback;
}

export async function getSettings(): Promise<SettingsRecord> {
  const response = await authFetch(
    "/api/settings",
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load settings: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function updateSettings(
  request: SettingsUpdateRequest
): Promise<SettingsRecord> {
  const response = await authFetch(
    "/api/settings",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to update settings: ${response.status}`
      )
    );
  }

  return response.json();
}