CREATE INDEX idx_app_user_email
    ON app_user(email);

CREATE INDEX idx_product_name
    ON product(name);

CREATE INDEX idx_product_sku
    ON product(sku);

CREATE INDEX idx_category_name
    ON category(name);

CREATE INDEX idx_unit_of_measure_name
    ON unit_of_measure(name);

CREATE INDEX idx_customer_email
    ON customer(email);

CREATE INDEX idx_supplier_email
    ON supplier(email);

CREATE INDEX idx_warehouse_name
    ON warehouse(name);

CREATE INDEX idx_inventory_transaction_type
    ON inventory_transaction(transaction_type);

CREATE INDEX idx_inventory_transaction_product_created
    ON inventory_transaction(product_id, created_at);

CREATE INDEX idx_purchase_order_line_product_order
    ON purchase_order_line(product_id, purchase_order_id);

CREATE INDEX idx_receipt_line_product_receipt
    ON receipt_line(product_id, receipt_id);

CREATE INDEX idx_sales_order_line_product_order
    ON sales_order_line(product_id, sales_order_id);