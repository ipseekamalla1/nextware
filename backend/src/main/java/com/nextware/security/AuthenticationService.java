package com.nextware.security;

import com.nextware.entity.Role;
import com.nextware.entity.User;
import com.nextware.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthenticationResult authenticate(
            UUID companyId,
            String username,
            String password
    ) {

        User user = userRepository
                .findByCompanyIdAndUsername(
                        companyId,
                        username
                )
                .orElseThrow(() ->
                        new BadCredentialsException(
                                "Invalid username or password"
                        )
                );

        if (!user.isActive()) {
            throw new BadCredentialsException(
                    "User account is inactive"
            );
        }

        if (
                !passwordEncoder.matches(
                        password,
                        user.getPasswordHash()
                )
        ) {
            throw new BadCredentialsException(
                    "Invalid username or password"
            );
        }

        List<String> roles = user.getRoles()
                .stream()
                .map(Role::getName)
                .toList();

        List<String> permissions = user.getRoles()
                .stream()
                .flatMap(role ->
                        role.getPermissions()
                                .stream()
                )
                .map(permission ->
                        permission.getCode()
                )
                .distinct()
                .toList();

        String token = jwtService.generateToken(
                user.getId(),
                user.getCompanyId(),
                user.getUsername(),
                roles,
                permissions
        );

        return new AuthenticationResult(
                token,
                user.getId(),
                user.getCompanyId(),
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                roles,
                permissions
        );
    }

    public record AuthenticationResult(
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