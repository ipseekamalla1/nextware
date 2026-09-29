package com.nextware.repository;

import com.nextware.entity.CompanySettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CompanySettingsRepository
        extends JpaRepository<CompanySettings, UUID> {
}