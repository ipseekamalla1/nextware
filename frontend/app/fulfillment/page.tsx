"use client";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/ui/icons";

import { getCurrentCompanyId, hasPermission } from "@/lib/auth";

import { getSalesOrders, type SalesOrder } from "@/lib/salesApi";

import {
  cancelShipment,
  completePicking,
  createPackage,
  createPickList,
  createShipment,
  deliverShipment,
  getFulfillmentWarehouses,
  getPackages,
  getPickLists,
  getShipments,
  markInTransit,
  packPackage,
  shipShipment,
  startPicking,
  updatePickedQuantity,
  type FulfillmentResponse,
  type Warehouse,
} from "@/lib/fulfillmentApi";

type TabKey = "PICKING" | "PACKING" | "SHIPPING";

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "0";
  }

  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function getStatusClass(status: string | null): string {
  switch (status) {
    case "OPEN":
    case "READY":
      return "bg-[#fefae0] text-[#283618]";

    case "ASSIGNED":
    case "PICKING":
    case "RECEIVING":
    case "IN_TRANSIT":
      return "bg-[#dda15e]/20 text-[#283618]";

    case "COMPLETED":
    case "PACKED":
    case "SHIPPED":
    case "DELIVERED":
    case "FULFILLED":
      return "bg-[#606c38]/15 text-[#283618]";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function LocalStatusBadge({ status }: { status: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
        status,
      )}`}
    >
      {status ?? "—"}
    </span>
  );
}

function EmptyTable({ message }: { message: string }) {
  return (
    <div className="px-6 py-12 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

export default function FulfillmentPage() {
  const [companyId] = useState<string | null>(() => getCurrentCompanyId());

  const [tab, setTab] = useState<TabKey>("PICKING");

  const [pickLists, setPickLists] = useState<FulfillmentResponse[]>([]);

  const [packages, setPackages] = useState<FulfillmentResponse[]>([]);

  const [shipments, setShipments] = useState<FulfillmentResponse[]>([]);

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [loading, setLoading] = useState(() => Boolean(companyId));

  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [notice, setNotice] = useState<Notice>(null);

  const [showPickForm, setShowPickForm] = useState(false);

  const [showPackageForm, setShowPackageForm] = useState(false);

  const [showShipmentForm, setShowShipmentForm] = useState(false);

  const [pickSalesOrderId, setPickSalesOrderId] = useState("");

  const [pickWarehouseId, setPickWarehouseId] = useState("");

  const [pickListNumber, setPickListNumber] = useState("");

  const [packageSalesOrderId, setPackageSalesOrderId] = useState("");

  const [packageNumber, setPackageNumber] = useState("");

  const [packageWeight, setPackageWeight] = useState("");

  const [packageLength, setPackageLength] = useState("");

  const [packageWidth, setPackageWidth] = useState("");

  const [packageHeight, setPackageHeight] = useState("");

  const [packageQuantities, setPackageQuantities] = useState<
    Record<string, string>
  >({});

  const [shipmentSalesOrderId, setShipmentSalesOrderId] = useState("");

  const [shipmentNumber, setShipmentNumber] = useState("");

  const [carrierName, setCarrierName] = useState("");

  const [trackingNumber, setTrackingNumber] = useState("");

  const [shippingMethod, setShippingMethod] = useState("");

  const [shipmentNotes, setShipmentNotes] = useState("");

  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);

  const canView = hasPermission("FULFILLMENT_VIEW");

  const canCreate = hasPermission("FULFILLMENT_CREATE");

  const canPick = hasPermission("FULFILLMENT_PICK");

  const canPack = hasPermission("FULFILLMENT_PACK");

  const canShip = hasPermission("FULFILLMENT_SHIP");

  /*
   * React 19:
   *
   * The effect only starts the asynchronous synchronization.
   * State updates happen after the asynchronous requests resolve.
   */
  useEffect(() => {
    if (!companyId) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const [
          loadedPickLists,
          loadedPackages,
          loadedShipments,
          loadedSalesOrders,
          loadedWarehouses,
        ] = await Promise.all([
          getPickLists(companyId),
          getPackages(companyId),
          getShipments(companyId),
          getSalesOrders(companyId),
          getFulfillmentWarehouses(companyId),
        ]);

        if (cancelled) {
          return;
        }

        setPickLists(loadedPickLists);
        setPackages(loadedPackages);
        setShipments(loadedShipments);
        setSalesOrders(loadedSalesOrders);
        setWarehouses(loadedWarehouses);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setNotice({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to load fulfillment data.",
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notice]);

  const confirmedSalesOrders = useMemo(
    () =>
      salesOrders.filter(
        (order) =>
          order.status === "CONFIRMED" ||
          order.status === "PARTIALLY_FULFILLED",
      ),
    [salesOrders],
  );

  const visiblePickLists = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return pickLists;
    }

    return pickLists.filter((item) =>
      [item.number, item.status, item.salesOrderId, item.warehouseId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [pickLists, search]);

  const visiblePackages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return packages;
    }

    return packages.filter((item) =>
      [item.number, item.status, item.salesOrderId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [packages, search]);

  const visibleShipments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return shipments;
    }

    return shipments.filter((item) =>
      [
        item.number,
        item.status,
        item.salesOrderId,
        item.carrierName,
        item.trackingNumber,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [shipments, search]);

  const selectedPackageSalesOrder = useMemo(
    () =>
      packages.filter(
        (pkg) =>
          pkg.salesOrderId === shipmentSalesOrderId && pkg.status === "PACKED",
      ),
    [packages, shipmentSalesOrderId],
  );

  const packageOrder = useMemo(
    () => salesOrders.find((order) => order.id === packageSalesOrderId) ?? null,
    [salesOrders, packageSalesOrderId],
  );

  const reloadData = async () => {
    if (!companyId) {
      return;
    }

    try {
      const [
        loadedPickLists,
        loadedPackages,
        loadedShipments,
        loadedSalesOrders,
        loadedWarehouses,
      ] = await Promise.all([
        getPickLists(companyId),
        getPackages(companyId),
        getShipments(companyId),
        getSalesOrders(companyId),
        getFulfillmentWarehouses(companyId),
      ]);

      setPickLists(loadedPickLists);
      setPackages(loadedPackages);
      setShipments(loadedShipments);
      setSalesOrders(loadedSalesOrders);
      setWarehouses(loadedWarehouses);
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to refresh fulfillment data.",
      });

      throw error;
    }
  };

  const resetPickForm = () => {
    setPickSalesOrderId("");
    setPickWarehouseId("");
    setPickListNumber("");
    setShowPickForm(false);
  };

  const resetPackageForm = () => {
    setPackageSalesOrderId("");
    setPackageNumber("");
    setPackageWeight("");
    setPackageLength("");
    setPackageWidth("");
    setPackageHeight("");
    setPackageQuantities({});
    setShowPackageForm(false);
  };

  const resetShipmentForm = () => {
    setShipmentSalesOrderId("");
    setShipmentNumber("");
    setCarrierName("");
    setTrackingNumber("");
    setShippingMethod("");
    setShipmentNotes("");
    setSelectedPackageIds([]);
    setShowShipmentForm(false);
  };

  const handleCreatePickList = async () => {
    if (!companyId) {
      return;
    }

    if (!pickSalesOrderId) {
      setNotice({
        type: "error",
        message: "Select a sales order.",
      });
      return;
    }

    if (!pickWarehouseId) {
      setNotice({
        type: "error",
        message: "Select a warehouse.",
      });
      return;
    }

    setActionLoading(true);

    try {
      await createPickList({
        companyId,
        salesOrderId: pickSalesOrderId,
        warehouseId: pickWarehouseId,
        pickListNumber: pickListNumber.trim() || null,
      });

      await reloadData();

      setNotice({
        type: "success",
        message: "Pick list created successfully.",
      });

      resetPickForm();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create pick list.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartPicking = async (pickListId: string) => {
    if (!companyId) {
      return;
    }

    setActionLoading(true);

    try {
      await startPicking(companyId, pickListId);

      await reloadData();

      setNotice({
        type: "success",
        message: "Picking started.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to start picking.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickQuantity = async (
    pickList: FulfillmentResponse,
    line: FulfillmentResponse,
  ) => {
    if (!companyId) {
      return;
    }

    const current = line.pickedQuantity ?? 0;

    const requested = line.requestedQuantity ?? 0;

    const entered = window.prompt(
      `Picked quantity for this line (0-${requested})`,
      String(current),
    );

    if (entered === null) {
      return;
    }

    const quantity = Number(entered);

    if (!Number.isFinite(quantity) || quantity < 0 || quantity > requested) {
      setNotice({
        type: "error",
        message: "Enter a valid picked quantity.",
      });
      return;
    }

    setActionLoading(true);

    try {
      await updatePickedQuantity(companyId, pickList.id, line.id, quantity);

      await reloadData();

      setNotice({
        type: "success",
        message: "Picked quantity updated.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to update picked quantity.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompletePicking = async (pickListId: string) => {
    if (!companyId) {
      return;
    }

    setActionLoading(true);

    try {
      await completePicking(companyId, pickListId);

      await reloadData();

      setNotice({
        type: "success",
        message: "Pick list completed.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to complete picking.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    if (!companyId || !packageOrder) {
      return;
    }

    const lines = packageOrder.lines
      .map((line) => ({
        salesOrderLineId: line.id,
        quantity: Number(packageQuantities[line.id] || 0),
      }))
      .filter((line) => Number.isFinite(line.quantity) && line.quantity > 0);

    if (lines.length === 0) {
      setNotice({
        type: "error",
        message: "Enter a quantity for at least one sales order line.",
      });
      return;
    }

    const hasInvalidQuantity = lines.some((line) => {
      const orderLine = packageOrder.lines.find(
        (item) => item.id === line.salesOrderLineId,
      );

      return line.quantity > Number(orderLine?.orderedQuantity ?? 0);
    });

    if (hasInvalidQuantity) {
      setNotice({
        type: "error",
        message: "Package quantity cannot exceed the ordered quantity.",
      });
      return;
    }

    const numericFields = [
      packageWeight,
      packageLength,
      packageWidth,
      packageHeight,
    ];

    const hasInvalidDimension = numericFields.some((value) => {
      if (!value.trim()) {
        return false;
      }

      const number = Number(value);

      return !Number.isFinite(number) || number < 0;
    });

    if (hasInvalidDimension) {
      setNotice({
        type: "error",
        message: "Package dimensions and weight must be zero or greater.",
      });
      return;
    }

    setActionLoading(true);

    try {
      await createPackage({
        companyId,
        salesOrderId: packageOrder.id,
        packageNumber: packageNumber.trim() || null,
        weight: packageWeight.trim() ? Number(packageWeight) : null,
        length: packageLength.trim() ? Number(packageLength) : null,
        width: packageWidth.trim() ? Number(packageWidth) : null,
        height: packageHeight.trim() ? Number(packageHeight) : null,
        lines,
      });

      await reloadData();

      setNotice({
        type: "success",
        message: "Package created successfully.",
      });

      resetPackageForm();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to create package.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePack = async (packageId: string) => {
    if (!companyId) {
      return;
    }

    setActionLoading(true);

    try {
      await packPackage(companyId, packageId);

      await reloadData();

      setNotice({
        type: "success",
        message: "Package marked as packed.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to pack package.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!companyId) {
      return;
    }

    if (!shipmentSalesOrderId) {
      setNotice({
        type: "error",
        message: "Select a sales order.",
      });
      return;
    }

    if (selectedPackageIds.length === 0) {
      setNotice({
        type: "error",
        message: "Select at least one packed package.",
      });
      return;
    }

    setActionLoading(true);

    try {
      await createShipment({
        companyId,
        salesOrderId: shipmentSalesOrderId,
        shipmentNumber: shipmentNumber.trim() || null,
        carrierName: carrierName.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        shippingMethod: shippingMethod.trim() || null,
        notes: shipmentNotes.trim() || null,
        packageIds: selectedPackageIds,
      });

      await reloadData();

      setNotice({
        type: "success",
        message: "Shipment created successfully.",
      });

      resetShipmentForm();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to create shipment.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipmentAction = async (
    action: "ship" | "transit" | "deliver" | "cancel",
    shipmentId: string,
  ) => {
    if (!companyId) {
      return;
    }

    setActionLoading(true);

    try {
      switch (action) {
        case "ship":
          await shipShipment(companyId, shipmentId);
          break;

        case "transit":
          await markInTransit(companyId, shipmentId);
          break;

        case "deliver":
          await deliverShipment(companyId, shipmentId);
          break;

        case "cancel":
          await cancelShipment(companyId, shipmentId);
          break;
      }

      await reloadData();

      setNotice({
        type: "success",
        message:
          action === "ship"
            ? "Shipment marked as shipped."
            : action === "transit"
              ? "Shipment marked in transit."
              : action === "deliver"
                ? "Shipment delivered."
                : "Shipment cancelled.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Shipment action failed.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const togglePackageSelection = (packageId: string) => {
    setSelectedPackageIds((current) =>
      current.includes(packageId)
        ? current.filter((id) => id !== packageId)
        : [...current, packageId],
    );
  };

  if (!canView) {
    return (
      <AppShell>
        <div className="p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertIcon />

              <div>
                <h1 className="font-semibold text-red-800">Access denied</h1>

                <p className="mt-1 text-sm text-red-700">
                  You do not have permission to view fulfillment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-full bg-[#fefae0]">
        <div className="mx-auto max-w-[1600px] p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#283618]">Fulfillment</h1>

              <p className="mt-1 text-sm text-gray-600">
                Manage picking, packing, and shipping.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canCreate && tab === "PICKING" && (
                <button
                  type="button"
                  onClick={() => setShowPickForm((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#283618] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3b4d22]"
                >
                  <PlusIcon />
                  New Pick List
                </button>
              )}

              {canCreate && tab === "PACKING" && (
                <button
                  type="button"
                  onClick={() => setShowPackageForm((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#283618] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3b4d22]"
                >
                  <PlusIcon />
                  New Package
                </button>
              )}

              {canCreate && tab === "SHIPPING" && (
                <button
                  type="button"
                  onClick={() => setShowShipmentForm((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#283618] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3b4d22]"
                >
                  <PlusIcon />
                  New Shipment
                </button>
              )}
            </div>
          </div>

          {notice && (
            <div
              className={`mb-5 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                notice.type === "success"
                  ? "border-[#606c38]/30 bg-[#606c38]/10 text-[#283618]"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {notice.type === "success" ? <CheckIcon /> : <AlertIcon />}

                <span>{notice.message}</span>
              </div>

              <button
                type="button"
                onClick={() => setNotice(null)}
                className="rounded p-1 text-gray-500 hover:bg-black/5"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#606c38]/20 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Pick Lists
              </p>

              <p className="mt-2 text-2xl font-bold text-[#283618]">
                {pickLists.length}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {
                  pickLists.filter(
                    (item) =>
                      item.status === "OPEN" ||
                      item.status === "ASSIGNED" ||
                      item.status === "PICKING",
                  ).length
                }{" "}
                active
              </p>
            </div>

            <div className="rounded-xl border border-[#606c38]/20 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Packages
              </p>

              <p className="mt-2 text-2xl font-bold text-[#283618]">
                {packages.length}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {packages.filter((item) => item.status === "PACKED").length}{" "}
                ready to ship
              </p>
            </div>

            <div className="rounded-xl border border-[#606c38]/20 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Shipments
              </p>

              <p className="mt-2 text-2xl font-bold text-[#283618]">
                {shipments.length}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {
                  shipments.filter(
                    (item) =>
                      item.status === "READY" ||
                      item.status === "SHIPPED" ||
                      item.status === "IN_TRANSIT",
                  ).length
                }{" "}
                active
              </p>
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[#606c38]/20 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["PICKING", "Picking"],
                  ["PACKING", "Packing"],
                  ["SHIPPING", "Shipping"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    tab === key
                      ? "bg-[#283618] text-white"
                      : "text-gray-600 hover:bg-[#fefae0]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:max-w-sm">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${tab.toLowerCase()}...`}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#606c38] focus:ring-2 focus:ring-[#606c38]/10"
              />
            </div>
          </div>

          {tab === "PICKING" && (
            <>
              {showPickForm && (
                <div className="mb-5 rounded-xl border border-[#606c38]/20 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-[#283618]">
                      Create Pick List
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      A confirmed sales order is required.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Sales Order
                      </label>

                      <select
                        value={pickSalesOrderId}
                        onChange={(event) =>
                          setPickSalesOrderId(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38] focus:ring-2 focus:ring-[#606c38]/10"
                      >
                        <option value="">Select sales order</option>

                        {confirmedSalesOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.orderNumber} — {order.status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Warehouse
                      </label>

                      <select
                        value={pickWarehouseId}
                        onChange={(event) =>
                          setPickWarehouseId(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38] focus:ring-2 focus:ring-[#606c38]/10"
                      >
                        <option value="">Select warehouse</option>

                        {warehouses
                          .filter((warehouse) => warehouse.active)
                          .map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.code} — {warehouse.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Pick List Number
                      </label>

                      <input
                        value={pickListNumber}
                        onChange={(event) =>
                          setPickListNumber(event.target.value)
                        }
                        placeholder="Optional"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38] focus:ring-2 focus:ring-[#606c38]/10"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetPickForm}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleCreatePickList}
                      className="rounded-lg bg-[#283618] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ? "Creating..." : "Create Pick List"}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-[#606c38]/20 bg-white shadow-sm">
                {loading ? (
                  <div className="px-6 py-12 text-center text-sm text-gray-500">
                    Loading pick lists...
                  </div>
                ) : visiblePickLists.length === 0 ? (
                  <EmptyTable message="No pick lists found." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-gray-100 bg-[#fefae0]">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Pick List
                          </th>

                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Sales Order
                          </th>

                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Status
                          </th>

                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Lines
                          </th>

                          <th className="px-5 py-3 text-right font-semibold text-[#283618]">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {visiblePickLists.map((pickList) => {
                          const lines = pickList.lines ?? [];

                          const allPicked =
                            lines.length > 0 &&
                            lines.every((line) => line.status === "PICKED");

                          return (
                            <tr
                              key={pickList.id}
                              className="hover:bg-[#fefae0]/50"
                            >
                              <td className="px-5 py-4 font-semibold text-[#283618]">
                                {pickList.number ?? "—"}
                              </td>

                              <td className="px-5 py-4 text-gray-600">
                                {pickList.salesOrderId ?? "—"}
                              </td>

                              <td className="px-5 py-4">
                                <LocalStatusBadge status={pickList.status} />
                              </td>

                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  {lines.map((line) => (
                                    <div
                                      key={line.id}
                                      className="text-xs text-gray-600"
                                    >
                                      Product {line.productId?.slice(0, 8)} ·{" "}
                                      {formatNumber(line.pickedQuantity)}/
                                      {formatNumber(line.requestedQuantity)}
                                    </div>
                                  ))}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex flex-wrap justify-end gap-2">
                                  {canPick &&
                                    (pickList.status === "OPEN" ||
                                      pickList.status === "ASSIGNED") && (
                                      <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() =>
                                          handleStartPicking(pickList.id)
                                        }
                                        className="rounded-lg border border-[#606c38]/30 px-3 py-1.5 text-xs font-semibold text-[#283618] hover:bg-[#fefae0] disabled:opacity-50"
                                      >
                                        Start
                                      </button>
                                    )}

                                  {canPick &&
                                    pickList.status === "PICKING" &&
                                    lines.length > 0 && (
                                      <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() =>
                                          handlePickQuantity(pickList, lines[0])
                                        }
                                        className="rounded-lg border border-[#606c38]/30 px-3 py-1.5 text-xs font-semibold text-[#283618] hover:bg-[#fefae0] disabled:opacity-50"
                                      >
                                        Pick
                                      </button>
                                    )}

                                  {canPick &&
                                    pickList.status === "PICKING" &&
                                    lines.length > 0 && (
                                      <button
                                        type="button"
                                        disabled={actionLoading || !allPicked}
                                        onClick={() =>
                                          handleCompletePicking(pickList.id)
                                        }
                                        className="rounded-lg bg-[#283618] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                      >
                                        Complete
                                      </button>
                                    )}
                                </div>

                                {pickList.status === "PICKING" && (
                                  <div className="mt-3 space-y-2">
                                    {lines.map((line) => (
                                      <div
                                        key={line.id}
                                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                                      >
                                        <span className="text-xs text-gray-600">
                                          Product {line.productId?.slice(0, 8)}
                                        </span>

                                        {canPick && (
                                          <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() =>
                                              handlePickQuantity(pickList, line)
                                            }
                                            className="text-xs font-semibold text-[#bc6c25] hover:underline"
                                          >
                                            Update{" "}
                                            {formatNumber(line.pickedQuantity)}/
                                            {formatNumber(
                                              line.requestedQuantity,
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "PACKING" && (
            <>
              {showPackageForm && (
                <div className="mb-5 rounded-xl border border-[#606c38]/20 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-[#283618]">
                      Create Package
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Add quantities from a sales order.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Sales Order
                      </label>

                      <select
                        value={packageSalesOrderId}
                        onChange={(event) => {
                          setPackageSalesOrderId(event.target.value);
                          setPackageQuantities({});
                        }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38] focus:ring-2 focus:ring-[#606c38]/10"
                      >
                        <option value="">Select sales order</option>

                        {confirmedSalesOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.orderNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Package Number
                      </label>

                      <input
                        value={packageNumber}
                        onChange={(event) =>
                          setPackageNumber(event.target.value)
                        }
                        placeholder="Optional"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38] focus:ring-2 focus:ring-[#606c38]/10"
                      />
                    </div>
                  </div>

                  {packageOrder && (
                    <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left">Product</th>

                            <th className="px-4 py-3 text-left">Ordered</th>

                            <th className="px-4 py-3 text-left">Package Qty</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                          {packageOrder.lines.map((line) => (
                            <tr key={line.id}>
                              <td className="px-4 py-3 text-gray-600">
                                {line.productId}
                              </td>

                              <td className="px-4 py-3 font-medium">
                                {formatNumber(line.orderedQuantity)}
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.0001"
                                  value={packageQuantities[line.id] ?? ""}
                                  onChange={(event) =>
                                    setPackageQuantities((current) => ({
                                      ...current,
                                      [line.id]: event.target.value,
                                    }))
                                  }
                                  className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#606c38]"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Weight
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={packageWeight}
                        onChange={(event) =>
                          setPackageWeight(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Length
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={packageLength}
                        onChange={(event) =>
                          setPackageLength(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Width
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={packageWidth}
                        onChange={(event) =>
                          setPackageWidth(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Height
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={packageHeight}
                        onChange={(event) =>
                          setPackageHeight(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38]"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetPackageForm}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading || !packageOrder}
                      onClick={handleCreatePackage}
                      className="rounded-lg bg-[#283618] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ? "Creating..." : "Create Package"}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-[#606c38]/20 bg-white shadow-sm">
                {loading ? (
                  <div className="px-6 py-12 text-center text-sm text-gray-500">
                    Loading packages...
                  </div>
                ) : visiblePackages.length === 0 ? (
                  <EmptyTable message="No packages found." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-gray-100 bg-[#fefae0]">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Package
                          </th>

                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Sales Order
                          </th>

                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Status
                          </th>

                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Lines
                          </th>

                          <th className="px-5 py-3 text-right font-semibold text-[#283618]">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {visiblePackages.map((pkg) => (
                          <tr key={pkg.id} className="hover:bg-[#fefae0]/50">
                            <td className="px-5 py-4 font-semibold text-[#283618]">
                              {pkg.number ?? "—"}
                            </td>

                            <td className="px-5 py-4 text-gray-600">
                              {pkg.salesOrderId ?? "—"}
                            </td>

                            <td className="px-5 py-4">
                              <LocalStatusBadge status={pkg.status} />
                            </td>

                            <td className="px-5 py-4">
                              {(pkg.lines ?? []).map((line) => (
                                <div
                                  key={line.id}
                                  className="text-xs text-gray-600"
                                >
                                  Product {line.productId?.slice(0, 8)} ·{" "}
                                  {formatNumber(line.quantity)}
                                </div>
                              ))}
                            </td>

                            <td className="px-5 py-4 text-right">
                              {canPack && pkg.status === "OPEN" && (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handlePack(pkg.id)}
                                  className="rounded-lg bg-[#283618] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Pack
                                </button>
                              )}

                              {pkg.status === "PACKED" && (
                                <span className="text-xs font-semibold text-[#606c38]">
                                  Ready to ship
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "SHIPPING" && (
            <>
              {showShipmentForm && (
                <div className="mb-5 rounded-xl border border-[#606c38]/20 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-[#283618]">
                      Create Shipment
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Select packed packages belonging to one sales order.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Sales Order
                      </label>

                      <select
                        value={shipmentSalesOrderId}
                        onChange={(event) => {
                          setShipmentSalesOrderId(event.target.value);
                          setSelectedPackageIds([]);
                        }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38] focus:ring-2 focus:ring-[#606c38]/10"
                      >
                        <option value="">Select sales order</option>

                        {confirmedSalesOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.orderNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Shipment Number
                      </label>

                      <input
                        value={shipmentNumber}
                        onChange={(event) =>
                          setShipmentNumber(event.target.value)
                        }
                        placeholder="Optional"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Carrier
                      </label>

                      <input
                        value={carrierName}
                        onChange={(event) => setCarrierName(event.target.value)}
                        placeholder="e.g. UPS"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Tracking Number
                      </label>

                      <input
                        value={trackingNumber}
                        onChange={(event) =>
                          setTrackingNumber(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Shipping Method
                      </label>

                      <input
                        value={shippingMethod}
                        onChange={(event) =>
                          setShippingMethod(event.target.value)
                        }
                        placeholder="Ground, Express..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Notes
                      </label>

                      <input
                        value={shipmentNotes}
                        onChange={(event) =>
                          setShipmentNotes(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#606c38]"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="mb-3 text-sm font-semibold text-[#283618]">
                      Packed Packages
                    </h3>

                    {!shipmentSalesOrderId ? (
                      <p className="text-sm text-gray-500">
                        Select a sales order first.
                      </p>
                    ) : selectedPackageSalesOrder.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                        No packed packages are available for this sales order.
                      </p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {selectedPackageSalesOrder.map((pkg) => {
                          const selected = selectedPackageIds.includes(pkg.id);

                          return (
                            <label
                              key={pkg.id}
                              className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                                selected
                                  ? "border-[#606c38] bg-[#606c38]/5"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <div>
                                <p className="font-semibold text-[#283618]">
                                  {pkg.number}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  {pkg.lines?.length ?? 0} line(s)
                                </p>
                              </div>

                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => togglePackageSelection(pkg.id)}
                                className="h-4 w-4 accent-[#283618]"
                              />
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetShipmentForm}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={
                        actionLoading || selectedPackageIds.length === 0
                      }
                      onClick={handleCreateShipment}
                      className="rounded-lg bg-[#283618] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ? "Creating..." : "Create Shipment"}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-[#606c38]/20 bg-white shadow-sm">
                {loading ? (
                  <div className="px-6 py-12 text-center text-sm text-gray-500">
                    Loading shipments...
                  </div>
                ) : visibleShipments.length === 0 ? (
                  <EmptyTable message="No shipments found." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-gray-100 bg-[#fefae0]">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Shipment
                          </th>

                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Sales Order
                          </th>

                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Carrier
                          </th>

                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Tracking
                          </th>

                          <th className="px-5 py-3 text-left font-semibold text-[#283618]">
                            Status
                          </th>

                          <th className="px-5 py-3 text-right font-semibold text-[#283618]">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {visibleShipments.map((shipment) => (
                          <tr
                            key={shipment.id}
                            className="hover:bg-[#fefae0]/50"
                          >
                            <td className="px-5 py-4">
                              <div className="font-semibold text-[#283618]">
                                {shipment.number ?? "—"}
                              </div>

                              <div className="mt-1 text-xs text-gray-500">
                                {formatDate(shipment.createdAt)}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-gray-600">
                              {shipment.salesOrderId ?? "—"}
                            </td>

                            <td className="px-5 py-4 text-gray-600">
                              {shipment.carrierName ?? "—"}
                            </td>

                            <td className="px-5 py-4 text-gray-600">
                              {shipment.trackingNumber ?? "—"}
                            </td>

                            <td className="px-5 py-4">
                              <LocalStatusBadge status={shipment.status} />
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex flex-wrap justify-end gap-2">
                                {canShip && shipment.status === "READY" && (
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleShipmentAction("ship", shipment.id)
                                    }
                                    className="rounded-lg bg-[#283618] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    Ship
                                  </button>
                                )}

                                {canShip && shipment.status === "SHIPPED" && (
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleShipmentAction(
                                        "transit",
                                        shipment.id,
                                      )
                                    }
                                    className="rounded-lg border border-[#606c38]/30 px-3 py-1.5 text-xs font-semibold text-[#283618] hover:bg-[#fefae0] disabled:opacity-50"
                                  >
                                    In Transit
                                  </button>
                                )}

                                {canShip &&
                                  shipment.status === "IN_TRANSIT" && (
                                    <button
                                      type="button"
                                      disabled={actionLoading}
                                      onClick={() =>
                                        handleShipmentAction(
                                          "deliver",
                                          shipment.id,
                                        )
                                      }
                                      className="rounded-lg bg-[#606c38] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                    >
                                      Deliver
                                    </button>
                                  )}

                                {canCreate &&
                                  shipment.status !== "DELIVERED" &&
                                  shipment.status !== "CANCELLED" && (
                                    <button
                                      type="button"
                                      disabled={actionLoading}
                                      onClick={() =>
                                        handleShipmentAction(
                                          "cancel",
                                          shipment.id,
                                        )
                                      }
                                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  )}
                              </div>

                              {shipment.shippedAt && (
                                <p className="mt-2 text-right text-xs text-gray-500">
                                  Shipped {formatDate(shipment.shippedAt)}
                                </p>
                              )}

                              {shipment.deliveredAt && (
                                <p className="mt-1 text-right text-xs text-gray-500">
                                  Delivered {formatDate(shipment.deliveredAt)}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
