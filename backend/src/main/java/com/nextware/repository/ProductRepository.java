package com.nextware.repository;

import com.nextware.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository
        extends JpaRepository<Product, UUID> {

    List<Product>
    findAllByCompanyIdOrderByNameAsc(
            UUID companyId
    );

    Optional<Product>
    findByIdAndCompanyId(
            UUID id,
            UUID companyId
    );

    boolean existsByCompanyIdAndSku(
            UUID companyId,
            String sku
    );

    boolean existsByCompanyIdAndSkuAndIdNot(
            UUID companyId,
            String sku,
            UUID id
    );
}