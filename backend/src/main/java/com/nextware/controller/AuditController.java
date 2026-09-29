package com.nextware.controller;

import com.nextware.dto.audit.AuditResponse;
import com.nextware.service.audit.AuditService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasAuthority('AUDIT_VIEW')")
public class AuditController {

    private final AuditService auditService;

    public AuditController(
            AuditService auditService
    ) {
        this.auditService =
                auditService;
    }

    @GetMapping
    public ResponseEntity<List<AuditResponse>> getAuditLogs(
            @RequestParam(
                    required = false
            )
            String action,

            @RequestParam(
                    required = false
            )
            String entityType,

            @RequestParam(
                    required = false
            )
            UUID entityId,

            @RequestParam(
                    required = false
            )
            UUID userId,

            @RequestParam(
                    required = false
            )
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE_TIME
            )
            OffsetDateTime from,

            @RequestParam(
                    required = false
            )
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE_TIME
            )
            OffsetDateTime to
    ) {

        return ResponseEntity.ok(
                auditService.getAuditLogs(
                        action,
                        entityType,
                        entityId,
                        userId,
                        from,
                        to
                )
        );
    }
}