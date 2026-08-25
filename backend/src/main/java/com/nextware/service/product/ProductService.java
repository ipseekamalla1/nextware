package com.nextware.service.product;

import com.nextware.dto.product.ProductCreateRequest;
import com.nextware.dto.product.ProductResponse;
import com.nextware.entity.Product;
import com.nextware.mapper.ProductMapper;
import com.nextware.repository.ProductRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final CompanySecurityService companySecurityService;

    public ProductService(
            ProductRepository productRepository,
            ProductMapper productMapper,
            CompanySecurityService companySecurityService
    ) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.companySecurityService =
                companySecurityService;
    }

    /**
     * Get all products belonging to the authenticated company.
     */
    public List<ProductResponse> getProducts(
            UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return productRepository
                .findAllByCompanyIdOrderByNameAsc(
                        companyId
                )
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    /**
     * Get one product belonging to the authenticated company.
     */
    public ProductResponse getProduct(
            UUID companyId,
            UUID productId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Product product =
                productRepository
                        .findByIdAndCompanyId(
                                productId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Product not found"
                                        )
                        );

        return productMapper.toResponse(
                product
        );
    }

    /**
     * Create a product.
     */
    public ProductResponse createProduct(
            ProductCreateRequest request
    ) {
        UUID companyId =
                request.getCompanyId();

        companySecurityService.requireCompany(
                companyId
        );

        String sku =
                request.getSku().trim();

        if (
                productRepository
                        .existsByCompanyIdAndSku(
                                companyId,
                                sku
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A product with this SKU already exists for the company"
            );
        }

        Product product =
                productMapper.toEntity(
                        request
                );

        Product savedProduct =
                productRepository.save(
                        product
                );

        return productMapper.toResponse(
                savedProduct
        );
    }

    /**
     * Update a product.
     */
    public ProductResponse updateProduct(
            UUID companyId,
            UUID productId,
            ProductCreateRequest request
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

        Product product =
                productRepository
                        .findByIdAndCompanyId(
                                productId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Product not found"
                                        )
                        );

        String sku =
                request.getSku().trim();

        if (
                productRepository
                        .existsByCompanyIdAndSkuAndIdNot(
                                companyId,
                                sku,
                                productId
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A product with this SKU already exists for the company"
            );
        }

        productMapper.updateEntity(
                product,
                request
        );

        Product updatedProduct =
                productRepository.save(
                        product
                );

        return productMapper.toResponse(
                updatedProduct
        );
    }

    /**
     * Soft delete / deactivate a product.
     */
    public void deactivateProduct(
            UUID companyId,
            UUID productId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Product product =
                productRepository
                        .findByIdAndCompanyId(
                                productId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Product not found"
                                        )
                        );

        if (!product.isActive()) {
            return;
        }

        product.setActive(false);

        productRepository.save(
                product
        );
    }
}