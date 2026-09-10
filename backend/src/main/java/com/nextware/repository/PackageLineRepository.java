package com.nextware.repository;

import com.nextware.entity.PackageLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PackageLineRepository
        extends JpaRepository<PackageLine, java.util.UUID> {

    List<PackageLine>
    findAllByPackageIdOrderByCreatedAtAsc(
            java.util.UUID packageId
    );
}