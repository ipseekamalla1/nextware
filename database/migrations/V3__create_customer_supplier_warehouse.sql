CREATE TABLE customer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    customer_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,

    email VARCHAR(255),
    phone VARCHAR(50),

    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(30),
    billing_country VARCHAR(100),

    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(30),
    shipping_country VARCHAR(100),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_customer_company_code
        UNIQUE (company_id, customer_code)
);

CREATE INDEX idx_customer_company_id
    ON customer(company_id);

CREATE INDEX idx_customer_name
    ON customer(name);


CREATE TABLE supplier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    supplier_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,

    email VARCHAR(255),
    phone VARCHAR(50),

    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(30),
    country VARCHAR(100),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_supplier_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_supplier_company_code
        UNIQUE (company_id, supplier_code)
);

CREATE INDEX idx_supplier_company_id
    ON supplier(company_id);

CREATE INDEX idx_supplier_name
    ON supplier(name);


CREATE TABLE warehouse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,

    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(30),
    country VARCHAR(100),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_warehouse_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_warehouse_company_code
        UNIQUE (company_id, code)
);

CREATE INDEX idx_warehouse_company_id
    ON warehouse(company_id);


CREATE TABLE warehouse_location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    warehouse_id UUID NOT NULL,

    code VARCHAR(100) NOT NULL,
    name VARCHAR(255),

    location_type VARCHAR(50) NOT NULL DEFAULT 'STORAGE',

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_warehouse_location_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouse(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_warehouse_location_code
        UNIQUE (warehouse_id, code),

    CONSTRAINT chk_warehouse_location_type
        CHECK (
            location_type IN (
                'RECEIVING',
                'STORAGE',
                'PICKING',
                'PACKING',
                'SHIPPING',
                'QUARANTINE',
                'DAMAGED'
            )
        )
);

CREATE INDEX idx_warehouse_location_warehouse_id
    ON warehouse_location(warehouse_id);