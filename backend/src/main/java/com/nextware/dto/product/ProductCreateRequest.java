package com.nextware.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public class ProductCreateRequest {

    @NotNull
    private UUID companyId;

    private UUID categoryId;

    @NotNull
    private UUID unitOfMeasureId;

    @NotBlank
    @Size(max = 100)
    private String sku;

    @NotBlank
    @Size(max = 255)
    private String name;

    private String description;

    @Size(max = 100)
    private String barcode;

    @DecimalMin(
            value = "0.0",
            inclusive = true
    )
    private BigDecimal costPrice;

    @DecimalMin(
            value = "0.0",
            inclusive = true
    )
    private BigDecimal sellingPrice;

    private Boolean active;

    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(
            UUID companyId
    ) {
        this.companyId = companyId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(
            UUID categoryId
    ) {
        this.categoryId = categoryId;
    }

    public UUID getUnitOfMeasureId() {
        return unitOfMeasureId;
    }

    public void setUnitOfMeasureId(
            UUID unitOfMeasureId
    ) {
        this.unitOfMeasureId =
                unitOfMeasureId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(
            String sku
    ) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(
            String name
    ) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description
    ) {
        this.description = description;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(
            String barcode
    ) {
        this.barcode = barcode;
    }

    public BigDecimal getCostPrice() {
        return costPrice;
    }

    public void setCostPrice(
            BigDecimal costPrice
    ) {
        this.costPrice = costPrice;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(
            BigDecimal sellingPrice
    ) {
        this.sellingPrice =
                sellingPrice;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(
            Boolean active
    ) {
        this.active = active;
    }
}