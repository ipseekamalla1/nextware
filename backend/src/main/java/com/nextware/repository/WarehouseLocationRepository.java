package com.nextware.repository;

import com.nextware.entity.WarehouseLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WarehouseLocationRepository
        extends JpaRepository<WarehouseLocation, UUID> {

    List<WarehouseLocation>
    findAllByWarehouseIdOrderByCodeAsc(
            UUID warehouseId
    );

    /* ---- dashboard aggregates (scoped to the caller's warehouses) ---- */

    long countByWarehouseIdIn(Collection<UUID> warehouseIds);

    long countByWarehouseIdInAndActive(
            Collection<UUID> warehouseIds,
            boolean active
    );

    @Query("""
            select l.locationType as type, count(l) as count
            from WarehouseLocation l
            where l.warehouseId in :warehouseIds
            group by l.locationType
            """)
    List<TypeCount> countGroupedByType(
            @Param("warehouseIds") Collection<UUID> warehouseIds
    );

    @Query("""
            select l.warehouseId as warehouseId, count(l) as count
            from WarehouseLocation l
            where l.warehouseId in :warehouseIds
            group by l.warehouseId
            """)
    List<WarehouseCount> countGroupedByWarehouse(
            @Param("warehouseIds") Collection<UUID> warehouseIds
    );

    interface TypeCount {
        String getType();

        long getCount();
    }

    interface WarehouseCount {
        UUID getWarehouseId();

        long getCount();
    }

    Optional<WarehouseLocation>
    findByIdAndWarehouseId(
            UUID id,
            UUID warehouseId
    );

    boolean existsByWarehouseIdAndCode(
            UUID warehouseId,
            String code
    );

    boolean existsByWarehouseIdAndCodeAndIdNot(
            UUID warehouseId,
            String code,
            UUID id
    );
}