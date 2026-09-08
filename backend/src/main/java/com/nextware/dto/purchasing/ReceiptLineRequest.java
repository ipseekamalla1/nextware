package com.nextware.dto.purchasing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class ReceiptLineRequest {

    @NotNull
    private UUID purchaseOrderLineId;

    @NotNull
    private UUID warehouseLocationId;

    @NotNull
    @DecimalMin(value = "0.0001")
    private BigDecimal receivedQuantity;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal unitCost;

    public UUID getPurchaseOrderLineId() {
        return purchaseOrderLineId;
    }

    public void setPurchaseOrderLineId(UUID purchaseOrderLineId) {
        this.purchaseOrderLineId = purchaseOrderLineId;
    }

    public UUID getWarehouseLocationId() {
        return warehouseLocationId;
    }

    public void setWarehouseLocationId(UUID warehouseLocationId) {
        this.warehouseLocationId = warehouseLocationId;
    }

    public BigDecimal getReceivedQuantity() {
        return receivedQuantity;
    }

    public void setReceivedQuantity(BigDecimal receivedQuantity) {
        this.receivedQuantity = receivedQuantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }
}