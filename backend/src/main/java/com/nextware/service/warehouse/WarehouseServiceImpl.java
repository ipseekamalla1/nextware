package com.nextware.service.warehouse;

import com.nextware.dto.warehouse.WarehouseCreateRequest;
import com.nextware.dto.warehouse.WarehouseResponse;
import com.nextware.entity.Company;
import com.nextware.entity.Warehouse;
import com.nextware.mapper.WarehouseMapper;
import com.nextware.repository.CompanyRepository;
import com.nextware.repository.WarehouseRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class WarehouseServiceImpl
        implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final CompanyRepository companyRepository;
    private final WarehouseMapper warehouseMapper;
    private final CompanySecurityService companySecurityService;

    public WarehouseServiceImpl(
            WarehouseRepository warehouseRepository,
            CompanyRepository companyRepository,
            WarehouseMapper warehouseMapper,
            CompanySecurityService companySecurityService
    ) {
        this.warehouseRepository =
                warehouseRepository;

        this.companyRepository =
                companyRepository;

        this.warehouseMapper =
                warehouseMapper;

        this.companySecurityService =
                companySecurityService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> getWarehouses(
            UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return warehouseRepository
                .findByCompanyId(companyId)
                .stream()
                .map(warehouseMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouse(
            UUID companyId,
            UUID warehouseId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                warehouseId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Warehouse not found"
                                )
                        );

        return warehouseMapper.toResponse(
                warehouse
        );
    }

    @Override
    public WarehouseResponse createWarehouse(
            WarehouseCreateRequest request
    ) {
        UUID companyId =
                request.getCompanyId();

        companySecurityService.requireCompany(
                companyId
        );

        Company company =
                companyRepository
                        .findById(companyId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Company not found"
                                )
                        );

        if (
                warehouseRepository
                        .existsByCompanyIdAndCode(
                                companyId,
                                request.getCode()
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Warehouse code already exists for this company"
            );
        }

        Warehouse warehouse =
                warehouseMapper.toEntity(
                        request
                );

        Warehouse savedWarehouse =
                warehouseRepository.save(
                        warehouse
                );

        return warehouseMapper.toResponse(
                savedWarehouse
        );
    }

    @Override
    public WarehouseResponse updateWarehouse(
            UUID companyId,
            UUID warehouseId,
            WarehouseCreateRequest request
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

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                warehouseId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Warehouse not found"
                                )
                        );

        if (
                warehouseRepository
                        .existsByCompanyIdAndCodeAndIdNot(
                                companyId,
                                request.getCode(),
                                warehouseId
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Warehouse code already exists for this company"
            );
        }

        warehouseMapper.updateEntity(
                warehouse,
                request
        );

        Warehouse updatedWarehouse =
                warehouseRepository.save(
                        warehouse
                );

        return warehouseMapper.toResponse(
                updatedWarehouse
        );
    }

    @Override
    public void deactivateWarehouse(
            UUID companyId,
            UUID warehouseId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                warehouseId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Warehouse not found"
                                )
                        );

        if (!warehouse.isActive()) {
            return;
        }

        warehouse.setActive(false);

        warehouseRepository.save(
                warehouse
        );
    }

    @Override
    public WarehouseResponse activateWarehouse(
            UUID companyId,
            UUID warehouseId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                warehouseId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Warehouse not found"
                                )
                        );

        if (!warehouse.isActive()) {
            warehouse.setActive(true);

            warehouse =
                    warehouseRepository.save(
                            warehouse
                    );
        }

        return warehouseMapper.toResponse(
                warehouse
        );
    }
}