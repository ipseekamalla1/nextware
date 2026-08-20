package com.nextware.service.customer;

import com.nextware.dto.customer.CustomerCreateRequest;
import com.nextware.dto.customer.CustomerResponse;
import com.nextware.entity.Customer;
import com.nextware.mapper.CustomerMapper;
import com.nextware.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    private final CustomerMapper customerMapper;

    public CustomerService(
            CustomerRepository customerRepository,
            CustomerMapper customerMapper
    ) {
        this.customerRepository =
                customerRepository;

        this.customerMapper =
                customerMapper;
    }

    /**
     * Get all customers belonging to a company.
     */
    public List<CustomerResponse> getCustomers(
            UUID companyId
    ) {
        return customerRepository
                .findAllByCompanyIdOrderByNameAsc(
                        companyId
                )
                .stream()
                .map(customerMapper::toResponse)
                .toList();
    }

    /**
     * Get one customer belonging to a company.
     */
    public CustomerResponse getCustomer(
            UUID companyId,
            UUID customerId
    ) {
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
     * Create a customer.
     */
    public CustomerResponse createCustomer(
            CustomerCreateRequest request
    ) {
        String customerCode =
                request.getCustomerCode().trim();

        if (
                customerRepository
                        .existsByCompanyIdAndCustomerCode(
                                request.getCompanyId(),
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
     * Update a customer.
     */
    public CustomerResponse updateCustomer(
            UUID companyId,
            UUID customerId,
            CustomerCreateRequest request
    ) {

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
                request.getCustomerCode().trim();

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

        customerRepository.save(customer);
    }

    /**
     * Activate a customer.
     */
    public CustomerResponse activateCustomer(
            UUID companyId,
            UUID customerId
    ) {
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