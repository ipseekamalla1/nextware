package com.nextware.repository;

import com.nextware.entity.SalesOrderLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SalesOrderLineRepository
        extends JpaRepository<SalesOrderLine, UUID> {

    List<SalesOrderLine>
    findAllBySalesOrderIdOrderByCreatedAtAsc(
            UUID salesOrderId
    );

    long countBySalesOrderId(
            UUID salesOrderId
    );
}