CREATE TABLE purchase_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    supplier_id UUID NOT NULL,

    order_number VARCHAR(100) NOT NULL,

    order_date DATE NOT NULL DEFAULT CURRENT_DATE,

    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',

    notes VARCHAR(1000),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_purchase_order_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_purchase_order_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES supplier(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_purchase_order_company_number
        UNIQUE (company_id, order_number),

    CONSTRAINT chk_purchase_order_status
        CHECK (
            status IN (
                'DRAFT',
                'SUBMITTED',
                'APPROVED',
                'PARTIALLY_RECEIVED',
                'RECEIVED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_purchase_order_company_id
    ON purchase_order(company_id);

CREATE INDEX idx_purchase_order_supplier_id
    ON purchase_order(supplier_id);

CREATE INDEX idx_purchase_order_status
    ON purchase_order(status);

CREATE INDEX idx_purchase_order_order_date
    ON purchase_order(order_date);


CREATE TABLE purchase_order_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_order_id UUID NOT NULL,

    product_id UUID NOT NULL,

    ordered_quantity NUMERIC(19,4) NOT NULL,
    unit_cost NUMERIC(19,4) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_purchase_order_line_order
        FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_order(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_purchase_order_line_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_purchase_order_line_quantity
        CHECK (ordered_quantity > 0),

    CONSTRAINT chk_purchase_order_line_unit_cost
        CHECK (unit_cost >= 0)
);

CREATE INDEX idx_purchase_order_line_order_id
    ON purchase_order_line(purchase_order_id);

CREATE INDEX idx_purchase_order_line_product_id
    ON purchase_order_line(product_id);


CREATE TABLE receipt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    purchase_order_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,

    receipt_number VARCHAR(100) NOT NULL,

    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,

    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    notes VARCHAR(1000),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_receipt_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_receipt_purchase_order
        FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_order(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_receipt_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouse(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_receipt_company_number
        UNIQUE (company_id, receipt_number),

    CONSTRAINT chk_receipt_status
        CHECK (
            status IN (
                'OPEN',
                'RECEIVING',
                'COMPLETED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_receipt_company_id
    ON receipt(company_id);

CREATE INDEX idx_receipt_purchase_order_id
    ON receipt(purchase_order_id);

CREATE INDEX idx_receipt_warehouse_id
    ON receipt(warehouse_id);

CREATE INDEX idx_receipt_receipt_date
    ON receipt(receipt_date);


CREATE TABLE receipt_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    receipt_id UUID NOT NULL,

    purchase_order_line_id UUID NOT NULL,

    product_id UUID NOT NULL,

    warehouse_location_id UUID NOT NULL,

    received_quantity NUMERIC(19,4) NOT NULL,

    unit_cost NUMERIC(19,4) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_receipt_line_receipt
        FOREIGN KEY (receipt_id)
        REFERENCES receipt(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_receipt_line_purchase_order_line
        FOREIGN KEY (purchase_order_line_id)
        REFERENCES purchase_order_line(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_receipt_line_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_receipt_line_location
        FOREIGN KEY (warehouse_location_id)
        REFERENCES warehouse_location(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_receipt_line_quantity
        CHECK (received_quantity > 0),

    CONSTRAINT chk_receipt_line_unit_cost
        CHECK (unit_cost >= 0)
);

CREATE INDEX idx_receipt_line_receipt_id
    ON receipt_line(receipt_id);

CREATE INDEX idx_receipt_line_purchase_order_line_id
    ON receipt_line(purchase_order_line_id);

CREATE INDEX idx_receipt_line_product_id
    ON receipt_line(product_id);

CREATE INDEX idx_receipt_line_location_id
    ON receipt_line(warehouse_location_id);