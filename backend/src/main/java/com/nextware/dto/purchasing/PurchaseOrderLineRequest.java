package com.nextware.dto.purchasing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class PurchaseOrderLineRequest {

    @NotNull
    private UUID productId;

    @NotNull
    @DecimalMin(
            value = "0.0001",
            inclusive = true
    )
    private BigDecimal orderedQuantity;

    @NotNull
    @DecimalMin(
            value = "0.0000",
            inclusive = true
    )
    private BigDecimal unitCost;

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public BigDecimal getOrderedQuantity() {
        return orderedQuantity;
    }

    public void setOrderedQuantity(BigDecimal orderedQuantity) {
        this.orderedQuantity = orderedQuantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }
}