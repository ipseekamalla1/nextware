package com.nextware.controller;

import com.nextware.dto.purchasing.PurchaseOrderCreateRequest;
import com.nextware.dto.purchasing.PurchaseOrderResponse;
import com.nextware.purchasing.PurchaseOrderStatus;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.purchasing.PurchaseOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    private final CompanySecurityService companySecurityService;

    public PurchaseOrderController(
            PurchaseOrderService purchaseOrderService,
            CompanySecurityService companySecurityService
    ) {
        this.purchaseOrderService =
                purchaseOrderService;

        this.companySecurityService =
                companySecurityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PURCHASE_ORDER_CREATE')")
    public ResponseEntity<List<PurchaseOrderResponse>>
    getPurchaseOrders(
            @RequestParam UUID companyId,
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) PurchaseOrderStatus status
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        if (supplierId != null) {

            return ResponseEntity.ok(
                    purchaseOrderService
                            .getPurchaseOrdersBySupplier(
                                    companyId,
                                    supplierId
                            )
            );
        }

        if (status != null) {

            return ResponseEntity.ok(
                    purchaseOrderService
                            .getPurchaseOrdersByStatus(
                                    companyId,
                                    status
                            )
            );
        }

        return ResponseEntity.ok(
                purchaseOrderService
                        .getPurchaseOrders(
                                companyId
                        )
        );
    }

    @GetMapping("/{purchaseOrderId}")
    @PreAuthorize("hasAuthority('PURCHASE_ORDER_CREATE')")
    public ResponseEntity<PurchaseOrderResponse>
    getPurchaseOrder(
            @RequestParam UUID companyId,
            @PathVariable UUID purchaseOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                purchaseOrderService.getPurchaseOrder(
                        companyId,
                        purchaseOrderId
                )
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PURCHASE_ORDER_CREATE')")
    public ResponseEntity<PurchaseOrderResponse>
    createPurchaseOrder(
            @Valid
            @RequestBody
            PurchaseOrderCreateRequest request
    ) {

        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        purchaseOrderService
                                .createPurchaseOrder(
                                        request
                                )
                );
    }

    @PostMapping("/{purchaseOrderId}/submit")
    @PreAuthorize("hasAuthority('PURCHASE_ORDER_CREATE')")
    public ResponseEntity<PurchaseOrderResponse>
    submitPurchaseOrder(
            @RequestParam UUID companyId,
            @PathVariable UUID purchaseOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                purchaseOrderService
                        .submitPurchaseOrder(
                                companyId,
                                purchaseOrderId
                        )
        );
    }

    @PostMapping("/{purchaseOrderId}/approve")
    @PreAuthorize("hasAuthority('PURCHASE_ORDER_APPROVE')")
    public ResponseEntity<PurchaseOrderResponse>
    approvePurchaseOrder(
            @RequestParam UUID companyId,
            @PathVariable UUID purchaseOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                purchaseOrderService
                        .approvePurchaseOrder(
                                companyId,
                                purchaseOrderId
                        )
        );
    }
}