const API_BASE_URL = "http://localhost:8080";

export interface Product {
  id: string;
  companyId: string;
  categoryId: string | null;
  unitOfMeasureId: string;
  sku: string;
  name: string;
  description: string | null;
  barcode: string | null;
  costPrice: number | null;
  sellingPrice: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateRequest {
  companyId: string;
  categoryId: string | null;
  unitOfMeasureId: string;
  sku: string;
  name: string;
  description: string | null;
  barcode: string | null;
  costPrice: number | null;
  sellingPrice: number | null;
  active: boolean;
}

/**
 * Create a new product.
 */
export async function createProduct(
  request: ProductCreateRequest
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let message = `Failed to create product: ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * Check whether the Spring Boot backend is reachable.
 */
export async function checkBackendHealth(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.text();
}

/**
 * Get all products belonging to a company.
 */
export async function getProducts(
  companyId: string
): Promise<Product[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/products?companyId=${encodeURIComponent(
      companyId
    )}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = `Failed to load products: ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * Get one product by ID.
 *
 * The company ID is included because the backend uses
 * company context when accessing product data.
 */
export async function getProduct(
  companyId: string,
  productId: string
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${encodeURIComponent(
      productId
    )}?companyId=${encodeURIComponent(companyId)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = `Failed to load product: ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * Update an existing product.
 */
export async function updateProduct(
  companyId: string,
  productId: string,
  request: ProductCreateRequest
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${encodeURIComponent(
      productId
    )}?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    let message = `Failed to update product: ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * Deactivate an existing product.
 */
export async function deactivateProduct(
  companyId: string,
  productId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${encodeURIComponent(
      productId
    )}?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    let message = `Failed to deactivate product: ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }
}