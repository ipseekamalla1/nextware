package com.nextware.repository;

import com.nextware.entity.InventoryReservation;
import com.nextware.fulfillment.InventoryReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryReservationRepository
        extends JpaRepository<InventoryReservation, UUID> {

    List<InventoryReservation>
    findAllBySalesOrderLineIdOrderByCreatedAtAsc(UUID salesOrderLineId);

    List<InventoryReservation>
    findAllByProductIdAndWarehouseLocationIdAndStatus(
            UUID productId,
            UUID warehouseLocationId,
            InventoryReservationStatus status
    );

    boolean existsBySalesOrderLineIdAndStatus(
            UUID salesOrderLineId,
            InventoryReservationStatus status
    );
}