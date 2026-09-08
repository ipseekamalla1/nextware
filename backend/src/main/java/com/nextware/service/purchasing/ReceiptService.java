package com.nextware.service.purchasing;

import com.nextware.dto.inventory.InventoryTransactionCreateRequest;
import com.nextware.dto.purchasing.ReceiptCreateRequest;
import com.nextware.dto.purchasing.ReceiptLineRequest;
import com.nextware.dto.purchasing.ReceiptLineResponse;
import com.nextware.dto.purchasing.ReceiptResponse;
import com.nextware.entity.PurchaseOrder;
import com.nextware.entity.PurchaseOrderLine;
import com.nextware.entity.Receipt;
import com.nextware.entity.ReceiptLine;
import com.nextware.entity.Warehouse;
import com.nextware.entity.WarehouseLocation;
import com.nextware.inventory.InventoryTransactionType;
import com.nextware.purchasing.PurchaseOrderStatus;
import com.nextware.purchasing.ReceiptStatus;
import com.nextware.repository.PurchaseOrderLineRepository;
import com.nextware.repository.PurchaseOrderRepository;
import com.nextware.repository.ProductRepository;
import com.nextware.repository.ReceiptLineRepository;
import com.nextware.repository.ReceiptRepository;
import com.nextware.repository.WarehouseLocationRepository;
import com.nextware.repository.WarehouseRepository;
import com.nextware.security.CompanySecurityService;
import com.nextware.service.inventory.InventoryService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ReceiptService {

    private final ReceiptRepository receiptRepository;

    private final ReceiptLineRepository receiptLineRepository;

    private final PurchaseOrderRepository purchaseOrderRepository;

    private final PurchaseOrderLineRepository purchaseOrderLineRepository;

    private final ProductRepository productRepository;

    private final WarehouseRepository warehouseRepository;

    private final WarehouseLocationRepository warehouseLocationRepository;

    private final InventoryService inventoryService;

    private final CompanySecurityService companySecurityService;

    public ReceiptService(
            ReceiptRepository receiptRepository,
            ReceiptLineRepository receiptLineRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseOrderLineRepository purchaseOrderLineRepository,
            ProductRepository productRepository,
            WarehouseRepository warehouseRepository,
            WarehouseLocationRepository warehouseLocationRepository,
            InventoryService inventoryService,
            CompanySecurityService companySecurityService
    ) {
        this.receiptRepository = receiptRepository;
        this.receiptLineRepository = receiptLineRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderLineRepository = purchaseOrderLineRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.warehouseLocationRepository = warehouseLocationRepository;
        this.inventoryService = inventoryService;
        this.companySecurityService = companySecurityService;
    }

    @Transactional
    public ReceiptResponse createReceipt(
            ReceiptCreateRequest request
    ) {
        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        UUID companyId = request.getCompanyId();

        String receiptNumber =
                normalizeRequiredString(
                        request.getReceiptNumber(),
                        "Receipt number is required"
                );

        if (
                receiptRepository.existsByCompanyIdAndReceiptNumber(
                        companyId,
                        receiptNumber
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A receipt with this receipt number already exists"
            );
        }

        PurchaseOrder purchaseOrder =
                requirePurchaseOrder(
                        companyId,
                        request.getPurchaseOrderId()
                );

        if (
                purchaseOrder.getStatus()
                        != PurchaseOrderStatus.APPROVED
                &&
                purchaseOrder.getStatus()
                        != PurchaseOrderStatus.PARTIALLY_RECEIVED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only approved or partially received purchase orders can be received"
            );
        }

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                request.getWarehouseId(),
                                companyId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Warehouse not found"
                                )
                        );

        if (!warehouse.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot create a receipt for an inactive warehouse"
            );
        }

        validateReceiptLines(
                companyId,
                purchaseOrder,
                request.getLines(),
                warehouse.getId()
        );

        Receipt receipt = new Receipt();

        receipt.setCompanyId(
                companyId
        );

        receipt.setPurchaseOrderId(
                purchaseOrder.getId()
        );

        receipt.setWarehouseId(
                warehouse.getId()
        );

        receipt.setReceiptNumber(
                receiptNumber
        );

        receipt.setReceiptDate(
                request.getReceiptDate() == null
                        ? LocalDate.now()
                        : request.getReceiptDate()
        );

        receipt.setStatus(
                ReceiptStatus.OPEN
        );

        receipt.setNotes(
                normalizeOptionalString(
                        request.getNotes()
                )
        );

        Receipt savedReceipt =
                receiptRepository.save(
                        receipt
                );

        Set<UUID> purchaseOrderLineIds =
                new HashSet<>();

        for (
                ReceiptLineRequest lineRequest
                : request.getLines()
        ) {
            if (
                    !purchaseOrderLineIds.add(
                            lineRequest.getPurchaseOrderLineId()
                    )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A purchase order line cannot appear more than once on the same receipt"
                );
            }

            PurchaseOrderLine purchaseOrderLine =
                    requirePurchaseOrderLine(
                            purchaseOrder.getId(),
                            lineRequest.getPurchaseOrderLineId()
                    );

            ReceiptLine line = new ReceiptLine();

            line.setReceiptId(
                    savedReceipt.getId()
            );

            line.setPurchaseOrderLineId(
                    purchaseOrderLine.getId()
            );

            line.setProductId(
                    purchaseOrderLine.getProductId()
            );

            line.setWarehouseLocationId(
                    lineRequest.getWarehouseLocationId()
            );

            line.setReceivedQuantity(
                    lineRequest.getReceivedQuantity()
            );

            line.setUnitCost(
                    lineRequest.getUnitCost()
            );

            receiptLineRepository.save(
                    line
            );
        }

        return getReceipt(
                companyId,
                savedReceipt.getId()
        );
    }

    @Transactional(readOnly = true)
    public List<ReceiptResponse> getReceipts(
            UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        return receiptRepository
                .findAllByCompanyIdOrderByReceiptDateDescCreatedAtDesc(
                        companyId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReceiptResponse getReceipt(
            UUID companyId,
            UUID receiptId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Receipt receipt =
                requireReceipt(
                        companyId,
                        receiptId
                );

        return toResponse(
                receipt
        );
    }

    @Transactional(readOnly = true)
    public List<ReceiptResponse> getReceiptsByPurchaseOrder(
            UUID companyId,
            UUID purchaseOrderId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        requirePurchaseOrder(
                companyId,
                purchaseOrderId
        );

        return receiptRepository
                .findAllByCompanyIdAndPurchaseOrderIdOrderByReceiptDateDescCreatedAtDesc(
                        companyId,
                        purchaseOrderId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReceiptResponse startReceiving(
            UUID companyId,
            UUID receiptId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Receipt receipt =
                requireReceipt(
                        companyId,
                        receiptId
                );

        if (
                receipt.getStatus()
                        != ReceiptStatus.OPEN
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only open receipts can be started"
            );
        }

        if (
                receiptLineRepository.countByReceiptId(
                        receiptId
                ) == 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A receipt must contain at least one line before receiving can start"
            );
        }

        receipt.setStatus(
                ReceiptStatus.RECEIVING
        );

        Receipt savedReceipt =
                receiptRepository.save(
                        receipt
                );

        return toResponse(
                savedReceipt
        );
    }

    @Transactional
    public ReceiptResponse completeReceipt(
            UUID companyId,
            UUID receiptId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Receipt receipt =
                requireReceipt(
                        companyId,
                        receiptId
                );

        if (
                receipt.getStatus()
                        != ReceiptStatus.RECEIVING
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only receipts in receiving status can be completed"
            );
        }

        PurchaseOrder purchaseOrder =
                requirePurchaseOrder(
                        companyId,
                        receipt.getPurchaseOrderId()
                );

        Warehouse warehouse =
                warehouseRepository
                        .findByIdAndCompanyId(
                                receipt.getWarehouseId(),
                                companyId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Receipt warehouse does not belong to the authenticated company"
                                )
                        );

        if (!warehouse.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot complete a receipt into an inactive warehouse"
            );
        }

        List<ReceiptLine> lines =
                receiptLineRepository
                        .findAllByReceiptIdOrderByCreatedAtAsc(
                                receiptId
                        );

        if (lines.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A receipt must contain at least one line before completion"
            );
        }

        validateCompletionLines(
                companyId,
                receipt,
                purchaseOrder,
                lines
        );

        for (ReceiptLine line : lines) {

            InventoryTransactionCreateRequest inventoryRequest =
                    new InventoryTransactionCreateRequest();

            inventoryRequest.setCompanyId(
                    companyId
            );

            inventoryRequest.setProductId(
                    line.getProductId()
            );

            inventoryRequest.setWarehouseLocationId(
                    line.getWarehouseLocationId()
            );

            inventoryRequest.setTransactionType(
                    InventoryTransactionType.RECEIPT
            );

            inventoryRequest.setQuantity(
                    line.getReceivedQuantity()
            );

            inventoryRequest.setReferenceType(
                    "RECEIPT"
            );

            inventoryRequest.setReferenceId(
                    receipt.getId()
            );

            inventoryRequest.setNotes(
                    "Receipt " + receipt.getReceiptNumber()
            );

            inventoryService.createTransaction(
                    inventoryRequest
            );
        }

        receipt.setStatus(
                ReceiptStatus.COMPLETED
        );

        receiptRepository.save(
                receipt
        );

        updatePurchaseOrderReceivingStatus(
                purchaseOrder
        );

        return getReceipt(
                companyId,
                receiptId
        );
    }

    @Transactional
    public ReceiptResponse cancelReceipt(
            UUID companyId,
            UUID receiptId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Receipt receipt =
                requireReceipt(
                        companyId,
                        receiptId
                );

        if (
                receipt.getStatus()
                        == ReceiptStatus.COMPLETED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A completed receipt cannot be cancelled"
            );
        }

        if (
                receipt.getStatus()
                        == ReceiptStatus.CANCELLED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Receipt is already cancelled"
            );
        }

        receipt.setStatus(
                ReceiptStatus.CANCELLED
        );

        Receipt savedReceipt =
                receiptRepository.save(
                        receipt
                );

        return toResponse(
                savedReceipt
        );
    }

    private void validateReceiptLines(
            UUID companyId,
            PurchaseOrder purchaseOrder,
            List<ReceiptLineRequest> lines,
            UUID warehouseId
    ) {
        if (
                lines == null
                || lines.isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one receipt line is required"
            );
        }

        Set<UUID> purchaseOrderLineIds =
                new HashSet<>();

        for (
                ReceiptLineRequest line
                : lines
        ) {
            if (line == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Receipt line cannot be null"
                );
            }

            if (
                    line.getPurchaseOrderLineId()
                            == null
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Purchase order line ID is required"
                );
            }

            if (
                    !purchaseOrderLineIds.add(
                            line.getPurchaseOrderLineId()
                    )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A purchase order line cannot appear more than once on the same receipt"
                );
            }

            PurchaseOrderLine purchaseOrderLine =
                    requirePurchaseOrderLine(
                            purchaseOrder.getId(),
                            line.getPurchaseOrderLineId()
                    );

            if (
                    line.getReceivedQuantity()
                            == null
                    ||
                    line.getReceivedQuantity()
                            .compareTo(BigDecimal.ZERO) <= 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Received quantity must be greater than zero"
                );
            }

            if (
                    line.getUnitCost()
                            == null
                    ||
                    line.getUnitCost()
                            .compareTo(BigDecimal.ZERO) < 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unit cost cannot be negative"
                );
            }

            if (
                    line.getWarehouseLocationId()
                            == null
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Warehouse location ID is required"
                );
            }

            WarehouseLocation location =
                    requireWarehouseLocation(
                            companyId,
                            warehouseId,
                            line.getWarehouseLocationId()
                    );

            if (!location.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Cannot receive inventory into an inactive warehouse location"
                );
            }

            productRepository
                    .findByIdAndCompanyId(
                            purchaseOrderLine.getProductId(),
                            companyId
                    )
                    .orElseThrow(
                            () -> new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Product on purchase order line was not found"
                            )
                    );
        }
    }

    private void validateCompletionLines(
            UUID companyId,
            Receipt receipt,
            PurchaseOrder purchaseOrder,
            List<ReceiptLine> lines
    ) {
        Set<UUID> purchaseOrderLineIds =
                new HashSet<>();

        for (
                ReceiptLine line
                : lines
        ) {
            if (
                    !purchaseOrderLineIds.add(
                            line.getPurchaseOrderLineId()
                    )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A purchase order line cannot appear more than once on a receipt"
                );
            }

            PurchaseOrderLine purchaseOrderLine =
                    requirePurchaseOrderLine(
                            purchaseOrder.getId(),
                            line.getPurchaseOrderLineId()
                    );

            if (
                    !purchaseOrderLine
                            .getProductId()
                            .equals(
                                    line.getProductId()
                            )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Receipt product does not match the purchase order line product"
                );
            }

            WarehouseLocation location =
                    requireWarehouseLocation(
                            companyId,
                            receipt.getWarehouseId(),
                            line.getWarehouseLocationId()
                    );

            if (!location.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Cannot receive inventory into an inactive warehouse location"
                );
            }

            BigDecimal alreadyReceived =
                    receiptLineRepository
                            .sumCompletedReceivedQuantityForPurchaseOrderLine(
                                    purchaseOrderLine.getId()
                            );

            if (alreadyReceived == null) {
                alreadyReceived = BigDecimal.ZERO;
            }

            BigDecimal newTotal =
                    alreadyReceived.add(
                            line.getReceivedQuantity()
                    );

            if (
                    newTotal.compareTo(
                            purchaseOrderLine.getOrderedQuantity()
                    ) > 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Received quantity exceeds ordered quantity for purchase order line "
                                + purchaseOrderLine.getId()
                );
            }
        }
    }

    private void updatePurchaseOrderReceivingStatus(
            PurchaseOrder purchaseOrder
    ) {
        List<PurchaseOrderLine> purchaseOrderLines =
                purchaseOrderLineRepository
                        .findAllByPurchaseOrderIdOrderByCreatedAtAsc(
                                purchaseOrder.getId()
                        );

        boolean fullyReceived = true;
        boolean partiallyReceived = false;

        for (
                PurchaseOrderLine purchaseOrderLine
                : purchaseOrderLines
        ) {
            BigDecimal received =
                    receiptLineRepository
                            .sumCompletedReceivedQuantityForPurchaseOrderLine(
                                    purchaseOrderLine.getId()
                            );

            if (received == null) {
                received = BigDecimal.ZERO;
            }

            if (
                    received.compareTo(
                            BigDecimal.ZERO
                    ) > 0
            ) {
                partiallyReceived = true;
            }

            if (
                    received.compareTo(
                            purchaseOrderLine.getOrderedQuantity()
                    ) < 0
            ) {
                fullyReceived = false;
            }
        }

        if (fullyReceived) {
            purchaseOrder.setStatus(
                    PurchaseOrderStatus.RECEIVED
            );
        } else if (partiallyReceived) {
            purchaseOrder.setStatus(
                    PurchaseOrderStatus.PARTIALLY_RECEIVED
            );
        }

        purchaseOrderRepository.save(
                purchaseOrder
        );
    }

    private PurchaseOrder requirePurchaseOrder(
            UUID companyId,
            UUID purchaseOrderId
    ) {
        return purchaseOrderRepository
                .findByIdAndCompanyId(
                        purchaseOrderId,
                        companyId
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Purchase order not found"
                        )
                );
    }

    private PurchaseOrderLine requirePurchaseOrderLine(
            UUID purchaseOrderId,
            UUID purchaseOrderLineId
    ) {
        PurchaseOrderLine line =
                purchaseOrderLineRepository
                        .findById(
                                purchaseOrderLineId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Purchase order line not found"
                                )
                        );

        if (
                !purchaseOrderId.equals(
                        line.getPurchaseOrderId()
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Purchase order line does not belong to the purchase order"
            );
        }

        return line;
    }

    private WarehouseLocation requireWarehouseLocation(
            UUID companyId,
            UUID warehouseId,
            UUID warehouseLocationId
    ) {
        WarehouseLocation location =
                warehouseLocationRepository
                        .findByIdAndWarehouseId(
                                warehouseLocationId,
                                warehouseId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Warehouse location not found"
                                )
                        );

        warehouseRepository
                .findByIdAndCompanyId(
                        warehouseId,
                        companyId
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Warehouse does not belong to the authenticated company"
                        )
                );

        return location;
    }

    private Receipt requireReceipt(
            UUID companyId,
            UUID receiptId
    ) {
        return receiptRepository
                .findByIdAndCompanyId(
                        receiptId,
                        companyId
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Receipt not found"
                        )
                );
    }

    private ReceiptResponse toResponse(
            Receipt receipt
    ) {
        List<ReceiptLineResponse> lineResponses =
                receiptLineRepository
                        .findAllByReceiptIdOrderByCreatedAtAsc(
                                receipt.getId()
                        )
                        .stream()
                        .map(this::toLineResponse)
                        .toList();

        BigDecimal totalAmount =
                lineResponses
                        .stream()
                        .map(
                                ReceiptLineResponse::getLineTotal
                        )
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        ReceiptResponse response =
                new ReceiptResponse();

        response.setId(
                receipt.getId()
        );

        response.setCompanyId(
                receipt.getCompanyId()
        );

        response.setPurchaseOrderId(
                receipt.getPurchaseOrderId()
        );

        response.setWarehouseId(
                receipt.getWarehouseId()
        );

        response.setReceiptNumber(
                receipt.getReceiptNumber()
        );

        response.setReceiptDate(
                receipt.getReceiptDate()
        );

        response.setStatus(
                receipt.getStatus()
        );

        response.setNotes(
                receipt.getNotes()
        );

        response.setLines(
                lineResponses
        );

        response.setTotalAmount(
                totalAmount
        );

        response.setCreatedAt(
                receipt.getCreatedAt()
        );

        response.setUpdatedAt(
                receipt.getUpdatedAt()
        );

        return response;
    }

    private ReceiptLineResponse toLineResponse(
            ReceiptLine line
    ) {
        ReceiptLineResponse response =
                new ReceiptLineResponse();

        response.setId(
                line.getId()
        );

        response.setPurchaseOrderLineId(
                line.getPurchaseOrderLineId()
        );

        response.setProductId(
                line.getProductId()
        );

        response.setWarehouseLocationId(
                line.getWarehouseLocationId()
        );

        response.setReceivedQuantity(
                line.getReceivedQuantity()
        );

        response.setUnitCost(
                line.getUnitCost()
        );

        response.setLineTotal(
                line.getReceivedQuantity()
                        .multiply(
                                line.getUnitCost()
                        )
        );

        return response;
    }

    private String normalizeRequiredString(
            String value,
            String errorMessage
    ) {
        if (value == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    errorMessage
            );
        }

        String trimmed =
                value.trim();

        if (trimmed.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    errorMessage
            );
        }

        return trimmed;
    }

    private String normalizeOptionalString(
            String value
    ) {
        if (value == null) {
            return null;
        }

        String trimmed =
                value.trim();

        return trimmed.isEmpty()
                ? null
                : trimmed;
    }
}