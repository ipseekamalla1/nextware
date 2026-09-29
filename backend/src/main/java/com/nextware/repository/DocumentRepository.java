package com.nextware.repository;

import com.nextware.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository
        extends JpaRepository<Document, UUID> {

    List<Document> findAllByCompanyIdOrderByCreatedAtDesc(
            UUID companyId
    );

    Optional<Document> findByIdAndCompanyId(
            UUID id,
            UUID companyId
    );
}