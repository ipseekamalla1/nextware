package com.nextware.security;

import com.nextware.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class AuthenticatedUser {

    private AuthenticatedUser() {
    }

    public static User get() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (
                authentication == null ||
                !authentication.isAuthenticated()
        ) {
            throw new IllegalStateException(
                    "No authenticated user is available"
            );
        }

        Object principal =
                authentication.getPrincipal();

        if (!(principal instanceof User user)) {
            throw new IllegalStateException(
                    "Authenticated principal is not a Nextware user"
            );
        }

        return user;
    }

    public static UUID getUserId() {
        return get().getId();
    }

    public static UUID getCompanyId() {
        return get().getCompanyId();
    }
}