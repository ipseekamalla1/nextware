package com.nextware.dto.document;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        String fileName,
        String contentType,
        long fileSize,
        String documentType,
        String description,
        UUID uploadedBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}