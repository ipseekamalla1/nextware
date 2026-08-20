import AppShell from "@/components/layout/AppShell";

const summaryCards = [
  {
    title: "Total Products",
    value: "1,248",
    change: "+12 this month",
  },
  {
    title: "Inventory Value",
    value: "$284,650",
    change: "+4.8% this month",
  },
  {
    title: "Open Purchase Orders",
    value: "24",
    change: "8 awaiting receipt",
  },
  {
    title: "Open Sales Orders",
    value: "37",
    change: "12 ready to pick",
  },
];

const recentOrders = [
  {
    order: "SO-2026-1042",
    customer: "Northern Wholesale",
    status: "Ready to Pick",
    amount: "$4,280.00",
  },
  {
    order: "SO-2026-1041",
    customer: "Maple Distribution",
    status: "Processing",
    amount: "$2,145.50",
  },
  {
    order: "SO-2026-1040",
    customer: "Hamilton Supplies",
    status: "Shipped",
    amount: "$6,820.00",
  },
  {
    order: "SO-2026-1039",
    customer: "Ontario Retail Group",
    status: "Processing",
    amount: "$1,975.25",
  },
];

export default function Home() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <p className="mb-1 text-sm font-medium text-slate-400">
            Thursday, August 20, 2026
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good morning
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Here is what is happening across your business today.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">
                {card.title}
              </p>

              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                {card.value}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {card.change}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent Sales Orders
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Latest customer orders and fulfillment status
                </p>
              </div>

              <button className="text-xs font-semibold text-slate-700 hover:text-slate-900">
                View all
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400">
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.order}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {order.order}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {order.customer}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {order.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-medium text-slate-800">
                        {order.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Quick Actions
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Common operational tasks
              </p>
            </div>

            <div className="space-y-2 p-4">
              <button className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50">
                <div className="text-sm font-semibold text-slate-800">
                  Create Sales Order
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Create a new customer order
                </div>
              </button>

              <button className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50">
                <div className="text-sm font-semibold text-slate-800">
                  Create Purchase Order
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Order inventory from a supplier
                </div>
              </button>

              <button className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50">
                <div className="text-sm font-semibold text-slate-800">
                  Receive Inventory
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Record an incoming shipment
                </div>
              </button>

              <button className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50">
                <div className="text-sm font-semibold text-slate-800">
                  Inventory Adjustment
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Adjust warehouse stock
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}