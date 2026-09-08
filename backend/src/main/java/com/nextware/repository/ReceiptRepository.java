package com.nextware.repository;

import com.nextware.entity.Receipt;
import com.nextware.purchasing.ReceiptStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReceiptRepository
        extends JpaRepository<Receipt, UUID> {

    List<Receipt>
    findAllByCompanyIdOrderByReceiptDateDescCreatedAtDesc(
            UUID companyId
    );

    Optional<Receipt>
    findByIdAndCompanyId(
            UUID id,
            UUID companyId
    );

    boolean existsByCompanyIdAndReceiptNumber(
            UUID companyId,
            String receiptNumber
    );

    List<Receipt>
    findAllByCompanyIdAndPurchaseOrderIdOrderByReceiptDateDescCreatedAtDesc(
            UUID companyId,
            UUID purchaseOrderId
    );

    List<Receipt>
    findAllByCompanyIdAndStatusOrderByReceiptDateDescCreatedAtDesc(
            UUID companyId,
            ReceiptStatus status
    );
}