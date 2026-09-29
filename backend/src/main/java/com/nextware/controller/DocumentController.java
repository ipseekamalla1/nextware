package com.nextware.controller;

import com.nextware.dto.document.DocumentResponse;
import com.nextware.service.document.DocumentService;
import com.nextware.service.document.DocumentService.DownloadedDocument;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@PreAuthorize("hasAuthority('DOCUMENT_VIEW')")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(
            DocumentService documentService
    ) {
        this.documentService =
                documentService;
    }

    @GetMapping
    public ResponseEntity<List<DocumentResponse>>
    getDocuments() {

        return ResponseEntity.ok(
                documentService.getDocuments()
        );
    }

    @PostMapping(
            consumes =
                    MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize(
            "hasAuthority('DOCUMENT_CREATE')"
    )
    public ResponseEntity<DocumentResponse> upload(
            @RequestParam("file")
            MultipartFile file,

            @RequestParam("documentType")
            String documentType,

            @RequestParam(
                    value = "description",
                    required = false
            )
            String description
    ) {

        return ResponseEntity.ok(
                documentService.upload(
                        file,
                        documentType,
                        description
                )
        );
    }

    @GetMapping(
            "/{documentId}/download"
    )
    public ResponseEntity<Resource> download(
            @PathVariable UUID documentId
    ) {

        DownloadedDocument downloaded =
                documentService.download(
                        documentId
                );

        String disposition =
                ContentDisposition
                        .attachment()
                        .filename(
                                downloaded
                                        .document()
                                        .getFileName(),
                                StandardCharsets.UTF_8
                        )
                        .build()
                        .toString();

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(
                                downloaded
                                        .document()
                                        .getContentType()
                        )
                )
                .contentLength(
                        downloaded
                                .document()
                                .getFileSize()
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        disposition
                )
                .body(
                        downloaded.resource()
                );
    }

    @DeleteMapping(
            "/{documentId}"
    )
    @PreAuthorize(
            "hasAuthority('DOCUMENT_DELETE')"
    )
    public ResponseEntity<Void> delete(
            @PathVariable UUID documentId
    ) {

        documentService.delete(
                documentId
        );

        return ResponseEntity.noContent()
                .build();
    }
}