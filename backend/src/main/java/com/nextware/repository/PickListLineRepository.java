package com.nextware.repository;

import com.nextware.entity.PickListLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PickListLineRepository
        extends JpaRepository<PickListLine, UUID> {

    List<PickListLine>
    findAllByPickListIdOrderByCreatedAtAsc(UUID pickListId);

    Optional<PickListLine>
    findByIdAndPickListId(UUID id, UUID pickListId);
}