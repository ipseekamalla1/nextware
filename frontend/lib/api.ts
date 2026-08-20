const API_BASE_URL = "http://localhost:8080";

/* =========================================================
   PRODUCT
========================================================= */

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

/* =========================================================
   CATEGORY
========================================================= */

export interface Category {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreateRequest {
  companyId: string;
  name: string;
  description: string | null;
  active: boolean;
}

/* =========================================================
   ERROR HANDLING
========================================================= */

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

/* =========================================================
   HEALTH
========================================================= */

export async function checkBackendHealth(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Backend request failed: ${response.status}`
      )
    );
  }

  return response.text();
}

/* =========================================================
   PRODUCT API
========================================================= */

export async function getProducts(
  companyId: string
): Promise<Product[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/products?companyId=${encodeURIComponent(
      companyId
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load products: ${response.status}`
      )
    );
  }

  return response.json();
}

export async function getProduct(
  companyId: string,
  productId: string
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${encodeURIComponent(
      productId
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
        `Failed to load product: ${response.status}`
      )
    );
  }

  return response.json();
}

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
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to create product: ${response.status}`
      )
    );
  }

  return response.json();
}

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
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to update product: ${response.status}`
      )
    );
  }

  return response.json();
}

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
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to deactivate product: ${response.status}`
      )
    );
  }
}

export async function activateProduct(
  companyId: string,
  product: Product
): Promise<Product> {
  const request: ProductCreateRequest = {
    companyId: product.companyId,
    categoryId: product.categoryId,
    unitOfMeasureId: product.unitOfMeasureId,
    sku: product.sku,
    name: product.name,
    description: product.description,
    barcode: product.barcode,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    active: true,
  };

  return updateProduct(companyId, product.id, request);
}

/* =========================================================
   CATEGORY API
========================================================= */

/**
 * Get all categories belonging to a company.
 */
export async function getCategories(
  companyId: string
): Promise<Category[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/categories?companyId=${encodeURIComponent(
      companyId
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to load categories: ${response.status}`
      )
    );
  }

  return response.json();
}

/**
 * Get one category by ID.
 */
export async function getCategory(
  companyId: string,
  categoryId: string
): Promise<Category> {
  const response = await fetch(
    `${API_BASE_URL}/api/categories/${encodeURIComponent(
      categoryId
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
        `Failed to load category: ${response.status}`
      )
    );
  }

  return response.json();
}

/**
 * Create a new category.
 */
export async function createCategory(
  request: CategoryCreateRequest
): Promise<Category> {
  const response = await fetch(
    `${API_BASE_URL}/api/categories`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to create category: ${response.status}`
      )
    );
  }

  return response.json();
}

/**
 * Update an existing category.
 */
export async function updateCategory(
  companyId: string,
  categoryId: string,
  request: CategoryCreateRequest
): Promise<Category> {
  const response = await fetch(
    `${API_BASE_URL}/api/categories/${encodeURIComponent(
      categoryId
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
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to update category: ${response.status}`
      )
    );
  }

  return response.json();
}

/**
 * Deactivate an existing category.
 *
 * The backend performs a soft delete by setting active=false.
 */
export async function deactivateCategory(
  companyId: string,
  categoryId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/categories/${encodeURIComponent(
      categoryId
    )}?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        `Failed to deactivate category: ${response.status}`
      )
    );
  }
}

/**
 * Activate an inactive category.
 *
 * Activation uses the existing PUT endpoint.
 */
export async function activateCategory(
  companyId: string,
  category: Category
): Promise<Category> {
  const request: CategoryCreateRequest = {
    companyId: category.companyId,
    name: category.name,
    description: category.description,
    active: true,
  };

  return updateCategory(
    companyId,
    category.id,
    request
  );
}