import { authFetch } from "@/lib/authFetch";

const fetch = authFetch;

export interface DocumentRecord {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  documentType: string;
  description: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

async function getErrorMessage(
  response: Response,
  fallback: string,
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
    // Response may not contain JSON.
  }

  return fallback;
}

export async function getDocuments(): Promise<DocumentRecord[]> {
  const response = await fetch("/api/documents", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load documents: ${response.status}`,
      ),
    );
  }

  return response.json();
}

export async function uploadDocument(
  file: File,
  documentType: string,
  description?: string,
): Promise<DocumentRecord> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("documentType", documentType);

  if (description?.trim()) {
    formData.append("description", description.trim());
  }

  const response = await fetch("/api/documents", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to upload document: ${response.status}`,
      ),
    );
  }

  return response.json();
}

export async function downloadDocument(
  documentId: string,
  fileName: string,
): Promise<void> {
  const response = await fetch(
    `/api/documents/${encodeURIComponent(documentId)}/download`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to download document: ${response.status}`,
      ),
    );
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(url);
}

export async function deleteDocument(
  documentId: string,
): Promise<void> {
  const response = await fetch(
    `/api/documents/${encodeURIComponent(documentId)}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to delete document: ${response.status}`,
      ),
    );
  }
}