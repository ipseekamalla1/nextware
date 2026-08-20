package com.nextware.service.category;

import com.nextware.dto.category.CategoryCreateRequest;
import com.nextware.dto.category.CategoryResponse;
import com.nextware.entity.Category;
import com.nextware.mapper.CategoryMapper;
import com.nextware.repository.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryService(
            CategoryRepository categoryRepository,
            CategoryMapper categoryMapper
    ) {
        this.categoryRepository =
                categoryRepository;

        this.categoryMapper =
                categoryMapper;
    }

    /**
     * Get all categories belonging to a company.
     */
    public List<CategoryResponse> getCategories(
            UUID companyId
    ) {
        return categoryRepository
                .findAllByCompanyIdOrderByNameAsc(
                        companyId
                )
                .stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    /**
     * Get one category belonging to a company.
     */
    public CategoryResponse getCategory(
            UUID companyId,
            UUID categoryId
    ) {
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

        return categoryMapper.toResponse(
                category
        );
    }

    /**
     * Create a category.
     */
    public CategoryResponse createCategory(
            CategoryCreateRequest request
    ) {
        String name =
                request.getName().trim();

        if (
                categoryRepository
                        .existsByCompanyIdAndName(
                                request.getCompanyId(),
                                name
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A category with this name already exists for the company"
            );
        }

        Category category =
                categoryMapper.toEntity(
                        request
                );

        Category savedCategory =
                categoryRepository.save(
                        category
                );

        return categoryMapper.toResponse(
                savedCategory
        );
    }

    /**
     * Update a category.
     */
    public CategoryResponse updateCategory(
            UUID companyId,
            UUID categoryId,
            CategoryCreateRequest request
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

        String name =
                request.getName().trim();

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
                categoryRepository.save(
                        category
                );

        return categoryMapper.toResponse(
                updatedCategory
        );
    }

    /**
     * Soft delete / deactivate category.
     */
    public void deactivateCategory(
            UUID companyId,
            UUID categoryId
    ) {
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