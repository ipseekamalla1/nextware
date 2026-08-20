package com.nextware.repository;

import com.nextware.entity.WarehouseLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WarehouseLocationRepository
        extends JpaRepository<WarehouseLocation, UUID> {

    List<WarehouseLocation>
    findAllByWarehouseIdOrderByCodeAsc(
            UUID warehouseId
    );

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