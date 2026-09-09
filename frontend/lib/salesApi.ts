import { authFetch } from "@/lib/authFetch";

const fetch = authFetch;

export type SalesOrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "CANCELLED";

export interface SalesOrderLineRequest {
  productId: string;
  orderedQuantity: number;
  unitPrice: number;
}

export interface SalesOrderCreateRequest {
  companyId: string;
  customerId: string;
  orderNumber: string;
  orderDate: string;

  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;

  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;

  notes: string | null;
  lines: SalesOrderLineRequest[];
}

export interface SalesOrderLineResponse {
  id: string;
  productId: string;
  orderedQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SalesOrder {
  id: string;
  companyId: string;
  customerId: string;
  orderNumber: string;
  orderDate: string;
  status: SalesOrderStatus;

  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;

  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;

  notes: string | null;
  lines: SalesOrderLineResponse[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const errorBody = await response.json();

    ```
if (typeof errorBody?.message === "string") {
  return errorBody.message;
}

if (typeof errorBody?.error === "string") {
  return errorBody.error;
}
```;
  } catch {
    // Response may not contain JSON.
  }

  return fallback;
}

export async function getSalesOrders(
  companyId: string,
  options?: {
    customerId?: string;
    status?: SalesOrderStatus;
  },
): Promise<SalesOrder[]> {
  const params = new URLSearchParams();

  params.set("companyId", companyId);

  if (options?.customerId) {
    params.set("customerId", options.customerId);
  }

  if (options?.status) {
    params.set("status", options.status);
  }

  const response = await fetch(`/api/sales-orders?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load sales orders: ${response.status}`,
      ),
    );
  }

  return response.json();
}

export async function getSalesOrder(
  companyId: string,
  salesOrderId: string,
): Promise<SalesOrder> {
  const response = await fetch(
    `/api/sales-orders/${encodeURIComponent(
      salesOrderId,
    )}?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load sales order: ${response.status}`,
      ),
    );
  }

  return response.json();
}

export async function createSalesOrder(
  request: SalesOrderCreateRequest,
): Promise<SalesOrder> {
  const response = await fetch("/api/sales-orders", {
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
        `Failed to create sales order: ${response.status}`,
      ),
    );
  }

  return response.json();
}

export async function confirmSalesOrder(
  companyId: string,
  salesOrderId: string,
): Promise<SalesOrder> {
  const response = await fetch(
    `/api/sales-orders/${encodeURIComponent(
      salesOrderId,
    )}/confirm?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to confirm sales order: ${response.status}`,
      ),
    );
  }

  return response.json();
}

export async function cancelSalesOrder(
  companyId: string,
  salesOrderId: string,
): Promise<SalesOrder> {
  const response = await fetch(
    `/api/sales-orders/${encodeURIComponent(
      salesOrderId,
    )}/cancel?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to cancel sales order: ${response.status}`,
      ),
    );
  }

  return response.json();
}
