package com.nextware.dto.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ReportResponse() {

    public record InventorySummary(
            long lineCount,
            BigDecimal totalQuantity,
            BigDecimal totalReservedQuantity,
            BigDecimal totalAvailableQuantity,
            List<InventoryBalanceRow> rows
    ) {
    }

    public record InventoryBalanceRow(
            UUID productId,
            String sku,
            String productName,
            UUID warehouseId,
            String warehouseName,
            UUID warehouseLocationId,
            String locationCode,
            BigDecimal quantity,
            BigDecimal reservedQuantity,
            BigDecimal availableQuantity
    ) {
    }

    public record InventoryTransactionRow(
            UUID id,
            UUID productId,
            String sku,
            String productName,
            UUID warehouseId,
            String warehouseName,
            UUID warehouseLocationId,
            String locationCode,
            String transactionType,
            BigDecimal quantity,
            String referenceType,
            UUID referenceId,
            String notes,
            OffsetDateTime createdAt
    ) {
    }

    public record PurchaseOrderSummary(
            long orderCount,
            BigDecimal orderedValue,
            List<PurchaseOrderRow> rows
    ) {
    }

    public record PurchaseOrderRow(
            UUID id,
            String orderNumber,
            LocalDate orderDate,
            UUID supplierId,
            String supplierName,
            String status,
            BigDecimal orderedValue
    ) {
    }

    public record ReceivingSummary(
            long receiptCount,
            BigDecimal receivedQuantity,
            BigDecimal receivedValue,
            List<ReceivingRow> rows
    ) {
    }

    public record ReceivingRow(
            UUID id,
            String receiptNumber,
            LocalDate receiptDate,
            UUID purchaseOrderId,
            UUID warehouseId,
            String warehouseName,
            String status,
            BigDecimal receivedQuantity,
            BigDecimal receivedValue
    ) {
    }

    public record SalesSummary(
            long orderCount,
            BigDecimal orderValue,
            List<SalesOrderRow> rows
    ) {
    }

    public record SalesOrderRow(
            UUID id,
            String orderNumber,
            LocalDate orderDate,
            UUID customerId,
            String customerName,
            String status,
            BigDecimal orderValue
    ) {
    }

    public record SalesCustomerRow(
            UUID customerId,
            String customerName,
            long orderCount,
            BigDecimal orderValue
    ) {
    }

    public record FulfillmentSummary(
            long pickListCount,
            long packageCount,
            long shipmentCount,
            List<StatusCount> pickListsByStatus,
            List<StatusCount> packagesByStatus,
            List<StatusCount> shipmentsByStatus
    ) {
    }

    public record StatusCount(
            String status,
            long count
    ) {
    }
}