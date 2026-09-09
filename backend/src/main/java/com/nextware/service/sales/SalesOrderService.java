package com.nextware.service.sales;

import com.nextware.dto.sales.SalesOrderCreateRequest;
import com.nextware.dto.sales.SalesOrderLineRequest;
import com.nextware.dto.sales.SalesOrderLineResponse;
import com.nextware.dto.sales.SalesOrderResponse;
import com.nextware.entity.Customer;
import com.nextware.entity.Product;
import com.nextware.entity.SalesOrder;
import com.nextware.entity.SalesOrderLine;
import com.nextware.repository.CustomerRepository;
import com.nextware.repository.ProductRepository;
import com.nextware.repository.SalesOrderLineRepository;
import com.nextware.repository.SalesOrderRepository;
import com.nextware.sales.SalesOrderStatus;
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
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;

    private final SalesOrderLineRepository salesOrderLineRepository;

    private final CustomerRepository customerRepository;

    private final ProductRepository productRepository;

    private final CompanySecurityService companySecurityService;

    public SalesOrderService(
            SalesOrderRepository salesOrderRepository,
            SalesOrderLineRepository salesOrderLineRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            CompanySecurityService companySecurityService
    ) {
        this.salesOrderRepository =
                salesOrderRepository;

        this.salesOrderLineRepository =
                salesOrderLineRepository;

        this.customerRepository =
                customerRepository;

        this.productRepository =
                productRepository;

        this.companySecurityService =
                companySecurityService;
    }

    @Transactional
    public SalesOrderResponse createSalesOrder(
            SalesOrderCreateRequest request
    ) {

        companySecurityService.requireCompany(
                request.getCompanyId()
        );

        UUID companyId =
                request.getCompanyId();

        String orderNumber =
                normalizeRequiredString(
                        request.getOrderNumber(),
                        "Order number is required"
                );

        if (
                salesOrderRepository
                        .existsByCompanyIdAndOrderNumber(
                                companyId,
                                orderNumber
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A sales order with this order number already exists"
            );
        }

        Customer customer =
                customerRepository
                        .findByIdAndCompanyId(
                                request.getCustomerId(),
                                companyId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Customer not found"
                                )
                        );

        if (!customer.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot create a sales order for an inactive customer"
            );
        }

        validateLines(
                request.getLines()
        );

        SalesOrder salesOrder =
                new SalesOrder();

        salesOrder.setCompanyId(
                companyId
        );

        salesOrder.setCustomerId(
                customer.getId()
        );

        salesOrder.setOrderNumber(
                orderNumber
        );

        salesOrder.setOrderDate(
                request.getOrderDate() == null
                        ? LocalDate.now()
                        : request.getOrderDate()
        );

        salesOrder.setStatus(
                SalesOrderStatus.DRAFT
        );

        salesOrder.setBillingAddressLine1(
                normalizeOptionalString(
                        request.getBillingAddressLine1()
                )
        );

        salesOrder.setBillingAddressLine2(
                normalizeOptionalString(
                        request.getBillingAddressLine2()
                )
        );

        salesOrder.setBillingCity(
                normalizeOptionalString(
                        request.getBillingCity()
                )
        );

        salesOrder.setBillingState(
                normalizeOptionalString(
                        request.getBillingState()
                )
        );

        salesOrder.setBillingPostalCode(
                normalizeOptionalString(
                        request.getBillingPostalCode()
                )
        );

        salesOrder.setBillingCountry(
                normalizeOptionalString(
                        request.getBillingCountry()
                )
        );

        salesOrder.setShippingAddressLine1(
                normalizeOptionalString(
                        request.getShippingAddressLine1()
                )
        );

        salesOrder.setShippingAddressLine2(
                normalizeOptionalString(
                        request.getShippingAddressLine2()
                )
        );

        salesOrder.setShippingCity(
                normalizeOptionalString(
                        request.getShippingCity()
                )
        );

        salesOrder.setShippingState(
                normalizeOptionalString(
                        request.getShippingState()
                )
        );

        salesOrder.setShippingPostalCode(
                normalizeOptionalString(
                        request.getShippingPostalCode()
                )
        );

        salesOrder.setShippingCountry(
                normalizeOptionalString(
                        request.getShippingCountry()
                )
        );

        salesOrder.setNotes(
                normalizeOptionalString(
                        request.getNotes()
                )
        );

        SalesOrder savedSalesOrder =
                salesOrderRepository.save(
                        salesOrder
                );

        Set<UUID> productIds =
                new HashSet<>();

        for (
                SalesOrderLineRequest lineRequest
                : request.getLines()
        ) {

            if (
                    !productIds.add(
                            lineRequest.getProductId()
                    )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A product cannot appear more than once on the same sales order"
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
                        "Cannot add inactive product to a sales order: "
                                + product.getId()
                );
            }

            SalesOrderLine line =
                    new SalesOrderLine();

            line.setSalesOrderId(
                    savedSalesOrder.getId()
            );

            line.setProductId(
                    product.getId()
            );

            line.setOrderedQuantity(
                    lineRequest.getOrderedQuantity()
            );

            line.setUnitPrice(
                    lineRequest.getUnitPrice()
            );

            salesOrderLineRepository.save(
                    line
            );
        }

        return getSalesOrder(
                companyId,
                savedSalesOrder.getId()
        );
    }

    @Transactional(readOnly = true)
    public List<SalesOrderResponse> getSalesOrders(
            UUID companyId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        return salesOrderRepository
                .findAllByCompanyIdOrderByOrderDateDescCreatedAtDesc(
                        companyId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SalesOrderResponse getSalesOrder(
            UUID companyId,
            UUID salesOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        SalesOrder salesOrder =
                requireSalesOrder(
                        companyId,
                        salesOrderId
                );

        return toResponse(
                salesOrder
        );
    }

    @Transactional(readOnly = true)
    public List<SalesOrderResponse> getSalesOrdersByCustomer(
            UUID companyId,
            UUID customerId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        customerRepository
                .findByIdAndCompanyId(
                        customerId,
                        companyId
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Customer not found"
                        )
                );

        return salesOrderRepository
                .findAllByCompanyIdAndCustomerIdOrderByOrderDateDescCreatedAtDesc(
                        companyId,
                        customerId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SalesOrderResponse> getSalesOrdersByStatus(
            UUID companyId,
            SalesOrderStatus status
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

        return salesOrderRepository
                .findAllByCompanyIdAndStatusOrderByOrderDateDescCreatedAtDesc(
                        companyId,
                        status
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SalesOrderResponse confirmSalesOrder(
            UUID companyId,
            UUID salesOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        SalesOrder salesOrder =
                requireSalesOrder(
                        companyId,
                        salesOrderId
                );

        if (
                salesOrder.getStatus()
                        != SalesOrderStatus.DRAFT
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only draft sales orders can be confirmed"
            );
        }

        long lineCount =
                salesOrderLineRepository
                        .countBySalesOrderId(
                                salesOrderId
                        );

        if (lineCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A sales order must contain at least one line before confirmation"
            );
        }

        salesOrder.setStatus(
                SalesOrderStatus.CONFIRMED
        );

        SalesOrder saved =
                salesOrderRepository.save(
                        salesOrder
                );

        return toResponse(
                saved
        );
    }

    @Transactional
    public SalesOrderResponse cancelSalesOrder(
            UUID companyId,
            UUID salesOrderId
    ) {

        companySecurityService.requireCompany(
                companyId
        );

        SalesOrder salesOrder =
                requireSalesOrder(
                        companyId,
                        salesOrderId
                );

        SalesOrderStatus status =
                salesOrder.getStatus();

        if (
                status != SalesOrderStatus.DRAFT
                &&
                status != SalesOrderStatus.CONFIRMED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only draft or confirmed sales orders can be cancelled"
            );
        }

        salesOrder.setStatus(
                SalesOrderStatus.CANCELLED
        );

        SalesOrder saved =
                salesOrderRepository.save(
                        salesOrder
                );

        return toResponse(
                saved
        );
    }

    private SalesOrder requireSalesOrder(
            UUID companyId,
            UUID salesOrderId
    ) {

        return salesOrderRepository
                .findByIdAndCompanyId(
                        salesOrderId,
                        companyId
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Sales order not found"
                        )
                );
    }

    private void validateLines(
            List<SalesOrderLineRequest> lines
    ) {

        if (
                lines == null
                || lines.isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one sales order line is required"
            );
        }

        for (
                SalesOrderLineRequest line
                : lines
        ) {

            if (line == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Sales order line cannot be null"
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
                    line.getUnitPrice() == null
                    ||
                    line.getUnitPrice()
                            .compareTo(BigDecimal.ZERO) < 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unit price cannot be negative"
                );
            }
        }
    }

    private SalesOrderResponse toResponse(
            SalesOrder salesOrder
    ) {

        List<SalesOrderLineResponse> lineResponses =
                salesOrderLineRepository
                        .findAllBySalesOrderIdOrderByCreatedAtAsc(
                                salesOrder.getId()
                        )
                        .stream()
                        .map(this::toLineResponse)
                        .toList();

        BigDecimal totalAmount =
                lineResponses
                        .stream()
                        .map(
                                SalesOrderLineResponse::getLineTotal
                        )
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        SalesOrderResponse response =
                new SalesOrderResponse();

        response.setId(
                salesOrder.getId()
        );

        response.setCompanyId(
                salesOrder.getCompanyId()
        );

        response.setCustomerId(
                salesOrder.getCustomerId()
        );

        response.setOrderNumber(
                salesOrder.getOrderNumber()
        );

        response.setOrderDate(
                salesOrder.getOrderDate()
        );

        response.setStatus(
                salesOrder.getStatus()
        );

        response.setBillingAddressLine1(
                salesOrder.getBillingAddressLine1()
        );

        response.setBillingAddressLine2(
                salesOrder.getBillingAddressLine2()
        );

        response.setBillingCity(
                salesOrder.getBillingCity()
        );

        response.setBillingState(
                salesOrder.getBillingState()
        );

        response.setBillingPostalCode(
                salesOrder.getBillingPostalCode()
        );

        response.setBillingCountry(
                salesOrder.getBillingCountry()
        );

        response.setShippingAddressLine1(
                salesOrder.getShippingAddressLine1()
        );

        response.setShippingAddressLine2(
                salesOrder.getShippingAddressLine2()
        );

        response.setShippingCity(
                salesOrder.getShippingCity()
        );

        response.setShippingState(
                salesOrder.getShippingState()
        );

        response.setShippingPostalCode(
                salesOrder.getShippingPostalCode()
        );

        response.setShippingCountry(
                salesOrder.getShippingCountry()
        );

        response.setNotes(
                salesOrder.getNotes()
        );

        response.setLines(
                lineResponses
        );

        response.setTotalAmount(
                totalAmount
        );

        response.setCreatedAt(
                salesOrder.getCreatedAt()
        );

        response.setUpdatedAt(
                salesOrder.getUpdatedAt()
        );

        return response;
    }

    private SalesOrderLineResponse toLineResponse(
            SalesOrderLine line
    ) {

        BigDecimal lineTotal =
                line.getOrderedQuantity()
                        .multiply(
                                line.getUnitPrice()
                        );

        SalesOrderLineResponse response =
                new SalesOrderLineResponse();

        response.setId(
                line.getId()
        );

        response.setProductId(
                line.getProductId()
        );

        response.setOrderedQuantity(
                line.getOrderedQuantity()
        );

        response.setUnitPrice(
                line.getUnitPrice()
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