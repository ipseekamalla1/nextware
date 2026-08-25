package com.nextware.controller;

import com.nextware.security.AuthenticationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authenticationService;

    public AuthController(
            AuthenticationService authenticationService
    ) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {

        try {

            AuthenticationService.AuthenticationResult result =
                    authenticationService.authenticate(
                            request.companyId(),
                            request.username(),
                            request.password()
                    );

            return ResponseEntity.ok(
                    new LoginResponse(
                            result.token(),
                            result.userId(),
                            result.companyId(),
                            result.username(),
                            result.firstName(),
                            result.lastName(),
                            result.roles(),
                            result.permissions()
                    )
            );

        } catch (BadCredentialsException exception) {

            return ResponseEntity
                    .status(401)
                    .build();
        }
    }

    public record LoginRequest(

            @NotNull
            UUID companyId,

            @NotBlank
            String username,

            @NotBlank
            String password

    ) {
    }

    public record LoginResponse(

            String token,

            UUID userId,

            UUID companyId,

            String username,

            String firstName,

            String lastName,

            List<String> roles,

            List<String> permissions

    ) {
    }
}