import AppShell from "@/components/layout/AppShell";

const products = [
  {
    sku: "PRD-001",
    name: "Wireless Barcode Scanner",
    category: "Hardware",
    unit: "Each",
    stock: 25,
    status: "Active",
  },
  {
    sku: "PRD-002",
    name: "Thermal Shipping Labels",
    category: "Supplies",
    unit: "Roll",
    stock: 500,
    status: "Active",
  },
  {
    sku: "PRD-003",
    name: "Warehouse Storage Bin",
    category: "Warehouse",
    unit: "Each",
    stock: 42,
    status: "Active",
  },
  {
    sku: "PRD-004",
    name: "Packing Tape",
    category: "Supplies",
    unit: "Box",
    stock: 86,
    status: "Active",
  },
  {
    sku: "PRD-005",
    name: "Handheld RFID Reader",
    category: "Hardware",
    unit: "Each",
    stock: 12,
    status: "Active",
  },
];

export default function ProductsPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-400">
              Master Data / Products
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage products, SKUs, categories, units, and product status.
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            + New Product
          </button>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row">
          <input
            type="search"
            placeholder="Search products by name or SKU..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
          />

          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none">
            <option>All Categories</option>
            <option>Hardware</option>
            <option>Supplies</option>
            <option>Warehouse</option>
          </select>

          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Product Catalog
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {products.length} products
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-400">
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Unit</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Stock
                  </th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.sku}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                      {product.sku}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-800">
                        {product.name}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {product.category}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {product.unit}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-medium text-slate-800">
                      {product.stock}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {product.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="text-sm font-medium text-slate-500 hover:text-slate-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <p className="text-xs text-slate-400">
              Showing 1–{products.length} of {products.length}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-300"
              >
                Previous
              </button>

              <button
                type="button"
                disabled
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}