package com.nextware.repository;

import com.nextware.entity.PickList;
import com.nextware.fulfillment.PickListStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PickListRepository
        extends JpaRepository<PickList, UUID> {

    List<PickList>
    findAllByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    List<PickList>
    findAllByCompanyIdAndStatusOrderByCreatedAtDesc(
            UUID companyId,
            PickListStatus status
    );

    Optional<PickList>
    findByIdAndCompanyId(UUID id, UUID companyId);

    boolean existsByCompanyIdAndPickListNumber(
            UUID companyId,
            String pickListNumber
    );

    boolean existsBySalesOrderIdAndStatusNot(
            UUID salesOrderId,
            PickListStatus status
    );
}