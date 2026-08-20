"use client";

import { useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  getCategory,
  updateCategory,
  Category,
  CategoryCreateRequest,
} from "@/lib/api";

const COMPANY_ID =
  "7178d6f9-7df6-4beb-ab9c-a5d3a9b21824";

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default function CategoryViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryId =
    searchParams.get("id");

  const [category, setCategory] =
    useState<Category | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editForm, setEditForm] =
    useState<CategoryCreateRequest | null>(
      null
    );

  const [updating, setUpdating] =
    useState(false);

  const [updateError, setUpdateError] =
    useState<string | null>(null);

  const [updateSuccess, setUpdateSuccess] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategory() {
      if (!categoryId) {
        if (!cancelled) {
          setError(
            "Category ID is missing."
          );
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getCategory(
          COMPANY_ID,
          categoryId
        );

        if (!cancelled) {
          setCategory(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load category."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategory();

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  function openEditModal() {
    if (!category) {
      return;
    }

    setUpdateError(null);
    setUpdateSuccess(false);

    setEditForm({
      companyId: category.companyId,
      name: category.name,
      description: category.description,
      active: category.active,
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    if (updating) {
      return;
    }

    setShowEditModal(false);
    setUpdateError(null);
    setUpdateSuccess(false);
    setEditForm(null);
  }

  function updateEditForm(
    field: keyof CategoryCreateRequest,
    value: string | boolean
  ) {
    setEditForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function handleUpdateCategory(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!categoryId || !editForm) {
      return;
    }

    if (!editForm.name.trim()) {
      setUpdateError(
        "Category Name is required."
      );
      return;
    }

    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const request: CategoryCreateRequest = {
        companyId: COMPANY_ID,
        name: editForm.name.trim(),
        description:
          editForm.description?.trim() ||
          null,
        active: editForm.active,
      };

      const updatedCategory =
        await updateCategory(
          COMPANY_ID,
          categoryId,
          request
        );

      setCategory(updatedCategory);

      setUpdateSuccess(true);

      window.setTimeout(() => {
        setShowEditModal(false);
        setEditForm(null);
        setUpdateSuccess(false);
      }, 900);
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : "Failed to update category."
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6">
          <button
            type="button"
            onClick={() =>
              router.push("/categories")
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeftIcon />
            Back to Categories
          </button>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-400">
              Master Data / Categories / View
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Category Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage detailed category information.
            </p>
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />

            <p className="mt-4 text-sm text-slate-500">
              Loading category...
            </p>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10">
            <div className="flex items-start gap-3">
              <div className="text-red-600">
                <AlertIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Unable to load category
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/categories")
                  }
                  className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Back to Categories
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            CATEGORY DETAILS
        ================================================= */}

        {!loading &&
          !error &&
          category && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {category.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Product Category
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={
                      category.active
                        ? "inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                        : "inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                    }
                  >
                    {category.active
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <button
                    type="button"
                    onClick={openEditModal}
                    title="Edit category"
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    <EditIcon />
                    Edit Category
                  </button>
                </div>
              </div>

              <div className="grid gap-x-8 gap-y-7 p-6 md:grid-cols-2">

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Category Name
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-slate-800">
                    {category.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <span
                    className={
                      category.active
                        ? "mt-1.5 inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                        : "mt-1.5 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                    }
                  >
                    {category.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Description
                  </p>

                  <p className="mt-1.5 text-sm leading-6 text-slate-700">
                    {category.description ||
                      "No description provided."}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Created
                  </p>

                  <p className="mt-1.5 text-sm text-slate-700">
                    {new Date(
                      category.createdAt
                    ).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Last Updated
                  </p>

                  <p className="mt-1.5 text-sm text-slate-700">
                    {new Date(
                      category.updatedAt
                    ).toLocaleString()}
                  </p>
                </div>

              </div>
            </div>
          )}

        {/* =================================================
            EDIT MODAL
        ================================================= */}

        {showEditModal &&
          editForm &&
          category && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
              <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">

                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Edit Category
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Update category information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={updating}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  >
                    <XIcon />
                  </button>
                </div>

                <form
                  onSubmit={
                    handleUpdateCategory
                  }
                >
                  <div className="grid gap-5 p-5">

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Category Name{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(event) =>
                          updateEditForm(
                            "name",
                            event.target.value
                          )
                        }
                        required
                        maxLength={150}
                        autoFocus
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Description
                      </label>

                      <textarea
                        value={
                          editForm.description ??
                          ""
                        }
                        onChange={(event) =>
                          updateEditForm(
                            "description",
                            event.target.value
                          )
                        }
                        maxLength={500}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                      />
                    </div>

                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editForm.active}
                        onChange={(event) =>
                          updateEditForm(
                            "active",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />

                      <span>
                        <span className="block text-sm font-medium text-slate-700">
                          Active category
                        </span>

                        <span className="block text-xs text-slate-400">
                          Inactive categories remain stored and can be reactivated.
                        </span>
                      </span>
                    </label>

                    {updateError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-sm font-medium text-red-700">
                          Unable to update category
                        </p>

                        <p className="mt-1 text-xs text-red-600">
                          {updateError}
                        </p>
                      </div>
                    )}

                    {updateSuccess && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                          <CheckIcon />
                          Category updated successfully.
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">

                    <button
                      type="button"
                      onClick={closeEditModal}
                      disabled={updating}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={updating}
                      className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updating
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    </AppShell>
  );
}