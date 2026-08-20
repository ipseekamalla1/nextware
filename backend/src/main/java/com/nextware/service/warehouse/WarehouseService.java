package com.nextware.service.warehouse;

import com.nextware.dto.warehouse.WarehouseCreateRequest;
import com.nextware.dto.warehouse.WarehouseResponse;

import java.util.List;
import java.util.UUID;

public interface WarehouseService {

    List<WarehouseResponse> getWarehouses(
            UUID companyId
    );

    WarehouseResponse getWarehouse(
            UUID companyId,
            UUID warehouseId
    );

    WarehouseResponse createWarehouse(
            WarehouseCreateRequest request
    );

    WarehouseResponse updateWarehouse(
            UUID companyId,
            UUID warehouseId,
            WarehouseCreateRequest request
    );

    void deactivateWarehouse(
            UUID companyId,
            UUID warehouseId
    );

    WarehouseResponse activateWarehouse(
            UUID companyId,
            UUID warehouseId
    );
}