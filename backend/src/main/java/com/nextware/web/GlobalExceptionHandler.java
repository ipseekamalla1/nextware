package com.nextware.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Translates exceptions into a consistent JSON error body so the frontend can
 * always read {@code message} (and {@code status}) without seeing stack traces.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
            ResponseStatusException exception
    ) {
        String message = exception.getReason();

        if (message == null || message.isBlank()) {
            message = "Request could not be completed.";
        }

        return body(exception.getStatusCode(), message);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException exception
    ) {
        FieldError fieldError =
                exception.getBindingResult().getFieldError();

        String message = fieldError != null
                ? fieldError.getField() + ": " + fieldError.getDefaultMessage()
                : "The submitted data is invalid.";

        return body(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(
            DataIntegrityViolationException exception
    ) {
        log.warn("Data integrity violation", exception);

        return body(
                HttpStatus.CONFLICT,
                "This record conflicts with existing data and cannot be saved."
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            AccessDeniedException exception
    ) {
        return body(
                HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action."
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(
            Exception exception
    ) {
        log.error("Unhandled exception", exception);

        return body(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again."
        );
    }

    private ResponseEntity<Map<String, Object>> body(
            HttpStatusCode status,
            String message
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();

        payload.put("timestamp", OffsetDateTime.now().toString());
        payload.put("status", status.value());
        payload.put("message", message);

        return ResponseEntity.status(status).body(payload);
    }
}
