CREATE TABLE document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(150) NOT NULL,
    file_size BIGINT NOT NULL,

    storage_key VARCHAR(255) NOT NULL,

    document_type VARCHAR(100) NOT NULL,
    description VARCHAR(1000),

    uploaded_by UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_document_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_document_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES app_user(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_document_storage_key
        UNIQUE (storage_key),

    CONSTRAINT ck_document_file_size
        CHECK (file_size > 0)
);

CREATE INDEX idx_document_company_created
    ON document(company_id, created_at DESC);

CREATE INDEX idx_document_company_type
    ON document(company_id, document_type);

INSERT INTO permission (
    code,
    description
)
VALUES
    (
        'DOCUMENT_CREATE',
        'Upload documents.'
    ),
    (
        'DOCUMENT_DELETE',
        'Delete documents.'
    )
ON CONFLICT (code) DO NOTHING;