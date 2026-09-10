package com.nextware.controller;

import com.nextware.dto.fulfillment.*;
import com.nextware.service.fulfillment.FulfillmentService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fulfillment")
public class FulfillmentController {

    private final FulfillmentService fulfillmentService;

    public FulfillmentController(
            FulfillmentService fulfillmentService
    ) {
        this.fulfillmentService =
                fulfillmentService;
    }

    @GetMapping("/pick-lists")
    @PreAuthorize("hasAuthority('FULFILLMENT_VIEW')")
    public List<FulfillmentResponse> getPickLists(
            @RequestParam UUID companyId
    ) {
        return fulfillmentService.getPickLists(
                companyId
        );
    }

    @PostMapping("/pick-lists")
    @PreAuthorize("hasAuthority('FULFILLMENT_CREATE')")
    public FulfillmentResponse createPickList(
            @Valid @RequestBody PickListCreateRequest request
    ) {
        return fulfillmentService.createPickList(
                request
        );
    }

    @PostMapping("/pick-lists/{pickListId}/assign")
    @PreAuthorize("hasAuthority('FULFILLMENT_PICK')")
    public FulfillmentResponse assignPickList(
            @PathVariable UUID pickListId,
            @RequestParam UUID companyId,
            @RequestParam UUID userId
    ) {
        return fulfillmentService.assignPickList(
                companyId,
                pickListId,
                userId
        );
    }

    @PostMapping("/pick-lists/{pickListId}/start")
    @PreAuthorize("hasAuthority('FULFILLMENT_PICK')")
    public FulfillmentResponse startPicking(
            @PathVariable UUID pickListId,
            @RequestParam UUID companyId
    ) {
        return fulfillmentService.startPicking(
                companyId,
                pickListId
        );
    }

    @PostMapping(
            "/pick-lists/{pickListId}/lines/{lineId}/pick"
    )
    @PreAuthorize("hasAuthority('FULFILLMENT_PICK')")
    public FulfillmentResponse updatePickedQuantity(
            @PathVariable UUID pickListId,
            @PathVariable UUID lineId,
            @RequestParam UUID companyId,
            @Valid @RequestBody PickQuantityRequest request
    ) {
        return fulfillmentService.updatePickedQuantity(
                companyId,
                pickListId,
                lineId,
                request.getPickedQuantity()
        );
    }

    @PostMapping("/pick-lists/{pickListId}/complete")
    @PreAuthorize("hasAuthority('FULFILLMENT_PICK')")
    public FulfillmentResponse completePicking(
            @PathVariable UUID pickListId,
            @RequestParam UUID companyId
    ) {
        return fulfillmentService.completePicking(
                companyId,
                pickListId
        );
    }

    @GetMapping("/packages")
    @PreAuthorize("hasAuthority('FULFILLMENT_VIEW')")
    public List<FulfillmentResponse> getPackages(
            @RequestParam UUID companyId
    ) {
        return fulfillmentService.getPackages(
                companyId
        );
    }

    @PostMapping("/packages")
    @PreAuthorize("hasAuthority('FULFILLMENT_CREATE')")
    public FulfillmentResponse createPackage(
            @Valid @RequestBody PackageCreateRequest request
    ) {
        return fulfillmentService.createPackage(
                request
        );
    }

    @PostMapping("/packages/{packageId}/pack")
    @PreAuthorize("hasAuthority('FULFILLMENT_PACK')")
    public FulfillmentResponse packPackage(
            @PathVariable UUID packageId,
            @RequestParam UUID companyId
    ) {
        return fulfillmentService.packPackage(
                companyId,
                packageId
        );
    }

    @GetMapping("/shipments")
    @PreAuthorize("hasAuthority('FULFILLMENT_VIEW')")
    public List<FulfillmentResponse> getShipments(
            @RequestParam UUID companyId
    ) {
        return fulfillmentService.getShipments(
                companyId
        );
    }

    @PostMapping("/shipments")
    @PreAuthorize("hasAuthority('FULFILLMENT_CREATE')")
    public FulfillmentResponse createShipment(
            @Valid @RequestBody ShipmentCreateRequest request
    ) {
        return fulfillmentService.createShipment(
                request
        );
    }

    @PostMapping("/shipments/{shipmentId}/ship")
    @PreAuthorize("hasAuthority('FULFILLMENT_SHIP')")
    public FulfillmentResponse shipShipment(
            @PathVariable UUID shipmentId,
            @RequestParam UUID companyId
    ) {
        return fulfillmentService.shipShipment(
                companyId,
                shipmentId
        );
    }

    @PostMapping("/shipments/{shipmentId}/in-transit")
    @PreAuthorize("hasAuthority('FULFILLMENT_SHIP')")
    public FulfillmentResponse markInTransit(
            @PathVariable UUID shipmentId,
            @RequestParam UUID companyId
    ) {
        return fulfillmentService.markInTransit(
                companyId,
                shipmentId
        );
    }

    @PostMapping("/shipments/{shipmentId}/deliver")
    @PreAuthorize("hasAuthority('FULFILLMENT_SHIP')")
    public FulfillmentResponse deliverShipment(
            @PathVariable UUID shipmentId,
            @RequestParam UUID companyId
    ) {
        return fulfillmentService.deliverShipment(
                companyId,
                shipmentId
        );
    }

    @PostMapping("/shipments/{shipmentId}/cancel")
    @PreAuthorize("hasAuthority('FULFILLMENT_CREATE')")
    public FulfillmentResponse cancelShipment(
            @PathVariable UUID shipmentId,
            @RequestParam UUID companyId
    ) {
        return fulfillmentService.cancelShipment(
                companyId,
                shipmentId
        );
    }
}