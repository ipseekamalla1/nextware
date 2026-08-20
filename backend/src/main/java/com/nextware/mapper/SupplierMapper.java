package com.nextware.mapper;

import com.nextware.dto.supplier.SupplierCreateRequest;
import com.nextware.dto.supplier.SupplierResponse;
import com.nextware.entity.Supplier;
import org.springframework.stereotype.Component;

@Component
public class SupplierMapper {

    public Supplier toEntity(
            SupplierCreateRequest request
    ) {
        Supplier supplier = new Supplier();

        supplier.setCompanyId(
                request.getCompanyId()
        );

        supplier.setSupplierCode(
                request.getSupplierCode().trim()
        );

        supplier.setName(
                request.getName().trim()
        );

        supplier.setEmail(
                request.getEmail()
        );

        supplier.setPhone(
                request.getPhone()
        );

        supplier.setAddressLine1(
                request.getAddressLine1()
        );

        supplier.setAddressLine2(
                request.getAddressLine2()
        );

        supplier.setCity(
                request.getCity()
        );

        supplier.setState(
                request.getState()
        );

        supplier.setPostalCode(
                request.getPostalCode()
        );

        supplier.setCountry(
                request.getCountry()
        );

        if (request.getActive() != null) {
            supplier.setActive(
                    request.getActive()
            );
        }

        return supplier;
    }

    public void updateEntity(
            Supplier supplier,
            SupplierCreateRequest request
    ) {
        supplier.setSupplierCode(
                request.getSupplierCode().trim()
        );

        supplier.setName(
                request.getName().trim()
        );

        supplier.setEmail(
                request.getEmail()
        );

        supplier.setPhone(
                request.getPhone()
        );

        supplier.setAddressLine1(
                request.getAddressLine1()
        );

        supplier.setAddressLine2(
                request.getAddressLine2()
        );

        supplier.setCity(
                request.getCity()
        );

        supplier.setState(
                request.getState()
        );

        supplier.setPostalCode(
                request.getPostalCode()
        );

        supplier.setCountry(
                request.getCountry()
        );

        if (request.getActive() != null) {
            supplier.setActive(
                    request.getActive()
            );
        }
    }

    public SupplierResponse toResponse(
            Supplier supplier
    ) {
        SupplierResponse response =
                new SupplierResponse();

        response.setId(
                supplier.getId()
        );

        response.setCompanyId(
                supplier.getCompanyId()
        );

        response.setSupplierCode(
                supplier.getSupplierCode()
        );

        response.setName(
                supplier.getName()
        );

        response.setEmail(
                supplier.getEmail()
        );

        response.setPhone(
                supplier.getPhone()
        );

        response.setAddressLine1(
                supplier.getAddressLine1()
        );

        response.setAddressLine2(
                supplier.getAddressLine2()
        );

        response.setCity(
                supplier.getCity()
        );

        response.setState(
                supplier.getState()
        );

        response.setPostalCode(
                supplier.getPostalCode()
        );

        response.setCountry(
                supplier.getCountry()
        );

        response.setActive(
                supplier.isActive()
        );

        response.setCreatedAt(
                supplier.getCreatedAt()
        );

        response.setUpdatedAt(
                supplier.getUpdatedAt()
        );

        return response;
    }
}