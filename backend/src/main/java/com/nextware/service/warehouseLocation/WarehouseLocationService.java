package com.nextware.service.warehouseLocation;

import com.nextware.dto.warehouseLocation.WarehouseLocationCreateRequest;
import com.nextware.dto.warehouseLocation.WarehouseLocationResponse;
import com.nextware.entity.Warehouse;
import com.nextware.entity.WarehouseLocation;
import com.nextware.mapper.WarehouseLocationMapper;
import com.nextware.repository.WarehouseLocationRepository;
import com.nextware.repository.WarehouseRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class WarehouseLocationService {

    private static final List<String> VALID_LOCATION_TYPES =
            List.of(
                    "RECEIVING",
                    "STORAGE",
                    "PICKING",
                    "PACKING",
                    "SHIPPING",
                    "QUARANTINE",
                    "DAMAGED"
            );

    private final WarehouseLocationRepository warehouseLocationRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationMapper warehouseLocationMapper;
    private final CompanySecurityService companySecurityService;

    public WarehouseLocationService(
            WarehouseLocationRepository warehouseLocationRepository,
            WarehouseRepository warehouseRepository,
            WarehouseLocationMapper warehouseLocationMapper,
            CompanySecurityService companySecurityService
    ) {
        this.warehouseLocationRepository =
                warehouseLocationRepository;

        this.warehouseRepository =
                warehouseRepository;

        this.warehouseLocationMapper =
                warehouseLocationMapper;

        this.companySecurityService =
                companySecurityService;
    }

    /**
     * Get all locations belonging to a warehouse
     * owned by the authenticated company.
     */
    public List<WarehouseLocationResponse>
    getWarehouseLocations(
            UUID warehouseId
    ) {
        requireAuthenticatedWarehouse(
                warehouseId
        );

        return warehouseLocationRepository
                .findAllByWarehouseIdOrderByCodeAsc(
                        warehouseId
                )
                .stream()
                .map(
                        warehouseLocationMapper::toResponse
                )
                .toList();
    }

    /**
     * Get one warehouse location belonging to
     * a warehouse owned by the authenticated company.
     */
    public WarehouseLocationResponse getWarehouseLocation(
            UUID warehouseId,
            UUID locationId
    ) {
        requireAuthenticatedWarehouse(
                warehouseId
        );

        WarehouseLocation location =
                warehouseLocationRepository
                        .findByIdAndWarehouseId(
                                locationId,
                                warehouseId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Warehouse location not found"
                                        )
                        );

        return warehouseLocationMapper.toResponse(
                location
        );
    }

    /**
     * Create a warehouse location.
     */
    public WarehouseLocationResponse createWarehouseLocation(
            WarehouseLocationCreateRequest request
    ) {
        UUID warehouseId =
                request.getWarehouseId();

        requireAuthenticatedWarehouse(
                warehouseId
        );

        validateLocationType(
                request.getLocationType()
        );

        String code =
                request.getCode().trim();

        if (
                warehouseLocationRepository
                        .existsByWarehouseIdAndCode(
                                warehouseId,
                                code
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A warehouse location with this code already exists for the warehouse"
            );
        }

        WarehouseLocation location =
                warehouseLocationMapper.toEntity(
                        request
                );

        WarehouseLocation savedLocation =
                warehouseLocationRepository.save(
                        location
                );

        return warehouseLocationMapper.toResponse(
                savedLocation
        );
    }

    /**
     * Update a warehouse location.
     */
    public WarehouseLocationResponse updateWarehouseLocation(
            UUID warehouseId,
            UUID locationId,
            WarehouseLocationCreateRequest request
    ) {
        requireAuthenticatedWarehouse(
                warehouseId
        );

        if (
                !warehouseId.equals(
                        request.getWarehouseId()
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Warehouse ID cannot be changed"
            );
        }

        validateLocationType(
                request.getLocationType()
        );

        WarehouseLocation location =
                warehouseLocationRepository
                        .findByIdAndWarehouseId(
                                locationId,
                                warehouseId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Warehouse location not found"
                                        )
                        );

        String code =
                request.getCode().trim();

        if (
                warehouseLocationRepository
                        .existsByWarehouseIdAndCodeAndIdNot(
                                warehouseId,
                                code,
                                locationId
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A warehouse location with this code already exists for the warehouse"
            );
        }

        warehouseLocationMapper.updateEntity(
                location,
                request
        );

        WarehouseLocation updatedLocation =
                warehouseLocationRepository.save(
                        location
                );

        return warehouseLocationMapper.toResponse(
                updatedLocation
        );
    }

    /**
     * Soft delete / deactivate a warehouse location.
     */
    public void deactivateWarehouseLocation(
            UUID warehouseId,
            UUID locationId
    ) {
        requireAuthenticatedWarehouse(
                warehouseId
        );

        WarehouseLocation location =
                warehouseLocationRepository
                        .findByIdAndWarehouseId(
                                locationId,
                                warehouseId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Warehouse location not found"
                                        )
                        );

        if (!location.isActive()) {
            return;
        }

        location.setActive(false);

        warehouseLocationRepository.save(
                location
        );
    }

    /**
     * Activate a warehouse location.
     */
    public WarehouseLocationResponse activateWarehouseLocation(
            UUID warehouseId,
            UUID locationId
    ) {
        requireAuthenticatedWarehouse(
                warehouseId
        );

        WarehouseLocation location =
                warehouseLocationRepository
                        .findByIdAndWarehouseId(
                                locationId,
                                warehouseId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Warehouse location not found"
                                        )
                        );

        if (!location.isActive()) {
            location.setActive(true);

            location =
                    warehouseLocationRepository.save(
                            location
                    );
        }

        return warehouseLocationMapper.toResponse(
                location
        );
    }

    /**
     * Resolves the warehouse and verifies that
     * the warehouse belongs to the authenticated company.
     */
    private Warehouse requireAuthenticatedWarehouse(
            UUID warehouseId
    ) {
        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                warehouseId,
                                companySecurityService
                                        .getAuthenticatedCompanyId()
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Warehouse not found"
                                        )
                        );

        return warehouse;
    }

    private void validateLocationType(
            String locationType
    ) {
        if (
                locationType == null ||
                locationType.trim().isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Location type is required"
            );
        }

        String normalizedType =
                locationType.trim().toUpperCase();

        if (
                !VALID_LOCATION_TYPES.contains(
                        normalizedType
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid warehouse location type"
            );
        }
    }
}