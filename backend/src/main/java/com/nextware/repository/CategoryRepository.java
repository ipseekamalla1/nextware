package com.nextware.repository;

import com.nextware.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository
        extends JpaRepository<Category, UUID> {

    List<Category>
    findAllByCompanyIdOrderByNameAsc(
            UUID companyId
    );

    Optional<Category>
    findByIdAndCompanyId(
            UUID id,
            UUID companyId
    );

    boolean existsByCompanyIdAndName(
            UUID companyId,
            String name
    );

    boolean existsByCompanyIdAndNameAndIdNot(
            UUID companyId,
            String name,
            UUID id
    );
}