CREATE TABLE inventory_reservation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sales_order_line_id UUID NOT NULL,

    product_id UUID NOT NULL,
    warehouse_location_id UUID NOT NULL,

    reserved_quantity NUMERIC(19,4) NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'RESERVED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_reservation_sales_order_line
        FOREIGN KEY (sales_order_line_id)
        REFERENCES sales_order_line(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_inventory_reservation_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_inventory_reservation_location
        FOREIGN KEY (warehouse_location_id)
        REFERENCES warehouse_location(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_inventory_reservation_quantity
        CHECK (reserved_quantity > 0),

    CONSTRAINT chk_inventory_reservation_status
        CHECK (
            status IN (
                'RESERVED',
                'RELEASED',
                'FULFILLED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_inventory_reservation_sales_order_line_id
    ON inventory_reservation(sales_order_line_id);

CREATE INDEX idx_inventory_reservation_product_id
    ON inventory_reservation(product_id);

CREATE INDEX idx_inventory_reservation_location_id
    ON inventory_reservation(warehouse_location_id);

CREATE INDEX idx_inventory_reservation_status
    ON inventory_reservation(status);


CREATE TABLE pick_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,

    sales_order_id UUID NOT NULL,

    pick_list_number VARCHAR(100) NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    assigned_to_user_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pick_list_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_pick_list_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouse(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_pick_list_sales_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_order(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_pick_list_assigned_user
        FOREIGN KEY (assigned_to_user_id)
        REFERENCES app_user(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_pick_list_company_number
        UNIQUE (company_id, pick_list_number),

    CONSTRAINT chk_pick_list_status
        CHECK (
            status IN (
                'OPEN',
                'ASSIGNED',
                'PICKING',
                'COMPLETED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_pick_list_company_id
    ON pick_list(company_id);

CREATE INDEX idx_pick_list_warehouse_id
    ON pick_list(warehouse_id);

CREATE INDEX idx_pick_list_sales_order_id
    ON pick_list(sales_order_id);

CREATE INDEX idx_pick_list_assigned_user_id
    ON pick_list(assigned_to_user_id);

CREATE INDEX idx_pick_list_status
    ON pick_list(status);


CREATE TABLE pick_list_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    pick_list_id UUID NOT NULL,

    sales_order_line_id UUID NOT NULL,

    product_id UUID NOT NULL,

    warehouse_location_id UUID NOT NULL,

    requested_quantity NUMERIC(19,4) NOT NULL,
    picked_quantity NUMERIC(19,4) NOT NULL DEFAULT 0,

    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pick_list_line_pick_list
        FOREIGN KEY (pick_list_id)
        REFERENCES pick_list(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pick_list_line_sales_order_line
        FOREIGN KEY (sales_order_line_id)
        REFERENCES sales_order_line(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_pick_list_line_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_pick_list_line_location
        FOREIGN KEY (warehouse_location_id)
        REFERENCES warehouse_location(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_pick_list_line_requested_quantity
        CHECK (requested_quantity > 0),

    CONSTRAINT chk_pick_list_line_picked_quantity
        CHECK (picked_quantity >= 0),

    CONSTRAINT chk_pick_list_line_picked_not_greater
        CHECK (picked_quantity <= requested_quantity),

    CONSTRAINT chk_pick_list_line_status
        CHECK (
            status IN (
                'OPEN',
                'PARTIALLY_PICKED',
                'PICKED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_pick_list_line_pick_list_id
    ON pick_list_line(pick_list_id);

CREATE INDEX idx_pick_list_line_sales_order_line_id
    ON pick_list_line(sales_order_line_id);

CREATE INDEX idx_pick_list_line_product_id
    ON pick_list_line(product_id);

CREATE INDEX idx_pick_list_line_location_id
    ON pick_list_line(warehouse_location_id);

CREATE INDEX idx_pick_list_line_status
    ON pick_list_line(status);