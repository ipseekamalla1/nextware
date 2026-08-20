"use client";

import { useRouter } from "next/navigation";
import {
  Category,
} from "@/lib/api";

interface CategoryDetailClientProps {
  category: Category;
}

export default function CategoryDetailClient({
  category,
}: CategoryDetailClientProps) {
  const router = useRouter();

  return (
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
            onClick={() =>
              router.push(
                `/categories/view?id=${encodeURIComponent(
                  category.id
                )}`
              )
            }
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            View Category
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
  );
}