import { authFetch } from "@/lib/authFetch";

const fetch = authFetch;

export interface FulfillmentResponse {
  id: string;
  type: string;
  companyId: string | null;
  salesOrderId: string | null;
  warehouseId: string | null;
  number: string | null;
  status: string | null;
  assignedToUserId: string | null;
  salesOrderLineId: string | null;
  productId: string | null;
  warehouseLocationId: string | null;
  requestedQuantity: number | null;
  pickedQuantity: number | null;
  quantity: number | null;
  carrierName: string | null;
  trackingNumber: string | null;
  shippingMethod: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  lines: FulfillmentResponse[] | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PickListCreateRequest {
  companyId: string;
  warehouseId: string;
  salesOrderId: string;
  pickListNumber?: string | null;
}

export interface PickQuantityRequest {
  pickedQuantity: number;
}

export interface PackageLineRequest {
  salesOrderLineId: string;
  quantity: number;
}

export interface PackageCreateRequest {
  companyId: string;
  salesOrderId: string;
  packageNumber?: string | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  lines: PackageLineRequest[];
}

export interface ShipmentCreateRequest {
  companyId: string;
  salesOrderId: string;
  shipmentNumber?: string | null;
  carrierName?: string | null;
  trackingNumber?: string | null;
  shippingMethod?: string | null;
  notes?: string | null;
  packageIds: string[];
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

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Fulfillment request failed: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function getPickLists(
  companyId: string
): Promise<FulfillmentResponse[]> {
  return request<FulfillmentResponse[]>(
    `/api/fulfillment/pick-lists?companyId=${encodeURIComponent(companyId)}`
  );
}

export async function createPickList(
  requestBody: PickListCreateRequest
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>("/api/fulfillment/pick-lists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

export async function assignPickList(
  companyId: string,
  pickListId: string,
  userId: string
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>(
    `/api/fulfillment/pick-lists/${encodeURIComponent(
      pickListId
    )}/assign?companyId=${encodeURIComponent(
      companyId
    )}&userId=${encodeURIComponent(userId)}`,
    {
      method: "POST",
    }
  );
}

export async function startPicking(
  companyId: string,
  pickListId: string
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>(
    `/api/fulfillment/pick-lists/${encodeURIComponent(
      pickListId
    )}/start?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );
}

export async function updatePickedQuantity(
  companyId: string,
  pickListId: string,
  lineId: string,
  pickedQuantity: number
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>(
    `/api/fulfillment/pick-lists/${encodeURIComponent(
      pickListId
    )}/lines/${encodeURIComponent(
      lineId
    )}/pick?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pickedQuantity,
      } satisfies PickQuantityRequest),
    }
  );
}

export async function completePicking(
  companyId: string,
  pickListId: string
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>(
    `/api/fulfillment/pick-lists/${encodeURIComponent(
      pickListId
    )}/complete?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );
}

export async function getPackages(
  companyId: string
): Promise<FulfillmentResponse[]> {
  return request<FulfillmentResponse[]>(
    `/api/fulfillment/packages?companyId=${encodeURIComponent(companyId)}`
  );
}

export async function createPackage(
  requestBody: PackageCreateRequest
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>("/api/fulfillment/packages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

export async function packPackage(
  companyId: string,
  packageId: string
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>(
    `/api/fulfillment/packages/${encodeURIComponent(
      packageId
    )}/pack?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );
}

export async function getShipments(
  companyId: string
): Promise<FulfillmentResponse[]> {
  return request<FulfillmentResponse[]>(
    `/api/fulfillment/shipments?companyId=${encodeURIComponent(companyId)}`
  );
}

export async function createShipment(
  requestBody: ShipmentCreateRequest
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>("/api/fulfillment/shipments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

export async function shipShipment(
  companyId: string,
  shipmentId: string
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>(
    `/api/fulfillment/shipments/${encodeURIComponent(
      shipmentId
    )}/ship?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );
}

export async function markInTransit(
  companyId: string,
  shipmentId: string
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>(
    `/api/fulfillment/shipments/${encodeURIComponent(
      shipmentId
    )}/in-transit?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );
}

export async function deliverShipment(
  companyId: string,
  shipmentId: string
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>(
    `/api/fulfillment/shipments/${encodeURIComponent(
      shipmentId
    )}/deliver?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );
}

export async function cancelShipment(
  companyId: string,
  shipmentId: string
): Promise<FulfillmentResponse> {
  return request<FulfillmentResponse>(
    `/api/fulfillment/shipments/${encodeURIComponent(
      shipmentId
    )}/cancel?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
    }
  );
}

export interface Warehouse {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}

export async function getFulfillmentWarehouses(
  companyId: string
): Promise<Warehouse[]> {
  return request<Warehouse[]>(
    `/api/warehouses?companyId=${encodeURIComponent(companyId)}`
  );
}