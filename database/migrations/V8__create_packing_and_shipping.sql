CREATE TABLE package (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    sales_order_id UUID NOT NULL,

    package_number VARCHAR(100) NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    weight NUMERIC(19,4),
    length NUMERIC(19,4),
    width NUMERIC(19,4),
    height NUMERIC(19,4),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_package_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_package_sales_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_order(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_package_company_number
        UNIQUE (company_id, package_number),

    CONSTRAINT chk_package_status
        CHECK (
            status IN (
                'OPEN',
                'PACKED',
                'SHIPPED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_package_weight
        CHECK (weight IS NULL OR weight >= 0),

    CONSTRAINT chk_package_length
        CHECK (length IS NULL OR length >= 0),

    CONSTRAINT chk_package_width
        CHECK (width IS NULL OR width >= 0),

    CONSTRAINT chk_package_height
        CHECK (height IS NULL OR height >= 0)
);

CREATE INDEX idx_package_company_id
    ON package(company_id);

CREATE INDEX idx_package_sales_order_id
    ON package(sales_order_id);

CREATE INDEX idx_package_status
    ON package(status);


CREATE TABLE package_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    package_id UUID NOT NULL,

    sales_order_line_id UUID NOT NULL,
    product_id UUID NOT NULL,

    quantity NUMERIC(19,4) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_package_line_package
        FOREIGN KEY (package_id)
        REFERENCES package(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_package_line_sales_order_line
        FOREIGN KEY (sales_order_line_id)
        REFERENCES sales_order_line(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_package_line_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_package_line_quantity
        CHECK (quantity > 0)
);

CREATE INDEX idx_package_line_package_id
    ON package_line(package_id);

CREATE INDEX idx_package_line_sales_order_line_id
    ON package_line(sales_order_line_id);

CREATE INDEX idx_package_line_product_id
    ON package_line(product_id);


CREATE TABLE shipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    sales_order_id UUID NOT NULL,

    shipment_number VARCHAR(100) NOT NULL,

    carrier_name VARCHAR(255),
    tracking_number VARCHAR(255),

    shipping_method VARCHAR(100),

    status VARCHAR(50) NOT NULL DEFAULT 'READY',

    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    notes VARCHAR(1000),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_shipment_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_shipment_sales_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_order(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_shipment_company_number
        UNIQUE (company_id, shipment_number),

    CONSTRAINT chk_shipment_status
        CHECK (
            status IN (
                'READY',
                'SHIPPED',
                'IN_TRANSIT',
                'DELIVERED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_shipment_company_id
    ON shipment(company_id);

CREATE INDEX idx_shipment_sales_order_id
    ON shipment(sales_order_id);

CREATE INDEX idx_shipment_tracking_number
    ON shipment(tracking_number);

CREATE INDEX idx_shipment_status
    ON shipment(status);


CREATE TABLE shipment_package (
    shipment_id UUID NOT NULL,
    package_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (shipment_id, package_id),

    CONSTRAINT fk_shipment_package_shipment
        FOREIGN KEY (shipment_id)
        REFERENCES shipment(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_shipment_package_package
        FOREIGN KEY (package_id)
        REFERENCES package(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_shipment_package_package_id
    ON shipment_package(package_id);