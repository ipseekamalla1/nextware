package com.nextware.service.unit;

import com.nextware.dto.unit.UnitOfMeasureCreateRequest;
import com.nextware.dto.unit.UnitOfMeasureResponse;
import com.nextware.entity.UnitOfMeasure;
import com.nextware.mapper.UnitOfMeasureMapper;
import com.nextware.repository.UnitOfMeasureRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class UnitOfMeasureService {

    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final UnitOfMeasureMapper unitOfMeasureMapper;
    private final CompanySecurityService companySecurityService;

    public UnitOfMeasureService(
            UnitOfMeasureRepository unitOfMeasureRepository,
            UnitOfMeasureMapper unitOfMeasureMapper,
            CompanySecurityService companySecurityService
    ) {
        this.unitOfMeasureRepository =
                unitOfMeasureRepository;

        this.unitOfMeasureMapper =
                unitOfMeasureMapper;

        this.companySecurityService =
                companySecurityService;
    }

    /**
     * Get all units belonging to
     * the authenticated company.
     */
    public List<UnitOfMeasureResponse> getUnits(
            UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return unitOfMeasureRepository
                .findAllByCompanyIdOrderByNameAsc(
                        companyId
                )
                .stream()
                .map(unitOfMeasureMapper::toResponse)
                .toList();
    }

    /**
     * Get one unit belonging to
     * the authenticated company.
     */
    public UnitOfMeasureResponse getUnit(
            UUID companyId,
            UUID unitId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        UnitOfMeasure unit =
                unitOfMeasureRepository
                        .findByIdAndCompanyId(
                                unitId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Unit of measure not found"
                                        )
                        );

        return unitOfMeasureMapper.toResponse(
                unit
        );
    }

    /**
     * Create a unit of measure for
     * the authenticated company.
     */
    public UnitOfMeasureResponse createUnit(
            UnitOfMeasureCreateRequest request
    ) {
        UUID companyId =
                request.getCompanyId();

        companySecurityService.requireCompany(
                companyId
        );

        String code =
                request.getCode()
                        .trim()
                        .toUpperCase();

        if (
                unitOfMeasureRepository
                        .existsByCompanyIdAndCode(
                                companyId,
                                code
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A unit of measure with this code already exists for the company"
            );
        }

        UnitOfMeasure unit =
                unitOfMeasureMapper.toEntity(
                        request
                );

        UnitOfMeasure savedUnit =
                unitOfMeasureRepository.save(
                        unit
                );

        return unitOfMeasureMapper.toResponse(
                savedUnit
        );
    }

    /**
     * Update a unit of measure belonging
     * to the authenticated company.
     */
    public UnitOfMeasureResponse updateUnit(
            UUID companyId,
            UUID unitId,
            UnitOfMeasureCreateRequest request
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        if (
                !companyId.equals(
                        request.getCompanyId()
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Company ID cannot be changed"
            );
        }

        UnitOfMeasure unit =
                unitOfMeasureRepository
                        .findByIdAndCompanyId(
                                unitId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Unit of measure not found"
                                        )
                        );

        String code =
                request.getCode()
                        .trim()
                        .toUpperCase();

        if (
                unitOfMeasureRepository
                        .existsByCompanyIdAndCodeAndIdNot(
                                companyId,
                                code,
                                unitId
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A unit of measure with this code already exists for the company"
            );
        }

        unitOfMeasureMapper.updateEntity(
                unit,
                request
        );

        UnitOfMeasure updatedUnit =
                unitOfMeasureRepository.save(
                        unit
                );

        return unitOfMeasureMapper.toResponse(
                updatedUnit
        );
    }

    /**
     * Soft delete / deactivate a unit
     * belonging to the authenticated company.
     */
    public void deactivateUnit(
            UUID companyId,
            UUID unitId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        UnitOfMeasure unit =
                unitOfMeasureRepository
                        .findByIdAndCompanyId(
                                unitId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Unit of measure not found"
                                        )
                        );

        if (!unit.isActive()) {
            return;
        }

        unit.setActive(false);

        unitOfMeasureRepository.save(
                unit
        );
    }
}