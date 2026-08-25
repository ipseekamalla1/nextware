package com.nextware.repository;

import com.nextware.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByCompanyIdAndUsername(
            UUID companyId,
            String username
    );

    Optional<User> findByCompanyIdAndEmail(
            UUID companyId,
            String email
    );

    Optional<User> findByUsername(
            String username
    );

    boolean existsByCompanyIdAndUsername(
            UUID companyId,
            String username
    );

    boolean existsByCompanyIdAndEmail(
            UUID companyId,
            String email
    );
}