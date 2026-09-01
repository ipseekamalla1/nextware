package com.nextware.controller;

import com.nextware.dto.unit.UnitOfMeasureCreateRequest;
import com.nextware.dto.unit.UnitOfMeasureResponse;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.unit.UnitOfMeasureService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/unit-of-measures")
public class UnitOfMeasureController {

    private final UnitOfMeasureService unitOfMeasureService;
    private final CompanySecurityService companySecurityService;

    public UnitOfMeasureController(
            UnitOfMeasureService unitOfMeasureService,
            CompanySecurityService companySecurityService
    ) {
        this.unitOfMeasureService = unitOfMeasureService;
        this.companySecurityService = companySecurityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('UNIT_OF_MEASURE_VIEW')")
    public ResponseEntity<List<UnitOfMeasureResponse>> getUnits(
            @RequestParam UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                unitOfMeasureService.getUnits(
                        companyId
                )
        );
    }

    @GetMapping("/{unitId}")
    @PreAuthorize("hasAuthority('UNIT_OF_MEASURE_VIEW')")
    public ResponseEntity<UnitOfMeasureResponse> getUnit(
            @RequestParam UUID companyId,
            @PathVariable UUID unitId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                unitOfMeasureService.getUnit(
                        companyId,
                        unitId
                )
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('UNIT_OF_MEASURE_CREATE')")
    public ResponseEntity<UnitOfMeasureResponse> createUnit(
            @Valid
            @RequestBody
            UnitOfMeasureCreateRequest request
    ) {
        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        unitOfMeasureService.createUnit(
                                request
                        )
                );
    }

    @PutMapping("/{unitId}")
    @PreAuthorize("hasAuthority('UNIT_OF_MEASURE_UPDATE')")
    public ResponseEntity<UnitOfMeasureResponse> updateUnit(
            @RequestParam UUID companyId,
            @PathVariable UUID unitId,
            @Valid
            @RequestBody
            UnitOfMeasureCreateRequest request
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity.ok(
                unitOfMeasureService.updateUnit(
                        companyId,
                        unitId,
                        request
                )
        );
    }

    @DeleteMapping("/{unitId}")
    @PreAuthorize("hasAuthority('UNIT_OF_MEASURE_DELETE')")
    public ResponseEntity<Void> deactivateUnit(
            @RequestParam UUID companyId,
            @PathVariable UUID unitId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        unitOfMeasureService.deactivateUnit(
                companyId,
                unitId
        );

        return ResponseEntity.noContent().build();
    }
}