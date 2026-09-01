package com.nextware.service.dashboard;

import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the dashboard period selector. No Spring context or database
 * is required — this exercises the pure date-window logic that drives the
 * "added in period" metrics and the catalog-growth chart window.
 */
class DashboardServicePeriodTest {

    @Test
    void unknownKeyFallsBackToLast30Days() {
        DashboardService.Period period =
                DashboardService.Period.resolve("something-invalid");

        assertThat(period.key()).isEqualTo("LAST_30_DAYS");
        assertThat(period.label()).isEqualTo("Last 30 days");
        assertThat(daysBetween(period)).isEqualTo(30);
    }

    @Test
    void nullKeyFallsBackToLast30Days() {
        assertThat(DashboardService.Period.resolve(null).key())
                .isEqualTo("LAST_30_DAYS");
    }

    @Test
    void last7DaysWindowIsSevenDays() {
        DashboardService.Period period =
                DashboardService.Period.resolve("LAST_7_DAYS");

        assertThat(period.key()).isEqualTo("LAST_7_DAYS");
        assertThat(daysBetween(period)).isEqualTo(7);
    }

    @Test
    void last90DaysWindowIsNinetyDays() {
        assertThat(daysBetween(DashboardService.Period.resolve("LAST_90_DAYS")))
                .isEqualTo(90);
    }

    @Test
    void keyIsCaseInsensitive() {
        assertThat(DashboardService.Period.resolve("last_7_days").key())
                .isEqualTo("LAST_7_DAYS");
    }

    @Test
    void thisMonthStartsOnTheFirst() {
        DashboardService.Period period =
                DashboardService.Period.resolve("THIS_MONTH");

        assertThat(period.from().getDayOfMonth()).isEqualTo(1);
        assertThat(period.from().getMonth())
                .isEqualTo(OffsetDateTime.now().getMonth());
        assertThat(period.from()).isBeforeOrEqualTo(period.to());
    }

    @Test
    void thisQuarterStartsOnAQuarterBoundaryMonth() {
        DashboardService.Period period =
                DashboardService.Period.resolve("THIS_QUARTER");

        assertThat(period.from().getDayOfMonth()).isEqualTo(1);
        assertThat(period.from().getMonthValue() % 3).isEqualTo(1);
        assertThat(period.from()).isBeforeOrEqualTo(period.to());
    }

    @Test
    void allTimeStartsAtEpoch() {
        DashboardService.Period period =
                DashboardService.Period.resolve("ALL_TIME");

        assertThat(period.from().getYear()).isEqualTo(1970);
        assertThat(period.label()).isEqualTo("All time");
    }

    private static long daysBetween(DashboardService.Period period) {
        return ChronoUnit.DAYS.between(
                period.from().truncatedTo(ChronoUnit.SECONDS),
                period.to().truncatedTo(ChronoUnit.SECONDS));
    }
}
