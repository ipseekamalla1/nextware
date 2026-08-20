package com.nextware.controller;

import com.nextware.dto.unit.UnitOfMeasureCreateRequest;
import com.nextware.dto.unit.UnitOfMeasureResponse;
import com.nextware.service.unit.UnitOfMeasureService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    public UnitOfMeasureController(
            UnitOfMeasureService unitOfMeasureService
    ) {
        this.unitOfMeasureService = unitOfMeasureService;
    }

    @GetMapping
    public ResponseEntity<List<UnitOfMeasureResponse>> getUnits(
            @RequestParam UUID companyId
    ) {
        return ResponseEntity.ok(
                unitOfMeasureService.getUnits(companyId)
        );
    }

    @GetMapping("/{unitId}")
    public ResponseEntity<UnitOfMeasureResponse> getUnit(
            @RequestParam UUID companyId,
            @PathVariable UUID unitId
    ) {
        return ResponseEntity.ok(
                unitOfMeasureService.getUnit(
                        companyId,
                        unitId
                )
        );
    }

    @PostMapping
    public ResponseEntity<UnitOfMeasureResponse> createUnit(
            @Valid @RequestBody UnitOfMeasureCreateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        unitOfMeasureService.createUnit(request)
                );
    }

    @PutMapping("/{unitId}")
    public ResponseEntity<UnitOfMeasureResponse> updateUnit(
            @RequestParam UUID companyId,
            @PathVariable UUID unitId,
            @Valid @RequestBody UnitOfMeasureCreateRequest request
    ) {
        return ResponseEntity.ok(
                unitOfMeasureService.updateUnit(
                        companyId,
                        unitId,
                        request
                )
        );
    }

    @DeleteMapping("/{unitId}")
    public ResponseEntity<Void> deactivateUnit(
            @RequestParam UUID companyId,
            @PathVariable UUID unitId
    ) {
        unitOfMeasureService.deactivateUnit(
                companyId,
                unitId
        );

        return ResponseEntity.noContent().build();
    }
}