package com.nextware.service.inventory;

import com.nextware.dto.inventory.InventoryBalanceResponse;
import com.nextware.dto.inventory.InventoryTransactionCreateRequest;
import com.nextware.dto.inventory.InventoryTransactionResponse;
import com.nextware.entity.InventoryBalance;
import com.nextware.entity.InventoryTransaction;
import com.nextware.entity.Product;
import com.nextware.entity.Warehouse;
import com.nextware.entity.WarehouseLocation;
import com.nextware.inventory.InventoryTransactionType;
import com.nextware.repository.InventoryBalanceRepository;
import com.nextware.repository.InventoryTransactionRepository;
import com.nextware.repository.ProductRepository;
import com.nextware.repository.WarehouseLocationRepository;
import com.nextware.repository.WarehouseRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryService {

    private final InventoryBalanceRepository inventoryBalanceRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductRepository productRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final WarehouseRepository warehouseRepository;
    private final CompanySecurityService companySecurityService;

    public InventoryService(
            InventoryBalanceRepository inventoryBalanceRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            ProductRepository productRepository,
            WarehouseLocationRepository warehouseLocationRepository,
            WarehouseRepository warehouseRepository,
            CompanySecurityService companySecurityService
    ) {
        this.inventoryBalanceRepository =
                inventoryBalanceRepository;

        this.inventoryTransactionRepository =
                inventoryTransactionRepository;

        this.productRepository =
                productRepository;

        this.warehouseLocationRepository =
                warehouseLocationRepository;

        this.warehouseRepository =
                warehouseRepository;

        this.companySecurityService =
                companySecurityService;
    }

    /**
     * Create an inventory transaction and update the corresponding
     * inventory balance atomically.
     *
     * The inventory transaction is append-only.
     */
    @Transactional
    public InventoryTransactionResponse createTransaction(
            InventoryTransactionCreateRequest request
    ) {
        UUID companyId = request.getCompanyId();

        companySecurityService.requireCompany(
                companyId
        );

        validateRequest(request);

        Product product =
                productRepository
                        .findByIdAndCompanyId(
                                request.getProductId(),
                                companyId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Product not found"
                                )
                        );

        if (!product.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot create inventory transaction for an inactive product"
            );
        }

        WarehouseLocation location =
                warehouseLocationRepository
                        .findById(
                                request.getWarehouseLocationId()
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Warehouse location not found"
                                )
                        );

        if (!location.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot create inventory transaction for an inactive warehouse location"
            );
        }

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                location.getWarehouseId(),
                                companyId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Warehouse location does not belong to the authenticated company"
                                )
                        );

        if (!warehouse.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot create inventory transaction in an inactive warehouse"
            );
        }

        inventoryBalanceRepository.createIfMissing(
                product.getId(),
                location.getId()
        );

        InventoryBalance balance =
                inventoryBalanceRepository
                        .findForUpdate(
                                product.getId(),
                                location.getId()
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.INTERNAL_SERVER_ERROR,
                                        "Unable to initialize inventory balance"
                                )
                        );

        BigDecimal signedQuantity =
                calculateSignedQuantity(
                        request.getTransactionType(),
                        request.getQuantity()
                );

        BigDecimal newQuantity =
                balance.getQuantity()
                        .add(signedQuantity);

        if (newQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Inventory quantity cannot become negative"
            );
        }

        if (
                newQuantity.compareTo(
                        balance.getReservedQuantity()
                ) < 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Inventory quantity cannot be less than reserved quantity"
            );
        }

        balance.setQuantity(
                newQuantity
        );

        inventoryBalanceRepository.save(
                balance
        );

        InventoryTransaction transaction =
                new InventoryTransaction();

        transaction.setProductId(
                product.getId()
        );

        transaction.setWarehouseLocationId(
                location.getId()
        );

        transaction.setTransactionType(
                request.getTransactionType()
        );

        transaction.setQuantity(
                signedQuantity
        );

        transaction.setReferenceType(
                normalizeOptionalString(
                        request.getReferenceType()
                )
        );

        transaction.setReferenceId(
                request.getReferenceId()
        );

        transaction.setNotes(
                normalizeOptionalString(
                        request.getNotes()
                )
        );

        InventoryTransaction savedTransaction =
                inventoryTransactionRepository.save(
                        transaction
                );

        return toTransactionResponse(
                savedTransaction
        );
    }

    /**
     * Get all transactions for a product.
     */
    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> getProductTransactions(
            UUID companyId,
            UUID productId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        requireProduct(
                companyId,
                productId
        );

        return inventoryTransactionRepository
                .findAllByProductIdOrderByCreatedAtDesc(
                        productId
                )
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    /**
     * Get all transactions for a warehouse location.
     */
    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> getLocationTransactions(
            UUID companyId,
            UUID warehouseLocationId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        requireLocation(
                companyId,
                warehouseLocationId
        );

        return inventoryTransactionRepository
                .findAllByWarehouseLocationIdOrderByCreatedAtDesc(
                        warehouseLocationId
                )
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    /**
     * Get one product/location balance.
     */
    @Transactional(readOnly = true)
    public InventoryBalanceResponse getBalance(
            UUID companyId,
            UUID productId,
            UUID warehouseLocationId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        requireProduct(
                companyId,
                productId
        );

        requireLocation(
                companyId,
                warehouseLocationId
        );

        InventoryBalance balance =
                inventoryBalanceRepository
                        .findByProductIdAndWarehouseLocationId(
                                productId,
                                warehouseLocationId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Inventory balance not found"
                                )
                        );

        return toBalanceResponse(
                balance
        );
    }

    /**
     * Get all balances for a product.
     */
    @Transactional(readOnly = true)
    public List<InventoryBalanceResponse> getProductBalances(
            UUID companyId,
            UUID productId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        requireProduct(
                companyId,
                productId
        );

        return inventoryBalanceRepository
                .findAllByProductIdOrderByWarehouseLocationIdAsc(
                        productId
                )
                .stream()
                .map(this::toBalanceResponse)
                .toList();
    }

    /**
     * Get all balances for a warehouse location.
     */
    @Transactional(readOnly = true)
    public List<InventoryBalanceResponse> getLocationBalances(
            UUID companyId,
            UUID warehouseLocationId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        requireLocation(
                companyId,
                warehouseLocationId
        );

        return inventoryBalanceRepository
                .findAllByWarehouseLocationIdOrderByProductIdAsc(
                        warehouseLocationId
                )
                .stream()
                .map(this::toBalanceResponse)
                .toList();
    }

    private void validateRequest(
            InventoryTransactionCreateRequest request
    ) {
        if (request.getProductId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Product ID is required"
            );
        }

        if (request.getWarehouseLocationId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Warehouse location ID is required"
            );
        }

        if (request.getTransactionType() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Transaction type is required"
            );
        }

        if (request.getQuantity() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity is required"
            );
        }

        if (
                request.getQuantity()
                        .compareTo(BigDecimal.ZERO) == 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity cannot be zero"
            );
        }

        if (
                request.getTransactionType()
                        != InventoryTransactionType.ADJUSTMENT
                &&
                request.getTransactionType()
                        != InventoryTransactionType.STOCKTAKE
                &&
                request.getQuantity()
                        .compareTo(BigDecimal.ZERO) < 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity must be positive for this transaction type"
            );
        }
    }

    private BigDecimal calculateSignedQuantity(
            InventoryTransactionType transactionType,
            BigDecimal quantity
    ) {
        switch (transactionType) {

            case RECEIPT:
            case RETURN:
            case TRANSFER_IN:
                return quantity.abs();

            case SHIPMENT:
            case TRANSFER_OUT:
            case DAMAGE:
                return quantity.abs().negate();

            case ADJUSTMENT:
            case STOCKTAKE:
                return quantity;

            default:
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unsupported inventory transaction type"
                );
        }
    }

    private Product requireProduct(
            UUID companyId,
            UUID productId
    ) {
        return productRepository
                .findByIdAndCompanyId(
                        productId,
                        companyId
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Product not found"
                        )
                );
    }

    private WarehouseLocation requireLocation(
            UUID companyId,
            UUID warehouseLocationId
    ) {
        WarehouseLocation location =
                warehouseLocationRepository
                        .findById(
                                warehouseLocationId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Warehouse location not found"
                                )
                        );

        warehouseRepository
                .findByIdAndCompanyId(
                        location.getWarehouseId(),
                        companyId
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Warehouse location does not belong to the authenticated company"
                        )
                );

        return location;
    }

    private InventoryTransactionResponse toTransactionResponse(
            InventoryTransaction transaction
    ) {
        InventoryTransactionResponse response =
                new InventoryTransactionResponse();

        response.setId(
                transaction.getId()
        );

        response.setProductId(
                transaction.getProductId()
        );

        response.setWarehouseLocationId(
                transaction.getWarehouseLocationId()
        );

        response.setTransactionType(
                transaction.getTransactionType()
        );

        response.setQuantity(
                transaction.getQuantity()
        );

        response.setReferenceType(
                transaction.getReferenceType()
        );

        response.setReferenceId(
                transaction.getReferenceId()
        );

        response.setNotes(
                transaction.getNotes()
        );

        response.setCreatedAt(
                transaction.getCreatedAt()
        );

        return response;
    }

    private InventoryBalanceResponse toBalanceResponse(
            InventoryBalance balance
    ) {
        InventoryBalanceResponse response =
                new InventoryBalanceResponse();

        response.setId(
                balance.getId()
        );

        response.setProductId(
                balance.getProductId()
        );

        response.setWarehouseLocationId(
                balance.getWarehouseLocationId()
        );

        response.setQuantity(
                balance.getQuantity()
        );

        response.setReservedQuantity(
                balance.getReservedQuantity()
        );

        response.setAvailableQuantity(
                balance.getQuantity()
                        .subtract(
                                balance.getReservedQuantity()
                        )
        );

        return response;
    }

    private String normalizeOptionalString(
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
}