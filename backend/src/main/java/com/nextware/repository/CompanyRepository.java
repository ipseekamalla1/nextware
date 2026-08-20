package com.nextware.repository;

import com.nextware.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {

    List<Company> findAllByOrderByNameAsc();

    Optional<Company> findByIdAndActiveTrue(UUID id);
}