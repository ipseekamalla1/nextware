package com.nextware.dto.fulfillment;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public class ShipmentCreateRequest {

    @NotNull
    private UUID companyId;

    @NotNull
    private UUID salesOrderId;

    private String shipmentNumber;
    private String carrierName;
    private String trackingNumber;
    private String shippingMethod;
    private String notes;

    private List<UUID> packageIds;

    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
    }

    public UUID getSalesOrderId() {
        return salesOrderId;
    }

    public void setSalesOrderId(UUID salesOrderId) {
        this.salesOrderId = salesOrderId;
    }

    public String getShipmentNumber() {
        return shipmentNumber;
    }

    public void setShipmentNumber(String shipmentNumber) {
        this.shipmentNumber = shipmentNumber;
    }

    public String getCarrierName() {
        return carrierName;
    }

    public void setCarrierName(String carrierName) {
        this.carrierName = carrierName;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getShippingMethod() {
        return shippingMethod;
    }

    public void setShippingMethod(String shippingMethod) {
        this.shippingMethod = shippingMethod;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<UUID> getPackageIds() {
        return packageIds;
    }

    public void setPackageIds(List<UUID> packageIds) {
        this.packageIds = packageIds;
    }
}