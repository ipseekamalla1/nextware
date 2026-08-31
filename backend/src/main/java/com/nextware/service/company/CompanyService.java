package com.nextware.service.company;

import com.nextware.dto.company.CompanyCreateRequest;
import com.nextware.dto.company.CompanyResponse;
import com.nextware.entity.Company;
import com.nextware.mapper.CompanyMapper;
import com.nextware.repository.CompanyRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;
    private final CompanySecurityService companySecurityService;

    public CompanyService(
            CompanyRepository companyRepository,
            CompanyMapper companyMapper,
            CompanySecurityService companySecurityService
    ) {
        this.companyRepository = companyRepository;
        this.companyMapper = companyMapper;
        this.companySecurityService =
                companySecurityService;
    }

    /**
     * Get the authenticated user's company.
     */
    public CompanyResponse getCompany(
            UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Company company =
                companyRepository
                        .findById(companyId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Company not found"
                                        )
                        );

        return companyMapper.toResponse(
                company
        );
    }

    /**
     * Company creation is intentionally
     * disabled for the normal authenticated
     * company-scoped API.
     *
     * Company onboarding will be handled
     * separately during productization.
     */
    public CompanyResponse createCompany(
            CompanyCreateRequest request
    ) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Company creation is not permitted through this API"
        );
    }

    /**
     * Update the authenticated user's company.
     */
    public CompanyResponse updateCompany(
            UUID companyId,
            CompanyCreateRequest request
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Company company =
                companyRepository
                        .findById(companyId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Company not found"
                                        )
                        );

        companyMapper.updateEntity(
                company,
                request
        );

        Company updatedCompany =
                companyRepository.save(
                        company
                );

        return companyMapper.toResponse(
                updatedCompany
        );
    }

    /**
     * Deactivate the authenticated user's
     * company.
     */
    public void deactivateCompany(
            UUID companyId
    ) {
        companySecurityService.requireCompany(
                companyId
        );

        Company company =
                companyRepository
                        .findById(companyId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Company not found"
                                        )
                        );

        if (!company.isActive()) {
            return;
        }

        company.setActive(false);

        companyRepository.save(
                company
        );
    }
}