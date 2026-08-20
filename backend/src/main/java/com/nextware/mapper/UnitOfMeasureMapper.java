package com.nextware.mapper;

import com.nextware.dto.unit.UnitOfMeasureCreateRequest;
import com.nextware.dto.unit.UnitOfMeasureResponse;
import com.nextware.entity.UnitOfMeasure;
import org.springframework.stereotype.Component;

@Component
public class UnitOfMeasureMapper {

    public UnitOfMeasure toEntity(
            UnitOfMeasureCreateRequest request
    ) {
        UnitOfMeasure unit = new UnitOfMeasure();

        unit.setCompanyId(request.getCompanyId());
        unit.setCode(request.getCode().trim().toUpperCase());
        unit.setName(request.getName().trim());
        unit.setDescription(trimToNull(request.getDescription()));

        if (request.getActive() != null) {
            unit.setActive(request.getActive());
        }

        return unit;
    }

    public void updateEntity(
            UnitOfMeasure unit,
            UnitOfMeasureCreateRequest request
    ) {
        unit.setCode(request.getCode().trim().toUpperCase());
        unit.setName(request.getName().trim());
        unit.setDescription(trimToNull(request.getDescription()));

        if (request.getActive() != null) {
            unit.setActive(request.getActive());
        }
    }

    public UnitOfMeasureResponse toResponse(
            UnitOfMeasure unit
    ) {
        UnitOfMeasureResponse response = new UnitOfMeasureResponse();

        response.setId(unit.getId());
        response.setCompanyId(unit.getCompanyId());
        response.setCode(unit.getCode());
        response.setName(unit.getName());
        response.setDescription(unit.getDescription());
        response.setActive(unit.isActive());
        response.setCreatedAt(unit.getCreatedAt());
        response.setUpdatedAt(unit.getUpdatedAt());

        return response;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }
}