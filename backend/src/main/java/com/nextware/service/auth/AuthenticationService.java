package com.nextware.service.auth;

import com.nextware.dto.auth.LoginRequest;
import com.nextware.dto.auth.LoginResponse;
import com.nextware.entity.Permission;
import com.nextware.entity.Role;
import com.nextware.entity.User;
import com.nextware.repository.UserRepository;
import com.nextware.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        User user = userRepository
                .findByCompanyIdAndUsername(
                        request.getCompanyId(),
                        request.getUsername()
                )
                .orElseThrow(() ->
                        new InvalidCredentialsException(
                                "Invalid company, username, or password."
                        )
                );

        if (!user.isActive()) {
            throw new InvalidCredentialsException(
                    "This user account is inactive."
            );
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        )) {
            throw new InvalidCredentialsException(
                    "Invalid company, username, or password."
            );
        }

        List<String> roles = user.getRoles()
                .stream()
                .filter(Role::isActive)
                .map(Role::getName)
                .sorted()
                .toList();

        List<String> permissions = user.getRoles()
                .stream()
                .filter(Role::isActive)
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getCode)
                .distinct()
                .sorted()
                .toList();

        String token = jwtService.generateToken(
                user.getId(),
                user.getCompanyId(),
                user.getUsername(),
                roles,
                permissions
        );

        LoginResponse response = new LoginResponse();

        response.setToken(token);
        response.setUserId(user.getId());
        response.setCompanyId(user.getCompanyId());
        response.setUsername(user.getUsername());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRoles(roles);
        response.setPermissions(permissions);

        return response;
    }

    public static class InvalidCredentialsException
            extends RuntimeException {

        public InvalidCredentialsException(String message) {
            super(message);
        }
    }
}