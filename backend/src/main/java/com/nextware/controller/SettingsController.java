package com.nextware.controller;

import com.nextware.dto.settings.SettingsResponse;
import com.nextware.dto.settings.SettingsUpdateRequest;
import com.nextware.service.settings.SettingsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(
            SettingsService settingsService
    ) {
        this.settingsService = settingsService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('COMPANY_VIEW')")
    public ResponseEntity<SettingsResponse> getSettings() {

        return ResponseEntity.ok(
                settingsService.getSettings()
        );
    }

    @PutMapping
    @PreAuthorize("hasAuthority('COMPANY_UPDATE')")
    public ResponseEntity<SettingsResponse> updateSettings(
            @Valid
            @RequestBody
            SettingsUpdateRequest request
    ) {

        return ResponseEntity.ok(
                settingsService.updateSettings(
                        request
                )
        );
    }
}