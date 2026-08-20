package com.nextware.controller;

import com.nextware.dto.product.ProductCreateRequest;
import com.nextware.dto.product.ProductResponse;
import com.nextware.service.product.ProductService;
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
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getProducts(
            @RequestParam UUID companyId
    ) {
        return ResponseEntity.ok(
                productService.getProducts(companyId)
        );
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProduct(
            @RequestParam UUID companyId,
            @PathVariable UUID productId
    ) {
        return ResponseEntity.ok(
                productService.getProduct(
                        companyId,
                        productId
                )
        );
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductCreateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        productService.createProduct(
                                request
                        )
                );
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @RequestParam UUID companyId,
            @PathVariable UUID productId,
            @Valid @RequestBody ProductCreateRequest request
    ) {
        return ResponseEntity.ok(
                productService.updateProduct(
                        companyId,
                        productId,
                        request
                )
        );
    }

    /**
     * Soft delete / deactivate product.
     */
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deactivateProduct(
            @RequestParam UUID companyId,
            @PathVariable UUID productId
    ) {
        productService.deactivateProduct(
                companyId,
                productId
        );

        return ResponseEntity.noContent().build();
    }
}