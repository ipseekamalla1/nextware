package com.nextware.service.fulfillment;


import com.nextware.entity.InventoryBalance;
import com.nextware.entity.InventoryReservation;
import com.nextware.entity.Package;
import com.nextware.entity.PackageLine;
import com.nextware.entity.PickList;
import com.nextware.entity.PickListLine;
import com.nextware.entity.Product;
import com.nextware.entity.SalesOrder;
import com.nextware.entity.SalesOrderLine;
import com.nextware.entity.Shipment;
import com.nextware.dto.fulfillment.*;
import com.nextware.fulfillment.*;
import com.nextware.repository.*;
import com.nextware.security.CompanySecurityService;
import com.nextware.sales.SalesOrderStatus;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class FulfillmentService {

    private final InventoryReservationRepository reservationRepository;
    private final PickListRepository pickListRepository;
    private final PickListLineRepository pickListLineRepository;
    private final PackageRepository packageRepository;
    private final PackageLineRepository packageLineRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentPackageRepository shipmentPackageRepository;

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderLineRepository salesOrderLineRepository;

    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final ProductRepository productRepository;
    private final InventoryBalanceRepository inventoryBalanceRepository;

    private final CompanySecurityService companySecurityService;

    public FulfillmentService(
            InventoryReservationRepository reservationRepository,
            PickListRepository pickListRepository,
            PickListLineRepository pickListLineRepository,
            PackageRepository packageRepository,
            PackageLineRepository packageLineRepository,
            ShipmentRepository shipmentRepository,
            ShipmentPackageRepository shipmentPackageRepository,
            SalesOrderRepository salesOrderRepository,
            SalesOrderLineRepository salesOrderLineRepository,
            WarehouseRepository warehouseRepository,
            WarehouseLocationRepository warehouseLocationRepository,
            ProductRepository productRepository,
            InventoryBalanceRepository inventoryBalanceRepository,
            CompanySecurityService companySecurityService
    ) {
        this.reservationRepository = reservationRepository;
        this.pickListRepository = pickListRepository;
        this.pickListLineRepository = pickListLineRepository;
        this.packageRepository = packageRepository;
        this.packageLineRepository = packageLineRepository;
        this.shipmentRepository = shipmentRepository;
        this.shipmentPackageRepository = shipmentPackageRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.salesOrderLineRepository = salesOrderLineRepository;
        this.warehouseRepository = warehouseRepository;
        this.warehouseLocationRepository = warehouseLocationRepository;
        this.productRepository = productRepository;
        this.inventoryBalanceRepository = inventoryBalanceRepository;
        this.companySecurityService = companySecurityService;
    }

    @Transactional(readOnly = true)
    public List<FulfillmentResponse> getPickLists(
            UUID companyId
    ) {
        companySecurityService.requireCompany(companyId);

        return pickListRepository
                .findAllByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(this::toPickListResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FulfillmentResponse> getPackages(
            UUID companyId
    ) {
        companySecurityService.requireCompany(companyId);

        return packageRepository
                .findAllByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(this::toPackageResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FulfillmentResponse> getShipments(
            UUID companyId
    ) {
        companySecurityService.requireCompany(companyId);

        return shipmentRepository
                .findAllByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(this::toShipmentResponse)
                .toList();
    }

    @Transactional
    public FulfillmentResponse createPickList(
            PickListCreateRequest request
    ) {
        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        UUID companyId = request.getCompanyId();

        SalesOrder salesOrder =
                salesOrderRepository
                        .findByIdAndCompanyId(
                                request.getSalesOrderId(),
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Sales order not found"
                                )
                        );

        if (
                salesOrder.getStatus()
                        != SalesOrderStatus.CONFIRMED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only confirmed sales orders can be picked"
            );
        }

        warehouseRepository
                .findByIdAndCompanyId(
                        request.getWarehouseId(),
                        companyId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Warehouse not found"
                        )
                );

        if (
                pickListRepository
                        .existsBySalesOrderIdAndStatusNot(
                                request.getSalesOrderId(),
                                PickListStatus.CANCELLED
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An active pick list already exists for this sales order"
            );
        }

        String number =
                normalize(
                        request.getPickListNumber()
                );

        if (number == null) {
            number =
                    "PL-"
                            + UUID.randomUUID()
                            .toString()
                            .substring(0, 8)
                            .toUpperCase();
        }

        if (
                pickListRepository
                        .existsByCompanyIdAndPickListNumber(
                                companyId,
                                number
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pick list number already exists"
            );
        }

        List<SalesOrderLine> orderLines =
                salesOrderLineRepository
                        .findAllBySalesOrderIdOrderByCreatedAtAsc(
                                salesOrder.getId()
                        );

        if (orderLines.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Sales order has no lines"
            );
        }

        PickList pickList =
                new PickList();

        pickList.setCompanyId(companyId);
        pickList.setWarehouseId(request.getWarehouseId());
        pickList.setSalesOrderId(salesOrder.getId());
        pickList.setPickListNumber(number);
        pickList.setStatus(PickListStatus.OPEN);

        PickList saved =
                pickListRepository.save(pickList);

        for (SalesOrderLine orderLine : orderLines) {

            UUID productId =
                    orderLine.getProductId();

            Product product =
                    productRepository
                            .findByIdAndCompanyId(
                                    productId,
                                    companyId
                            )
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Product not found"
                                    )
                            );

            if (!product.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Cannot pick inactive product"
                );
            }

            InventoryBalance balance =
                    inventoryBalanceRepository
                            .findAllByProductIdOrderByWarehouseLocationIdAsc(
                                    productId
                            )
                            .stream()
                            .filter(
                                    item ->
                                            item.getWarehouseLocationId()
                                                    != null
                            )
                            .findFirst()
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.CONFLICT,
                                            "No inventory location available for product "
                                                    + productId
                                    )
                            );

            BigDecimal available =
                    balance.getQuantity()
                            .subtract(
                                    balance.getReservedQuantity()
                            );

            if (
                    available.compareTo(
                            orderLine.getOrderedQuantity()
                    ) < 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Insufficient available inventory for product "
                                + productId
                );
            }

            InventoryReservation reservation =
                    new InventoryReservation();

            reservation.setSalesOrderLineId(
                    orderLine.getId()
            );

            reservation.setProductId(
                    productId
            );

            reservation.setWarehouseLocationId(
                    balance.getWarehouseLocationId()
            );

            reservation.setReservedQuantity(
                    orderLine.getOrderedQuantity()
            );

            reservation.setStatus(
                    InventoryReservationStatus.RESERVED
            );

            reservationRepository.save(
                    reservation
            );

            PickListLine line =
                    new PickListLine();

            line.setPickListId(
                    saved.getId()
            );

            line.setSalesOrderLineId(
                    orderLine.getId()
            );

            line.setProductId(
                    productId
            );

            line.setWarehouseLocationId(
                    balance.getWarehouseLocationId()
            );

            line.setRequestedQuantity(
                    orderLine.getOrderedQuantity()
            );

            line.setPickedQuantity(
                    BigDecimal.ZERO
            );

            line.setStatus(
                    PickListLineStatus.OPEN
            );

            pickListLineRepository.save(line);
        }

        return toPickListResponse(saved);
    }

    @Transactional
    public FulfillmentResponse assignPickList(
            UUID companyId,
            UUID pickListId,
            UUID userId
    ) {
        companySecurityService.requireCompany(companyId);

        PickList pickList =
                requirePickList(
                        companyId,
                        pickListId
                );

        if (pickList.getStatus() != PickListStatus.OPEN) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only open pick lists can be assigned"
            );
        }

        pickList.setAssignedToUserId(userId);
        pickList.setStatus(PickListStatus.ASSIGNED);

        return toPickListResponse(
                pickListRepository.save(pickList)
        );
    }

    @Transactional
    public FulfillmentResponse startPicking(
            UUID companyId,
            UUID pickListId
    ) {
        companySecurityService.requireCompany(companyId);

        PickList pickList =
                requirePickList(
                        companyId,
                        pickListId
                );

        if (
                pickList.getStatus() != PickListStatus.ASSIGNED
                &&
                pickList.getStatus() != PickListStatus.OPEN
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pick list cannot be started from its current status"
            );
        }

        pickList.setStatus(
                PickListStatus.PICKING
        );

        return toPickListResponse(
                pickListRepository.save(pickList)
        );
    }

    @Transactional
    public FulfillmentResponse updatePickedQuantity(
            UUID companyId,
            UUID pickListId,
            UUID lineId,
            BigDecimal pickedQuantity
    ) {
        companySecurityService.requireCompany(companyId);

        if (
                pickedQuantity == null
                ||
                pickedQuantity.compareTo(BigDecimal.ZERO) < 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Picked quantity cannot be negative"
            );
        }

        PickList pickList =
                requirePickList(
                        companyId,
                        pickListId
                );

        if (pickList.getStatus() != PickListStatus.PICKING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pick list must be in PICKING status"
            );
        }

        PickListLine line =
                pickListLineRepository
                        .findByIdAndPickListId(
                                lineId,
                                pickListId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pick list line not found"
                                )
                        );

        if (
                pickedQuantity.compareTo(
                        line.getRequestedQuantity()
                ) > 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Picked quantity cannot exceed requested quantity"
            );
        }

        line.setPickedQuantity(
                pickedQuantity
        );

        if (
                pickedQuantity.compareTo(
                        BigDecimal.ZERO
                ) == 0
        ) {
            line.setStatus(
                    PickListLineStatus.OPEN
            );
        } else if (
                pickedQuantity.compareTo(
                        line.getRequestedQuantity()
                ) < 0
        ) {
            line.setStatus(
                    PickListLineStatus.PARTIALLY_PICKED
            );
        } else {
            line.setStatus(
                    PickListLineStatus.PICKED
            );
        }

        pickListLineRepository.save(line);

        return toPickListResponse(pickList);
    }

    @Transactional
    public FulfillmentResponse completePicking(
            UUID companyId,
            UUID pickListId
    ) {
        companySecurityService.requireCompany(companyId);

        PickList pickList =
                requirePickList(
                        companyId,
                        pickListId
                );

        if (pickList.getStatus() != PickListStatus.PICKING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pick list must be in PICKING status"
            );
        }

        List<PickListLine> lines =
                pickListLineRepository
                        .findAllByPickListIdOrderByCreatedAtAsc(
                                pickListId
                        );

        if (lines.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pick list has no lines"
            );
        }

        boolean allPicked =
                lines.stream()
                        .allMatch(
                                line ->
                                        line.getStatus()
                                                == PickListLineStatus.PICKED
                        );

        if (!allPicked) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "All pick lines must be fully picked"
            );
        }

        for (PickListLine line : lines) {

            List<InventoryReservation> reservations =
                    reservationRepository
                            .findAllBySalesOrderLineIdOrderByCreatedAtAsc(
                                    line.getSalesOrderLineId()
                            );

            BigDecimal remaining =
                    line.getPickedQuantity();

            for (
                    InventoryReservation reservation
                    : reservations
            ) {
                if (
                        reservation.getStatus()
                                != InventoryReservationStatus.RESERVED
                ) {
                    continue;
                }

                BigDecimal applied =
                        remaining.min(
                                reservation.getReservedQuantity()
                        );

                if (applied.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                reservation.setStatus(
                        InventoryReservationStatus.FULFILLED
                );

                reservationRepository.save(
                        reservation
                );

                remaining =
                        remaining.subtract(applied);

                if (
                        remaining.compareTo(BigDecimal.ZERO)
                                == 0
                ) {
                    break;
                }
            }
        }

        pickList.setStatus(
                PickListStatus.COMPLETED
        );

        return toPickListResponse(
                pickListRepository.save(pickList)
        );
    }

    @Transactional
    public FulfillmentResponse createPackage(
            PackageCreateRequest request
    ) {
        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        UUID companyId =
                request.getCompanyId();

        SalesOrder salesOrder =
                salesOrderRepository
                        .findByIdAndCompanyId(
                                request.getSalesOrderId(),
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Sales order not found"
                                )
                        );

        if (
                salesOrder.getStatus()
                        == SalesOrderStatus.CANCELLED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot package a cancelled sales order"
            );
        }

        validateDimension(
                request.getWeight(),
                "Weight"
        );

        validateDimension(
                request.getLength(),
                "Length"
        );

        validateDimension(
                request.getWidth(),
                "Width"
        );

        validateDimension(
                request.getHeight(),
                "Height"
        );

        String number =
                normalize(
                        request.getPackageNumber()
                );

        if (number == null) {
            number =
                    "PKG-"
                            + UUID.randomUUID()
                            .toString()
                            .substring(0, 8)
                            .toUpperCase();
        }

        if (
                packageRepository
                        .existsByCompanyIdAndPackageNumber(
                                companyId,
                                number
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Package number already exists"
            );
        }

        Package pkg =
                new Package();

        pkg.setCompanyId(companyId);
        pkg.setSalesOrderId(salesOrder.getId());
        pkg.setPackageNumber(number);
        pkg.setWeight(request.getWeight());
        pkg.setLength(request.getLength());
        pkg.setWidth(request.getWidth());
        pkg.setHeight(request.getHeight());
        pkg.setStatus(PackageStatus.OPEN);

        Package saved =
                packageRepository.save(pkg);

        Set<UUID> uniqueLines =
                new HashSet<>();

        for (
                PackageLineRequest requestLine
                : request.getLines()
        ) {

            if (
                    !uniqueLines.add(
                            requestLine.getSalesOrderLineId()
                    )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A sales order line cannot appear more than once in a package"
                );
            }

            SalesOrderLine orderLine =
                    salesOrderLineRepository
                            .findById(
                                    requestLine.getSalesOrderLineId()
                            )
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Sales order line not found"
                                    )
                            );

            if (
                    !orderLine.getSalesOrderId()
                            .equals(
                                    salesOrder.getId()
                            )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Sales order line does not belong to the sales order"
                );
            }

            BigDecimal alreadyPacked =
                    packageRepository
                            .findAllByCompanyIdAndSalesOrderIdOrderByCreatedAtAsc(
                                    companyId,
                                    salesOrder.getId()
                            )
                            .stream()
                            .flatMap(
                                    existing ->
                                            packageLineRepository
                                                    .findAllByPackageIdOrderByCreatedAtAsc(
                                                            existing.getId()
                                                    )
                                                    .stream()
                            )
                            .filter(
                                    existing ->
                                            existing.getSalesOrderLineId()
                                                    .equals(
                                                            orderLine.getId()
                                                    )
                            )
                            .map(
                                    PackageLine::getQuantity
                            )
                            .reduce(
                                    BigDecimal.ZERO,
                                    BigDecimal::add
                            );

            BigDecimal newTotal =
                    alreadyPacked.add(
                            requestLine.getQuantity()
                    );

            if (
                    newTotal.compareTo(
                            orderLine.getOrderedQuantity()
                    ) > 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Package quantity exceeds ordered quantity"
                );
            }

            PackageLine line =
                    new PackageLine();

            line.setPackageId(saved.getId());
            line.setSalesOrderLineId(orderLine.getId());
            line.setProductId(orderLine.getProductId());
            line.setQuantity(requestLine.getQuantity());

            packageLineRepository.save(line);
        }

        return toPackageResponse(saved);
    }

    @Transactional
    public FulfillmentResponse packPackage(
            UUID companyId,
            UUID packageId
    ) {
        companySecurityService.requireCompany(companyId);

        Package pkg =
                requirePackage(
                        companyId,
                        packageId
                );

        if (pkg.getStatus() != PackageStatus.OPEN) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only open packages can be packed"
            );
        }

        List<PackageLine> lines =
                packageLineRepository
                        .findAllByPackageIdOrderByCreatedAtAsc(
                                packageId
                        );

        if (lines.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Package must contain at least one line"
            );
        }

        pkg.setStatus(
                PackageStatus.PACKED
        );

        return toPackageResponse(
                packageRepository.save(pkg)
        );
    }

    @Transactional
    public FulfillmentResponse createShipment(
            ShipmentCreateRequest request
    ) {
        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        UUID companyId =
                request.getCompanyId();

        SalesOrder salesOrder =
                salesOrderRepository
                        .findByIdAndCompanyId(
                                request.getSalesOrderId(),
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Sales order not found"
                                )
                        );

        String number =
                normalize(
                        request.getShipmentNumber()
                );

        if (number == null) {
            number =
                    "SHP-"
                            + UUID.randomUUID()
                            .toString()
                            .substring(0, 8)
                            .toUpperCase();
        }

        if (
                shipmentRepository
                        .existsByCompanyIdAndShipmentNumber(
                                companyId,
                                number
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Shipment number already exists"
            );
        }

        if (
                request.getPackageIds() == null
                ||
                request.getPackageIds().isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one package is required"
            );
        }

        Shipment shipment =
                new Shipment();

        shipment.setCompanyId(companyId);
        shipment.setSalesOrderId(salesOrder.getId());
        shipment.setShipmentNumber(number);
        shipment.setCarrierName(
                normalize(request.getCarrierName())
        );
        shipment.setTrackingNumber(
                normalize(request.getTrackingNumber())
        );
        shipment.setShippingMethod(
                normalize(request.getShippingMethod())
        );
        shipment.setNotes(
                normalize(request.getNotes())
        );
        shipment.setStatus(
                ShipmentStatus.READY
        );

        Shipment saved =
                shipmentRepository.save(shipment);

        Set<UUID> packageIds =
                new HashSet<>(
                        request.getPackageIds()
                );

        for (UUID packageId : packageIds) {

            Package pkg =
                    requirePackage(
                            companyId,
                            packageId
                    );

            if (
                    !pkg.getSalesOrderId()
                            .equals(
                                    salesOrder.getId()
                            )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Package does not belong to sales order"
                );
            }

            if (
                    pkg.getStatus()
                            != PackageStatus.PACKED
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Only packed packages can be shipped"
                );
            }

            shipmentPackageRepository.addPackage(
                    saved.getId(),
                    pkg.getId()
            );
        }

        return toShipmentResponse(saved);
    }

    @Transactional
    public FulfillmentResponse shipShipment(
            UUID companyId,
            UUID shipmentId
    ) {
        companySecurityService.requireCompany(companyId);

        Shipment shipment =
                requireShipment(
                        companyId,
                        shipmentId
                );

        if (
                shipment.getStatus()
                        != ShipmentStatus.READY
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only READY shipments can be shipped"
            );
        }

        List<UUID> packageIds =
                shipmentPackageRepository
                        .findPackageIdsByShipmentId(
                                shipmentId
                        );

        if (packageIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Shipment must contain at least one package"
            );
        }

        shipment.setStatus(
                ShipmentStatus.SHIPPED
        );

        shipment.setShippedAt(
                OffsetDateTime.now()
        );

        Shipment saved =
                shipmentRepository.save(shipment);

        for (UUID packageId : packageIds) {

            Package pkg =
                    requirePackage(
                            companyId,
                            packageId
                    );

            pkg.setStatus(
                    PackageStatus.SHIPPED
            );

            packageRepository.save(pkg);
        }

        SalesOrder salesOrder =
                salesOrderRepository
                        .findByIdAndCompanyId(
                                shipment.getSalesOrderId(),
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Sales order not found"
                                )
                        );

        salesOrder.setStatus(
                SalesOrderStatus.FULFILLED
        );

        salesOrderRepository.save(salesOrder);

        return toShipmentResponse(saved);
    }

    @Transactional
    public FulfillmentResponse markInTransit(
            UUID companyId,
            UUID shipmentId
    ) {
        companySecurityService.requireCompany(companyId);

        Shipment shipment =
                requireShipment(
                        companyId,
                        shipmentId
                );

        if (
                shipment.getStatus()
                        != ShipmentStatus.SHIPPED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only shipped shipments can be marked in transit"
            );
        }

        shipment.setStatus(
                ShipmentStatus.IN_TRANSIT
        );

        return toShipmentResponse(
                shipmentRepository.save(shipment)
        );
    }

    @Transactional
    public FulfillmentResponse deliverShipment(
            UUID companyId,
            UUID shipmentId
    ) {
        companySecurityService.requireCompany(companyId);

        Shipment shipment =
                requireShipment(
                        companyId,
                        shipmentId
                );

        if (
                shipment.getStatus()
                        != ShipmentStatus.IN_TRANSIT
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only in-transit shipments can be delivered"
            );
        }

        shipment.setStatus(
                ShipmentStatus.DELIVERED
        );

        shipment.setDeliveredAt(
                OffsetDateTime.now()
        );

        return toShipmentResponse(
                shipmentRepository.save(shipment)
        );
    }

    @Transactional
    public FulfillmentResponse cancelShipment(
            UUID companyId,
            UUID shipmentId
    ) {
        companySecurityService.requireCompany(companyId);

        Shipment shipment =
                requireShipment(
                        companyId,
                        shipmentId
                );

        if (
                shipment.getStatus()
                        == ShipmentStatus.DELIVERED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Delivered shipments cannot be cancelled"
            );
        }

        shipment.setStatus(
                ShipmentStatus.CANCELLED
        );

        return toShipmentResponse(
                shipmentRepository.save(shipment)
        );
    }

    private PickList requirePickList(
            UUID companyId,
            UUID id
    ) {
        return pickListRepository
                .findByIdAndCompanyId(id, companyId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Pick list not found"
                        )
                );
    }

    private Package requirePackage(
            UUID companyId,
            UUID id
    ) {
        return packageRepository
                .findByIdAndCompanyId(id, companyId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Package not found"
                        )
                );
    }

    private Shipment requireShipment(
            UUID companyId,
            UUID id
    ) {
        return shipmentRepository
                .findByIdAndCompanyId(id, companyId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Shipment not found"
                        )
                );
    }

    private void validateDimension(
            BigDecimal value,
            String field
    ) {
        if (
                value != null
                &&
                value.compareTo(BigDecimal.ZERO) < 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    field + " cannot be negative"
            );
        }
    }

    private String normalize(
            String value
    ) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty()
                ? null
                : trimmed;
    }

    private FulfillmentResponse toPickListResponse(
            PickList pickList
    ) {
        FulfillmentResponse response =
                new FulfillmentResponse();

        response.setId(pickList.getId());
        response.setType("PICK_LIST");
        response.setCompanyId(pickList.getCompanyId());
        response.setSalesOrderId(pickList.getSalesOrderId());
        response.setWarehouseId(pickList.getWarehouseId());
        response.setNumber(pickList.getPickListNumber());
        response.setStatus(pickList.getStatus().name());
        response.setAssignedToUserId(
                pickList.getAssignedToUserId()
        );
        response.setCreatedAt(
                pickList.getCreatedAt()
        );
        response.setUpdatedAt(
                pickList.getUpdatedAt()
        );

        response.setLines(
                pickListLineRepository
                        .findAllByPickListIdOrderByCreatedAtAsc(
                                pickList.getId()
                        )
                        .stream()
                        .map(this::toPickLineResponse)
                        .toList()
        );

        return response;
    }

    private FulfillmentResponse toPickLineResponse(
            PickListLine line
    ) {
        FulfillmentResponse response =
                new FulfillmentResponse();

        response.setId(line.getId());
        response.setType("PICK_LIST_LINE");
        response.setSalesOrderLineId(
                line.getSalesOrderLineId()
        );
        response.setProductId(
                line.getProductId()
        );
        response.setWarehouseLocationId(
                line.getWarehouseLocationId()
        );
        response.setRequestedQuantity(
                line.getRequestedQuantity()
        );
        response.setPickedQuantity(
                line.getPickedQuantity()
        );
        response.setStatus(
                line.getStatus().name()
        );
        response.setCreatedAt(
                line.getCreatedAt()
        );
        response.setUpdatedAt(
                line.getUpdatedAt()
        );

        return response;
    }

    private FulfillmentResponse toPackageResponse(
            Package pkg
    ) {
        FulfillmentResponse response =
                new FulfillmentResponse();

        response.setId(pkg.getId());
        response.setType("PACKAGE");
        response.setCompanyId(pkg.getCompanyId());
        response.setSalesOrderId(pkg.getSalesOrderId());
        response.setNumber(pkg.getPackageNumber());
        response.setStatus(pkg.getStatus().name());
        response.setCreatedAt(pkg.getCreatedAt());
        response.setUpdatedAt(pkg.getUpdatedAt());

        response.setLines(
                packageLineRepository
                        .findAllByPackageIdOrderByCreatedAtAsc(
                                pkg.getId()
                        )
                        .stream()
                        .map(this::toPackageLineResponse)
                        .toList()
        );

        return response;
    }

    private FulfillmentResponse toPackageLineResponse(
            PackageLine line
    ) {
        FulfillmentResponse response =
                new FulfillmentResponse();

        response.setId(line.getId());
        response.setType("PACKAGE_LINE");
        response.setSalesOrderLineId(
                line.getSalesOrderLineId()
        );
        response.setProductId(
                line.getProductId()
        );
        response.setQuantity(
                line.getQuantity()
        );
        response.setCreatedAt(
                line.getCreatedAt()
        );

        return response;
    }

    private FulfillmentResponse toShipmentResponse(
            Shipment shipment
    ) {
        FulfillmentResponse response =
                new FulfillmentResponse();

        response.setId(shipment.getId());
        response.setType("SHIPMENT");
        response.setCompanyId(shipment.getCompanyId());
        response.setSalesOrderId(shipment.getSalesOrderId());
        response.setNumber(shipment.getShipmentNumber());
        response.setStatus(shipment.getStatus().name());
        response.setCarrierName(shipment.getCarrierName());
        response.setTrackingNumber(
                shipment.getTrackingNumber()
        );
        response.setShippingMethod(
                shipment.getShippingMethod()
        );
        response.setShippedAt(
                shipment.getShippedAt()
        );
        response.setDeliveredAt(
                shipment.getDeliveredAt()
        );
        response.setNotes(shipment.getNotes());
        response.setCreatedAt(shipment.getCreatedAt());
        response.setUpdatedAt(shipment.getUpdatedAt());

        return response;
    }
}