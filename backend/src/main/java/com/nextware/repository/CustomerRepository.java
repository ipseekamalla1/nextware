package com.nextware.repository;

import com.nextware.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository
        extends JpaRepository<Customer, UUID> {

    List<Customer>
    findAllByCompanyIdOrderByNameAsc(
            UUID companyId
    );

    Optional<Customer>
    findByIdAndCompanyId(
            UUID id,
            UUID companyId
    );

    boolean existsByCompanyIdAndCustomerCode(
            UUID companyId,
            String customerCode
    );

    boolean existsByCompanyIdAndCustomerCodeAndIdNot(
            UUID companyId,
            String customerCode,
            UUID id
    );
}