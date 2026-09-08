package com.nextware.repository;

import com.nextware.entity.ReceiptLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ReceiptLineRepository
        extends JpaRepository<ReceiptLine, UUID> {

    List<ReceiptLine>
    findAllByReceiptIdOrderByCreatedAtAsc(
            UUID receiptId
    );

    long countByReceiptId(
            UUID receiptId
    );

    void deleteAllByReceiptId(
            UUID receiptId
    );

    @Query("""
            select coalesce(sum(rl.receivedQuantity), 0)
            from ReceiptLine rl
            join Receipt r
                on r.id = rl.receiptId
            where rl.purchaseOrderLineId = :purchaseOrderLineId
              and r.status = com.nextware.purchasing.ReceiptStatus.COMPLETED
            """)
    BigDecimal sumCompletedReceivedQuantityForPurchaseOrderLine(
            @Param("purchaseOrderLineId")
            UUID purchaseOrderLineId
    );
}