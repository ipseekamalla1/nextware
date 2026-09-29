package com.nextware.repository;

import com.nextware.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findAllByCompanyIdOrderByCreatedAtDesc(
            UUID companyId
    );

    List<AuditLog> findAllByCompanyIdAndActionOrderByCreatedAtDesc(
            UUID companyId,
            String action
    );

    List<AuditLog> findAllByCompanyIdAndEntityTypeOrderByCreatedAtDesc(
            UUID companyId,
            String entityType
    );

    List<AuditLog> findAllByCompanyIdAndEntityIdOrderByCreatedAtDesc(
            UUID companyId,
            UUID entityId
    );

    List<AuditLog> findAllByCompanyIdAndUserIdOrderByCreatedAtDesc(
            UUID companyId,
            UUID userId
    );

    List<AuditLog> findAllByCompanyIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            UUID companyId,
            OffsetDateTime from,
            OffsetDateTime to
    );
}