package com.nextware.controller;

import com.nextware.dto.inventory.InventoryBalanceResponse;
import com.nextware.dto.inventory.InventoryTransactionCreateRequest;
import com.nextware.dto.inventory.InventoryTransactionResponse;
import com.nextware.service.inventory.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(
            InventoryService inventoryService
    ) {
        this.inventoryService =
                inventoryService;
    }

    @PostMapping("/transactions")
    @PreAuthorize("hasAuthority('INVENTORY_ADJUST')")
    public ResponseEntity<InventoryTransactionResponse>
    createTransaction(
            @Valid
            @RequestBody
            InventoryTransactionCreateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        inventoryService.createTransaction(
                                request
                        )
                );
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ResponseEntity<List<InventoryTransactionResponse>>
    getTransactions(
            @RequestParam UUID companyId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID warehouseLocationId
    ) {
        if (
                productId != null
                &&
                warehouseLocationId != null
        ) {
            return ResponseEntity.ok(
                    inventoryService
                            .getProductTransactions(
                                    companyId,
                                    productId
                            )
                            .stream()
                            .filter(
                                    transaction ->
                                            warehouseLocationId.equals(
                                                    transaction
                                                            .getWarehouseLocationId()
                                            )
                            )
                            .toList()
            );
        }

        if (productId != null) {
            return ResponseEntity.ok(
                    inventoryService
                            .getProductTransactions(
                                    companyId,
                                    productId
                            )
            );
        }

        if (warehouseLocationId != null) {
            return ResponseEntity.ok(
                    inventoryService
                            .getLocationTransactions(
                                    companyId,
                                    warehouseLocationId
                            )
            );
        }

        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Either productId or warehouseLocationId is required"
        );
    }

    @GetMapping("/balances")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ResponseEntity<List<InventoryBalanceResponse>>
    getBalances(
            @RequestParam UUID companyId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID warehouseLocationId
    ) {
        if (
                productId != null
                &&
                warehouseLocationId != null
        ) {
            return ResponseEntity.ok(
                    List.of(
                            inventoryService.getBalance(
                                    companyId,
                                    productId,
                                    warehouseLocationId
                            )
                    )
            );
        }

        if (productId != null) {
            return ResponseEntity.ok(
                    inventoryService.getProductBalances(
                            companyId,
                            productId
                    )
            );
        }

        if (warehouseLocationId != null) {
            return ResponseEntity.ok(
                    inventoryService.getLocationBalances(
                            companyId,
                            warehouseLocationId
                    )
            );
        }

        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Either productId or warehouseLocationId is required"
        );
    }
}