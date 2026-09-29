package com.nextware.service.audit;

import com.nextware.dto.audit.AuditResponse;
import com.nextware.entity.AuditLog;
import com.nextware.repository.AuditLogRepository;
import com.nextware.security.AuthenticatedUser;
import com.nextware.security.CompanySecurityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final CompanySecurityService companySecurityService;

    public AuditService(
            AuditLogRepository auditLogRepository,
            CompanySecurityService companySecurityService
    ) {
        this.auditLogRepository = auditLogRepository;
        this.companySecurityService = companySecurityService;
    }

    @Transactional
    public void record(
            String action,
            String entityType,
            UUID entityId,
            String details
    ) {

        UUID companyId =
                companySecurityService
                        .getAuthenticatedCompanyId();

        AuditLog auditLog =
                new AuditLog();

        auditLog.setCompanyId(
                companyId
        );

        auditLog.setUserId(
                AuthenticatedUser.getUserId()
        );

        auditLog.setAction(
                normalizeRequired(
                        action,
                        "Audit action is required"
                )
        );

        auditLog.setEntityType(
                normalizeRequired(
                        entityType,
                        "Audit entity type is required"
                )
        );

        auditLog.setEntityId(
                entityId
        );

        auditLog.setDetails(
                normalizeOptional(details)
        );

        auditLogRepository.save(
                auditLog
        );
    }

    @Transactional(readOnly = true)
    public List<AuditResponse> getAuditLogs(
            String action,
            String entityType,
            UUID entityId,
            UUID userId,
            OffsetDateTime from,
            OffsetDateTime to
    ) {

        UUID companyId =
                companySecurityService
                        .getAuthenticatedCompanyId();

        List<AuditLog> logs;

        if (entityId != null) {

            logs =
                    auditLogRepository
                            .findAllByCompanyIdAndEntityIdOrderByCreatedAtDesc(
                                    companyId,
                                    entityId
                            );

        } else if (userId != null) {

            logs =
                    auditLogRepository
                            .findAllByCompanyIdAndUserIdOrderByCreatedAtDesc(
                                    companyId,
                                    userId
                            );

        } else if (
                action != null &&
                !action.isBlank()
        ) {

            logs =
                    auditLogRepository
                            .findAllByCompanyIdAndActionOrderByCreatedAtDesc(
                                    companyId,
                                    action.trim().toUpperCase()
                            );

        } else if (
                entityType != null &&
                !entityType.isBlank()
        ) {

            logs =
                    auditLogRepository
                            .findAllByCompanyIdAndEntityTypeOrderByCreatedAtDesc(
                                    companyId,
                                    entityType.trim().toUpperCase()
                            );

        } else if (
                from != null &&
                to != null
        ) {

            if (from.isAfter(to)) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Audit start time must not be after end time"
                );
            }

            logs =
                    auditLogRepository
                            .findAllByCompanyIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                                    companyId,
                                    from,
                                    to
                            );

        } else {

            logs =
                    auditLogRepository
                            .findAllByCompanyIdOrderByCreatedAtDesc(
                                    companyId
                            );
        }

        return logs.stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditResponse toResponse(
            AuditLog auditLog
    ) {

        return new AuditResponse(
                auditLog.getId(),
                auditLog.getCompanyId(),
                auditLog.getUserId(),
                auditLog.getAction(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getDetails(),
                auditLog.getCreatedAt()
        );
    }

    private String normalizeRequired(
            String value,
            String message
    ) {

        if (
                value == null ||
                value.isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    message
            );
        }

        String normalized =
                value.trim()
                        .toUpperCase();

        if (normalized.length() > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Audit value must not exceed 100 characters"
            );
        }

        return normalized;
    }

    private String normalizeOptional(
            String value
    ) {

        if (value == null) {
            return null;
        }

        String normalized =
                value.trim();

        if (normalized.isEmpty()) {
            return null;
        }

        if (normalized.length() > 4000) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Audit details must not exceed 4000 characters"
            );
        }

        return normalized;
    }
}