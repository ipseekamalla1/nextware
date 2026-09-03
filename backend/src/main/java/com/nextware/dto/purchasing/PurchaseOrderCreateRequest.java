package com.nextware.dto.purchasing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class PurchaseOrderCreateRequest {

    @NotNull
    private UUID companyId;

    @NotNull
    private UUID supplierId;

    @NotBlank
    @Size(max = 100)
    private String orderNumber;

    private LocalDate orderDate;

    @Size(max = 1000)
    private String notes;

    @NotEmpty
    @Valid
    private List<PurchaseOrderLineRequest> lines;

    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
    }

    public UUID getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(UUID supplierId) {
        this.supplierId = supplierId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PurchaseOrderLineRequest> getLines() {
        return lines;
    }

    public void setLines(List<PurchaseOrderLineRequest> lines) {
        this.lines = lines;
    }
}