"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReceiptDetailClient from "@/components/receiving/ReceiptDetailClient";

function ReceivingViewContent() {
  const searchParams = useSearchParams();

  const receiptId =
    searchParams.get("id");

  return (
    <ReceiptDetailClient
      receiptId={receiptId}
    />
  );
}

export default function ReceivingViewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading receipt...
            </p>
          </div>
        </div>
      }
    >
      <ReceivingViewContent />
    </Suspense>
  );
}