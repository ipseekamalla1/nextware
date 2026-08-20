CREATE TABLE inventory_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,
    warehouse_location_id UUID NOT NULL,

    quantity NUMERIC(19,4) NOT NULL DEFAULT 0,
    reserved_quantity NUMERIC(19,4) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_balance_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_inventory_balance_location
        FOREIGN KEY (warehouse_location_id)
        REFERENCES warehouse_location(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_inventory_balance_product_location
        UNIQUE (product_id, warehouse_location_id),

    CONSTRAINT chk_inventory_balance_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_inventory_balance_reserved_quantity
        CHECK (reserved_quantity >= 0),

    CONSTRAINT chk_inventory_balance_reserved_not_greater_than_quantity
        CHECK (reserved_quantity <= quantity)
);

CREATE INDEX idx_inventory_balance_product_id
    ON inventory_balance(product_id);

CREATE INDEX idx_inventory_balance_location_id
    ON inventory_balance(warehouse_location_id);


CREATE TABLE inventory_transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,
    warehouse_location_id UUID NOT NULL,

    transaction_type VARCHAR(50) NOT NULL,

    quantity NUMERIC(19,4) NOT NULL,

    reference_type VARCHAR(100),
    reference_id UUID,

    notes VARCHAR(500),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_transaction_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_inventory_transaction_location
        FOREIGN KEY (warehouse_location_id)
        REFERENCES warehouse_location(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_inventory_transaction_quantity
        CHECK (quantity <> 0),

    CONSTRAINT chk_inventory_transaction_type
        CHECK (
            transaction_type IN (
                'RECEIPT',
                'SHIPMENT',
                'ADJUSTMENT',
                'TRANSFER_IN',
                'TRANSFER_OUT',
                'RETURN',
                'DAMAGE',
                'STOCKTAKE'
            )
        )
);

CREATE INDEX idx_inventory_transaction_product_id
    ON inventory_transaction(product_id);

CREATE INDEX idx_inventory_transaction_location_id
    ON inventory_transaction(warehouse_location_id);

CREATE INDEX idx_inventory_transaction_created_at
    ON inventory_transaction(created_at);

CREATE INDEX idx_inventory_transaction_reference
    ON inventory_transaction(reference_type, reference_id);