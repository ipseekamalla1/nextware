package com.nextware.repository;

import com.nextware.entity.PurchaseOrderLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PurchaseOrderLineRepository
        extends JpaRepository<PurchaseOrderLine, UUID> {

    List<PurchaseOrderLine>
    findAllByPurchaseOrderIdOrderByCreatedAtAsc(
            UUID purchaseOrderId
    );

    long countByPurchaseOrderId(
            UUID purchaseOrderId
    );

    void deleteAllByPurchaseOrderId(
            UUID purchaseOrderId
    );
}