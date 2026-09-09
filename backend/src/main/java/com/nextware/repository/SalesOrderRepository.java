package com.nextware.repository;

import com.nextware.entity.SalesOrder;
import com.nextware.sales.SalesOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SalesOrderRepository
        extends JpaRepository<SalesOrder, UUID> {

    List<SalesOrder>
    findAllByCompanyIdOrderByOrderDateDescCreatedAtDesc(
            UUID companyId
    );

    List<SalesOrder>
    findAllByCompanyIdAndCustomerIdOrderByOrderDateDescCreatedAtDesc(
            UUID companyId,
            UUID customerId
    );

    List<SalesOrder>
    findAllByCompanyIdAndStatusOrderByOrderDateDescCreatedAtDesc(
            UUID companyId,
            SalesOrderStatus status
    );

    Optional<SalesOrder>
    findByIdAndCompanyId(
            UUID id,
            UUID companyId
    );

    boolean existsByCompanyIdAndOrderNumber(
            UUID companyId,
            String orderNumber
    );
}