
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
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/useToast";
import {
  DownloadIcon,
  EyeIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from "@/components/ui/icons";
import {
  deleteDocument,
  DocumentRecord,
  downloadDocument,
  getDocuments,
  uploadDocument,
  viewDocument,
} from "@/lib/documentsApi";
import { exportToCsv } from "@/lib/exportCsv";
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

const PAGE_SIZE = 10;

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

function FileIcon({ contentType }: { contentType: string }) {
  const isPdf = contentType === "application/pdf";
  const isImage = contentType.startsWith("image/");
  const isSpreadsheet =
    contentType.includes("spreadsheet") || contentType.includes("excel");

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-active text-ink-secondary">
      {isPdf ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 16h2" />
          <path d="M8 12h8" />
        </svg>
      ) : isImage ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      ) : isSpreadsheet ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h8M12 8v8" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [page, setPage] = useState(1);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("GENERAL");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast, showToast, dismissToast } = useToast();

  const canCreate = hasPermission("DOCUMENT_CREATE");
  const canDelete = hasPermission("DOCUMENT_DELETE");

  async function loadDocuments() {
    setLoading(true);
    setPageError(null);

    try {
      const result = await getDocuments();
      setDocuments(result);
    } catch (loadError) {
      setPageError(
        loadError instanceof Error ? loadError.message : "Unable to load documents.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchDocuments() {
      setLoading(true);
      setPageError(null);

      try {
        const result = await getDocuments();

        if (!cancelled) {
          setDocuments(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setPageError(
            loadError instanceof Error ? loadError.message : "Unable to load documents.",
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

  const [appliedFilters, setAppliedFilters] = useState({ search, typeFilter });

  if (appliedFilters.search !== search || appliedFilters.typeFilter !== typeFilter) {
    setAppliedFilters({ search, typeFilter });
    setPage(1);
  }

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          document.fileName,
          document.documentType,
          document.description ?? "",
          document.contentType,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesType =
        typeFilter === "All Types" || document.documentType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [documents, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedDocuments = useMemo(
    () =>
      filteredDocuments.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [filteredDocuments, currentPage],
  );

  const totalSize = useMemo(
    () => documents.reduce((total, document) => total + document.fileSize, 0),
    [documents],
  );

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      showToast("error", "Select a file before uploading.");
      return;
    }

    setUploading(true);

    try {
      await uploadDocument(selectedFile, documentType, description);

      setSelectedFile(null);
      setDocumentType("GENERAL");
      setDescription("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadDocuments();
      showToast("success", "Document uploaded successfully.");
    } catch (uploadError) {
      showToast(
        "error",
        uploadError instanceof Error ? uploadError.message : "Unable to upload document.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleView(document: DocumentRecord) {
    setActionId(document.id);

    try {
      await viewDocument(document.id, document.fileName, document.contentType);
    } catch (viewError) {
      showToast(
        "error",
        viewError instanceof Error ? viewError.message : "Unable to open document.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDownload(document: DocumentRecord) {
    setActionId(document.id);

    try {
      await downloadDocument(document.id, document.fileName);
      showToast("success", "Document download started.");
    } catch (downloadError) {
      showToast(
        "error",
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download document.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteDocument(deleteTarget.id);

      setDocuments((current) => current.filter((item) => item.id !== deleteTarget.id));
      showToast("success", "Document deleted successfully.");
      setDeleteTarget(null);
    } catch (deleteError) {
      showToast(
        "error",
        deleteError instanceof Error ? deleteError.message : "Unable to delete document.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    exportToCsv("documents", filteredDocuments, [
      { label: "File Name", value: (row) => row.fileName },
      { label: "Type", value: (row) => formatDocumentType(row.documentType) },
      { label: "Description", value: (row) => row.description ?? "" },
      { label: "Size", value: (row) => formatFileSize(row.fileSize) },
      { label: "Uploaded By", value: (row) => row.uploadedBy },
      { label: "Uploaded At", value: (row) => formatDate(row.createdAt) },
    ]);
  }

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Documents</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Centralized business documents for your company.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Documents
              </div>
              <div className="mt-1 text-xl font-bold text-ink">{documents.length}</div>
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
                {canCreate ? "Upload enabled" : "View only"}
              </div>
            </div>
          </div>
        </div>

        {canCreate && (
          <Card padded={false}>
            <div className="border-b border-line px-5 py-4">
              <CardHeader
                title="Add document"
                description="Upload a business document to the company document store."
              />
            </div>

            <form onSubmit={handleUpload} className="grid gap-5 p-5 lg:grid-cols-[1.3fr_0.7fr]">
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
                    {selectedFile.name} · {formatFileSize(selectedFile.size)}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Document type
                </label>

                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
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
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Optional description or document context"
                  className="w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-600"
                />
              </div>

              <div className="lg:col-span-2">
                <Button type="submit" disabled={uploading || !selectedFile}>
                  <UploadIcon />
                  {uploading ? "Uploading..." : "Upload document"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card padded={false}>
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Document library</h2>
              <p className="mt-1 text-xs text-ink-muted">
                {filteredDocuments.length} document{filteredDocuments.length === 1 ? "" : "s"}{" "}
                shown
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search documents..."
                  className="w-full rounded-lg border border-line bg-canvas py-2.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary-600"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-primary-600 sm:w-44"
              >
                <option>All Types</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatDocumentType(type)}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="md"
                onClick={handleExport}
                disabled={filteredDocuments.length === 0}
              >
                <DownloadIcon />
                Export
              </Button>
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={6} columns={5} />
          ) : pageError ? (
            <ErrorState description={pageError} onRetry={loadDocuments} />
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              }
              title={search || typeFilter !== "All Types" ? "No matching documents" : "No documents yet"}
              description={
                search || typeFilter !== "All Types"
                  ? "Try a different filename, document type, or description."
                  : canCreate
                    ? "Upload your first business document using the form above."
                    : "Documents uploaded to your company will appear here."
              }
            />
          ) : (
            <>
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
                    {paginatedDocuments.map((document) => {
                      const busy = actionId === document.id;

                      return (
                        <tr key={document.id} className="transition hover:bg-surface-hover">
                          <td className="px-5 py-4">
                            <div className="flex min-w-[260px] items-center gap-3">
                              <FileIcon contentType={document.contentType} />
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-ink">
                                  {document.fileName}
                                </div>
                                <div className="mt-0.5 max-w-md truncate text-xs text-ink-muted">
                                  {document.description || document.contentType}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <Badge tone="info">{formatDocumentType(document.documentType)}</Badge>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-ink-secondary">
                            {formatFileSize(document.fileSize)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="text-sm text-ink-secondary">
                              {formatDate(document.createdAt)}
                            </div>
                            {document.uploadedBy && (
                              <div className="mt-0.5 text-xs text-ink-muted">
                                by {document.uploadedBy}
                              </div>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <IconButton
                                label="View"
                                disabled={busy}
                                onClick={() => handleView(document)}
                              >
                                <EyeIcon />
                              </IconButton>

                              <IconButton
                                label="Download"
                                disabled={busy}
                                onClick={() => handleDownload(document)}
                              >
                                <DownloadIcon />
                              </IconButton>

                              {canDelete && (
                                <IconButton
                                  label="Delete"
                                  danger
                                  disabled={busy}
                                  onClick={() => setDeleteTarget(document)}
                                >
                                  <TrashIcon />
                                </IconButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredDocuments.length}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[80]">
          <Toast type={toast.type} message={toast.message} onDismiss={dismissToast} />
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete document"
        message={
          <>
            Delete <span className="font-semibold text-ink">{deleteTarget?.fileName}</span>?
            This permanently removes the stored document.
          </>
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
