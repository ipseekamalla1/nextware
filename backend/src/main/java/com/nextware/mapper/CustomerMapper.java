package com.nextware.mapper;

import com.nextware.dto.customer.CustomerCreateRequest;
import com.nextware.dto.customer.CustomerResponse;
import com.nextware.entity.Customer;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    public Customer toEntity(
            CustomerCreateRequest request
    ) {
        Customer customer = new Customer();

        customer.setCompanyId(
                request.getCompanyId()
        );

        customer.setCustomerCode(
                request.getCustomerCode().trim()
        );

        customer.setName(
                request.getName().trim()
        );

        customer.setEmail(
                request.getEmail()
        );

        customer.setPhone(
                request.getPhone()
        );

        customer.setBillingAddressLine1(
                request.getBillingAddressLine1()
        );

        customer.setBillingAddressLine2(
                request.getBillingAddressLine2()
        );

        customer.setBillingCity(
                request.getBillingCity()
        );

        customer.setBillingState(
                request.getBillingState()
        );

        customer.setBillingPostalCode(
                request.getBillingPostalCode()
        );

        customer.setBillingCountry(
                request.getBillingCountry()
        );

        customer.setShippingAddressLine1(
                request.getShippingAddressLine1()
        );

        customer.setShippingAddressLine2(
                request.getShippingAddressLine2()
        );

        customer.setShippingCity(
                request.getShippingCity()
        );

        customer.setShippingState(
                request.getShippingState()
        );

        customer.setShippingPostalCode(
                request.getShippingPostalCode()
        );

        customer.setShippingCountry(
                request.getShippingCountry()
        );

        if (request.getActive() != null) {
            customer.setActive(
                    request.getActive()
            );
        }

        return customer;
    }

    public void updateEntity(
            Customer customer,
            CustomerCreateRequest request
    ) {
        customer.setCustomerCode(
                request.getCustomerCode().trim()
        );

        customer.setName(
                request.getName().trim()
        );

        customer.setEmail(
                request.getEmail()
        );

        customer.setPhone(
                request.getPhone()
        );

        customer.setBillingAddressLine1(
                request.getBillingAddressLine1()
        );

        customer.setBillingAddressLine2(
                request.getBillingAddressLine2()
        );

        customer.setBillingCity(
                request.getBillingCity()
        );

        customer.setBillingState(
                request.getBillingState()
        );

        customer.setBillingPostalCode(
                request.getBillingPostalCode()
        );

        customer.setBillingCountry(
                request.getBillingCountry()
        );

        customer.setShippingAddressLine1(
                request.getShippingAddressLine1()
        );

        customer.setShippingAddressLine2(
                request.getShippingAddressLine2()
        );

        customer.setShippingCity(
                request.getShippingCity()
        );

        customer.setShippingState(
                request.getShippingState()
        );

        customer.setShippingPostalCode(
                request.getShippingPostalCode()
        );

        customer.setShippingCountry(
                request.getShippingCountry()
        );

        if (request.getActive() != null) {
            customer.setActive(
                    request.getActive()
            );
        }
    }

    public CustomerResponse toResponse(
            Customer customer
    ) {
        CustomerResponse response =
                new CustomerResponse();

        response.setId(
                customer.getId()
        );

        response.setCompanyId(
                customer.getCompanyId()
        );

        response.setCustomerCode(
                customer.getCustomerCode()
        );

        response.setName(
                customer.getName()
        );

        response.setEmail(
                customer.getEmail()
        );

        response.setPhone(
                customer.getPhone()
        );

        response.setBillingAddressLine1(
                customer.getBillingAddressLine1()
        );

        response.setBillingAddressLine2(
                customer.getBillingAddressLine2()
        );

        response.setBillingCity(
                customer.getBillingCity()
        );

        response.setBillingState(
                customer.getBillingState()
        );

        response.setBillingPostalCode(
                customer.getBillingPostalCode()
        );

        response.setBillingCountry(
                customer.getBillingCountry()
        );

        response.setShippingAddressLine1(
                customer.getShippingAddressLine1()
        );

        response.setShippingAddressLine2(
                customer.getShippingAddressLine2()
        );

        response.setShippingCity(
                customer.getShippingCity()
        );

        response.setShippingState(
                customer.getShippingState()
        );

        response.setShippingPostalCode(
                customer.getShippingPostalCode()
        );

        response.setShippingCountry(
                customer.getShippingCountry()
        );

        response.setActive(
                customer.isActive()
        );

        response.setCreatedAt(
                customer.getCreatedAt()
        );

        response.setUpdatedAt(
                customer.getUpdatedAt()
        );

        return response;
    }
}