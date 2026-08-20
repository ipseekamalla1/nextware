package com.nextware.service.unit;

import com.nextware.dto.unit.UnitOfMeasureCreateRequest;
import com.nextware.dto.unit.UnitOfMeasureResponse;
import com.nextware.entity.UnitOfMeasure;
import com.nextware.mapper.UnitOfMeasureMapper;
import com.nextware.repository.UnitOfMeasureRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class UnitOfMeasureService {

    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final UnitOfMeasureMapper unitOfMeasureMapper;

    public UnitOfMeasureService(
            UnitOfMeasureRepository unitOfMeasureRepository,
            UnitOfMeasureMapper unitOfMeasureMapper
    ) {
        this.unitOfMeasureRepository = unitOfMeasureRepository;
        this.unitOfMeasureMapper = unitOfMeasureMapper;
    }

    public List<UnitOfMeasureResponse> getUnits(UUID companyId) {
        return unitOfMeasureRepository
                .findAllByCompanyIdOrderByNameAsc(companyId)
                .stream()
                .map(unitOfMeasureMapper::toResponse)
                .toList();
    }

    public UnitOfMeasureResponse getUnit(
            UUID companyId,
            UUID unitId
    ) {
        UnitOfMeasure unit = unitOfMeasureRepository
                .findByIdAndCompanyId(unitId, companyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Unit of measure not found"
                ));

        return unitOfMeasureMapper.toResponse(unit);
    }

    public UnitOfMeasureResponse createUnit(
            UnitOfMeasureCreateRequest request
    ) {
        String code = request.getCode().trim().toUpperCase();

        if (unitOfMeasureRepository.existsByCompanyIdAndCode(
                request.getCompanyId(),
                code
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A unit of measure with this code already exists for the company"
            );
        }

        UnitOfMeasure unit = unitOfMeasureMapper.toEntity(request);

        UnitOfMeasure savedUnit =
                unitOfMeasureRepository.save(unit);

        return unitOfMeasureMapper.toResponse(savedUnit);
    }

    public UnitOfMeasureResponse updateUnit(
            UUID companyId,
            UUID unitId,
            UnitOfMeasureCreateRequest request
    ) {
        if (!companyId.equals(request.getCompanyId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Company ID cannot be changed"
            );
        }

        UnitOfMeasure unit = unitOfMeasureRepository
                .findByIdAndCompanyId(unitId, companyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Unit of measure not found"
                ));

        String code = request.getCode().trim().toUpperCase();

        if (unitOfMeasureRepository
                .existsByCompanyIdAndCodeAndIdNot(
                        companyId,
                        code,
                        unitId
                )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A unit of measure with this code already exists for the company"
            );
        }

        unitOfMeasureMapper.updateEntity(unit, request);

        UnitOfMeasure updatedUnit =
                unitOfMeasureRepository.save(unit);

        return unitOfMeasureMapper.toResponse(updatedUnit);
    }

    public void deactivateUnit(
            UUID companyId,
            UUID unitId
    ) {
        UnitOfMeasure unit = unitOfMeasureRepository
                .findByIdAndCompanyId(unitId, companyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Unit of measure not found"
                ));

        unit.setActive(false);

        unitOfMeasureRepository.save(unit);
    }
}