package com.nextware.dto.fulfillment;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class PickListCreateRequest {

    @NotNull
    private UUID companyId;

    @NotNull
    private UUID warehouseId;

    @NotNull
    private UUID salesOrderId;

    private String pickListNumber;

    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
    }

    public UUID getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(UUID warehouseId) {
        this.warehouseId = warehouseId;
    }

    public UUID getSalesOrderId() {
        return salesOrderId;
    }

    public void setSalesOrderId(UUID salesOrderId) {
        this.salesOrderId = salesOrderId;
    }

    public String getPickListNumber() {
        return pickListNumber;
    }

    public void setPickListNumber(String pickListNumber) {
        this.pickListNumber = pickListNumber;
    }
}