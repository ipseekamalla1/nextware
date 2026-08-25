package com.nextware.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class CompanySecurityService {

    /**
     * Returns the company belonging to the authenticated user.
     *
     * The authenticated JWT is the source of truth.
     *
     * A company ID supplied by the client must never be trusted
     * as proof that the user belongs to that company.
     */
    public UUID getAuthenticatedCompanyId() {
        return AuthenticatedUser.getCompanyId();
    }

    /**
     * Ensures that a client-supplied company ID matches the
     * company belonging to the authenticated user.
     */
    public void requireCompany(UUID requestedCompanyId) {

        UUID authenticatedCompanyId =
                getAuthenticatedCompanyId();

        if (
                requestedCompanyId == null ||
                !authenticatedCompanyId.equals(
                        requestedCompanyId
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to access this company"
            );
        }
    }
}