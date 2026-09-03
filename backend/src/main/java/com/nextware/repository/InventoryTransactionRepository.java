package com.nextware.repository;

import com.nextware.entity.InventoryTransaction;
import com.nextware.inventory.InventoryTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryTransactionRepository
        extends JpaRepository<InventoryTransaction, UUID> {

    List<InventoryTransaction>
    findAllByProductIdOrderByCreatedAtDesc(
            UUID productId
    );

    List<InventoryTransaction>
    findAllByWarehouseLocationIdOrderByCreatedAtDesc(
            UUID warehouseLocationId
    );

    List<InventoryTransaction>
    findAllByProductIdAndWarehouseLocationIdOrderByCreatedAtDesc(
            UUID productId,
            UUID warehouseLocationId
    );

    Page<InventoryTransaction>
    findAllByProductIdOrderByCreatedAtDesc(
            UUID productId,
            Pageable pageable
    );

    Page<InventoryTransaction>
    findAllByWarehouseLocationIdOrderByCreatedAtDesc(
            UUID warehouseLocationId,
            Pageable pageable
    );

    long countByProductId(UUID productId);

    long countByWarehouseLocationId(UUID warehouseLocationId);

    long countByTransactionType(
            InventoryTransactionType transactionType
    );
}