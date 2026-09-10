package com.nextware.entity;

import com.nextware.fulfillment.PickListLineStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "pick_list_line")
public class PickListLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pick_list_id", nullable = false)
    private UUID pickListId;

    @Column(name = "sales_order_line_id", nullable = false)
    private UUID salesOrderLineId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "warehouse_location_id", nullable = false)
    private UUID warehouseLocationId;

    @Column(name = "requested_quantity", nullable = false, precision = 19, scale = 4)
    private BigDecimal requestedQuantity;

    @Column(name = "picked_quantity", nullable = false, precision = 19, scale = 4)
    private BigDecimal pickedQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PickListLineStatus status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        if (pickedQuantity == null) {
            pickedQuantity = BigDecimal.ZERO;
        }

        if (status == null) {
            status = PickListLineStatus.OPEN;
        }

        OffsetDateTime now = OffsetDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getPickListId() {
        return pickListId;
    }

    public void setPickListId(UUID pickListId) {
        this.pickListId = pickListId;
    }

    public UUID getSalesOrderLineId() {
        return salesOrderLineId;
    }

    public void setSalesOrderLineId(UUID salesOrderLineId) {
        this.salesOrderLineId = salesOrderLineId;
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

    public BigDecimal getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(BigDecimal requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public BigDecimal getPickedQuantity() {
        return pickedQuantity;
    }

    public void setPickedQuantity(BigDecimal pickedQuantity) {
        this.pickedQuantity = pickedQuantity;
    }

    public PickListLineStatus getStatus() {
        return status;
    }

    public void setStatus(PickListLineStatus status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}