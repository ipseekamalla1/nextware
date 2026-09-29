import { authFetch } from "@/lib/authFetch";

const fetch = authFetch;

export interface AuditRecord {
  id: string;
  companyId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

export interface AuditFilter {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  from?: string;
  to?: string;
}

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = await response.json();

    if (
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
    ) {
      return body.message;
    }

    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // Response may not contain JSON.
  }

  return fallback;
}

function buildQuery(
  filter: AuditFilter = {},
): string {
  const params = new URLSearchParams();

  if (filter.action?.trim()) {
    params.set(
      "action",
      filter.action.trim().toUpperCase(),
    );
  }

  if (filter.entityType?.trim()) {
    params.set(
      "entityType",
      filter.entityType.trim().toUpperCase(),
    );
  }

  if (filter.entityId?.trim()) {
    params.set(
      "entityId",
      filter.entityId.trim(),
    );
  }

  if (filter.userId?.trim()) {
    params.set(
      "userId",
      filter.userId.trim(),
    );
  }

  if (filter.from?.trim()) {
    params.set(
      "from",
      filter.from.trim(),
    );
  }

  if (filter.to?.trim()) {
    params.set(
      "to",
      filter.to.trim(),
    );
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

export async function getAuditLogs(
  filter: AuditFilter = {},
): Promise<AuditRecord[]> {
  const response = await fetch(
    `/api/audit${buildQuery(filter)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load audit records: ${response.status}`,
      ),
    );
  }

  return response.json();
}