package com.nextware.service.report;

import com.nextware.dto.report.ReportFilterRequest;
import com.nextware.dto.report.ReportResponse;
import com.nextware.entity.InventoryBalance;
import com.nextware.entity.InventoryTransaction;
import com.nextware.entity.Package;
import com.nextware.entity.PickList;
import com.nextware.entity.PurchaseOrder;
import com.nextware.entity.PurchaseOrderLine;
import com.nextware.entity.Receipt;
import com.nextware.entity.ReceiptLine;
import com.nextware.entity.SalesOrder;
import com.nextware.entity.SalesOrderLine;
import com.nextware.entity.Shipment;
import com.nextware.entity.Warehouse;
import com.nextware.entity.WarehouseLocation;
import com.nextware.repository.CustomerRepository;
import com.nextware.repository.InventoryBalanceRepository;
import com.nextware.repository.InventoryTransactionRepository;
import com.nextware.repository.PackageRepository;
import com.nextware.repository.PickListRepository;
import com.nextware.repository.ProductRepository;
import com.nextware.repository.PurchaseOrderLineRepository;
import com.nextware.repository.PurchaseOrderRepository;
import com.nextware.repository.ReceiptLineRepository;
import com.nextware.repository.ReceiptRepository;
import com.nextware.repository.SalesOrderLineRepository;
import com.nextware.repository.SalesOrderRepository;
import com.nextware.repository.ShipmentRepository;
import com.nextware.repository.SupplierRepository;
import com.nextware.repository.WarehouseLocationRepository;
import com.nextware.repository.WarehouseRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final InventoryBalanceRepository inventoryBalanceRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderLineRepository purchaseOrderLineRepository;
    private final ReceiptRepository receiptRepository;
    private final ReceiptLineRepository receiptLineRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderLineRepository salesOrderLineRepository;
    private final PickListRepository pickListRepository;
    private final PackageRepository packageRepository;
    private final ShipmentRepository shipmentRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final CompanySecurityService companySecurityService;

    public ReportService(
            InventoryBalanceRepository inventoryBalanceRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseOrderLineRepository purchaseOrderLineRepository,
            ReceiptRepository receiptRepository,
            ReceiptLineRepository receiptLineRepository,
            SalesOrderRepository salesOrderRepository,
            SalesOrderLineRepository salesOrderLineRepository,
            PickListRepository pickListRepository,
            PackageRepository packageRepository,
            ShipmentRepository shipmentRepository,
            ProductRepository productRepository,
            CustomerRepository customerRepository,
            SupplierRepository supplierRepository,
            WarehouseRepository warehouseRepository,
            WarehouseLocationRepository warehouseLocationRepository,
            CompanySecurityService companySecurityService
    ) {
        this.inventoryBalanceRepository = inventoryBalanceRepository;
        this.inventoryTransactionRepository =
                inventoryTransactionRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderLineRepository = purchaseOrderLineRepository;
        this.receiptRepository = receiptRepository;
        this.receiptLineRepository = receiptLineRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.salesOrderLineRepository = salesOrderLineRepository;
        this.pickListRepository = pickListRepository;
        this.packageRepository = packageRepository;
        this.shipmentRepository = shipmentRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.warehouseRepository = warehouseRepository;
        this.warehouseLocationRepository =
                warehouseLocationRepository;
        this.companySecurityService = companySecurityService;
    }

    public ReportResponse.InventorySummary getInventoryBalance(
            UUID companyId,
            ReportFilterRequest filter
    ) {
        requireAuthenticatedCompany(companyId);
        validateCompanyReferences(companyId, filter);

        Map<UUID, Warehouse> warehouses =
                companyWarehouses(companyId);

        Map<UUID, WarehouseLocation> locations =
                companyLocations(warehouses);

        Map<UUID, com.nextware.entity.Product> products =
                productRepository
                        .findAllByCompanyIdOrderByNameAsc(companyId)
                        .stream()
                        .collect(Collectors.toMap(
                                com.nextware.entity.Product::getId,
                                Function.identity()
                        ));

        List<ReportResponse.InventoryBalanceRow> rows =
                new ArrayList<>();

        for (InventoryBalance balance :
                inventoryBalanceRepository.findAll()) {

            WarehouseLocation location =
                    locations.get(balance.getWarehouseLocationId());

            if (location == null) {
                continue;
            }

            Warehouse warehouse =
                    warehouses.get(location.getWarehouseId());

            if (warehouse == null) {
                continue;
            }

            com.nextware.entity.Product product =
                    products.get(balance.getProductId());

            if (product == null) {
                continue;
            }

            if (filter.warehouseId() != null
                    && !filter.warehouseId()
                    .equals(warehouse.getId())) {
                continue;
            }

            if (filter.productId() != null
                    && !filter.productId()
                    .equals(product.getId())) {
                continue;
            }

            BigDecimal available =
                    balance.getQuantity()
                            .subtract(balance.getReservedQuantity());

            rows.add(
                    new ReportResponse.InventoryBalanceRow(
                            product.getId(),
                            product.getSku(),
                            product.getName(),
                            warehouse.getId(),
                            warehouse.getName(),
                            location.getId(),
                            location.getCode(),
                            balance.getQuantity(),
                            balance.getReservedQuantity(),
                            available
                    )
            );
        }

        rows.sort(
                Comparator
                        .comparing(
                                ReportResponse.InventoryBalanceRow
                                        ::warehouseName,
                                String.CASE_INSENSITIVE_ORDER
                        )
                        .thenComparing(
                                ReportResponse.InventoryBalanceRow
                                        ::locationCode,
                                String.CASE_INSENSITIVE_ORDER
                        )
                        .thenComparing(
                                ReportResponse.InventoryBalanceRow
                                        ::productName,
                                String.CASE_INSENSITIVE_ORDER
                        )
        );

        return new ReportResponse.InventorySummary(
                rows.size(),
                sum(
                        rows,
                        ReportResponse.InventoryBalanceRow::quantity
                ),
                sum(
                        rows,
                        ReportResponse.InventoryBalanceRow
                                ::reservedQuantity
                ),
                sum(
                        rows,
                        ReportResponse.InventoryBalanceRow
                                ::availableQuantity
                ),
                rows
        );
    }

    public List<ReportResponse.InventoryTransactionRow>
    getInventoryTransactions(
            UUID companyId,
            ReportFilterRequest filter
    ) {
        requireAuthenticatedCompany(companyId);
        validateCompanyReferences(companyId, filter);

        Map<UUID, Warehouse> warehouses =
                companyWarehouses(companyId);

        Map<UUID, WarehouseLocation> locations =
                companyLocations(warehouses);

        Map<UUID, com.nextware.entity.Product> products =
                productRepository
                        .findAllByCompanyIdOrderByNameAsc(companyId)
                        .stream()
                        .collect(Collectors.toMap(
                                com.nextware.entity.Product::getId,
                                Function.identity()
                        ));

        List<ReportResponse.InventoryTransactionRow> rows =
                new ArrayList<>();

        for (InventoryTransaction transaction :
                inventoryTransactionRepository.findAll()) {

            WarehouseLocation location =
                    locations.get(
                            transaction.getWarehouseLocationId()
                    );

            if (location == null) {
                continue;
            }

            Warehouse warehouse =
                    warehouses.get(location.getWarehouseId());

            if (warehouse == null) {
                continue;
            }

            com.nextware.entity.Product product =
                    products.get(transaction.getProductId());

            if (product == null) {
                continue;
            }

            LocalDate transactionDate =
                    transaction.getCreatedAt().toLocalDate();

            if (!within(
                    transactionDate,
                    filter.dateFrom(),
                    filter.dateTo()
            )) {
                continue;
            }

            if (filter.warehouseId() != null
                    && !filter.warehouseId()
                    .equals(warehouse.getId())) {
                continue;
            }

            if (filter.productId() != null
                    && !filter.productId()
                    .equals(product.getId())) {
                continue;
            }

            if (filter.transactionType() != null
                    && !filter.transactionType()
                    .equals(
                            transaction
                                    .getTransactionType()
                                    .name()
                    )) {
                continue;
            }

            rows.add(
                    new ReportResponse.InventoryTransactionRow(
                            transaction.getId(),
                            product.getId(),
                            product.getSku(),
                            product.getName(),
                            warehouse.getId(),
                            warehouse.getName(),
                            location.getId(),
                            location.getCode(),
                            transaction
                                    .getTransactionType()
                                    .name(),
                            transaction.getQuantity(),
                            transaction.getReferenceType(),
                            transaction.getReferenceId(),
                            transaction.getNotes(),
                            transaction.getCreatedAt()
                    )
            );
        }

        rows.sort(
                Comparator.comparing(
                        ReportResponse.InventoryTransactionRow
                                ::createdAt
                ).reversed()
        );

        return rows;
    }

    public ReportResponse.PurchaseOrderSummary getPurchasing(
            UUID companyId,
            ReportFilterRequest filter
    ) {
        requireAuthenticatedCompany(companyId);
        validateCompanyReferences(companyId, filter);

        Map<UUID, String> supplierNames =
                supplierRepository
                        .findAllByCompanyIdOrderByNameAsc(companyId)
                        .stream()
                        .collect(Collectors.toMap(
                                com.nextware.entity.Supplier::getId,
                                com.nextware.entity.Supplier::getName
                        ));

        List<ReportResponse.PurchaseOrderRow> rows =
                new ArrayList<>();

        for (PurchaseOrder order :
                purchaseOrderRepository
                        .findAllByCompanyIdOrderByOrderDateDescCreatedAtDesc(
                                companyId
                        )) {

            if (!within(
                    order.getOrderDate(),
                    filter.dateFrom(),
                    filter.dateTo()
            )) {
                continue;
            }

            if (filter.supplierId() != null
                    && !filter.supplierId()
                    .equals(order.getSupplierId())) {
                continue;
            }

            if (filter.status() != null
                    && !filter.status()
                    .equals(order.getStatus().name())) {
                continue;
            }

            BigDecimal value = BigDecimal.ZERO;

            for (PurchaseOrderLine line :
                    purchaseOrderLineRepository
                            .findAllByPurchaseOrderIdOrderByCreatedAtAsc(
                                    order.getId()
                            )) {

                value = value.add(
                        line.getOrderedQuantity()
                                .multiply(line.getUnitCost())
                );
            }

            rows.add(
                    new ReportResponse.PurchaseOrderRow(
                            order.getId(),
                            order.getOrderNumber(),
                            order.getOrderDate(),
                            order.getSupplierId(),
                            supplierNames.getOrDefault(
                                    order.getSupplierId(),
                                    "Unknown supplier"
                            ),
                            order.getStatus().name(),
                            value
                    )
            );
        }

        return new ReportResponse.PurchaseOrderSummary(
                rows.size(),
                sum(
                        rows,
                        ReportResponse.PurchaseOrderRow
                                ::orderedValue
                ),
                rows
        );
    }

    public ReportResponse.ReceivingSummary getReceiving(
            UUID companyId,
            ReportFilterRequest filter
    ) {
        requireAuthenticatedCompany(companyId);
        validateCompanyReferences(companyId, filter);

        Map<UUID, Warehouse> warehouses =
                companyWarehouses(companyId);

        List<ReportResponse.ReceivingRow> rows =
                new ArrayList<>();

        for (Receipt receipt :
                receiptRepository
                        .findAllByCompanyIdOrderByReceiptDateDescCreatedAtDesc(
                                companyId
                        )) {

            if (!within(
                    receipt.getReceiptDate(),
                    filter.dateFrom(),
                    filter.dateTo()
            )) {
                continue;
            }

            if (filter.warehouseId() != null
                    && !filter.warehouseId()
                    .equals(receipt.getWarehouseId())) {
                continue;
            }

            if (filter.status() != null
                    && !filter.status()
                    .equals(receipt.getStatus().name())) {
                continue;
            }

            BigDecimal quantity = BigDecimal.ZERO;
            BigDecimal value = BigDecimal.ZERO;

            for (ReceiptLine line :
                    receiptLineRepository
                            .findAllByReceiptIdOrderByCreatedAtAsc(
                                    receipt.getId()
                            )) {

                quantity =
                        quantity.add(
                                line.getReceivedQuantity()
                        );

                value =
                        value.add(
                                line.getReceivedQuantity()
                                        .multiply(
                                                line.getUnitCost()
                                        )
                        );
            }

            Warehouse warehouse =
                    warehouses.get(receipt.getWarehouseId());

            rows.add(
                    new ReportResponse.ReceivingRow(
                            receipt.getId(),
                            receipt.getReceiptNumber(),
                            receipt.getReceiptDate(),
                            receipt.getPurchaseOrderId(),
                            receipt.getWarehouseId(),
                            warehouse == null
                                    ? "Unknown warehouse"
                                    : warehouse.getName(),
                            receipt.getStatus().name(),
                            quantity,
                            value
                    )
            );
        }

        return new ReportResponse.ReceivingSummary(
                rows.size(),
                sum(
                        rows,
                        ReportResponse.ReceivingRow
                                ::receivedQuantity
                ),
                sum(
                        rows,
                        ReportResponse.ReceivingRow
                                ::receivedValue
                ),
                rows
        );
    }

    public ReportResponse.SalesSummary getSales(
            UUID companyId,
            ReportFilterRequest filter
    ) {
        requireAuthenticatedCompany(companyId);
        validateCompanyReferences(companyId, filter);

        Map<UUID, String> customerNames =
                customerRepository
                        .findAllByCompanyIdOrderByNameAsc(companyId)
                        .stream()
                        .collect(Collectors.toMap(
                                com.nextware.entity.Customer::getId,
                                com.nextware.entity.Customer::getName
                        ));

        List<ReportResponse.SalesOrderRow> rows =
                buildSalesRows(
                        companyId,
                        filter,
                        customerNames
                );

        return new ReportResponse.SalesSummary(
                rows.size(),
                sum(
                        rows,
                        ReportResponse.SalesOrderRow
                                ::orderValue
                ),
                rows
        );
    }

    public List<ReportResponse.SalesCustomerRow>
    getSalesByCustomer(
            UUID companyId,
            ReportFilterRequest filter
    ) {
        requireAuthenticatedCompany(companyId);
        validateCompanyReferences(companyId, filter);

        Map<UUID, String> customerNames =
                customerRepository
                        .findAllByCompanyIdOrderByNameAsc(companyId)
                        .stream()
                        .collect(Collectors.toMap(
                                com.nextware.entity.Customer::getId,
                                com.nextware.entity.Customer::getName
                        ));

        List<ReportResponse.SalesOrderRow> orders =
                buildSalesRows(
                        companyId,
                        filter,
                        customerNames
                );

        Map<UUID, List<ReportResponse.SalesOrderRow>> grouped =
                new LinkedHashMap<>();

        for (ReportResponse.SalesOrderRow order : orders) {
            grouped
                    .computeIfAbsent(
                            order.customerId(),
                            ignored -> new ArrayList<>()
                    )
                    .add(order);
        }

        List<ReportResponse.SalesCustomerRow> rows =
                new ArrayList<>();

        for (Map.Entry<
                UUID,
                List<ReportResponse.SalesOrderRow>
                > entry : grouped.entrySet()) {

            List<ReportResponse.SalesOrderRow> customerOrders =
                    entry.getValue();

            rows.add(
                    new ReportResponse.SalesCustomerRow(
                            entry.getKey(),
                            customerOrders
                                    .get(0)
                                    .customerName(),
                            customerOrders.size(),
                            sum(
                                    customerOrders,
                                    ReportResponse.SalesOrderRow
                                            ::orderValue
                            )
                    )
            );
        }

        rows.sort(
                Comparator.comparing(
                        ReportResponse.SalesCustomerRow
                                ::orderValue
                ).reversed()
        );

        return rows;
    }

    public ReportResponse.FulfillmentSummary getFulfillment(
            UUID companyId,
            ReportFilterRequest filter
    ) {
        requireAuthenticatedCompany(companyId);
        validateCompanyReferences(companyId, filter);

        List<PickList> pickLists =
                pickListRepository
                        .findAllByCompanyIdOrderByCreatedAtDesc(
                                companyId
                        );

        List<Package> packages =
                packageRepository
                        .findAllByCompanyIdOrderByCreatedAtDesc(
                                companyId
                        );

        List<Shipment> shipments =
                shipmentRepository
                        .findAllByCompanyIdOrderByCreatedAtDesc(
                                companyId
                        );

        pickLists =
                pickLists.stream()
                        .filter(
                                pick ->
                                        within(
                                                pick.getCreatedAt()
                                                        .toLocalDate(),
                                                filter.dateFrom(),
                                                filter.dateTo()
                                        )
                        )
                        .filter(
                                pick ->
                                        filter.warehouseId() == null
                                                || filter.warehouseId()
                                                .equals(
                                                        pick.getWarehouseId()
                                                )
                        )
                        .filter(
                                pick ->
                                        filter.status() == null
                                                || filter.status()
                                                .equals(
                                                        pick.getStatus()
                                                                .name()
                                                )
                        )
                        .toList();

        packages =
                packages.stream()
                        .filter(
                                item ->
                                        within(
                                                item.getCreatedAt()
                                                        .toLocalDate(),
                                                filter.dateFrom(),
                                                filter.dateTo()
                                        )
                        )
                        .filter(
                                item ->
                                        filter.status() == null
                                                || filter.status()
                                                .equals(
                                                        item.getStatus()
                                                                .name()
                                                )
                        )
                        .toList();

        shipments =
                shipments.stream()
                        .filter(
                                shipment ->
                                        within(
                                                shipment.getCreatedAt()
                                                        .toLocalDate(),
                                                filter.dateFrom(),
                                                filter.dateTo()
                                        )
                        )
                        .filter(
                                shipment ->
                                        filter.status() == null
                                                || filter.status()
                                                .equals(
                                                        shipment.getStatus()
                                                                .name()
                                                )
                        )
                        .toList();

        return new ReportResponse.FulfillmentSummary(
                pickLists.size(),
                packages.size(),
                shipments.size(),
                statusCounts(
                        pickLists.stream()
                                .map(
                                        pick ->
                                                pick.getStatus()
                                                        .name()
                                )
                                .toList()
                ),
                statusCounts(
                        packages.stream()
                                .map(
                                        item ->
                                                item.getStatus()
                                                        .name()
                                )
                                .toList()
                ),
                statusCounts(
                        shipments.stream()
                                .map(
                                        shipment ->
                                                shipment.getStatus()
                                                        .name()
                                )
                                .toList()
                )
        );
    }

    private List<ReportResponse.SalesOrderRow> buildSalesRows(
            UUID companyId,
            ReportFilterRequest filter,
            Map<UUID, String> customerNames
    ) {
        List<ReportResponse.SalesOrderRow> rows =
                new ArrayList<>();

        for (SalesOrder order :
                salesOrderRepository
                        .findAllByCompanyIdOrderByOrderDateDescCreatedAtDesc(
                                companyId
                        )) {

            if (!within(
                    order.getOrderDate(),
                    filter.dateFrom(),
                    filter.dateTo()
            )) {
                continue;
            }

            if (filter.customerId() != null
                    && !filter.customerId()
                    .equals(order.getCustomerId())) {
                continue;
            }

            if (filter.status() != null
                    && !filter.status()
                    .equals(order.getStatus().name())) {
                continue;
            }

            BigDecimal value = BigDecimal.ZERO;

            for (SalesOrderLine line :
                    salesOrderLineRepository
                            .findAllBySalesOrderIdOrderByCreatedAtAsc(
                                    order.getId()
                            )) {

                value = value.add(
                        line.getOrderedQuantity()
                                .multiply(line.getUnitPrice())
                );
            }

            rows.add(
                    new ReportResponse.SalesOrderRow(
                            order.getId(),
                            order.getOrderNumber(),
                            order.getOrderDate(),
                            order.getCustomerId(),
                            customerNames.getOrDefault(
                                    order.getCustomerId(),
                                    "Unknown customer"
                            ),
                            order.getStatus().name(),
                            value
                    )
            );
        }

        return rows;
    }

    private Map<UUID, Warehouse> companyWarehouses(
            UUID companyId
    ) {
        return warehouseRepository
                .findByCompanyId(companyId)
                .stream()
                .collect(Collectors.toMap(
                        Warehouse::getId,
                        Function.identity()
                ));
    }

    private Map<UUID, WarehouseLocation> companyLocations(
            Map<UUID, Warehouse> warehouses
    ) {
        Map<UUID, WarehouseLocation> locations =
                new HashMap<>();

        for (UUID warehouseId : warehouses.keySet()) {
            for (WarehouseLocation location :
                    warehouseLocationRepository
                            .findAllByWarehouseIdOrderByCodeAsc(
                                    warehouseId
                            )) {

                locations.put(
                        location.getId(),
                        location
                );
            }
        }

        return locations;
    }

    private void validateCompanyReferences(
            UUID companyId,
            ReportFilterRequest filter
    ) {
        if (filter.warehouseId() != null
                && warehouseRepository
                .findByIdAndCompanyId(
                        filter.warehouseId(),
                        companyId
                )
                .isEmpty()) {

            throw forbidden(
                    "Warehouse is not accessible"
            );
        }

        if (filter.productId() != null
                && productRepository
                .findByIdAndCompanyId(
                        filter.productId(),
                        companyId
                )
                .isEmpty()) {

            throw forbidden(
                    "Product is not accessible"
            );
        }

        if (filter.customerId() != null
                && customerRepository
                .findByIdAndCompanyId(
                        filter.customerId(),
                        companyId
                )
                .isEmpty()) {

            throw forbidden(
                    "Customer is not accessible"
            );
        }

        if (filter.supplierId() != null
                && supplierRepository
                .findByIdAndCompanyId(
                        filter.supplierId(),
                        companyId
                )
                .isEmpty()) {

            throw forbidden(
                    "Supplier is not accessible"
            );
        }
    }

    private void requireAuthenticatedCompany(
            UUID companyId
    ) {
        companySecurityService.requireCompany(companyId);
    }

    private static boolean within(
            LocalDate value,
            LocalDate from,
            LocalDate to
    ) {
        if (value == null) {
            return false;
        }

        if (from != null && value.isBefore(from)) {
            return false;
        }

        if (to != null && value.isAfter(to)) {
            return false;
        }

        return true;
    }

    private static <T> BigDecimal sum(
            List<T> rows,
            Function<T, BigDecimal> getter
    ) {
        BigDecimal total = BigDecimal.ZERO;

        for (T row : rows) {
            BigDecimal value = getter.apply(row);

            if (value != null) {
                total = total.add(value);
            }
        }

        return total;
    }

    private static List<ReportResponse.StatusCount> statusCounts(
            List<String> statuses
    ) {
        Map<String, Long> counts = new java.util.TreeMap<>();

        for (String status : statuses) {
            counts.merge(
                    status,
                    1L,
                    Long::sum
            );
        }

        return counts.entrySet()
                .stream()
                .map(
                        entry ->
                                new ReportResponse.StatusCount(
                                        entry.getKey(),
                                        entry.getValue()
                                )
                )
                .toList();
    }

    private static ResponseStatusException forbidden(
            String message
    ) {
        return new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                message
        );
    }
}