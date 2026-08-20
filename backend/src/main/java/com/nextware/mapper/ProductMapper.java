package com.nextware.mapper;

import com.nextware.dto.product.ProductCreateRequest;
import com.nextware.dto.product.ProductResponse;
import com.nextware.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public Product toEntity(ProductCreateRequest request) {
        Product product = new Product();

        product.setCompanyId(request.getCompanyId());
        product.setCategoryId(request.getCategoryId());
        product.setUnitOfMeasureId(request.getUnitOfMeasureId());
        product.setSku(request.getSku().trim());
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setBarcode(request.getBarcode());
        product.setCostPrice(request.getCostPrice());
        product.setSellingPrice(request.getSellingPrice());

        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        return product;
    }

    public void updateEntity(Product product, ProductCreateRequest request) {
        product.setCategoryId(request.getCategoryId());
        product.setUnitOfMeasureId(request.getUnitOfMeasureId());
        product.setSku(request.getSku().trim());
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setBarcode(request.getBarcode());
        product.setCostPrice(request.getCostPrice());
        product.setSellingPrice(request.getSellingPrice());

        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }
    }

    public ProductResponse toResponse(Product product) {
        ProductResponse response = new ProductResponse();

        response.setId(product.getId());
        response.setCompanyId(product.getCompanyId());
        response.setCategoryId(product.getCategoryId());
        response.setUnitOfMeasureId(product.getUnitOfMeasureId());
        response.setSku(product.getSku());
        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setBarcode(product.getBarcode());
        response.setCostPrice(product.getCostPrice());
        response.setSellingPrice(product.getSellingPrice());
        response.setActive(product.isActive());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());

        return response;
    }
}