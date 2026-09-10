package com.nextware.repository;

import com.nextware.entity.Package;
import com.nextware.fulfillment.PackageStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PackageRepository
        extends JpaRepository<Package, UUID> {

    List<Package>
    findAllByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    List<Package>
    findAllByCompanyIdAndSalesOrderIdOrderByCreatedAtAsc(
            UUID companyId,
            UUID salesOrderId
    );

    Optional<Package>
    findByIdAndCompanyId(UUID id, UUID companyId);

    boolean existsByCompanyIdAndPackageNumber(
            UUID companyId,
            String packageNumber
    );

    boolean existsBySalesOrderIdAndStatus(
            UUID salesOrderId,
            PackageStatus status
    );
}