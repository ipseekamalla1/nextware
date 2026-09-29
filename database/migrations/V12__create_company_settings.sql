CREATE TABLE company_settings (
    company_id UUID PRIMARY KEY,

    default_currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/Toronto',
    date_format VARCHAR(30) NOT NULL DEFAULT 'yyyy-MM-dd',
    time_format VARCHAR(10) NOT NULL DEFAULT 'HH:mm',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_company_settings_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE CASCADE
);