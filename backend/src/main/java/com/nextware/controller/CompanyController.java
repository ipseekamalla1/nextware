package com.nextware.controller;

import com.nextware.dto.company.CompanyCreateRequest;
import com.nextware.dto.company.CompanyResponse;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.company.CompanyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;
    private final CompanySecurityService companySecurityService;

    public CompanyController(
            CompanyService companyService,
            CompanySecurityService companySecurityService
    ) {
        this.companyService = companyService;
        this.companySecurityService =
                companySecurityService;
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<CompanyResponse> getCompany(
            @PathVariable UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                companyService.getCompany(
                        companyId
                )
        );
    }

    @PostMapping
    public ResponseEntity<CompanyResponse> createCompany(
            @Valid
            @RequestBody
            CompanyCreateRequest request
    ) {
        /*
         * Company creation is intentionally not permitted
         * through the authenticated company-scoped API.
         *
         * Company onboarding/creation will be handled later
         * as part of productization.
         */
        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Company creation is not permitted through this API"
        );
    }

    @PutMapping("/{companyId}")
    public ResponseEntity<CompanyResponse> updateCompany(
            @PathVariable UUID companyId,
            @Valid
            @RequestBody
            CompanyCreateRequest request
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                companyService.updateCompany(
                        companyId,
                        request
                )
        );
    }

    @DeleteMapping("/{companyId}")
    public ResponseEntity<Void> deactivateCompany(
            @PathVariable UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        companyService.deactivateCompany(
                companyId
        );

        return ResponseEntity.noContent().build();
    }
}