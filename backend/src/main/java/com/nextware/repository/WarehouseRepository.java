package com.nextware.repository;

import com.nextware.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WarehouseRepository
        extends JpaRepository<Warehouse, UUID> {

    List<Warehouse> findByCompanyId(
            UUID companyId
    );

    Optional<Warehouse> findByIdAndCompanyId(
            UUID id,
            UUID companyId
    );

    boolean existsByCompanyIdAndCode(
            UUID companyId,
            String code
    );

    boolean existsByCompanyIdAndCodeAndIdNot(
            UUID companyId,
            String code,
            UUID id
    );
}