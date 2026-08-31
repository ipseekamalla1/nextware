package com.nextware.service.customer;

import com.nextware.dto.customer.CustomerCreateRequest;
import com.nextware.dto.customer.CustomerResponse;
import com.nextware.entity.Customer;
import com.nextware.mapper.CustomerMapper;
import com.nextware.repository.CustomerRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;
    private final CompanySecurityService companySecurityService;

    public CustomerService(
            CustomerRepository customerRepository,
            CustomerMapper customerMapper,
            CompanySecurityService companySecurityService
    ) {
        this.customerRepository =
                customerRepository;

        this.customerMapper =
                customerMapper;

        this.companySecurityService =
                companySecurityService;
    }

    /**
     * Get all customers belonging to
     * the authenticated company.
     */
    public List<CustomerResponse> getCustomers(
            UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return customerRepository
                .findAllByCompanyIdOrderByNameAsc(
                        companyId
                )
                .stream()
                .map(customerMapper::toResponse)
                .toList();
    }

    /**
     * Get one customer belonging to
     * the authenticated company.
     */
    public CustomerResponse getCustomer(
            UUID companyId,
            UUID customerId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Customer customer =
                customerRepository
                        .findByIdAndCompanyId(
                                customerId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Customer not found"
                                        )
                        );

        return customerMapper.toResponse(
                customer
        );
    }

    /**
     * Create a customer for the
     * authenticated company.
     */
    public CustomerResponse createCustomer(
            CustomerCreateRequest request
    ) {
        UUID companyId =
                request.getCompanyId();

        companySecurityService.requireCompany(
                companyId
        );

        String customerCode =
                request.getCustomerCode()
                        .trim();

        if (
                customerRepository
                        .existsByCompanyIdAndCustomerCode(
                                companyId,
                                customerCode
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A customer with this code already exists for the company"
            );
        }

        Customer customer =
                customerMapper.toEntity(
                        request
                );

        Customer savedCustomer =
                customerRepository.save(
                        customer
                );

        return customerMapper.toResponse(
                savedCustomer
        );
    }

    /**
     * Update a customer belonging to
     * the authenticated company.
     */
    public CustomerResponse updateCustomer(
            UUID companyId,
            UUID customerId,
            CustomerCreateRequest request
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

        Customer customer =
                customerRepository
                        .findByIdAndCompanyId(
                                customerId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Customer not found"
                                        )
                        );

        String customerCode =
                request.getCustomerCode()
                        .trim();

        if (
                customerRepository
                        .existsByCompanyIdAndCustomerCodeAndIdNot(
                                companyId,
                                customerCode,
                                customerId
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A customer with this code already exists for the company"
            );
        }

        customerMapper.updateEntity(
                customer,
                request
        );

        Customer updatedCustomer =
                customerRepository.save(
                        customer
                );

        return customerMapper.toResponse(
                updatedCustomer
        );
    }

    /**
     * Soft delete / deactivate a customer.
     */
    public void deactivateCustomer(
            UUID companyId,
            UUID customerId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Customer customer =
                customerRepository
                        .findByIdAndCompanyId(
                                customerId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Customer not found"
                                        )
                        );

        if (!customer.isActive()) {
            return;
        }

        customer.setActive(false);

        customerRepository.save(
                customer
        );
    }

    /**
     * Activate a customer.
     */
    public CustomerResponse activateCustomer(
            UUID companyId,
            UUID customerId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Customer customer =
                customerRepository
                        .findByIdAndCompanyId(
                                customerId,
                                companyId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Customer not found"
                                        )
                        );

        if (!customer.isActive()) {
            customer.setActive(true);

            customer =
                    customerRepository.save(
                            customer
                    );
        }

        return customerMapper.toResponse(
                customer
        );
    }
}