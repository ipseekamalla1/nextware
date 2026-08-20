CREATE TABLE sales_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    customer_id UUID NOT NULL,

    order_number VARCHAR(100) NOT NULL,

    order_date DATE NOT NULL DEFAULT CURRENT_DATE,

    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',

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

    notes VARCHAR(1000),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_order_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_sales_order_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_sales_order_company_number
        UNIQUE (company_id, order_number),

    CONSTRAINT chk_sales_order_status
        CHECK (
            status IN (
                'DRAFT',
                'CONFIRMED',
                'PARTIALLY_FULFILLED',
                'FULFILLED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_sales_order_company_id
    ON sales_order(company_id);

CREATE INDEX idx_sales_order_customer_id
    ON sales_order(customer_id);

CREATE INDEX idx_sales_order_status
    ON sales_order(status);

CREATE INDEX idx_sales_order_order_date
    ON sales_order(order_date);


CREATE TABLE sales_order_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sales_order_id UUID NOT NULL,

    product_id UUID NOT NULL,

    ordered_quantity NUMERIC(19,4) NOT NULL,
    unit_price NUMERIC(19,4) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_order_line_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_order(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sales_order_line_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_sales_order_line_quantity
        CHECK (ordered_quantity > 0),

    CONSTRAINT chk_sales_order_line_unit_price
        CHECK (unit_price >= 0)
);

CREATE INDEX idx_sales_order_line_order_id
    ON sales_order_line(sales_order_id);

CREATE INDEX idx_sales_order_line_product_id
    ON sales_order_line(product_id);