import { authFetch } from "@/lib/authFetch";

const fetch = authFetch;

export type InventoryTransactionType =
  | "RECEIPT"
  | "SHIPMENT"
  | "ADJUSTMENT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "RETURN"
  | "DAMAGE"
  | "STOCKTAKE";

export interface InventoryBalance {
  id: string;
  productId: string;
  warehouseLocationId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  warehouseLocationId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
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

export async function getInventoryBalances(
  companyId: string,
  productId?: string,
  warehouseLocationId?: string
): Promise<InventoryBalance[]> {
  const params = new URLSearchParams();

  params.set("companyId", companyId);

  if (productId) {
    params.set("productId", productId);
  }

  if (warehouseLocationId) {
    params.set(
      "warehouseLocationId",
      warehouseLocationId
    );
  }

  const response = await fetch(
    `/api/inventory/balances?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load inventory balances: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function getInventoryTransactions(
  companyId: string,
  productId?: string,
  warehouseLocationId?: string
): Promise<InventoryTransaction[]> {
  const params = new URLSearchParams();

  params.set("companyId", companyId);

  if (productId) {
    params.set("productId", productId);
  }

  if (warehouseLocationId) {
    params.set(
      "warehouseLocationId",
      warehouseLocationId
    );
  }

  const response = await fetch(
    `/api/inventory/transactions?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load inventory transactions: ${response.status}`
      )
    );
  }

  return response.json();
}