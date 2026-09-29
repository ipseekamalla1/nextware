package com.nextware.service.document;

import com.nextware.dto.document.DocumentResponse;
import com.nextware.entity.Document;
import com.nextware.repository.DocumentRepository;
import com.nextware.security.AuthenticatedUser;
import com.nextware.security.CompanySecurityService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentStorageService storageService;
    private final CompanySecurityService companySecurityService;

    public DocumentService(
            DocumentRepository documentRepository,
            DocumentStorageService storageService,
            CompanySecurityService companySecurityService
    ) {
        this.documentRepository = documentRepository;
        this.storageService = storageService;
        this.companySecurityService =
                companySecurityService;
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocuments() {

        UUID companyId =
                companySecurityService
                        .getAuthenticatedCompanyId();

        return documentRepository
                .findAllByCompanyIdOrderByCreatedAtDesc(
                        companyId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DocumentResponse upload(
            MultipartFile file,
            String documentType,
            String description
    ) {

        UUID companyId =
                companySecurityService
                        .getAuthenticatedCompanyId();

        String normalizedType =
                normalizeRequired(
                        documentType,
                        "Document type is required"
                );

        if (normalizedType.length() > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Document type must not exceed 100 characters"
            );
        }

        String normalizedDescription =
                normalizeOptional(description);

        if (
                normalizedDescription != null &&
                normalizedDescription.length() > 1000
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Document description must not exceed 1000 characters"
            );
        }

        DocumentStorageService.StoredDocument stored =
                storageService.store(file);

        Document document =
                new Document();

        document.setCompanyId(companyId);

        document.setFileName(
                stored.fileName()
        );

        document.setContentType(
                stored.contentType()
        );

        document.setFileSize(
                stored.fileSize()
        );

        document.setStorageKey(
                stored.storageKey()
        );

        document.setDocumentType(
                normalizedType.toUpperCase()
        );

        document.setDescription(
                normalizedDescription
        );

        document.setUploadedBy(
                AuthenticatedUser.getUserId()
        );

        try {

            return toResponse(
                    documentRepository.save(document)
            );

        } catch (RuntimeException exception) {

            storageService.delete(
                    stored.storageKey()
            );

            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public DownloadedDocument download(
            UUID documentId
    ) {

        UUID companyId =
                companySecurityService
                        .getAuthenticatedCompanyId();

        Document document =
                requireDocument(
                        companyId,
                        documentId
                );

        Path path =
                storageService.resolve(
                        document.getStorageKey()
                );

        if (!Files.isRegularFile(path)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document file is no longer available"
            );
        }

        Resource resource =
                new FileSystemResource(path);

        return new DownloadedDocument(
                document,
                resource
        );
    }

    @Transactional
    public void delete(
            UUID documentId
    ) {

        UUID companyId =
                companySecurityService
                        .getAuthenticatedCompanyId();

        Document document =
                requireDocument(
                        companyId,
                        documentId
                );

        storageService.delete(
                document.getStorageKey()
        );

        documentRepository.delete(document);
    }

    private Document requireDocument(
            UUID companyId,
            UUID documentId
    ) {

        if (documentId == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Document ID is required"
            );
        }

        return documentRepository
                .findByIdAndCompanyId(
                        documentId,
                        companyId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Document not found"
                        )
                );
    }

    private DocumentResponse toResponse(
            Document document
    ) {

        return new DocumentResponse(
                document.getId(),
                document.getFileName(),
                document.getContentType(),
                document.getFileSize(),
                document.getDocumentType(),
                document.getDescription(),
                document.getUploadedBy(),
                document.getCreatedAt(),
                document.getUpdatedAt()
        );
    }

    private String normalizeRequired(
            String value,
            String message
    ) {

        if (
                value == null ||
                value.isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    message
            );
        }

        return value.trim();
    }

    private String normalizeOptional(
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

    public record DownloadedDocument(
            Document document,
            Resource resource
    ) {
    }
}