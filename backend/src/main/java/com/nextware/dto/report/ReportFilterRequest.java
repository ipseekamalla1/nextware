package com.nextware.dto.report;

import java.time.LocalDate;
import java.util.UUID;

public record ReportFilterRequest(
        LocalDate dateFrom,
        LocalDate dateTo,
        UUID warehouseId,
        UUID productId,
        UUID customerId,
        UUID supplierId,
        String status,
        String transactionType
) {

    public ReportFilterRequest {
        if (dateFrom != null
                && dateTo != null
                && dateFrom.isAfter(dateTo)) {
            throw new IllegalArgumentException(
                    "dateFrom cannot be after dateTo"
            );
        }

        status = normalize(status);
        transactionType = normalize(transactionType);
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim().toUpperCase();
    }
}