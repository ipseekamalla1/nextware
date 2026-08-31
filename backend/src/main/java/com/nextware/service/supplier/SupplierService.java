package com.nextware.service.supplier;

import com.nextware.dto.supplier.SupplierCreateRequest;
import com.nextware.dto.supplier.SupplierResponse;
import com.nextware.entity.Supplier;
import com.nextware.mapper.SupplierMapper;
import com.nextware.repository.SupplierRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;
    private final CompanySecurityService companySecurityService;

    public SupplierService(
            SupplierRepository supplierRepository,
            SupplierMapper supplierMapper,
            CompanySecurityService companySecurityService
    ) {
        this.supplierRepository = supplierRepository;
        this.supplierMapper = supplierMapper;
        this.companySecurityService =
                companySecurityService;
    }

    /**
     * Get all suppliers belonging to
     * the authenticated company.
     */
    public List<SupplierResponse> getSuppliers(
            UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return supplierRepository
                .findAllByCompanyIdOrderByNameAsc(
                        companyId
                )
                .stream()
                .map(supplierMapper::toResponse)
                .toList();
    }

    /**
     * Get one supplier belonging to
     * the authenticated company.
     */
    public SupplierResponse getSupplier(
            UUID companyId,
            UUID supplierId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

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
     * Create a supplier for the
     * authenticated company.
     */
    public SupplierResponse createSupplier(
            SupplierCreateRequest request
    ) {
        UUID companyId =
                request.getCompanyId();

        companySecurityService.requireCompany(
                companyId
        );

        String supplierCode =
                request.getSupplierCode()
                        .trim();

        if (
                supplierRepository
                        .existsByCompanyIdAndSupplierCode(
                                companyId,
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
     * Update a supplier belonging to
     * the authenticated company.
     */
    public SupplierResponse updateSupplier(
            UUID companyId,
            UUID supplierId,
            SupplierCreateRequest request
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
                request.getSupplierCode()
                        .trim();

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
     * Soft delete / deactivate supplier.
     */
    public void deactivateSupplier(
            UUID companyId,
            UUID supplierId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

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
     * Activate supplier.
     */
    public SupplierResponse activateSupplier(
            UUID companyId,
            UUID supplierId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

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