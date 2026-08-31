package com.nextware.controller;

import com.nextware.dto.category.CategoryCreateRequest;
import com.nextware.dto.category.CategoryResponse;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.category.CategoryService;
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
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final CompanySecurityService companySecurityService;

    public CategoryController(
            CategoryService categoryService,
            CompanySecurityService companySecurityService
    ) {
        this.categoryService = categoryService;
        this.companySecurityService = companySecurityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CATEGORY_VIEW')")
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @RequestParam UUID companyId
    ) {
        companySecurityService.requireCompany(companyId);

        return ResponseEntity.ok(
                categoryService.getCategories(companyId)
        );
    }

    @GetMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('CATEGORY_VIEW')")
    public ResponseEntity<CategoryResponse> getCategory(
            @RequestParam UUID companyId,
            @PathVariable UUID categoryId
    ) {
        companySecurityService.requireCompany(companyId);

        return ResponseEntity.ok(
                categoryService.getCategory(
                        companyId,
                        categoryId
                )
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CATEGORY_CREATE')")
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid
            @RequestBody
            CategoryCreateRequest request
    ) {
        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        categoryService.createCategory(request)
                );
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('CATEGORY_UPDATE')")
    public ResponseEntity<CategoryResponse> updateCategory(
            @RequestParam UUID companyId,
            @PathVariable UUID categoryId,
            @Valid
            @RequestBody
            CategoryCreateRequest request
    ) {
        companySecurityService.requireCompany(companyId);

        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity.ok(
                categoryService.updateCategory(
                        companyId,
                        categoryId,
                        request
                )
        );
    }

    /**
     * Soft delete / deactivate category.
     */
    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('CATEGORY_DELETE')")
    public ResponseEntity<Void> deactivateCategory(
            @RequestParam UUID companyId,
            @PathVariable UUID categoryId
    ) {
        companySecurityService.requireCompany(companyId);

        categoryService.deactivateCategory(
                companyId,
                categoryId
        );

        return ResponseEntity.noContent().build();
    }
}