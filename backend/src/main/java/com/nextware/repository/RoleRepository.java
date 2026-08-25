package com.nextware.repository;

import com.nextware.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByCompanyIdAndName(
            UUID companyId,
            String name
    );

    boolean existsByCompanyIdAndName(
            UUID companyId,
            String name
    );
}