package com.nextware.dto.purchasing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class ReceiptCreateRequest {

    @NotNull
    private UUID companyId;

    @NotNull
    private UUID purchaseOrderId;

    @NotNull
    private UUID warehouseId;

    @NotBlank
    @Size(max = 100)
    private String receiptNumber;

    private LocalDate receiptDate;

    @Size(max = 1000)
    private String notes;

    @NotEmpty
    @Valid
    private List<ReceiptLineRequest> lines;

    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
    }

    public UUID getPurchaseOrderId() {
        return purchaseOrderId;
    }

    public void setPurchaseOrderId(UUID purchaseOrderId) {
        this.purchaseOrderId = purchaseOrderId;
    }

    public UUID getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(UUID warehouseId) {
        this.warehouseId = warehouseId;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public LocalDate getReceiptDate() {
        return receiptDate;
    }

    public void setReceiptDate(LocalDate receiptDate) {
        this.receiptDate = receiptDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<ReceiptLineRequest> getLines() {
        return lines;
    }

    public void setLines(List<ReceiptLineRequest> lines) {
        this.lines = lines;
    }
}