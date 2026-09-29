package com.nextware.dto.audit;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuditResponse(
        UUID id,
        UUID companyId,
        UUID userId,
        String action,
        String entityType,
        UUID entityId,
        String details,
        OffsetDateTime createdAt
) {
}