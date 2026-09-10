package com.nextware.repository;

import com.nextware.entity.Shipment;
import com.nextware.fulfillment.ShipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShipmentRepository
        extends JpaRepository<Shipment, UUID> {

    List<Shipment>
    findAllByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    List<Shipment>
    findAllByCompanyIdAndStatusOrderByCreatedAtDesc(
            UUID companyId,
            ShipmentStatus status
    );

    List<Shipment>
    findAllByCompanyIdAndSalesOrderIdOrderByCreatedAtAsc(
            UUID companyId,
            UUID salesOrderId
    );

    Optional<Shipment>
    findByIdAndCompanyId(UUID id, UUID companyId);

    boolean existsByCompanyIdAndShipmentNumber(
            UUID companyId,
            String shipmentNumber
    );
}