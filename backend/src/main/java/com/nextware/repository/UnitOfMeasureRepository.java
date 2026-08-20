package com.nextware.repository;

import com.nextware.entity.UnitOfMeasure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UnitOfMeasureRepository
        extends JpaRepository<UnitOfMeasure, UUID> {

    List<UnitOfMeasure> findAllByCompanyIdOrderByNameAsc(
            UUID companyId
    );

    Optional<UnitOfMeasure> findByIdAndCompanyId(
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