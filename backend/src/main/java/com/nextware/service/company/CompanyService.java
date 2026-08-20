package com.nextware.service.company;

import com.nextware.dto.company.CompanyCreateRequest;
import com.nextware.dto.company.CompanyResponse;
import com.nextware.entity.Company;
import com.nextware.mapper.CompanyMapper;
import com.nextware.repository.CompanyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;

    public CompanyService(
            CompanyRepository companyRepository,
            CompanyMapper companyMapper
    ) {
        this.companyRepository = companyRepository;
        this.companyMapper = companyMapper;
    }

    public List<CompanyResponse> getCompanies() {
        return companyRepository
                .findAllByOrderByNameAsc()
                .stream()
                .map(companyMapper::toResponse)
                .toList();
    }

    public CompanyResponse getCompany(UUID companyId) {
        Company company = companyRepository
                .findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Company not found"
                ));

        return companyMapper.toResponse(company);
    }

    public CompanyResponse createCompany(
            CompanyCreateRequest request
    ) {
        Company company = companyMapper.toEntity(request);

        Company savedCompany = companyRepository.save(company);

        return companyMapper.toResponse(savedCompany);
    }

    public CompanyResponse updateCompany(
            UUID companyId,
            CompanyCreateRequest request
    ) {
        Company company = companyRepository
                .findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Company not found"
                ));

        companyMapper.updateEntity(company, request);

        Company updatedCompany = companyRepository.save(company);

        return companyMapper.toResponse(updatedCompany);
    }

    public void deactivateCompany(UUID companyId) {
        Company company = companyRepository
                .findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Company not found"
                ));

        company.setActive(false);

        companyRepository.save(company);
    }
}