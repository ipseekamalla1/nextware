package com.nextware.controller;

import com.nextware.dto.purchasing.ReceiptCreateRequest;
import com.nextware.dto.purchasing.ReceiptResponse;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.purchasing.ReceiptService;
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
@RequestMapping("/api/receipts")
public class ReceiptController {

    private final ReceiptService receiptService;

    private final CompanySecurityService companySecurityService;

    public ReceiptController(
            ReceiptService receiptService,
            CompanySecurityService companySecurityService
    ) {
        this.receiptService =
                receiptService;

        this.companySecurityService =
                companySecurityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('INVENTORY_ADJUST')")
    public ResponseEntity<List<ReceiptResponse>>
    getReceipts(
            @RequestParam UUID companyId,
            @RequestParam(required = false) UUID purchaseOrderId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        if (purchaseOrderId != null) {
            return ResponseEntity.ok(
                    receiptService
                            .getReceiptsByPurchaseOrder(
                                    companyId,
                                    purchaseOrderId
                            )
            );
        }

        return ResponseEntity.ok(
                receiptService.getReceipts(
                        companyId
                )
        );
    }

    @GetMapping("/{receiptId}")
    @PreAuthorize("hasAuthority('INVENTORY_ADJUST')")
    public ResponseEntity<ReceiptResponse>
    getReceipt(
            @RequestParam UUID companyId,
            @PathVariable UUID receiptId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                receiptService.getReceipt(
                        companyId,
                        receiptId
                )
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('INVENTORY_ADJUST')")
    public ResponseEntity<ReceiptResponse>
    createReceipt(
            @Valid
            @RequestBody
            ReceiptCreateRequest request
    ) {
        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        receiptService.createReceipt(
                                request
                        )
                );
    }

    @PostMapping("/{receiptId}/start")
    @PreAuthorize("hasAuthority('INVENTORY_ADJUST')")
    public ResponseEntity<ReceiptResponse>
    startReceiving(
            @RequestParam UUID companyId,
            @PathVariable UUID receiptId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                receiptService.startReceiving(
                        companyId,
                        receiptId
                )
        );
    }

    @PostMapping("/{receiptId}/complete")
    @PreAuthorize("hasAuthority('INVENTORY_ADJUST')")
    public ResponseEntity<ReceiptResponse>
    completeReceipt(
            @RequestParam UUID companyId,
            @PathVariable UUID receiptId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                receiptService.completeReceipt(
                        companyId,
                        receiptId
                )
        );
    }

    @PostMapping("/{receiptId}/cancel")
    @PreAuthorize("hasAuthority('INVENTORY_ADJUST')")
    public ResponseEntity<ReceiptResponse>
    cancelReceipt(
            @RequestParam UUID companyId,
            @PathVariable UUID receiptId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                receiptService.cancelReceipt(
                        companyId,
                        receiptId
                )
        );
    }
}