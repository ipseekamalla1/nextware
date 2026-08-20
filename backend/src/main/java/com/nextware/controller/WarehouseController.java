package com.nextware.controller;

import com.nextware.dto.warehouse.WarehouseCreateRequest;
import com.nextware.dto.warehouse.WarehouseResponse;
import com.nextware.service.warehouse.WarehouseService;
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
@RequestMapping("/api/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(
            WarehouseService warehouseService
    ) {
        this.warehouseService =
                warehouseService;
    }

    @GetMapping
    public ResponseEntity<List<WarehouseResponse>>
    getWarehouses(
            @RequestParam UUID companyId
    ) {

        return ResponseEntity.ok(
                warehouseService.getWarehouses(
                        companyId
                )
        );
    }

    @GetMapping("/{warehouseId}")
    public ResponseEntity<WarehouseResponse>
    getWarehouse(
            @RequestParam UUID companyId,
            @PathVariable UUID warehouseId
    ) {

        return ResponseEntity.ok(
                warehouseService.getWarehouse(
                        companyId,
                        warehouseId
                )
        );
    }

    @PostMapping
    public ResponseEntity<WarehouseResponse>
    createWarehouse(
            @Valid
            @RequestBody
            WarehouseCreateRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        warehouseService.createWarehouse(
                                request
                        )
                );
    }

    @PutMapping("/{warehouseId}")
    public ResponseEntity<WarehouseResponse>
    updateWarehouse(
            @RequestParam UUID companyId,
            @PathVariable UUID warehouseId,
            @Valid
            @RequestBody
            WarehouseCreateRequest request
    ) {

        return ResponseEntity.ok(
                warehouseService.updateWarehouse(
                        companyId,
                        warehouseId,
                        request
                )
        );
    }

    @DeleteMapping("/{warehouseId}")
    public ResponseEntity<Void>
    deactivateWarehouse(
            @RequestParam UUID companyId,
            @PathVariable UUID warehouseId
    ) {

        warehouseService.deactivateWarehouse(
                companyId,
                warehouseId
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    @PutMapping("/{warehouseId}/activate")
    public ResponseEntity<WarehouseResponse>
    activateWarehouse(
            @RequestParam UUID companyId,
            @PathVariable UUID warehouseId
    ) {

        return ResponseEntity.ok(
                warehouseService.activateWarehouse(
                        companyId,
                        warehouseId
                )
        );
    }
}