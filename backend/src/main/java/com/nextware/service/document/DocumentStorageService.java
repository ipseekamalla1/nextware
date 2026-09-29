package com.nextware.service.document;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
public class DocumentStorageService {

    private final Path storageRoot;
    private final long maxFileSize;

    public DocumentStorageService(
            @Value("${nextware.documents.storage-root:./data/documents}")
            String storageRoot,

            @Value("${nextware.documents.max-file-size:26214400}")
            long maxFileSize
    ) {
        this.storageRoot =
                Path.of(storageRoot)
                        .toAbsolutePath()
                        .normalize();

        this.maxFileSize = maxFileSize;

        try {
            Files.createDirectories(this.storageRoot);
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Unable to initialize document storage",
                    exception
            );
        }
    }

    public StoredDocument store(
            MultipartFile file
    ) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "A non-empty document file is required"
            );
        }

        if (file.getSize() > maxFileSize) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Document exceeds the maximum allowed file size"
            );
        }

        String fileName =
                sanitizeFileName(
                        file.getOriginalFilename()
                );

        String extension =
                extensionOf(fileName);

        String storageKey =
                UUID.randomUUID() + extension;

        Path target =
                storageRoot
                        .resolve(storageKey)
                        .normalize();

        if (!target.getParent().equals(storageRoot)) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Invalid document storage path"
            );
        }

        try (InputStream inputStream =
                     file.getInputStream()) {

            Files.copy(
                    inputStream,
                    target,
                    StandardCopyOption.REPLACE_EXISTING
            );

        } catch (IOException exception) {

            throw new ResponseStatusException(
                    INTERNAL_SERVER_ERROR,
                    "Unable to store document",
                    exception
            );
        }

        return new StoredDocument(
                fileName,
                storageKey,
                file.getSize(),
                normalizeContentType(
                        file.getContentType()
                )
        );
    }

    public Path resolve(
            String storageKey
    ) {

        if (
                storageKey == null ||
                storageKey.isBlank()
        ) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Document storage reference is invalid"
            );
        }

        Path resolved =
                storageRoot
                        .resolve(storageKey)
                        .normalize();

        if (
                !resolved.getParent().equals(storageRoot) ||
                !resolved.startsWith(storageRoot)
        ) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Document storage reference is invalid"
            );
        }

        return resolved;
    }

    public void delete(
            String storageKey
    ) {

        try {

            Files.deleteIfExists(
                    resolve(storageKey)
            );

        } catch (IOException exception) {

            throw new ResponseStatusException(
                    INTERNAL_SERVER_ERROR,
                    "Unable to delete document file",
                    exception
            );
        }
    }

    private String sanitizeFileName(
            String originalFileName
    ) {

        if (
                originalFileName == null ||
                originalFileName.isBlank()
        ) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Document filename is required"
            );
        }

        String fileName =
                Path.of(originalFileName)
                        .getFileName()
                        .toString()
                        .replaceAll(
                                "[\\p{Cntrl}]",
                                ""
                        )
                        .trim();

        if (
                fileName.isBlank() ||
                ".".equals(fileName) ||
                "..".equals(fileName)
        ) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Document filename is invalid"
            );
        }

        if (fileName.length() > 255) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Document filename must not exceed 255 characters"
            );
        }

        return fileName;
    }

    private String extensionOf(
            String fileName
    ) {

        int dot =
                fileName.lastIndexOf('.');

        if (
                dot <= 0 ||
                dot == fileName.length() - 1
        ) {
            return "";
        }

        String extension =
                fileName.substring(dot);

        if (
                !extension.matches(
                        "\\.[A-Za-z0-9]{1,20}"
                )
        ) {
            return "";
        }

        return extension.toLowerCase();
    }

    private String normalizeContentType(
            String contentType
    ) {

        if (
                contentType == null ||
                contentType.isBlank()
        ) {
            return "application/octet-stream";
        }

        String normalized =
                contentType.trim();

        if (normalized.length() > 150) {
            return "application/octet-stream";
        }

        return normalized;
    }

    public record StoredDocument(
            String fileName,
            String storageKey,
            long fileSize,
            String contentType
    ) {
    }
}