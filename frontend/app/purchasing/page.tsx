import { authFetch } from "@/lib/authFetch";

const fetch = authFetch;

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export interface PurchaseOrderLineRequest {
  productId: string;
  orderedQuantity: number;
  unitCost: number;
}

export interface PurchaseOrderCreateRequest {
  companyId: string;
  supplierId: string;
  orderNumber: string;
  orderDate: string | null;
  notes: string | null;
  lines: PurchaseOrderLineRequest[];
}

export interface PurchaseOrderLine {
  id: string;
  productId: string;
  orderedQuantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  supplierId: string;
  orderNumber: string;
  orderDate: string;
  status: PurchaseOrderStatus;
  notes: string | null;
  lines: PurchaseOrderLine[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

async function getErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const errorBody = await response.json();

    if (typeof errorBody?.message === "string") {
      return errorBody.message;
    }

    if (typeof errorBody?.error === "string") {
      return errorBody.error;
    }
  } catch {
    // Response may not contain JSON.
  }

  return fallback;
}

export async function getPurchaseOrders(
  companyId: string,
  options?: {
    supplierId?: string;
    status?: PurchaseOrderStatus;
  }
): Promise<PurchaseOrder[]> {
  const params = new URLSearchParams();

  params.set("companyId", companyId);

  if (options?.supplierId) {
    params.set("supplierId", options.supplierId);
  }

  if (options?.status) {
    params.set("status", options.status);
  }

  const response = await fetch(
    `/api/purchase-orders?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load purchase orders: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function getPurchaseOrder(
  companyId: string,
  purchaseOrderId: string
): Promise<PurchaseOrder> {
  const response = await fetch(
    `/api/purchase-orders/${encodeURIComponent(
      purchaseOrderId
    )}?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load purchase order: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function createPurchaseOrder(
  request: PurchaseOrderCreateRequest
): Promise<PurchaseOrder> {
  const response = await fetch("/api/purchase-orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to create purchase order: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function submitPurchaseOrder(
  companyId: string,
  purchaseOrderId: string
): Promise<PurchaseOrder> {
  const response = await fetch(
    `/api/purchase-orders/${encodeURIComponent(
      purchaseOrderId
    )}/submit?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to submit purchase order: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function approvePurchaseOrder(
  companyId: string,
  purchaseOrderId: string
): Promise<PurchaseOrder> {
  const response = await fetch(
    `/api/purchase-orders/${encodeURIComponent(
      purchaseOrderId
    )}/approve?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to approve purchase order: ${response.status}`
      )
    );
  }

  return response.json();
}