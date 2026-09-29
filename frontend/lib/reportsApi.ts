import { authFetch } from "@/lib/authFetch";

const fetch = authFetch;

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = await response.json();

    if (typeof body?.message === "string") {
      return body.message;
    }

    if (typeof body?.error === "string") {
      return body.error;
    }
  } catch {
    // Response may not contain JSON.
  }

  return fallback;
}

function buildQuery(
  params: Record<string, string | null | undefined>,
): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.set(key, value);
    }
  });

  const result = query.toString();

  return result ? `?${result}` : "";
}

export interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  warehouseId?: string;
  productId?: string;
  customerId?: string;
  supplierId?: string;
  status?: string;
  transactionType?: string;
}

export interface InventoryBalanceRow {
  productId: string;
  sku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocationId: string;
  locationCode: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface InventorySummary {
  lineCount: number;
  totalQuantity: number;
  totalReservedQuantity: number;
  totalAvailableQuantity: number;
  rows: InventoryBalanceRow[];
}

export interface InventoryTransactionRow {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocationId: string;
  locationCode: string;
  transactionType: string;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PurchaseOrderRow {
  id: string;
  orderNumber: string;
  orderDate: string;
  supplierId: string;
  supplierName: string;
  status: string;
  orderedValue: number;
}

export interface PurchaseOrderSummary {
  orderCount: number;
  orderedValue: number;
  rows: PurchaseOrderRow[];
}

export interface ReceivingRow {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  purchaseOrderId: string;
  warehouseId: string;
  warehouseName: string;
  status: string;
  receivedQuantity: number;
  receivedValue: number;
}

export interface ReceivingSummary {
  receiptCount: number;
  receivedQuantity: number;
  receivedValue: number;
  rows: ReceivingRow[];
}

export interface SalesOrderRow {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerId: string;
  customerName: string;
  status: string;
  orderValue: number;
}

export interface SalesSummary {
  orderCount: number;
  orderValue: number;
  rows: SalesOrderRow[];
}

export interface SalesCustomerRow {
  customerId: string;
  customerName: string;
  orderCount: number;
  orderValue: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface FulfillmentSummary {
  pickListCount: number;
  packageCount: number;
  shipmentCount: number;
  pickListsByStatus: StatusCount[];
  packagesByStatus: StatusCount[];
  shipmentsByStatus: StatusCount[];
}

async function getJson<T>(
  path: string,
  fallback: string,
): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `${fallback}: ${response.status}`,
      ),
    );
  }

  return response.json();
}

export async function getInventoryBalance(
  filter: ReportFilter = {},
): Promise<InventorySummary> {
  return getJson(
    `/api/reports/inventory/balance${buildQuery({
      warehouseId: filter.warehouseId,
      productId: filter.productId,
    })}`,
    "Failed to load inventory balance",
  );
}

export async function getInventoryTransactions(
  filter: ReportFilter = {},
): Promise<InventoryTransactionRow[]> {
  return getJson(
    `/api/reports/inventory/transactions${buildQuery({
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      warehouseId: filter.warehouseId,
      productId: filter.productId,
      transactionType: filter.transactionType,
    })}`,
    "Failed to load inventory transactions",
  );
}

export async function getPurchaseOrderReport(
  filter: ReportFilter = {},
): Promise<PurchaseOrderSummary> {
  return getJson(
    `/api/reports/purchasing${buildQuery({
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      supplierId: filter.supplierId,
      status: filter.status,
    })}`,
    "Failed to load purchase order report",
  );
}

export async function getReceivingReport(
  filter: ReportFilter = {},
): Promise<ReceivingSummary> {
  return getJson(
    `/api/reports/receiving${buildQuery({
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      warehouseId: filter.warehouseId,
      status: filter.status,
    })}`,
    "Failed to load receiving report",
  );
}

export async function getSalesReport(
  filter: ReportFilter = {},
): Promise<SalesSummary> {
  return getJson(
    `/api/reports/sales${buildQuery({
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      customerId: filter.customerId,
      status: filter.status,
    })}`,
    "Failed to load sales report",
  );
}

export async function getSalesByCustomerReport(
  filter: ReportFilter = {},
): Promise<SalesCustomerRow[]> {
  return getJson(
    `/api/reports/sales/by-customer${buildQuery({
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      customerId: filter.customerId,
      status: filter.status,
    })}`,
    "Failed to load sales by customer report",
  );
}

export async function getFulfillmentReport(
  filter: ReportFilter = {},
): Promise<FulfillmentSummary> {
  return getJson(
    `/api/reports/fulfillment${buildQuery({
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      warehouseId: filter.warehouseId,
      status: filter.status,
    })}`,
    "Failed to load fulfillment report",
  );
}