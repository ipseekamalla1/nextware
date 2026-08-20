package com.nextware.mapper;

import com.nextware.dto.warehouseLocation.WarehouseLocationCreateRequest;
import com.nextware.dto.warehouseLocation.WarehouseLocationResponse;
import com.nextware.entity.WarehouseLocation;
import org.springframework.stereotype.Component;

@Component
public class WarehouseLocationMapper {

    public WarehouseLocation toEntity(
            WarehouseLocationCreateRequest request
    ) {
        WarehouseLocation location =
                new WarehouseLocation();

        location.setWarehouseId(
                request.getWarehouseId()
        );

        location.setCode(
                request.getCode().trim()
        );

        if (request.getName() != null) {
            location.setName(
                    request.getName().trim()
            );
        }

        String locationType =
                request.getLocationType();

        if (locationType == null ||
                locationType.trim().isEmpty()) {

            locationType = "STORAGE";
        }

        location.setLocationType(
                locationType.trim().toUpperCase()
        );

        if (request.getActive() != null) {
            location.setActive(
                    request.getActive()
            );
        }

        return location;
    }

    public void updateEntity(
            WarehouseLocation location,
            WarehouseLocationCreateRequest request
    ) {
        location.setCode(
                request.getCode().trim()
        );

        if (request.getName() != null) {
            location.setName(
                    request.getName().trim()
            );
        } else {
            location.setName(null);
        }

        String locationType =
                request.getLocationType();

        if (locationType == null ||
                locationType.trim().isEmpty()) {

            locationType = "STORAGE";
        }

        location.setLocationType(
                locationType.trim().toUpperCase()
        );

        if (request.getActive() != null) {
            location.setActive(
                    request.getActive()
            );
        }
    }

    public WarehouseLocationResponse toResponse(
            WarehouseLocation location
    ) {
        WarehouseLocationResponse response =
                new WarehouseLocationResponse();

        response.setId(
                location.getId()
        );

        response.setWarehouseId(
                location.getWarehouseId()
        );

        response.setCode(
                location.getCode()
        );

        response.setName(
                location.getName()
        );

        response.setLocationType(
                location.getLocationType()
        );

        response.setActive(
                location.isActive()
        );

        response.setCreatedAt(
                location.getCreatedAt()
        );

        response.setUpdatedAt(
                location.getUpdatedAt()
        );

        return response;
    }
}