package com.nextware.controller;

import com.nextware.dto.sales.SalesOrderCreateRequest;
import com.nextware.dto.sales.SalesOrderResponse;
import com.nextware.sales.SalesOrderStatus;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.sales.SalesOrderService;
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
@RequestMapping("/api/sales-orders")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    private final CompanySecurityService companySecurityService;

    public SalesOrderController(
            SalesOrderService salesOrderService,
            CompanySecurityService companySecurityService
    ) {
        this.salesOrderService =
                salesOrderService;

        this.companySecurityService =
                companySecurityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SALES_ORDER_CREATE')")
    public ResponseEntity<List<SalesOrderResponse>>
    getSalesOrders(
            @RequestParam UUID companyId,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) SalesOrderStatus status
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        if (customerId != null) {

            return ResponseEntity.ok(
                    salesOrderService
                            .getSalesOrdersByCustomer(
                                    companyId,
                                    customerId
                            )
            );
        }

        if (status != null) {

            return ResponseEntity.ok(
                    salesOrderService
                            .getSalesOrdersByStatus(
                                    companyId,
                                    status
                            )
            );
        }

        return ResponseEntity.ok(
                salesOrderService
                        .getSalesOrders(
                                companyId
                        )
        );
    }

    @GetMapping("/{salesOrderId}")
    @PreAuthorize("hasAuthority('SALES_ORDER_CREATE')")
    public ResponseEntity<SalesOrderResponse>
    getSalesOrder(
            @RequestParam UUID companyId,
            @PathVariable UUID salesOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                salesOrderService.getSalesOrder(
                        companyId,
                        salesOrderId
                )
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SALES_ORDER_CREATE')")
    public ResponseEntity<SalesOrderResponse>
    createSalesOrder(
            @Valid
            @RequestBody
            SalesOrderCreateRequest request
    ) {

        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        salesOrderService
                                .createSalesOrder(
                                        request
                                )
                );
    }

    @PostMapping("/{salesOrderId}/confirm")
    @PreAuthorize("hasAuthority('SALES_ORDER_APPROVE')")
    public ResponseEntity<SalesOrderResponse>
    confirmSalesOrder(
            @RequestParam UUID companyId,
            @PathVariable UUID salesOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                salesOrderService
                        .confirmSalesOrder(
                                companyId,
                                salesOrderId
                        )
        );
    }

    @PostMapping("/{salesOrderId}/cancel")
    @PreAuthorize("hasAuthority('SALES_ORDER_CREATE')")
    public ResponseEntity<SalesOrderResponse>
    cancelSalesOrder(
            @RequestParam UUID companyId,
            @PathVariable UUID salesOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                salesOrderService
                        .cancelSalesOrder(
                                companyId,
                                salesOrderId
                        )
        );
    }
}