package com.nextware.mapper;

import com.nextware.dto.warehouse.WarehouseCreateRequest;
import com.nextware.dto.warehouse.WarehouseResponse;
import com.nextware.entity.Warehouse;
import org.springframework.stereotype.Component;

@Component
public class WarehouseMapper {

    public Warehouse toEntity(
            WarehouseCreateRequest request
    ) {

        Warehouse warehouse = new Warehouse();

        warehouse.setCompanyId(
                request.getCompanyId()
        );

        warehouse.setCode(
                request.getCode()
        );

        warehouse.setName(
                request.getName()
        );

        warehouse.setAddressLine1(
                request.getAddressLine1()
        );

        warehouse.setAddressLine2(
                request.getAddressLine2()
        );

        warehouse.setCity(
                request.getCity()
        );

        warehouse.setState(
                request.getState()
        );

        warehouse.setPostalCode(
                request.getPostalCode()
        );

        warehouse.setCountry(
                request.getCountry()
        );

        if (request.getActive() != null) {
            warehouse.setActive(
                    request.getActive()
            );
        }

        return warehouse;
    }

    public void updateEntity(
            Warehouse warehouse,
            WarehouseCreateRequest request
    ) {

        warehouse.setCode(
                request.getCode()
        );

        warehouse.setName(
                request.getName()
        );

        warehouse.setAddressLine1(
                request.getAddressLine1()
        );

        warehouse.setAddressLine2(
                request.getAddressLine2()
        );

        warehouse.setCity(
                request.getCity()
        );

        warehouse.setState(
                request.getState()
        );

        warehouse.setPostalCode(
                request.getPostalCode()
        );

        warehouse.setCountry(
                request.getCountry()
        );

        if (request.getActive() != null) {
            warehouse.setActive(
                    request.getActive()
            );
        }
    }

    public WarehouseResponse toResponse(
            Warehouse warehouse
    ) {

        WarehouseResponse response =
                new WarehouseResponse();

        response.setId(
                warehouse.getId()
        );

        response.setCompanyId(
                warehouse.getCompanyId()
        );

        response.setCode(
                warehouse.getCode()
        );

        response.setName(
                warehouse.getName()
        );

        response.setAddressLine1(
                warehouse.getAddressLine1()
        );

        response.setAddressLine2(
                warehouse.getAddressLine2()
        );

        response.setCity(
                warehouse.getCity()
        );

        response.setState(
                warehouse.getState()
        );

        response.setPostalCode(
                warehouse.getPostalCode()
        );

        response.setCountry(
                warehouse.getCountry()
        );

        response.setActive(
                warehouse.isActive()
        );

        response.setCreatedAt(
                warehouse.getCreatedAt()
        );

        response.setUpdatedAt(
                warehouse.getUpdatedAt()
        );

        return response;
    }
}