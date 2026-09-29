package com.nextware.service.settings;

import com.nextware.dto.settings.SettingsResponse;
import com.nextware.dto.settings.SettingsUpdateRequest;
import com.nextware.entity.CompanySettings;
import com.nextware.repository.CompanySettingsRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class SettingsService {

    private static final String DEFAULT_CURRENCY = "CAD";
    private static final String DEFAULT_TIMEZONE = "America/Toronto";
    private static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd";
    private static final String DEFAULT_TIME_FORMAT = "HH:mm";

    private final CompanySettingsRepository companySettingsRepository;
    private final CompanySecurityService companySecurityService;

    public SettingsService(
            CompanySettingsRepository companySettingsRepository,
            CompanySecurityService companySecurityService
    ) {
        this.companySettingsRepository = companySettingsRepository;
        this.companySecurityService = companySecurityService;
    }

    @Transactional(readOnly = true)
    public SettingsResponse getSettings() {

        UUID companyId =
                companySecurityService.getAuthenticatedCompanyId();

        CompanySettings settings =
                companySettingsRepository
                        .findById(companyId)
                        .orElseGet(() -> createDefaultSettings(companyId));

        return toResponse(settings);
    }

    public SettingsResponse updateSettings(
            SettingsUpdateRequest request
    ) {

        UUID companyId =
                companySecurityService.getAuthenticatedCompanyId();

        CompanySettings settings =
                companySettingsRepository
                        .findById(companyId)
                        .orElseGet(() -> createDefaultSettings(companyId));

        settings.setDefaultCurrency(
                request.getDefaultCurrency()
                        .trim()
                        .toUpperCase()
        );

        settings.setTimezone(
                request.getTimezone().trim()
        );

        settings.setDateFormat(
                request.getDateFormat().trim()
        );

        settings.setTimeFormat(
                request.getTimeFormat().trim()
        );

        return toResponse(
                companySettingsRepository.save(settings)
        );
    }

    private CompanySettings createDefaultSettings(
            UUID companyId
    ) {

        CompanySettings settings =
                new CompanySettings();

        settings.setCompanyId(companyId);
        settings.setDefaultCurrency(DEFAULT_CURRENCY);
        settings.setTimezone(DEFAULT_TIMEZONE);
        settings.setDateFormat(DEFAULT_DATE_FORMAT);
        settings.setTimeFormat(DEFAULT_TIME_FORMAT);

        return companySettingsRepository.save(settings);
    }

    private SettingsResponse toResponse(
            CompanySettings settings
    ) {

        SettingsResponse response =
                new SettingsResponse();

        response.setCompanyId(
                settings.getCompanyId()
        );

        response.setDefaultCurrency(
                settings.getDefaultCurrency()
        );

        response.setTimezone(
                settings.getTimezone()
        );

        response.setDateFormat(
                settings.getDateFormat()
        );

        response.setTimeFormat(
                settings.getTimeFormat()
        );

        response.setCreatedAt(
                settings.getCreatedAt()
        );

        response.setUpdatedAt(
                settings.getUpdatedAt()
        );

        return response;
    }
}