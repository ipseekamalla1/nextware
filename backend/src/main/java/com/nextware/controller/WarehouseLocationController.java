package com.nextware.controller;

import com.nextware.dto.warehouseLocation.WarehouseLocationCreateRequest;
import com.nextware.dto.warehouseLocation.WarehouseLocationResponse;
import com.nextware.service.warehouseLocation.WarehouseLocationService;
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
@RequestMapping("/api/warehouse-locations")
public class WarehouseLocationController {

    private final WarehouseLocationService
            warehouseLocationService;

    public WarehouseLocationController(
            WarehouseLocationService warehouseLocationService
    ) {
        this.warehouseLocationService =
                warehouseLocationService;
    }

    @GetMapping
    public ResponseEntity<List<WarehouseLocationResponse>>
    getWarehouseLocations(
            @RequestParam UUID warehouseId
    ) {
        return ResponseEntity.ok(
                warehouseLocationService
                        .getWarehouseLocations(
                                warehouseId
                        )
        );
    }

    @GetMapping("/{locationId}")
    public ResponseEntity<WarehouseLocationResponse>
    getWarehouseLocation(
            @RequestParam UUID warehouseId,
            @PathVariable UUID locationId
    ) {
        return ResponseEntity.ok(
                warehouseLocationService
                        .getWarehouseLocation(
                                warehouseId,
                                locationId
                        )
        );
    }

    @PostMapping
    public ResponseEntity<WarehouseLocationResponse>
    createWarehouseLocation(
            @Valid
            @RequestBody
            WarehouseLocationCreateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        warehouseLocationService
                                .createWarehouseLocation(
                                        request
                                )
                );
    }

    @PutMapping("/{locationId}")
    public ResponseEntity<WarehouseLocationResponse>
    updateWarehouseLocation(
            @RequestParam UUID warehouseId,
            @PathVariable UUID locationId,
            @Valid
            @RequestBody
            WarehouseLocationCreateRequest request
    ) {
        return ResponseEntity.ok(
                warehouseLocationService
                        .updateWarehouseLocation(
                                warehouseId,
                                locationId,
                                request
                        )
        );
    }

    /**
     * Soft delete / deactivate warehouse location.
     */
    @DeleteMapping("/{locationId}")
    public ResponseEntity<Void>
    deactivateWarehouseLocation(
            @RequestParam UUID warehouseId,
            @PathVariable UUID locationId
    ) {
        warehouseLocationService
                .deactivateWarehouseLocation(
                        warehouseId,
                        locationId
                );

        return ResponseEntity
                .noContent()
                .build();
    }

    /**
     * Activate warehouse location.
     */
    @PutMapping("/{locationId}/activate")
    public ResponseEntity<WarehouseLocationResponse>
    activateWarehouseLocation(
            @RequestParam UUID warehouseId,
            @PathVariable UUID locationId
    ) {
        return ResponseEntity.ok(
                warehouseLocationService
                        .activateWarehouseLocation(
                                warehouseId,
                                locationId
                        )
        );
    }
}