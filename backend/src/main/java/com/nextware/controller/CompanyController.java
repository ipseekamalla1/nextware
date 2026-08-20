package com.nextware.controller;

import com.nextware.dto.company.CompanyCreateRequest;
import com.nextware.dto.company.CompanyResponse;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping
    public ResponseEntity<List<CompanyResponse>> getCompanies() {
        return ResponseEntity.ok(
                companyService.getCompanies()
        );
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<CompanyResponse> getCompany(
            @PathVariable UUID companyId
    ) {
        return ResponseEntity.ok(
                companyService.getCompany(companyId)
        );
    }

    @PostMapping
    public ResponseEntity<CompanyResponse> createCompany(
            @Valid @RequestBody CompanyCreateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(companyService.createCompany(request));
    }

    @PutMapping("/{companyId}")
    public ResponseEntity<CompanyResponse> updateCompany(
            @PathVariable UUID companyId,
            @Valid @RequestBody CompanyCreateRequest request
    ) {
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
        companyService.deactivateCompany(companyId);

        return ResponseEntity.noContent().build();
    }
}