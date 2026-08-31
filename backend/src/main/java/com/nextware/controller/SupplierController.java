package com.nextware.controller;

import com.nextware.dto.supplier.SupplierCreateRequest;
import com.nextware.dto.supplier.SupplierResponse;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.supplier.SupplierService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierService supplierService;
    private final CompanySecurityService companySecurityService;

    public SupplierController(
            SupplierService supplierService,
            CompanySecurityService companySecurityService
    ) {
        this.supplierService = supplierService;
        this.companySecurityService =
                companySecurityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SUPPLIER_VIEW')")
    public ResponseEntity<List<SupplierResponse>>
    getSuppliers(
            @RequestParam UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                supplierService.getSuppliers(
                        companyId
                )
        );
    }

    @GetMapping("/{supplierId}")
    @PreAuthorize("hasAuthority('SUPPLIER_VIEW')")
    public ResponseEntity<SupplierResponse>
    getSupplier(
            @RequestParam UUID companyId,
            @PathVariable UUID supplierId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                supplierService.getSupplier(
                        companyId,
                        supplierId
                )
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SUPPLIER_CREATE')")
    public ResponseEntity<SupplierResponse>
    createSupplier(
            @Valid
            @RequestBody
            SupplierCreateRequest request
    ) {
        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        supplierService.createSupplier(
                                request
                        )
                );
    }

    @PutMapping("/{supplierId}")
    @PreAuthorize("hasAuthority('SUPPLIER_UPDATE')")
    public ResponseEntity<SupplierResponse>
    updateSupplier(
            @RequestParam UUID companyId,
            @PathVariable UUID supplierId,
            @Valid
            @RequestBody
            SupplierCreateRequest request
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity.ok(
                supplierService.updateSupplier(
                        companyId,
                        supplierId,
                        request
                )
        );
    }

    /**
     * Soft delete / deactivate supplier.
     */
    @DeleteMapping("/{supplierId}")
    @PreAuthorize("hasAuthority('SUPPLIER_DELETE')")
    public ResponseEntity<Void>
    deactivateSupplier(
            @RequestParam UUID companyId,
            @PathVariable UUID supplierId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        supplierService.deactivateSupplier(
                companyId,
                supplierId
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    /**
     * Activate supplier.
     */
    @PutMapping("/{supplierId}/activate")
    @PreAuthorize("hasAuthority('SUPPLIER_UPDATE')")
    public ResponseEntity<SupplierResponse>
    activateSupplier(
            @RequestParam UUID companyId,
            @PathVariable UUID supplierId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                supplierService.activateSupplier(
                        companyId,
                        supplierId
                )
        );
    }
}