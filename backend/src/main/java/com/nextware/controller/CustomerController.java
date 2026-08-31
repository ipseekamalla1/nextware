package com.nextware.controller;

import com.nextware.dto.customer.CustomerCreateRequest;
import com.nextware.dto.customer.CustomerResponse;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.customer.CustomerService;
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
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final CompanySecurityService companySecurityService;

    public CustomerController(
            CustomerService customerService,
            CompanySecurityService companySecurityService
    ) {
        this.customerService = customerService;
        this.companySecurityService =
                companySecurityService;
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> getCustomers(
            @RequestParam UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                customerService.getCustomers(
                        companyId
                )
        );
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<CustomerResponse> getCustomer(
            @RequestParam UUID companyId,
            @PathVariable UUID customerId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                customerService.getCustomer(
                        companyId,
                        customerId
                )
        );
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(
            @Valid
            @RequestBody
            CustomerCreateRequest request
    ) {
        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        customerService.createCustomer(
                                request
                        )
                );
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @RequestParam UUID companyId,
            @PathVariable UUID customerId,
            @Valid
            @RequestBody
            CustomerCreateRequest request
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        return ResponseEntity.ok(
                customerService.updateCustomer(
                        companyId,
                        customerId,
                        request
                )
        );
    }

    /**
     * Soft delete / deactivate customer.
     */
    @DeleteMapping("/{customerId}")
    public ResponseEntity<Void> deactivateCustomer(
            @RequestParam UUID companyId,
            @PathVariable UUID customerId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        customerService.deactivateCustomer(
                companyId,
                customerId
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    /**
     * Activate customer.
     */
    @PutMapping("/{customerId}/activate")
    public ResponseEntity<CustomerResponse> activateCustomer(
            @RequestParam UUID companyId,
            @PathVariable UUID customerId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return ResponseEntity.ok(
                customerService.activateCustomer(
                        companyId,
                        customerId
                )
        );
    }
}