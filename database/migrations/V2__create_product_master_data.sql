CREATE TABLE category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_category_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_category_company_name
        UNIQUE (company_id, name)
);

CREATE INDEX idx_category_company_id
    ON category(company_id);


CREATE TABLE unit_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_unit_of_measure_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_unit_of_measure_company_code
        UNIQUE (company_id, code)
);

CREATE INDEX idx_unit_of_measure_company_id
    ON unit_of_measure(company_id);


CREATE TABLE product (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    category_id UUID,
    unit_of_measure_id UUID NOT NULL,

    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    barcode VARCHAR(100),

    cost_price NUMERIC(19,4),
    selling_price NUMERIC(19,4),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES category(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_product_unit_of_measure
        FOREIGN KEY (unit_of_measure_id)
        REFERENCES unit_of_measure(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_product_company_sku
        UNIQUE (company_id, sku),

    CONSTRAINT uq_product_company_barcode
        UNIQUE (company_id, barcode),

    CONSTRAINT chk_product_cost_price
        CHECK (cost_price IS NULL OR cost_price >= 0),

    CONSTRAINT chk_product_selling_price
        CHECK (selling_price IS NULL OR selling_price >= 0)
);

CREATE INDEX idx_product_company_id
    ON product(company_id);

CREATE INDEX idx_product_category_id
    ON product(category_id);

CREATE INDEX idx_product_unit_of_measure_id
    ON product(unit_of_measure_id);

CREATE INDEX idx_product_barcode
    ON product(barcode);