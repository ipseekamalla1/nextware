
"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AppShell from "@/components/layout/AppShell";
import {
  deleteDocument,
  DocumentRecord,
  downloadDocument,
  getDocuments,
  uploadDocument,
} from "@/lib/documentsApi";
import { hasPermission } from "@/lib/auth";

const DOCUMENT_TYPES = [
  "GENERAL",
  "INVOICE",
  "PURCHASE_ORDER",
  "RECEIPT",
  "SALES_ORDER",
  "PACKING_SLIP",
  "SHIPMENT",
  "CUSTOMER",
  "SUPPLIER",
  "PRODUCT",
  "OTHER",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDocumentType(value: string): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FileIcon({
  contentType,
}: {
  contentType: string;
}) {
  const isPdf = contentType === "application/pdf";
  const isImage = contentType.startsWith("image/");
  const isSpreadsheet =
    contentType.includes("spreadsheet") ||
    contentType.includes("excel");

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-active text-ink-secondary">
      {isPdf ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 16h2" />
          <path d="M8 12h8" />
        </svg>
      ) : isImage ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      ) : isSpreadsheet ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h8M12 8v8" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("GENERAL");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCreate = hasPermission("DOCUMENT_CREATE");
  const canDelete = hasPermission("DOCUMENT_DELETE");

  async function loadDocuments() {
    setLoading(true);
    setError(null);

    try {
      const result = await getDocuments();
      setDocuments(result);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load documents.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchDocuments() {
      try {
        const result = await getDocuments();

        if (!cancelled) {
          setDocuments(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load documents.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return documents;
    }

    return documents.filter((document) =>
      [
        document.fileName,
        document.documentType,
        document.description ?? "",
        document.contentType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [documents, search]);

  const totalSize = useMemo(
    () =>
      documents.reduce(
        (total, document) => total + document.fileSize,
        0,
      ),
    [documents],
  );

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setError(null);
    setSuccess(null);
  }

  async function handleUpload(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Select a file before uploading.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await uploadDocument(
        selectedFile,
        documentType,
        description,
      );

      setSelectedFile(null);
      setDocumentType("GENERAL");
      setDescription("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadDocuments();

      setSuccess("Document uploaded successfully.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload document.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(
    document: DocumentRecord,
  ) {
    setActionId(document.id);
    setError(null);
    setSuccess(null);

    try {
      await downloadDocument(
        document.id,
        document.fileName,
      );

      setSuccess("Document download started.");
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download document.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(
    document: DocumentRecord,
  ) {
    const confirmed = window.confirm(
      `Delete "${document.fileName}"? This permanently removes the stored document.`,
    );

    if (!confirmed) {
      return;
    }

    setActionId(document.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteDocument(document.id);

      setDocuments((current) =>
        current.filter(
          (item) => item.id !== document.id,
        ),
      );

      setSuccess("Document deleted successfully.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete document.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Documents
            </h1>

            <p className="mt-1 text-sm text-ink-muted">
              Centralized business documents for your company.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Documents
              </div>

              <div className="mt-1 text-xl font-bold text-ink">
                {documents.length}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Stored
              </div>

              <div className="mt-1 text-xl font-bold text-ink">
                {formatFileSize(totalSize)}
              </div>
            </div>

            <div className="col-span-2 rounded-xl border border-line bg-surface px-4 py-3 sm:col-span-1">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Access
              </div>

              <div className="mt-1 text-sm font-semibold text-ink">
                {canCreate
                  ? "Upload enabled"
                  : "View only"}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {canCreate && (
          <section className="rounded-xl border border-line bg-surface shadow-sm">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">
                Add document
              </h2>

              <p className="mt-1 text-xs text-ink-muted">
                Upload a business document to the company
                document store.
              </p>
            </div>

            <form
              onSubmit={handleUpload}
              className="grid gap-5 p-5 lg:grid-cols-[1.3fr_0.7fr]"
            >
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  File
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink file:mr-4 file:rounded-md file:border-0 file:bg-primary-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                />

                {selectedFile && (
                  <div className="mt-2 text-xs text-ink-muted">
                    {selectedFile.name} ·{" "}
                    {formatFileSize(selectedFile.size)}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Document type
                </label>

                <select
                  value={documentType}
                  onChange={(event) =>
                    setDocumentType(event.target.value)
                  }
                  className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-600"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {formatDocumentType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  maxLength={1000}
                  rows={3}
                  placeholder="Optional description or document context"
                  className="w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-600"
                />
              </div>

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#DDA15E] px-4 py-2.5 text-sm font-semibold text-[#283618] shadow-sm transition hover:bg-[#BC6C25] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading
                    ? "Uploading..."
                    : "Upload document"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Document library
              </h2>

              <p className="mt-1 text-xs text-ink-muted">
                {filteredDocuments.length} document
                {filteredDocuments.length === 1
                  ? ""
                  : "s"}{" "}
                shown
              </p>
            </div>

            <div className="w-full lg:w-80">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search documents..."
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">
              Loading documents...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-active text-ink-muted">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-ink">
                {search
                  ? "No matching documents"
                  : "No documents yet"}
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                {search
                  ? "Try a different filename, document type, or description."
                  : canCreate
                    ? "Upload your first business document using the form above."
                    : "Documents uploaded to your company will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-line bg-canvas text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Document
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Type
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Size
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Uploaded
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-line">
                  {filteredDocuments.map((document) => {
                    const busy =
                      actionId === document.id;

                    return (
                      <tr
                        key={document.id}
                        className="transition hover:bg-surface-hover"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-[260px] items-center gap-3">
                            <FileIcon
                              contentType={
                                document.contentType
                              }
                            />

                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-ink">
                                {document.fileName}
                              </div>

                              <div className="mt-0.5 max-w-md truncate text-xs text-ink-muted">
                                {document.description ||
                                  document.contentType}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-ink-secondary">
                          {formatDocumentType(
                            document.documentType,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-ink-secondary">
                          {formatFileSize(
                            document.fileSize,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-ink-secondary">
                          {formatDate(
                            document.createdAt,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                handleDownload(
                                  document,
                                )
                              }
                              className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-secondary transition hover:bg-surface-hover hover:text-ink disabled:opacity-50"
                            >
                              {busy
                                ? "Working..."
                                : "Download"}
                            </button>

                            {canDelete && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  handleDelete(
                                    document,
                                  )
                                }
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

