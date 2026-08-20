package com.nextware.service.supplier;

import com.nextware.dto.supplier.SupplierCreateRequest;
import com.nextware.dto.supplier.SupplierResponse;
import com.nextware.entity.Supplier;
import com.nextware.mapper.SupplierMapper;
import com.nextware.repository.SupplierRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    private final SupplierMapper supplierMapper;

    public SupplierService(
            SupplierRepository supplierRepository,
            SupplierMapper supplierMapper
    ) {
        this.supplierRepository =
                supplierRepository;

        this.supplierMapper =
                supplierMapper;
    }

    /**
     * Get all suppliers belonging to a company.
     */
    public List<SupplierResponse> getSuppliers(
            UUID companyId
    ) {
        return supplierRepository
                .findAllByCompanyIdOrderByNameAsc(
                        companyId
                )
                .stream()
                .map(supplierMapper::toResponse)
                .toList();
    }

    /**
     * Get one supplier belonging to a company.
     */
    public SupplierResponse getSupplier(
            UUID companyId,
            UUID supplierId
    ) {
        Supplier supplier =
                supplierRepository
                        .findByIdAndCompanyId(
                                supplierId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Supplier not found"
                                        )
                        );

        return supplierMapper.toResponse(
                supplier
        );
    }

    /**
     * Create a supplier.
     */
    public SupplierResponse createSupplier(
            SupplierCreateRequest request
    ) {
        String supplierCode =
                request.getSupplierCode().trim();

        if (
                supplierRepository
                        .existsByCompanyIdAndSupplierCode(
                                request.getCompanyId(),
                                supplierCode
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A supplier with this code already exists for the company"
            );
        }

        Supplier supplier =
                supplierMapper.toEntity(
                        request
                );

        Supplier savedSupplier =
                supplierRepository.save(
                        supplier
                );

        return supplierMapper.toResponse(
                savedSupplier
        );
    }

    /**
     * Update a supplier.
     */
    public SupplierResponse updateSupplier(
            UUID companyId,
            UUID supplierId,
            SupplierCreateRequest request
    ) {

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

        Supplier supplier =
                supplierRepository
                        .findByIdAndCompanyId(
                                supplierId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Supplier not found"
                                        )
                        );

        String supplierCode =
                request.getSupplierCode().trim();

        if (
                supplierRepository
                        .existsByCompanyIdAndSupplierCodeAndIdNot(
                                companyId,
                                supplierCode,
                                supplierId
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A supplier with this code already exists for the company"
            );
        }

        supplierMapper.updateEntity(
                supplier,
                request
        );

        Supplier updatedSupplier =
                supplierRepository.save(
                        supplier
                );

        return supplierMapper.toResponse(
                updatedSupplier
        );
    }

    /**
     * Soft delete / deactivate a supplier.
     */
    public void deactivateSupplier(
            UUID companyId,
            UUID supplierId
    ) {
        Supplier supplier =
                supplierRepository
                        .findByIdAndCompanyId(
                                supplierId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Supplier not found"
                                        )
                        );

        if (!supplier.isActive()) {
            return;
        }

        supplier.setActive(false);

        supplierRepository.save(
                supplier
        );
    }

    /**
     * Activate a supplier.
     */
    public SupplierResponse activateSupplier(
            UUID companyId,
            UUID supplierId
    ) {
        Supplier supplier =
                supplierRepository
                        .findByIdAndCompanyId(
                                supplierId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Supplier not found"
                                        )
                        );

        if (!supplier.isActive()) {
            supplier.setActive(true);

            supplier =
                    supplierRepository.save(
                            supplier
                    );
        }

        return supplierMapper.toResponse(
                supplier
        );
    }
}