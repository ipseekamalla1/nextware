package com.nextware.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "inventory_balance",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_inventory_balance_product_location",
                        columnNames = {
                                "product_id",
                                "warehouse_location_id"
                        }
                )
        }
)
public class InventoryBalance {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "warehouse_location_id", nullable = false)
    private UUID warehouseLocationId;

    @Column(
            name = "quantity",
            nullable = false,
            precision = 19,
            scale = 4
    )
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(
            name = "reserved_quantity",
            nullable = false,
            precision = 19,
            scale = 4
    )
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {

        if (id == null) {
            id = UUID.randomUUID();
        }

        if (quantity == null) {
            quantity = BigDecimal.ZERO;
        }

        if (reservedQuantity == null) {
            reservedQuantity = BigDecimal.ZERO;
        }

        OffsetDateTime now = OffsetDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public UUID getWarehouseLocationId() {
        return warehouseLocationId;
    }

    public void setWarehouseLocationId(UUID warehouseLocationId) {
        this.warehouseLocationId = warehouseLocationId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getReservedQuantity() {
        return reservedQuantity;
    }

    public void setReservedQuantity(BigDecimal reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}