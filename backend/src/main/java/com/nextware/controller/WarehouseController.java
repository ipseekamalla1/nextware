package com.nextware.controller;

import com.nextware.dto.warehouse.WarehouseCreateRequest;
import com.nextware.dto.warehouse.WarehouseResponse;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.warehouse.WarehouseService;
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
@RequestMapping("/api/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;
    private final CompanySecurityService companySecurityService;

    public WarehouseController(
            WarehouseService warehouseService,
            CompanySecurityService companySecurityService
    ) {
        this.warehouseService = warehouseService;
        this.companySecurityService =
                companySecurityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('WAREHOUSE_VIEW')")
    public ResponseEntity<List<WarehouseResponse>>
    getWarehouses(
            @RequestParam UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                warehouseService.getWarehouses(
                        companyId
                )
        );
    }

    @GetMapping("/{warehouseId}")
    @PreAuthorize("hasAuthority('WAREHOUSE_VIEW')")
    public ResponseEntity<WarehouseResponse>
    getWarehouse(
            @RequestParam UUID companyId,
            @PathVariable UUID warehouseId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                warehouseService.getWarehouse(
                        companyId,
                        warehouseId
                )
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('WAREHOUSE_CREATE')")
    public ResponseEntity<WarehouseResponse>
    createWarehouse(
            @Valid
            @RequestBody
            WarehouseCreateRequest request
    ) {
        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        warehouseService.createWarehouse(
                                request
                        )
                );
    }

    @PutMapping("/{warehouseId}")
    @PreAuthorize("hasAuthority('WAREHOUSE_UPDATE')")
    public ResponseEntity<WarehouseResponse>
    updateWarehouse(
            @RequestParam UUID companyId,
            @PathVariable UUID warehouseId,
            @Valid
            @RequestBody
            WarehouseCreateRequest request
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity.ok(
                warehouseService.updateWarehouse(
                        companyId,
                        warehouseId,
                        request
                )
        );
    }

    @DeleteMapping("/{warehouseId}")
    @PreAuthorize("hasAuthority('WAREHOUSE_DELETE')")
    public ResponseEntity<Void>
    deactivateWarehouse(
            @RequestParam UUID companyId,
            @PathVariable UUID warehouseId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        warehouseService.deactivateWarehouse(
                companyId,
                warehouseId
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    @PutMapping("/{warehouseId}/activate")
    @PreAuthorize("hasAuthority('WAREHOUSE_UPDATE')")
    public ResponseEntity<WarehouseResponse>
    activateWarehouse(
            @RequestParam UUID companyId,
            @PathVariable UUID warehouseId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                warehouseService.activateWarehouse(
                        companyId,
                        warehouseId
                )
        );
    }
}