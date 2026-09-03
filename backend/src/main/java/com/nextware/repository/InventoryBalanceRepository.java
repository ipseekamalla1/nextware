package com.nextware.repository;

import com.nextware.entity.InventoryBalance;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryBalanceRepository
        extends JpaRepository<InventoryBalance, UUID> {

    Optional<InventoryBalance>
    findByProductIdAndWarehouseLocationId(
            UUID productId,
            UUID warehouseLocationId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select ib
            from InventoryBalance ib
            where ib.productId = :productId
              and ib.warehouseLocationId = :warehouseLocationId
            """)
    Optional<InventoryBalance>
    findForUpdate(
            @Param("productId") UUID productId,
            @Param("warehouseLocationId") UUID warehouseLocationId
    );

    List<InventoryBalance>
    findAllByProductIdOrderByWarehouseLocationIdAsc(
            UUID productId
    );

    List<InventoryBalance>
    findAllByWarehouseLocationIdOrderByProductIdAsc(
            UUID warehouseLocationId
    );

    boolean existsByProductIdAndWarehouseLocationId(
            UUID productId,
            UUID warehouseLocationId
    );
}