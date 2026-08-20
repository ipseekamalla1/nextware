package com.nextware.service.warehouse;

import com.nextware.dto.warehouse.WarehouseCreateRequest;
import com.nextware.dto.warehouse.WarehouseResponse;
import com.nextware.entity.Company;
import com.nextware.entity.Warehouse;
import com.nextware.mapper.WarehouseMapper;
import com.nextware.repository.CompanyRepository;
import com.nextware.repository.WarehouseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public WarehouseServiceImpl(
            WarehouseRepository warehouseRepository,
            CompanyRepository companyRepository,
            WarehouseMapper warehouseMapper
    ) {
        this.warehouseRepository =
                warehouseRepository;

        this.companyRepository =
                companyRepository;

        this.warehouseMapper =
                warehouseMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> getWarehouses(
            UUID companyId
    ) {

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

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                warehouseId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
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

        Company company =
                companyRepository
                        .findById(
                                request.getCompanyId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Company not found"
                                )
                        );

        if (warehouseRepository
                .existsByCompanyIdAndCode(
                        request.getCompanyId(),
                        request.getCode()
                )) {

            throw new RuntimeException(
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

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                warehouseId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Warehouse not found"
                                )
                        );

        if (warehouseRepository
                .existsByCompanyIdAndCodeAndIdNot(
                        companyId,
                        request.getCode(),
                        warehouseId
                )) {

            throw new RuntimeException(
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

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                warehouseId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Warehouse not found"
                                )
                        );

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

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                warehouseId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Warehouse not found"
                                )
                        );

        warehouse.setActive(true);

        Warehouse updatedWarehouse =
                warehouseRepository.save(
                        warehouse
                );

        return warehouseMapper.toResponse(
                updatedWarehouse
        );
    }
}