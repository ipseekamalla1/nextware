package com.nextware.controller;

import com.nextware.dto.dashboard.DashboardSummaryResponse;
import com.nextware.service.dashboard.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only operational analytics for the authenticated company.
 *
 * <p>The company is taken from the authenticated session only — no company id
 * is accepted from the client. Individual sections of the response are omitted
 * for callers who lack the relevant {@code *_VIEW} permission.</p>
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DashboardSummaryResponse> getSummary(
            @RequestParam(name = "period", required = false, defaultValue = "LAST_30_DAYS")
            String period
    ) {
        return ResponseEntity.ok(
                dashboardService.getSummary(period)
        );
    }
}
