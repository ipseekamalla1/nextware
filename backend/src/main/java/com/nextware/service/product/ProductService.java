package com.nextware.service.product;

import com.nextware.dto.product.ProductCreateRequest;
import com.nextware.dto.product.ProductResponse;
import com.nextware.entity.Product;
import com.nextware.mapper.ProductMapper;
import com.nextware.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductService(
            ProductRepository productRepository,
            ProductMapper productMapper
    ) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    public List<ProductResponse> getProducts(UUID companyId) {
        return productRepository
                .findAllByCompanyIdOrderByNameAsc(companyId)
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    public ProductResponse getProduct(UUID companyId, UUID productId) {
        Product product = productRepository
                .findByIdAndCompanyId(productId, companyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found"
                ));

        return productMapper.toResponse(product);
    }

    public ProductResponse createProduct(ProductCreateRequest request) {
        String sku = request.getSku().trim();

        if (productRepository.existsByCompanyIdAndSku(
                request.getCompanyId(),
                sku
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A product with this SKU already exists for the company"
            );
        }

        Product product = productMapper.toEntity(request);

        Product savedProduct = productRepository.save(product);

        return productMapper.toResponse(savedProduct);
    }

    public ProductResponse updateProduct(
            UUID companyId,
            UUID productId,
            ProductCreateRequest request
    ) {
        if (!companyId.equals(request.getCompanyId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Company ID cannot be changed"
            );
        }

        Product product = productRepository
                .findByIdAndCompanyId(productId, companyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found"
                ));

        String sku = request.getSku().trim();

        if (productRepository.existsByCompanyIdAndSkuAndIdNot(
                companyId,
                sku,
                productId
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A product with this SKU already exists for the company"
            );
        }

        productMapper.updateEntity(product, request);

        Product updatedProduct = productRepository.save(product);

        return productMapper.toResponse(updatedProduct);
    }

    public void deactivateProduct(UUID companyId, UUID productId) {
        Product product = productRepository
                .findByIdAndCompanyId(productId, companyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found"
                ));

        product.setActive(false);

        productRepository.save(product);
    }
}