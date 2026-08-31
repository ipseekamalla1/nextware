package com.nextware.service.category;

import com.nextware.dto.category.CategoryCreateRequest;
import com.nextware.dto.category.CategoryResponse;
import com.nextware.entity.Category;
import com.nextware.mapper.CategoryMapper;
import com.nextware.repository.CategoryRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final CompanySecurityService companySecurityService;

    public CategoryService(
            CategoryRepository categoryRepository,
            CategoryMapper categoryMapper,
            CompanySecurityService companySecurityService
    ) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
        this.companySecurityService = companySecurityService;
    }

    /**
     * Get all categories belonging to
     * the authenticated company.
     */
    public List<CategoryResponse> getCategories(
            UUID companyId
    ) {
        companySecurityService.requireCompany(companyId);

        return categoryRepository
                .findAllByCompanyIdOrderByNameAsc(companyId)
                .stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    /**
     * Get one category belonging to
     * the authenticated company.
     */
    public CategoryResponse getCategory(
            UUID companyId,
            UUID categoryId
    ) {
        companySecurityService.requireCompany(companyId);

        Category category =
                categoryRepository
                        .findByIdAndCompanyId(
                                categoryId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Category not found"
                                        )
                        );

        return categoryMapper.toResponse(category);
    }

    /**
     * Create a category for the
     * authenticated company.
     */
    public CategoryResponse createCategory(
            CategoryCreateRequest request
    ) {
        UUID companyId = request.getCompanyId();

        companySecurityService.requireCompany(companyId);

        String name = request.getName().trim();

        if (
                categoryRepository.existsByCompanyIdAndName(
                        companyId,
                        name
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A category with this name already exists for the company"
            );
        }

        Category category =
                categoryMapper.toEntity(request);

        Category savedCategory =
                categoryRepository.save(category);

        return categoryMapper.toResponse(savedCategory);
    }

    /**
     * Update a category belonging to
     * the authenticated company.
     */
    public CategoryResponse updateCategory(
            UUID companyId,
            UUID categoryId,
            CategoryCreateRequest request
    ) {
        companySecurityService.requireCompany(companyId);

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

        Category category =
                categoryRepository
                        .findByIdAndCompanyId(
                                categoryId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Category not found"
                                        )
                        );

        String name = request.getName().trim();

        if (
                categoryRepository
                        .existsByCompanyIdAndNameAndIdNot(
                                companyId,
                                name,
                                categoryId
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A category with this name already exists for the company"
            );
        }

        categoryMapper.updateEntity(
                category,
                request
        );

        Category updatedCategory =
                categoryRepository.save(category);

        return categoryMapper.toResponse(updatedCategory);
    }

    /**
     * Soft delete / deactivate category.
     */
    public void deactivateCategory(
            UUID companyId,
            UUID categoryId
    ) {
        companySecurityService.requireCompany(companyId);

        Category category =
                categoryRepository
                        .findByIdAndCompanyId(
                                categoryId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Category not found"
                                        )
                        );

        if (!category.isActive()) {
            return;
        }

        category.setActive(false);

        categoryRepository.save(category);
    }
}