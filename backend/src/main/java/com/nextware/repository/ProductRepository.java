package com.nextware.repository;

import com.nextware.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository
        extends JpaRepository<Product, UUID> {

    List<Product>
    findAllByCompanyIdOrderByNameAsc(
            UUID companyId
    );

    /* ---- dashboard aggregates (company-scoped) ---- */

    long countByCompanyId(UUID companyId);

    long countByCompanyIdAndActive(UUID companyId, boolean active);

    long countByCompanyIdAndCategoryIdIsNull(UUID companyId);

    long countByCompanyIdAndSellingPriceIsNull(UUID companyId);

    long countByCompanyIdAndBarcodeIsNull(UUID companyId);

    long countByCompanyIdAndCreatedAtGreaterThanEqual(
            UUID companyId,
            OffsetDateTime from
    );

    List<Product> findTop5ByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    @Query("""
            select p.categoryId as categoryId, count(p) as count
            from Product p
            where p.companyId = :companyId
            group by p.categoryId
            """)
    List<CategoryCount> countGroupedByCategory(@Param("companyId") UUID companyId);

    @Query("select p.createdAt from Product p where p.companyId = :companyId")
    List<OffsetDateTime> findCreatedAtByCompanyId(@Param("companyId") UUID companyId);

    interface CategoryCount {
        UUID getCategoryId();

        long getCount();
    }

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