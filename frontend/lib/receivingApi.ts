import { authFetch } from "@/lib/authFetch";

const fetch = authFetch;

export type ReceiptStatus =
  | "OPEN"
  | "RECEIVING"
  | "COMPLETED"
  | "CANCELLED";

export interface ReceiptLineRequest {
  purchaseOrderLineId: string;
  warehouseLocationId: string;
  receivedQuantity: number;
  unitCost: number;
}

export interface ReceiptCreateRequest {
  companyId: string;
  purchaseOrderId: string;
  warehouseId: string;
  receiptNumber: string;
  receiptDate: string | null;
  notes: string | null;
  lines: ReceiptLineRequest[];
}

export interface ReceiptLine {
  id: string;
  purchaseOrderLineId: string;
  productId: string;
  warehouseLocationId: string;
  receivedQuantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Receipt {
  id: string;
  companyId: string;
  purchaseOrderId: string;
  warehouseId: string;
  receiptNumber: string;
  receiptDate: string;
  status: ReceiptStatus;
  notes: string | null;
  lines: ReceiptLine[];
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

export async function getReceipts(
  companyId: string,
  purchaseOrderId?: string
): Promise<Receipt[]> {
  const params = new URLSearchParams();

  params.set("companyId", companyId);

  if (purchaseOrderId) {
    params.set("purchaseOrderId", purchaseOrderId);
  }

  const response = await fetch(
    `/api/receipts?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load receipts: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function getReceipt(
  companyId: string,
  receiptId: string
): Promise<Receipt> {
  const response = await fetch(
    `/api/receipts/${encodeURIComponent(
      receiptId
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
        `Failed to load receipt: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function createReceipt(
  request: ReceiptCreateRequest
): Promise<Receipt> {
  const response = await fetch("/api/receipts", {
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
        `Failed to create receipt: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function startReceiving(
  companyId: string,
  receiptId: string
): Promise<Receipt> {
  const response = await fetch(
    `/api/receipts/${encodeURIComponent(
      receiptId
    )}/start?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to start receiving: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function completeReceipt(
  companyId: string,
  receiptId: string
): Promise<Receipt> {
  const response = await fetch(
    `/api/receipts/${encodeURIComponent(
      receiptId
    )}/complete?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to complete receipt: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function cancelReceipt(
  companyId: string,
  receiptId: string
): Promise<Receipt> {
  const response = await fetch(
    `/api/receipts/${encodeURIComponent(
      receiptId
    )}/cancel?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to cancel receipt: ${response.status}`
      )
    );
  }

  return response.json();
}