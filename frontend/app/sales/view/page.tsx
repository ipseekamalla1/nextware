"use client";

import {
Suspense,
} from "react";
import SalesOrderDetailClient from "@/components/sales/SalesOrderDetailClient";

function LoadingState() {
return ( <div className="p-6 lg:p-8"> <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-sm"> <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />


    <p className="mt-4 text-sm text-ink-muted">
      Loading sales order...
    </p>
  </div>
</div>


);
}

export default function SalesOrderViewPage() {
return (
<Suspense fallback={<LoadingState />}> <SalesOrderDetailClient /> </Suspense>
);
}
