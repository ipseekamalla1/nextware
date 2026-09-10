package com.nextware.dto.fulfillment;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class PickQuantityRequest {

    @NotNull
    private BigDecimal pickedQuantity;

    public BigDecimal getPickedQuantity() {
        return pickedQuantity;
    }

    public void setPickedQuantity(BigDecimal pickedQuantity) {
        this.pickedQuantity = pickedQuantity;
    }
}