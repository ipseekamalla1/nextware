package com.nextware.mapper;

import com.nextware.dto.company.CompanyCreateRequest;
import com.nextware.dto.company.CompanyResponse;
import com.nextware.entity.Company;
import org.springframework.stereotype.Component;

@Component
public class CompanyMapper {

    public Company toEntity(CompanyCreateRequest request) {
        Company company = new Company();

        company.setName(request.getName().trim());
        company.setLegalName(trimToNull(request.getLegalName()));
        company.setEmail(trimToNull(request.getEmail()));
        company.setPhone(trimToNull(request.getPhone()));

        if (request.getActive() != null) {
            company.setActive(request.getActive());
        }

        return company;
    }

    public void updateEntity(
            Company company,
            CompanyCreateRequest request
    ) {
        company.setName(request.getName().trim());
        company.setLegalName(trimToNull(request.getLegalName()));
        company.setEmail(trimToNull(request.getEmail()));
        company.setPhone(trimToNull(request.getPhone()));

        if (request.getActive() != null) {
            company.setActive(request.getActive());
        }
    }

    public CompanyResponse toResponse(Company company) {
        CompanyResponse response = new CompanyResponse();

        response.setId(company.getId());
        response.setName(company.getName());
        response.setLegalName(company.getLegalName());
        response.setEmail(company.getEmail());
        response.setPhone(company.getPhone());
        response.setActive(company.isActive());
        response.setCreatedAt(company.getCreatedAt());
        response.setUpdatedAt(company.getUpdatedAt());

        return response;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }
}