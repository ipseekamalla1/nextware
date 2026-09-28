package com.nextware.controller;

import com.nextware.dto.report.ReportFilterRequest;
import com.nextware.dto.report.ReportResponse;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.report.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAuthority('REPORT_VIEW')")
public class ReportController {

    private final ReportService reportService;
    private final CompanySecurityService companySecurityService;

    public ReportController(
            ReportService reportService,
            CompanySecurityService companySecurityService
    ) {
        this.reportService = reportService;
        this.companySecurityService = companySecurityService;
    }

    @GetMapping("/inventory/balance")
    public ResponseEntity<ReportResponse.InventorySummary>
    inventoryBalance(
            @RequestParam(required = false)
            UUID warehouseId,

            @RequestParam(required = false)
            UUID productId
    ) {
        UUID companyId =
                companySecurityService.getAuthenticatedCompanyId();

        ReportFilterRequest filter = new ReportFilterRequest(
                null,
                null,
                warehouseId,
                productId,
                null,
                null,
                null,
                null
        );

        return ResponseEntity.ok(
                reportService.getInventoryBalance(
                        companyId,
                        filter
                )
        );
    }

    @GetMapping("/inventory/transactions")
    public ResponseEntity<List<ReportResponse.InventoryTransactionRow>>
    inventoryTransactions(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateFrom,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateTo,

            @RequestParam(required = false)
            UUID warehouseId,

            @RequestParam(required = false)
            UUID productId,

            @RequestParam(required = false)
            String transactionType
    ) {
        UUID companyId =
                companySecurityService.getAuthenticatedCompanyId();

        ReportFilterRequest filter = new ReportFilterRequest(
                dateFrom,
                dateTo,
                warehouseId,
                productId,
                null,
                null,
                null,
                transactionType
        );

        return ResponseEntity.ok(
                reportService.getInventoryTransactions(
                        companyId,
                        filter
                )
        );
    }

    @GetMapping("/purchasing")
    public ResponseEntity<ReportResponse.PurchaseOrderSummary>
    purchasing(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateFrom,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateTo,

            @RequestParam(required = false)
            UUID supplierId,

            @RequestParam(required = false)
            String status
    ) {
        UUID companyId =
                companySecurityService.getAuthenticatedCompanyId();

        ReportFilterRequest filter = new ReportFilterRequest(
                dateFrom,
                dateTo,
                null,
                null,
                null,
                supplierId,
                status,
                null
        );

        return ResponseEntity.ok(
                reportService.getPurchasing(
                        companyId,
                        filter
                )
        );
    }

    @GetMapping("/receiving")
    public ResponseEntity<ReportResponse.ReceivingSummary>
    receiving(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateFrom,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateTo,

            @RequestParam(required = false)
            UUID warehouseId,

            @RequestParam(required = false)
            String status
    ) {
        UUID companyId =
                companySecurityService.getAuthenticatedCompanyId();

        ReportFilterRequest filter = new ReportFilterRequest(
                dateFrom,
                dateTo,
                warehouseId,
                null,
                null,
                null,
                status,
                null
        );

        return ResponseEntity.ok(
                reportService.getReceiving(
                        companyId,
                        filter
                )
        );
    }

    @GetMapping("/sales")
    public ResponseEntity<ReportResponse.SalesSummary>
    sales(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateFrom,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateTo,

            @RequestParam(required = false)
            UUID customerId,

            @RequestParam(required = false)
            String status
    ) {
        UUID companyId =
                companySecurityService.getAuthenticatedCompanyId();

        ReportFilterRequest filter = new ReportFilterRequest(
                dateFrom,
                dateTo,
                null,
                null,
                customerId,
                null,
                status,
                null
        );

        return ResponseEntity.ok(
                reportService.getSales(
                        companyId,
                        filter
                )
        );
    }

    @GetMapping("/sales/by-customer")
    public ResponseEntity<List<ReportResponse.SalesCustomerRow>>
    salesByCustomer(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateFrom,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateTo,

            @RequestParam(required = false)
            UUID customerId,

            @RequestParam(required = false)
            String status
    ) {
        UUID companyId =
                companySecurityService.getAuthenticatedCompanyId();

        ReportFilterRequest filter = new ReportFilterRequest(
                dateFrom,
                dateTo,
                null,
                null,
                customerId,
                null,
                status,
                null
        );

        return ResponseEntity.ok(
                reportService.getSalesByCustomer(
                        companyId,
                        filter
                )
        );
    }

    @GetMapping("/fulfillment")
    public ResponseEntity<ReportResponse.FulfillmentSummary>
    fulfillment(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateFrom,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateTo,

            @RequestParam(required = false)
            UUID warehouseId,

            @RequestParam(required = false)
            String status
    ) {
        UUID companyId =
                companySecurityService.getAuthenticatedCompanyId();

        ReportFilterRequest filter = new ReportFilterRequest(
                dateFrom,
                dateTo,
                warehouseId,
                null,
                null,
                null,
                status,
                null
        );

        return ResponseEntity.ok(
                reportService.getFulfillment(
                        companyId,
                        filter
                )
        );
    }
}