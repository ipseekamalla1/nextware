package com.nextware.mapper;

import com.nextware.dto.category.CategoryCreateRequest;
import com.nextware.dto.category.CategoryResponse;
import com.nextware.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toEntity(
            CategoryCreateRequest request
    ) {
        Category category = new Category();

        category.setCompanyId(
                request.getCompanyId()
        );

        category.setName(
                request.getName().trim()
        );

        category.setDescription(
                request.getDescription()
        );

        if (request.getActive() != null) {
            category.setActive(
                    request.getActive()
            );
        }

        return category;
    }

    public void updateEntity(
            Category category,
            CategoryCreateRequest request
    ) {
        category.setName(
                request.getName().trim()
        );

        category.setDescription(
                request.getDescription()
        );

        if (request.getActive() != null) {
            category.setActive(
                    request.getActive()
            );
        }
    }

    public CategoryResponse toResponse(
            Category category
    ) {
        CategoryResponse response =
                new CategoryResponse();

        response.setId(
                category.getId()
        );

        response.setCompanyId(
                category.getCompanyId()
        );

        response.setName(
                category.getName()
        );

        response.setDescription(
                category.getDescription()
        );

        response.setActive(
                category.isActive()
        );

        response.setCreatedAt(
                category.getCreatedAt()
        );

        response.setUpdatedAt(
                category.getUpdatedAt()
        );

        return response;
    }
}