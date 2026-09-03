package com.nextware.service.purchasing;

import com.nextware.dto.purchasing.PurchaseOrderCreateRequest;
import com.nextware.dto.purchasing.PurchaseOrderLineRequest;
import com.nextware.dto.purchasing.PurchaseOrderLineResponse;
import com.nextware.dto.purchasing.PurchaseOrderResponse;
import com.nextware.entity.Product;
import com.nextware.entity.PurchaseOrder;
import com.nextware.entity.PurchaseOrderLine;
import com.nextware.entity.Supplier;
import com.nextware.purchasing.PurchaseOrderStatus;
import com.nextware.repository.ProductRepository;
import com.nextware.repository.PurchaseOrderLineRepository;
import com.nextware.repository.PurchaseOrderRepository;
import com.nextware.repository.SupplierRepository;
import com.nextware.security.CompanySecurityService;
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
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;

    private final PurchaseOrderLineRepository purchaseOrderLineRepository;

    private final SupplierRepository supplierRepository;

    private final ProductRepository productRepository;

    private final CompanySecurityService companySecurityService;

    public PurchaseOrderService(
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseOrderLineRepository purchaseOrderLineRepository,
            SupplierRepository supplierRepository,
            ProductRepository productRepository,
            CompanySecurityService companySecurityService
    ) {
        this.purchaseOrderRepository =
                purchaseOrderRepository;

        this.purchaseOrderLineRepository =
                purchaseOrderLineRepository;

        this.supplierRepository =
                supplierRepository;

        this.productRepository =
                productRepository;

        this.companySecurityService =
                companySecurityService;
    }

    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(
            PurchaseOrderCreateRequest request
    ) {

        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        UUID companyId =
                request.getCompanyId();

        UUID supplierId =
                request.getSupplierId();

        String orderNumber =
                normalizeRequiredString(
                        request.getOrderNumber(),
                        "Order number is required"
                );

        if (
                purchaseOrderRepository
                        .existsByCompanyIdAndOrderNumber(
                                companyId,
                                orderNumber
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A purchase order with this order number already exists"
            );
        }

        Supplier supplier =
                supplierRepository
                        .findByIdAndCompanyId(
                                supplierId,
                                companyId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Supplier not found"
                                )
                        );

        if (!supplier.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot create a purchase order for an inactive supplier"
            );
        }

        validateLines(
                request.getLines()
        );

        PurchaseOrder purchaseOrder =
                new PurchaseOrder();

        purchaseOrder.setCompanyId(
                companyId
        );

        purchaseOrder.setSupplierId(
                supplier.getId()
        );

        purchaseOrder.setOrderNumber(
                orderNumber
        );

        purchaseOrder.setOrderDate(
                request.getOrderDate() == null
                        ? LocalDate.now()
                        : request.getOrderDate()
        );

        purchaseOrder.setStatus(
                PurchaseOrderStatus.DRAFT
        );

        purchaseOrder.setNotes(
                normalizeOptionalString(
                        request.getNotes()
                )
        );

        PurchaseOrder savedPurchaseOrder =
                purchaseOrderRepository.save(
                        purchaseOrder
                );

        Set<UUID> productIds =
                new HashSet<>();

        for (
                PurchaseOrderLineRequest lineRequest
                : request.getLines()
        ) {

            if (
                    !productIds.add(
                            lineRequest.getProductId()
                    )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A product cannot appear more than once on the same purchase order"
                );
            }

            Product product =
                    productRepository
                            .findByIdAndCompanyId(
                                    lineRequest.getProductId(),
                                    companyId
                            )
                            .orElseThrow(
                                    () -> new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Product not found: "
                                                    + lineRequest.getProductId()
                                    )
                            );

            if (!product.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Cannot add inactive product to a purchase order: "
                                + product.getId()
                );
            }

            PurchaseOrderLine line =
                    new PurchaseOrderLine();

            line.setPurchaseOrderId(
                    savedPurchaseOrder.getId()
            );

            line.setProductId(
                    product.getId()
            );

            line.setOrderedQuantity(
                    lineRequest.getOrderedQuantity()
            );

            line.setUnitCost(
                    lineRequest.getUnitCost()
            );

            purchaseOrderLineRepository.save(
                    line
            );
        }

        return getPurchaseOrder(
                companyId,
                savedPurchaseOrder.getId()
        );
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getPurchaseOrders(
            UUID companyId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        return purchaseOrderRepository
                .findAllByCompanyIdOrderByOrderDateDescCreatedAtDesc(
                        companyId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getPurchaseOrder(
            UUID companyId,
            UUID purchaseOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        PurchaseOrder purchaseOrder =
                purchaseOrderRepository
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

        return toResponse(
                purchaseOrder
        );
    }

    @Transactional
    public PurchaseOrderResponse submitPurchaseOrder(
            UUID companyId,
            UUID purchaseOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        PurchaseOrder purchaseOrder =
                requirePurchaseOrder(
                        companyId,
                        purchaseOrderId
                );

        if (
                purchaseOrder.getStatus()
                        != PurchaseOrderStatus.DRAFT
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only draft purchase orders can be submitted"
            );
        }

        long lineCount =
                purchaseOrderLineRepository
                        .countByPurchaseOrderId(
                                purchaseOrderId
                        );

        if (lineCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A purchase order must contain at least one line before submission"
            );
        }

        purchaseOrder.setStatus(
                PurchaseOrderStatus.SUBMITTED
        );

        PurchaseOrder saved =
                purchaseOrderRepository.save(
                        purchaseOrder
                );

        return toResponse(
                saved
        );
    }

    @Transactional
    public PurchaseOrderResponse approvePurchaseOrder(
            UUID companyId,
            UUID purchaseOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        PurchaseOrder purchaseOrder =
                requirePurchaseOrder(
                        companyId,
                        purchaseOrderId
                );

        if (
                purchaseOrder.getStatus()
                        != PurchaseOrderStatus.SUBMITTED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only submitted purchase orders can be approved"
            );
        }

        purchaseOrder.setStatus(
                PurchaseOrderStatus.APPROVED
        );

        PurchaseOrder saved =
                purchaseOrderRepository.save(
                        purchaseOrder
                );

        return toResponse(
                saved
        );
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getPurchaseOrdersBySupplier(
            UUID companyId,
            UUID supplierId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        supplierRepository
                .findByIdAndCompanyId(
                        supplierId,
                        companyId
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Supplier not found"
                        )
                );

        return purchaseOrderRepository
                .findAllByCompanyIdAndSupplierIdOrderByOrderDateDescCreatedAtDesc(
                        companyId,
                        supplierId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getPurchaseOrdersByStatus(
            UUID companyId,
            PurchaseOrderStatus status
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        if (status == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status is required"
            );
        }

        return purchaseOrderRepository
                .findAllByCompanyIdAndStatusOrderByOrderDateDescCreatedAtDesc(
                        companyId,
                        status
                )
                .stream()
                .map(this::toResponse)
                .toList();
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

    private void validateLines(
            List<PurchaseOrderLineRequest> lines
    ) {

        if (
                lines == null
                || lines.isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one purchase order line is required"
            );
        }

        for (
                PurchaseOrderLineRequest line
                : lines
        ) {

            if (line == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Purchase order line cannot be null"
                );
            }

            if (line.getProductId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Product ID is required"
                );
            }

            if (
                    line.getOrderedQuantity() == null
                    ||
                    line.getOrderedQuantity()
                            .compareTo(BigDecimal.ZERO) <= 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Ordered quantity must be greater than zero"
                );
            }

            if (
                    line.getUnitCost() == null
                    ||
                    line.getUnitCost()
                            .compareTo(BigDecimal.ZERO) < 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unit cost cannot be negative"
                );
            }
        }
    }

    private PurchaseOrderResponse toResponse(
            PurchaseOrder purchaseOrder
    ) {

        List<PurchaseOrderLineResponse> lineResponses =
                purchaseOrderLineRepository
                        .findAllByPurchaseOrderIdOrderByCreatedAtAsc(
                                purchaseOrder.getId()
                        )
                        .stream()
                        .map(this::toLineResponse)
                        .toList();

        BigDecimal totalAmount =
                lineResponses
                        .stream()
                        .map(
                                PurchaseOrderLineResponse::getLineTotal
                        )
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        PurchaseOrderResponse response =
                new PurchaseOrderResponse();

        response.setId(
                purchaseOrder.getId()
        );

        response.setCompanyId(
                purchaseOrder.getCompanyId()
        );

        response.setSupplierId(
                purchaseOrder.getSupplierId()
        );

        response.setOrderNumber(
                purchaseOrder.getOrderNumber()
        );

        response.setOrderDate(
                purchaseOrder.getOrderDate()
        );

        response.setStatus(
                purchaseOrder.getStatus()
        );

        response.setNotes(
                purchaseOrder.getNotes()
        );

        response.setLines(
                lineResponses
        );

        response.setTotalAmount(
                totalAmount
        );

        response.setCreatedAt(
                purchaseOrder.getCreatedAt()
        );

        response.setUpdatedAt(
                purchaseOrder.getUpdatedAt()
        );

        return response;
    }

    private PurchaseOrderLineResponse toLineResponse(
            PurchaseOrderLine line
    ) {

        BigDecimal lineTotal =
                line.getOrderedQuantity()
                        .multiply(
                                line.getUnitCost()
                        );

        PurchaseOrderLineResponse response =
                new PurchaseOrderLineResponse();

        response.setId(
                line.getId()
        );

        response.setProductId(
                line.getProductId()
        );

        response.setOrderedQuantity(
                line.getOrderedQuantity()
        );

        response.setUnitCost(
                line.getUnitCost()
        );

        response.setLineTotal(
                lineTotal
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