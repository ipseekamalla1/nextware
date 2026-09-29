package com.nextware.dto.settings;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SettingsUpdateRequest {

    @NotBlank
    @Pattern(
            regexp = "^[A-Z]{3}$",
            message = "Currency must be a 3-letter uppercase ISO currency code"
    )
    private String defaultCurrency;

    @NotBlank
    @Size(max = 100)
    private String timezone;

    @NotBlank
    @Size(max = 30)
    private String dateFormat;

    @NotBlank
    @Size(max = 10)
    private String timeFormat;

    public String getDefaultCurrency() {
        return defaultCurrency;
    }

    public void setDefaultCurrency(String defaultCurrency) {
        this.defaultCurrency = defaultCurrency;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        this.dateFormat = dateFormat;
    }

    public String getTimeFormat() {
        return timeFormat;
    }

    public void setTimeFormat(String timeFormat) {
        this.timeFormat = timeFormat;
    }
}