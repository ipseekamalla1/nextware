package com.nextware.repository;

import com.nextware.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PurchaseOrderRepository
        extends JpaRepository<PurchaseOrder, UUID> {

    List<PurchaseOrder>
    findAllByCompanyIdOrderByOrderDateDescCreatedAtDesc(
            UUID companyId
    );

    Optional<PurchaseOrder>
    findByIdAndCompanyId(
            UUID id,
            UUID companyId
    );

    boolean existsByCompanyIdAndOrderNumber(
            UUID companyId,
            String orderNumber
    );

    boolean existsByCompanyIdAndOrderNumberAndIdNot(
            UUID companyId,
            String orderNumber,
            UUID id
    );

    List<PurchaseOrder>
    findAllByCompanyIdAndSupplierIdOrderByOrderDateDescCreatedAtDesc(
            UUID companyId,
            UUID supplierId
    );

    List<PurchaseOrder>
    findAllByCompanyIdAndStatusOrderByOrderDateDescCreatedAtDesc(
            UUID companyId,
            com.nextware.purchasing.PurchaseOrderStatus status
    );
}