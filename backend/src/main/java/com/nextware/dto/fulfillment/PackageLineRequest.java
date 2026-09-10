package com.nextware.dto.fulfillment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public class PackageLineRequest {

    @NotNull
    private UUID salesOrderLineId;

    @NotNull
    @Positive
    private BigDecimal quantity;

    public UUID getSalesOrderLineId() {
        return salesOrderLineId;
    }

    public void setSalesOrderLineId(UUID salesOrderLineId) {
        this.salesOrderLineId = salesOrderLineId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
}