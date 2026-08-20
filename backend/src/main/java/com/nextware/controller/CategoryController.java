package com.nextware.controller;

import com.nextware.dto.category.CategoryCreateRequest;
import com.nextware.dto.category.CategoryResponse;
import com.nextware.service.category.CategoryService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(
            CategoryService categoryService
    ) {
        this.categoryService =
                categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>>
    getCategories(
            @RequestParam UUID companyId
    ) {
        return ResponseEntity.ok(
                categoryService.getCategories(
                        companyId
                )
        );
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse>
    getCategory(
            @RequestParam UUID companyId,
            @PathVariable UUID categoryId
    ) {
        return ResponseEntity.ok(
                categoryService.getCategory(
                        companyId,
                        categoryId
                )
        );
    }

    @PostMapping
    public ResponseEntity<CategoryResponse>
    createCategory(
            @Valid
            @RequestBody
            CategoryCreateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        categoryService.createCategory(
                                request
                        )
                );
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse>
    updateCategory(
            @RequestParam UUID companyId,
            @PathVariable UUID categoryId,
            @Valid
            @RequestBody
            CategoryCreateRequest request
    ) {
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
    public ResponseEntity<Void>
    deactivateCategory(
            @RequestParam UUID companyId,
            @PathVariable UUID categoryId
    ) {
        categoryService.deactivateCategory(
                companyId,
                categoryId
        );

        return ResponseEntity.noContent().build();
    }
}