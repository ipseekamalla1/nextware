CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    user_id UUID NOT NULL,

    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,

    details VARCHAR(4000),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_log_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_audit_log_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_audit_log_company_created
    ON audit_log(company_id, created_at DESC);

CREATE INDEX idx_audit_log_company_entity
    ON audit_log(company_id, entity_type, entity_id);

CREATE INDEX idx_audit_log_company_user
    ON audit_log(company_id, user_id, created_at DESC);

CREATE INDEX idx_audit_log_company_action
    ON audit_log(company_id, action, created_at DESC);

INSERT INTO permission (
    code,
    description
)
VALUES
    (
        'AUDIT_VIEW',
        'View audit information.'
    )
ON CONFLICT (code) DO NOTHING;