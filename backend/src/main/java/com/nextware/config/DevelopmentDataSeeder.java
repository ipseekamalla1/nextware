package com.nextware.config;

import com.nextware.entity.Category;
import com.nextware.entity.Company;
import com.nextware.entity.Customer;
import com.nextware.entity.Permission;
import com.nextware.entity.Product;
import com.nextware.entity.Role;
import com.nextware.entity.Supplier;
import com.nextware.entity.UnitOfMeasure;
import com.nextware.entity.User;
import com.nextware.entity.Warehouse;
import com.nextware.entity.WarehouseLocation;
import com.nextware.repository.CategoryRepository;
import com.nextware.repository.CompanyRepository;
import com.nextware.repository.CustomerRepository;
import com.nextware.repository.PermissionRepository;
import com.nextware.repository.ProductRepository;
import com.nextware.repository.RoleRepository;
import com.nextware.repository.SupplierRepository;
import com.nextware.repository.UnitOfMeasureRepository;
import com.nextware.repository.UserRepository;
import com.nextware.repository.WarehouseLocationRepository;
import com.nextware.repository.WarehouseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Development-only, idempotent seeder for realistic (but entirely fictional)
 * demo data: two companies, the standard role/permission matrix, one user per
 * role, and master data (units, categories, products, customers, suppliers,
 * warehouses and locations).
 *
 * <p>Only ever active under the {@code dev} profile. It never bypasses Spring
 * Security — it simply populates the same tables the application uses. Running
 * it repeatedly makes no further changes.</p>
 *
 * <p>All email addresses use the reserved {@code .test} / {@code .example}
 * domains and no message is ever sent to them.</p>
 */
@Component
@Profile("dev")
public class DevelopmentDataSeeder implements CommandLineRunner {

    private static final Logger log =
            LoggerFactory.getLogger(DevelopmentDataSeeder.class);

    /** Stable id for the primary demo company (dev only). */
    public static final UUID DEMO_COMPANY_ID =
            UUID.fromString("10000000-0000-0000-0000-000000000001");

    /** Stable id for the second company used to test company isolation. */
    public static final UUID TEST_COMPANY_ID =
            UUID.fromString("20000000-0000-0000-0000-000000000002");

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final CategoryRepository categoryRepository;
    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final PasswordEncoder passwordEncoder;

    private final boolean securityBootstrapEnabled;
    private final boolean demoDataEnabled;
    private final String primaryAdminUsername;
    private final String primaryAdminEmail;
    private final String bootstrapPassword;

    public DevelopmentDataSeeder(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            CategoryRepository categoryRepository,
            UnitOfMeasureRepository unitOfMeasureRepository,
            ProductRepository productRepository,
            CustomerRepository customerRepository,
            SupplierRepository supplierRepository,
            WarehouseRepository warehouseRepository,
            WarehouseLocationRepository warehouseLocationRepository,
            PasswordEncoder passwordEncoder,
            @Value("${nextware.security.bootstrap.enabled:false}")
            boolean securityBootstrapEnabled,
            @Value("${nextware.demo-data.enabled:false}")
            boolean demoDataEnabled,
            @Value("${nextware.security.bootstrap.username:admin}")
            String primaryAdminUsername,
            @Value("${nextware.security.bootstrap.email:admin@nextware.local}")
            String primaryAdminEmail,
            @Value("${nextware.security.bootstrap.password:}")
            String bootstrapPassword
    ) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.categoryRepository = categoryRepository;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.warehouseRepository = warehouseRepository;
        this.warehouseLocationRepository = warehouseLocationRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityBootstrapEnabled = securityBootstrapEnabled;
        this.demoDataEnabled = demoDataEnabled;
        this.primaryAdminUsername = primaryAdminUsername;
        this.primaryAdminEmail = primaryAdminEmail;
        this.bootstrapPassword = bootstrapPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {

        if (!securityBootstrapEnabled && !demoDataEnabled) {
            return;
        }

        log.info("Nextware development bootstrap starting...");

        if (securityBootstrapEnabled) {

            if (bootstrapPassword == null || bootstrapPassword.isBlank()) {
                throw new IllegalStateException(
                        "Development security bootstrap is enabled, but "
                                + "NEXTWARE_SECURITY_BOOTSTRAP_PASSWORD is not configured."
                );
            }

            ensurePermissions();
            log.info("Permissions: OK");

            Company demoCompany = ensureCompany(
                    DEMO_COMPANY_ID,
                    "Nextware Demo Company",
                    "Nextware Demo Company Ltd.",
                    "operations@demo.nextware.test",
                    "+1-555-0100"
            );

            Company testCompany = ensureCompany(
                    TEST_COMPANY_ID,
                    "Nextware Test Company",
                    "Nextware Test Company Inc.",
                    "operations@test.nextware.test",
                    "+1-555-0200"
            );

            log.info("Companies: OK");

            Map<String, Role> demoRoles = ensureRoles(demoCompany.getId());
            Map<String, Role> testRoles = ensureRoles(testCompany.getId());
            log.info("Roles: OK");

            ensureUsers(demoCompany.getId(), demoRoles, primaryUsers());
            ensureUsers(testCompany.getId(), testRoles, testCompanyUsers());
            log.info("Users: OK");
        }

        if (demoDataEnabled) {
            ensureCompany(
                    DEMO_COMPANY_ID,
                    "Nextware Demo Company",
                    "Nextware Demo Company Ltd.",
                    "operations@demo.nextware.test",
                    "+1-555-0100"
            );
            ensureCompany(
                    TEST_COMPANY_ID,
                    "Nextware Test Company",
                    "Nextware Test Company Inc.",
                    "operations@test.nextware.test",
                    "+1-555-0200"
            );

            seedMasterData(DEMO_COMPANY_ID, true);
            seedMasterData(TEST_COMPANY_ID, false);
        }

        log.info("Development data ready.");
    }

    /* ===================================================================
       SECURITY: permissions, companies, roles, users
       =================================================================== */

    private void ensurePermissions() {
        permissionCatalog().forEach((code, description) ->
                permissionRepository.findByCode(code).orElseGet(() -> {
                    Permission permission = new Permission();
                    permission.setCode(code);
                    permission.setDescription(description);
                    return permissionRepository.save(permission);
                })
        );
    }

    private Company ensureCompany(
            UUID id,
            String name,
            String legalName,
            String email,
            String phone
    ) {
        return companyRepository.findById(id).orElseGet(() -> {
            Company company = new Company();
            company.setId(id);
            company.setName(name);
            company.setLegalName(legalName);
            company.setEmail(email);
            company.setPhone(phone);
            company.setActive(true);
            return companyRepository.save(company);
        });
    }

    private Map<String, Role> ensureRoles(UUID companyId) {

        Map<String, Role> roles = new LinkedHashMap<>();

        roleMatrix().forEach((roleName, permissionCodes) -> {

            Role role = roleRepository
                    .findByCompanyIdAndName(companyId, roleName)
                    .orElseGet(() -> {
                        Role created = new Role();
                        created.setCompanyId(companyId);
                        created.setName(roleName);
                        created.setDescription(roleDescription(roleName));
                        created.setActive(true);
                        return created;
                    });

            role.setActive(true);

            Set<Permission> resolved = new LinkedHashSet<>();

            if (permissionCodes.contains("*")) {
                resolved.addAll(permissionRepository.findAll());
            } else {
                for (String code : permissionCodes) {
                    permissionRepository.findByCode(code).ifPresent(resolved::add);
                }
            }

            role.getPermissions().addAll(resolved);
            roles.put(roleName, roleRepository.save(role));
        });

        return roles;
    }

    private void ensureUsers(
            UUID companyId,
            Map<String, Role> roles,
            List<UserSpec> specs
    ) {
        for (UserSpec spec : specs) {

            Role role = roles.get(spec.role());

            if (role == null) {
                continue;
            }

            User user = userRepository
                    .findByCompanyIdAndUsername(companyId, spec.username())
                    .orElseGet(() -> {
                        User created = new User();
                        created.setCompanyId(companyId);
                        created.setUsername(spec.username());
                        created.setFirstName(spec.firstName());
                        created.setLastName(spec.lastName());
                        return created;
                    });

            user.setEmail(spec.username() + "@" + emailDomain(companyId));
            user.setFirstName(spec.firstName());
            user.setLastName(spec.lastName());
            user.setActive(true);
            user.setPasswordHash(passwordEncoder.encode(bootstrapPassword));
            user.getRoles().add(role);

            userRepository.save(user);
        }
    }

    private List<UserSpec> primaryUsers() {
        List<UserSpec> users = new ArrayList<>();
        users.add(new UserSpec(primaryAdminUsername, "System", "Administrator", "SYSTEM_ADMIN"));
        users.add(new UserSpec("warehouse.manager", "Wanda", "Fields", "WAREHOUSE_MANAGER"));
        users.add(new UserSpec("inventory.clerk", "Ivan", "Rowe", "INVENTORY_CLERK"));
        users.add(new UserSpec("purchasing", "Priya", "Nandakumar", "PURCHASING_USER"));
        users.add(new UserSpec("sales", "Sam", "Okafor", "SALES_USER"));
        users.add(new UserSpec("readonly", "Riley", "Chen", "READ_ONLY_USER"));
        return users;
    }

    private List<UserSpec> testCompanyUsers() {
        List<UserSpec> users = new ArrayList<>();
        users.add(new UserSpec("admin", "Test", "Administrator", "SYSTEM_ADMIN"));
        users.add(new UserSpec("companyb.admin", "Company B", "Administrator", "SYSTEM_ADMIN"));
        users.add(new UserSpec("sales", "Blake", "Turner", "SALES_USER"));
        return users;
    }

    private String emailDomain(UUID companyId) {
        return DEMO_COMPANY_ID.equals(companyId)
                ? "demo.nextware.test"
                : "test.nextware.test";
    }

    /* ===================================================================
       MASTER DATA
       =================================================================== */

    private void seedMasterData(UUID companyId, boolean full) {

        Map<String, UUID> units = seedUnits(companyId, full);
        log.info("Units of Measure: OK ({})", companyId);

        Map<String, UUID> categories = seedCategories(companyId, full);
        log.info("Categories: OK ({})", companyId);

        seedProducts(companyId, categories, units, full);
        log.info("Products: OK ({})", companyId);

        seedCustomers(companyId, full);
        log.info("Customers: OK ({})", companyId);

        seedSuppliers(companyId, full);
        log.info("Suppliers: OK ({})", companyId);

        seedWarehouses(companyId, full);
        log.info("Warehouses: OK ({})", companyId);
    }

    private Map<String, UUID> seedUnits(UUID companyId, boolean full) {

        String[][] rows = full
                ? new String[][] {
                        {"EA", "Each", "A single sellable unit"},
                        {"BOX", "Box", "A box of units"},
                        {"CASE", "Case", "A case of boxes"},
                        {"PLT", "Pallet", "A shipping pallet"},
                        {"KG", "Kilogram", "Weight in kilograms"},
                        {"G", "Gram", "Weight in grams"},
                        {"L", "Litre", "Volume in litres"},
                        {"ML", "Millilitre", "Volume in millilitres"},
                }
                : new String[][] {
                        {"EA", "Each", "A single sellable unit"},
                        {"CASE", "Case", "A case of units"},
                };

        for (String[] row : rows) {
            if (!unitOfMeasureRepository.existsByCompanyIdAndCode(companyId, row[0])) {
                UnitOfMeasure unit = new UnitOfMeasure();
                unit.setCompanyId(companyId);
                unit.setCode(row[0]);
                unit.setName(row[1]);
                unit.setDescription(row[2]);
                unit.setActive(true);
                unitOfMeasureRepository.save(unit);
            }
        }

        Map<String, UUID> byCode = new LinkedHashMap<>();
        unitOfMeasureRepository
                .findAllByCompanyIdOrderByNameAsc(companyId)
                .forEach(unit -> byCode.put(unit.getCode(), unit.getId()));
        return byCode;
    }

    private Map<String, UUID> seedCategories(UUID companyId, boolean full) {

        String[][] rows = full
                ? new String[][] {
                        {"Beverages", "Bottled and canned drinks"},
                        {"Snacks", "Packaged snack foods"},
                        {"Dry Goods", "Shelf-stable pantry staples"},
                        {"Cleaning Supplies", "Janitorial and cleaning products"},
                        {"Paper Products", "Disposable paper goods"},
                        {"Packaging", "Boxes, tape and shipping supplies"},
                        {"Personal Care", "Health and hygiene products"},
                        {"Office Supplies", "General office consumables"},
                }
                : new String[][] {
                        {"Beverages", "Bottled and canned drinks"},
                        {"Packaging", "Boxes, tape and shipping supplies"},
                };

        for (String[] row : rows) {
            if (!categoryRepository.existsByCompanyIdAndName(companyId, row[0])) {
                Category category = new Category();
                category.setCompanyId(companyId);
                category.setName(row[0]);
                category.setDescription(row[1]);
                category.setActive(true);
                categoryRepository.save(category);
            }
        }

        Map<String, UUID> byName = new LinkedHashMap<>();
        categoryRepository
                .findAllByCompanyIdOrderByNameAsc(companyId)
                .forEach(category -> byName.put(category.getName(), category.getId()));
        return byName;
    }

    private void seedProducts(
            UUID companyId,
            Map<String, UUID> categories,
            Map<String, UUID> units,
            boolean full
    ) {
        UUID ea = units.getOrDefault("EA", units.values().iterator().next());
        UUID box = units.getOrDefault("BOX", ea);
        UUID caseUnit = units.getOrDefault("CASE", ea);

        // {categoryName, skuPrefix, name, cost, price, unitId, active}
        List<Object[]> rows = new ArrayList<>();

        if (full) {
            addProductRow(rows, categories, "Beverages", "BEV-001", "Spring Water 500ml (24-pack)", "6.40", "11.99", caseUnit, true);
            addProductRow(rows, categories, "Beverages", "BEV-002", "Sparkling Water 330ml (12-pack)", "5.10", "9.49", caseUnit, true);
            addProductRow(rows, categories, "Beverages", "BEV-003", "Cola 355ml (24-pack)", "8.20", "14.99", caseUnit, true);
            addProductRow(rows, categories, "Beverages", "BEV-004", "Orange Juice 1L", "1.80", "3.49", ea, true);
            addProductRow(rows, categories, "Beverages", "BEV-005", "Cold Brew Coffee 250ml", "1.10", "2.99", ea, true);
            addProductRow(rows, categories, "Beverages", "BEV-006", "Herbal Tea Box (40 bags)", "2.40", "4.99", box, false);

            addProductRow(rows, categories, "Snacks", "SNK-001", "Potato Chips 150g", "0.95", "2.29", ea, true);
            addProductRow(rows, categories, "Snacks", "SNK-002", "Pretzels 200g", "0.85", "2.09", ea, true);
            addProductRow(rows, categories, "Snacks", "SNK-003", "Mixed Nuts 250g", "2.10", "4.79", ea, true);
            addProductRow(rows, categories, "Snacks", "SNK-004", "Granola Bars (12-count)", "2.60", "5.49", box, true);
            addProductRow(rows, categories, "Snacks", "SNK-005", "Dark Chocolate Bar 100g", "1.20", "2.89", ea, true);

            addProductRow(rows, categories, "Dry Goods", "DRY-001", "All-Purpose Flour 2kg", "1.90", "3.99", ea, true);
            addProductRow(rows, categories, "Dry Goods", "DRY-002", "White Rice 5kg", "5.40", "9.99", ea, true);
            addProductRow(rows, categories, "Dry Goods", "DRY-003", "Rolled Oats 1kg", "1.70", "3.49", ea, true);
            addProductRow(rows, categories, "Dry Goods", "DRY-004", "Granulated Sugar 2kg", "1.85", "3.79", ea, true);
            addProductRow(rows, categories, "Dry Goods", "DRY-005", "Pasta Penne 500g (case of 12)", "7.80", "13.99", caseUnit, true);

            addProductRow(rows, categories, "Cleaning Supplies", "CLN-001", "All-Purpose Cleaner 1L", "1.60", "3.29", ea, true);
            addProductRow(rows, categories, "Cleaning Supplies", "CLN-002", "Dish Soap 750ml", "1.30", "2.79", ea, true);
            addProductRow(rows, categories, "Cleaning Supplies", "CLN-003", "Bleach 2L", "1.75", "3.49", ea, true);
            addProductRow(rows, categories, "Cleaning Supplies", "CLN-004", "Microfiber Cloths (10-pack)", "3.20", "6.99", box, true);
            addProductRow(rows, categories, "Cleaning Supplies", "CLN-005", "Trash Bags 50L (40-count)", "4.10", "7.99", box, true);

            addProductRow(rows, categories, "Paper Products", "PAP-001", "Paper Towels (6 rolls)", "4.50", "8.49", box, true);
            addProductRow(rows, categories, "Paper Products", "PAP-002", "Bath Tissue (12 rolls)", "5.90", "10.99", box, true);
            addProductRow(rows, categories, "Paper Products", "PAP-003", "Facial Tissue (4 boxes)", "3.10", "5.99", box, true);
            addProductRow(rows, categories, "Paper Products", "PAP-004", "Napkins 1-ply (500-count)", "2.20", "4.49", box, true);
            addProductRow(rows, categories, "Paper Products", "PAP-005", "Paper Plates 9in (100-count)", "3.40", "6.49", box, false);

            addProductRow(rows, categories, "Packaging", "PKG-001", "Corrugated Box 12x12x12", "0.70", "1.49", ea, true);
            addProductRow(rows, categories, "Packaging", "PKG-002", "Corrugated Box 18x18x18", "1.20", "2.49", ea, true);
            addProductRow(rows, categories, "Packaging", "PKG-003", "Packing Tape 48mm x 100m", "1.10", "2.29", ea, true);
            addProductRow(rows, categories, "Packaging", "PKG-004", "Bubble Wrap 500mm x 50m", "8.50", "15.99", ea, true);
            addProductRow(rows, categories, "Packaging", "PKG-005", "Stretch Wrap 500mm (per roll)", "3.90", "7.49", ea, true);
            addProductRow(rows, categories, "Packaging", "PKG-006", "Shipping Labels 4x6 (250-count)", "5.20", "9.99", box, true);

            addProductRow(rows, categories, "Personal Care", "PER-001", "Hand Soap 500ml", "1.40", "2.99", ea, true);
            addProductRow(rows, categories, "Personal Care", "PER-002", "Hand Sanitizer 250ml", "1.60", "3.29", ea, true);
            addProductRow(rows, categories, "Personal Care", "PER-003", "Disposable Gloves (100-count)", "3.80", "7.49", box, true);
            addProductRow(rows, categories, "Personal Care", "PER-004", "Face Masks (50-count)", "4.20", "8.99", box, true);

            addProductRow(rows, categories, "Office Supplies", "OFF-001", "Ballpoint Pens (50-pack)", "3.10", "6.49", box, true);
            addProductRow(rows, categories, "Office Supplies", "OFF-002", "Copy Paper A4 (500 sheets)", "3.90", "7.99", ea, true);
            addProductRow(rows, categories, "Office Supplies", "OFF-003", "Sticky Notes (12-pack)", "4.60", "8.99", box, true);
            addProductRow(rows, categories, "Office Supplies", "OFF-004",
                    "Heavy-Duty Stapler with Built-in Staple Remover and 5000 Standard "
                            + "Staples Value Bundle for High-Volume Warehouse Office Use", "6.40", "12.99", ea, true);
        } else {
            addProductRow(rows, categories, "Beverages", "BEV-001", "Spring Water 500ml (24-pack)", "6.40", "11.99", caseUnit, true);
            addProductRow(rows, categories, "Beverages", "BEV-002", "Cola 355ml (24-pack)", "8.20", "14.99", caseUnit, true);
            addProductRow(rows, categories, "Packaging", "PKG-001", "Corrugated Box 12x12x12", "0.70", "1.49", ea, true);
        }

        int index = 0;

        for (Object[] row : rows) {
            index++;
            String sku = "NW-" + (String) row[1];

            if (productRepository.existsByCompanyIdAndSku(companyId, sku)) {
                continue;
            }

            Product product = new Product();
            product.setCompanyId(companyId);
            product.setCategoryId((UUID) row[0]);
            product.setUnitOfMeasureId((UUID) row[5]);
            product.setSku(sku);
            product.setName((String) row[2]);
            product.setDescription("Demo product — " + row[2]);
            product.setBarcode(String.format(
                    Locale.ROOT,
                    "%s%010d",
                    companyId.equals(DEMO_COMPANY_ID) ? "10" : "20",
                    index
            ));
            product.setCostPrice(new BigDecimal((String) row[3]));
            product.setSellingPrice(new BigDecimal((String) row[4]));
            product.setActive((Boolean) row[6]);
            productRepository.save(product);
        }
    }

    private void addProductRow(
            List<Object[]> rows,
            Map<String, UUID> categories,
            String categoryName,
            String skuPrefix,
            String name,
            String cost,
            String price,
            UUID unitId,
            boolean active
    ) {
        UUID categoryId = categories.get(categoryName);

        if (categoryId == null) {
            return;
        }

        rows.add(new Object[] {categoryId, skuPrefix, name, cost, price, unitId, active});
    }

    private void seedCustomers(UUID companyId, boolean full) {

        // {code, name, contactEmailLocalPart, phone, city, state, active}
        String[][] rows = full
                ? new String[][] {
                        {"CUST-0001", "Maple Market", "orders", "+1-555-0301", "Toronto", "ON", "true"},
                        {"CUST-0002", "Northstar Grocers", "purchasing", "+1-555-0302", "Ottawa", "ON", "true"},
                        {"CUST-0003", "Green Valley Foods", "ap", "+1-555-0303", "Hamilton", "ON", "true"},
                        {"CUST-0004", "Lakeside Convenience", "store12", "+1-555-0304", "Kingston", "ON", "true"},
                        {"CUST-0005", "Oakridge Retail", "buyer", "+1-555-0305", "London", "ON", "true"},
                        {"CUST-0006", "Riverbend Supermarket", "orders", "+1-555-0306", "Windsor", "ON", "true"},
                        {"CUST-0007", "Summit Wholesale Club", "procurement", "+1-555-0307", "Barrie", "ON", "true"},
                        {"CUST-0008", "Harbourfront Deli", "owner", "+1-555-0308", "Toronto", "ON", "true"},
                        {"CUST-0009", "Cedar Street Pharmacy", "orders", "+1-555-0309", "Guelph", "ON", "true"},
                        {"CUST-0010", "Prairie Pantry Co-op", "buying", "+1-555-0310", "Mississauga", "ON", "true"},
                        {"CUST-0011", "Beacon Hill Grocery", "orders", "+1-555-0311", "Oshawa", "ON", "true"},
                        {"CUST-0012", "Willowbrook Foods", "ap", "+1-555-0312", "Markham", "ON", "true"},
                        {"CUST-0013", "Ironwood Restaurant Group", "supply", "+1-555-0313", "Toronto", "ON", "true"},
                        {"CUST-0014", "Silver Lake Catering", "events", "+1-555-0314", "Kitchener", "ON", "true"},
                        {"CUST-0015", "Downtown Corner Store", "manager", "+1-555-0315", "Brampton", "ON", "true"},
                        {"CUST-0016", "Evergreen Health Foods", "orders", "+1-555-0316", "Burlington", "ON", "true"},
                        {"CUST-0017", "Fairview Hospitality Supplies", "procurement", "+1-555-0317", "Vaughan", "ON", "true"},
                        {"CUST-0018", "Northgate Cash & Carry", "buyer", "+1-555-0318", "Sudbury", "ON", "false"},
                        {"CUST-0019", "Coastal Provisions (seasonal account, currently dormant)", "orders", "+1-555-0319", "Thunder Bay", "ON", "false"},
                        {"CUST-0020", "Union Square Bistro", "chef", "+1-555-0320", "Toronto", "ON", "true"},
                }
                : new String[][] {
                        {"CUST-0001", "Bluewater Trading Co.", "orders", "+1-555-0401", "Calgary", "AB", "true"},
                        {"CUST-0002", "Rockyview Distributors", "ap", "+1-555-0402", "Edmonton", "AB", "true"},
                };

        for (String[] row : rows) {
            if (customerRepository.existsByCompanyIdAndCustomerCode(companyId, row[0])) {
                continue;
            }

            Customer customer = new Customer();
            customer.setCompanyId(companyId);
            customer.setCustomerCode(row[0]);
            customer.setName(row[1]);
            customer.setEmail(row[2] + "@" + slug(row[1]) + ".example.test");
            customer.setPhone(row[3]);
            customer.setBillingAddressLine1("100 " + row[4] + " Distribution Way");
            customer.setBillingCity(row[4]);
            customer.setBillingState(row[5]);
            customer.setBillingPostalCode("A1A 1A1");
            customer.setBillingCountry("Canada");
            customer.setShippingAddressLine1("100 " + row[4] + " Distribution Way");
            customer.setShippingCity(row[4]);
            customer.setShippingState(row[5]);
            customer.setShippingPostalCode("A1A 1A1");
            customer.setShippingCountry("Canada");
            customer.setActive(Boolean.parseBoolean(row[6]));
            customerRepository.save(customer);
        }
    }

    private void seedSuppliers(UUID companyId, boolean full) {

        // {code, name, contactLocalPart, phone, city, state, active}
        String[][] rows = full
                ? new String[][] {
                        {"SUP-0001", "Northern Supply Co.", "sales", "+1-555-0501", "Toronto", "ON", "true"},
                        {"SUP-0002", "Maple Distribution", "orders", "+1-555-0502", "Montreal", "QC", "true"},
                        {"SUP-0003", "Prairie Packaging", "quotes", "+1-555-0503", "Winnipeg", "MB", "true"},
                        {"SUP-0004", "Ontario Wholesale Supply", "accounts", "+1-555-0504", "London", "ON", "true"},
                        {"SUP-0005", "Great Lakes Foods", "sales", "+1-555-0505", "Hamilton", "ON", "true"},
                        {"SUP-0006", "Cascade Beverage Partners", "sales", "+1-555-0506", "Vancouver", "BC", "true"},
                        {"SUP-0007", "Evergreen Paper Mills", "orders", "+1-555-0507", "Thunder Bay", "ON", "true"},
                        {"SUP-0008", "Summit Cleaning Products", "sales", "+1-555-0508", "Calgary", "AB", "true"},
                        {"SUP-0009", "Riverside Personal Care Mfg.", "wholesale", "+1-555-0509", "Kitchener", "ON", "true"},
                        {"SUP-0010", "Harbour Office Distributors", "sales", "+1-555-0510", "Halifax", "NS", "true"},
                        {"SUP-0011", "Ironclad Industrial Packaging", "quotes", "+1-555-0511", "Windsor", "ON", "false"},
                        {"SUP-0012", "Golden Field Dry Goods", "orders", "+1-555-0512", "Saskatoon", "SK", "true"},
                }
                : new String[][] {
                        {"SUP-0001", "Foothills Import Partners", "sales", "+1-555-0601", "Calgary", "AB", "true"},
                        {"SUP-0002", "Prairie Rail Freight Supply", "orders", "+1-555-0602", "Regina", "SK", "true"},
                };

        for (String[] row : rows) {
            if (supplierRepository.existsByCompanyIdAndSupplierCode(companyId, row[0])) {
                continue;
            }

            Supplier supplier = new Supplier();
            supplier.setCompanyId(companyId);
            supplier.setSupplierCode(row[0]);
            supplier.setName(row[1]);
            supplier.setEmail(row[2] + "@" + slug(row[1]) + ".example.test");
            supplier.setPhone(row[3]);
            supplier.setAddressLine1("500 " + row[4] + " Industrial Blvd");
            supplier.setCity(row[4]);
            supplier.setState(row[5]);
            supplier.setPostalCode("B2B 2B2");
            supplier.setCountry("Canada");
            supplier.setActive(Boolean.parseBoolean(row[6]));
            supplierRepository.save(supplier);
        }
    }

    private void seedWarehouses(UUID companyId, boolean full) {

        // {code, name, city, state, seedLocations}
        String[][] rows = full
                ? new String[][] {
                        {"WH-MAIN", "Main Distribution Centre", "Toronto", "ON", "true"},
                        {"WH-NORTH", "North Warehouse", "Barrie", "ON", "true"},
                        {"WH-OVERFLOW", "Overflow Warehouse", "Vaughan", "ON", "true"},
                        {"WH-RETURNS", "Returns Warehouse", "Mississauga", "ON", "false"},
                }
                : new String[][] {
                        {"WH-TEST", "Test Distribution Centre", "Calgary", "AB", "true"},
                };

        for (String[] row : rows) {

            Warehouse warehouse = warehouseRepository
                    .findByCompanyId(companyId)
                    .stream()
                    .filter(existing -> existing.getCode().equals(row[0]))
                    .findFirst()
                    .orElse(null);

            if (warehouse == null) {
                warehouse = new Warehouse();
                warehouse.setCompanyId(companyId);
                warehouse.setCode(row[0]);
                warehouse.setName(row[1]);
                warehouse.setAddressLine1("1 " + row[1] + " Road");
                warehouse.setCity(row[2]);
                warehouse.setState(row[3]);
                warehouse.setPostalCode("C3C 3C3");
                warehouse.setCountry("Canada");
                warehouse.setActive(true);
                warehouse = warehouseRepository.save(warehouse);
            }

            if (Boolean.parseBoolean(row[4])) {
                seedWarehouseLocations(warehouse.getId(), full);
            }
        }
    }

    private void seedWarehouseLocations(UUID warehouseId, boolean full) {

        // {code, type, name}
        String[][] rows = full
                ? new String[][] {
                        {"RECEIVING", "RECEIVING", "Inbound receiving dock"},
                        {"A-01-01", "STORAGE", "Aisle A, Bay 1, Level 1"},
                        {"A-01-02", "STORAGE", "Aisle A, Bay 1, Level 2"},
                        {"A-02-01", "STORAGE", "Aisle A, Bay 2, Level 1"},
                        {"B-01-01", "STORAGE", "Aisle B, Bay 1, Level 1"},
                        {"B-01-02", "STORAGE", "Aisle B, Bay 1, Level 2"},
                        {"C-01-01", "STORAGE", "Aisle C, Bay 1, Level 1"},
                        {"PICK-01", "PICKING", "Pick face 1"},
                        {"PICK-02", "PICKING", "Pick face 2"},
                        {"PACK-01", "PACKING", "Packing bench 1"},
                        {"STAGING", "SHIPPING", "Outbound staging area"},
                        {"SHIPPING", "SHIPPING", "Outbound shipping dock"},
                        {"QUARANTINE", "QUARANTINE", "Hold for inspection"},
                        {"DAMAGED", "DAMAGED", "Damaged goods hold"},
                }
                : new String[][] {
                        {"RECEIVING", "RECEIVING", "Inbound receiving dock"},
                        {"T-01-01", "STORAGE", "Test aisle, Bay 1, Level 1"},
                        {"SHIPPING", "SHIPPING", "Outbound shipping dock"},
                };

        for (String[] row : rows) {
            if (warehouseLocationRepository.existsByWarehouseIdAndCode(warehouseId, row[0])) {
                continue;
            }

            WarehouseLocation location = new WarehouseLocation();
            location.setWarehouseId(warehouseId);
            location.setCode(row[0]);
            location.setLocationType(row[1]);
            location.setName(row[2]);
            location.setActive(true);
            warehouseLocationRepository.save(location);
        }
    }

    /* ===================================================================
       STATIC DEFINITIONS
       =================================================================== */

    private static String slug(String value) {
        String slug = value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return slug.isEmpty() ? "demo" : slug;
    }

    private static String roleDescription(String roleName) {
        return switch (roleName) {
            case "SYSTEM_ADMIN" -> "Full access to all Nextware functionality.";
            case "WAREHOUSE_MANAGER" -> "Manages warehouses, locations and inventory operations.";
            case "INVENTORY_CLERK" -> "Performs day-to-day inventory movements and counts.";
            case "PURCHASING_USER" -> "Manages suppliers and purchase orders.";
            case "SALES_USER" -> "Manages customers and sales orders.";
            case "READ_ONLY_USER" -> "Read-only access to all modules.";
            default -> roleName;
        };
    }

    private static Map<String, Set<String>> roleMatrix() {

        Map<String, Set<String>> matrix = new LinkedHashMap<>();

        matrix.put("SYSTEM_ADMIN", Set.of("*"));

        matrix.put("WAREHOUSE_MANAGER", new LinkedHashSet<>(List.of(
                "WAREHOUSE_VIEW", "WAREHOUSE_CREATE", "WAREHOUSE_UPDATE", "WAREHOUSE_DELETE",
                "WAREHOUSE_LOCATION_VIEW", "WAREHOUSE_LOCATION_CREATE",
                "WAREHOUSE_LOCATION_UPDATE", "WAREHOUSE_LOCATION_DELETE",
                "INVENTORY_VIEW", "INVENTORY_ADJUST", "INVENTORY_TRANSFER",
                "INVENTORY_CYCLE_COUNT", "INVENTORY_RESERVATION_VIEW",
                "PRODUCT_VIEW", "CATEGORY_VIEW", "UNIT_OF_MEASURE_VIEW",
                "PICK_LIST_VIEW", "PACKAGE_VIEW", "SHIPMENT_VIEW", "REPORT_VIEW"
        )));

        matrix.put("INVENTORY_CLERK", new LinkedHashSet<>(List.of(
                "INVENTORY_VIEW", "INVENTORY_ADJUST", "INVENTORY_TRANSFER", "INVENTORY_CYCLE_COUNT",
                "WAREHOUSE_VIEW", "WAREHOUSE_LOCATION_VIEW",
                "PRODUCT_VIEW", "CATEGORY_VIEW", "UNIT_OF_MEASURE_VIEW"
        )));

        matrix.put("PURCHASING_USER", new LinkedHashSet<>(List.of(
                "SUPPLIER_VIEW", "SUPPLIER_CREATE", "SUPPLIER_UPDATE", "SUPPLIER_DELETE",
                "PURCHASE_ORDER_VIEW", "PURCHASE_ORDER_CREATE", "PURCHASE_ORDER_UPDATE",
                "PURCHASE_ORDER_APPROVE", "PURCHASE_RECEIPT_VIEW", "PURCHASE_RECEIPT_CREATE",
                "PRODUCT_VIEW", "CATEGORY_VIEW", "UNIT_OF_MEASURE_VIEW", "INVENTORY_VIEW", "REPORT_VIEW"
        )));

        matrix.put("SALES_USER", new LinkedHashSet<>(List.of(
                "CUSTOMER_VIEW", "CUSTOMER_CREATE", "CUSTOMER_UPDATE", "CUSTOMER_DELETE",
                "SALES_ORDER_VIEW", "SALES_ORDER_CREATE", "SALES_ORDER_UPDATE", "SALES_ORDER_APPROVE",
                "INVENTORY_RESERVATION_VIEW", "INVENTORY_RESERVATION_CREATE",
                "PRODUCT_VIEW", "INVENTORY_VIEW", "REPORT_VIEW"
        )));

        matrix.put("READ_ONLY_USER", new LinkedHashSet<>(List.of(
                "COMPANY_VIEW", "USER_VIEW", "ROLE_VIEW", "PERMISSION_VIEW",
                "PRODUCT_VIEW", "CATEGORY_VIEW", "UNIT_OF_MEASURE_VIEW",
                "CUSTOMER_VIEW", "SUPPLIER_VIEW",
                "WAREHOUSE_VIEW", "WAREHOUSE_LOCATION_VIEW",
                "INVENTORY_VIEW", "INVENTORY_RESERVATION_VIEW",
                "PURCHASE_ORDER_VIEW", "PURCHASE_RECEIPT_VIEW",
                "SALES_ORDER_VIEW", "PICK_LIST_VIEW", "PACKAGE_VIEW", "SHIPMENT_VIEW",
                "REPORT_VIEW", "DOCUMENT_VIEW", "AUDIT_VIEW"
        )));

        return matrix;
    }

    private static Map<String, String> permissionCatalog() {

        Map<String, String> permissions = new LinkedHashMap<>();

        permissions.put("COMPANY_VIEW", "View company information.");
        permissions.put("COMPANY_CREATE", "Create companies.");
        permissions.put("COMPANY_UPDATE", "Update company information.");

        permissions.put("USER_VIEW", "View users.");
        permissions.put("USER_CREATE", "Create users.");
        permissions.put("USER_UPDATE", "Update users.");
        permissions.put("USER_DELETE", "Deactivate or delete users.");

        permissions.put("ROLE_VIEW", "View roles.");
        permissions.put("ROLE_CREATE", "Create roles.");
        permissions.put("ROLE_UPDATE", "Update roles.");
        permissions.put("ROLE_DELETE", "Deactivate or delete roles.");

        permissions.put("PERMISSION_VIEW", "View permissions.");

        permissions.put("PRODUCT_VIEW", "View products.");
        permissions.put("PRODUCT_CREATE", "Create products.");
        permissions.put("PRODUCT_UPDATE", "Update products.");
        permissions.put("PRODUCT_DELETE", "Deactivate or delete products.");

        permissions.put("CATEGORY_VIEW", "View product categories.");
        permissions.put("CATEGORY_CREATE", "Create product categories.");
        permissions.put("CATEGORY_UPDATE", "Update product categories.");
        permissions.put("CATEGORY_DELETE", "Deactivate or delete product categories.");

        permissions.put("UNIT_OF_MEASURE_VIEW", "View units of measure.");
        permissions.put("UNIT_OF_MEASURE_CREATE", "Create units of measure.");
        permissions.put("UNIT_OF_MEASURE_UPDATE", "Update units of measure.");
        permissions.put("UNIT_OF_MEASURE_DELETE", "Deactivate or delete units of measure.");

        permissions.put("CUSTOMER_VIEW", "View customers.");
        permissions.put("CUSTOMER_CREATE", "Create customers.");
        permissions.put("CUSTOMER_UPDATE", "Update customers.");
        permissions.put("CUSTOMER_DELETE", "Deactivate or delete customers.");

        permissions.put("SUPPLIER_VIEW", "View suppliers.");
        permissions.put("SUPPLIER_CREATE", "Create suppliers.");
        permissions.put("SUPPLIER_UPDATE", "Update suppliers.");
        permissions.put("SUPPLIER_DELETE", "Deactivate or delete suppliers.");

        permissions.put("WAREHOUSE_VIEW", "View warehouses.");
        permissions.put("WAREHOUSE_CREATE", "Create warehouses.");
        permissions.put("WAREHOUSE_UPDATE", "Update warehouses.");
        permissions.put("WAREHOUSE_DELETE", "Deactivate or delete warehouses.");

        permissions.put("WAREHOUSE_LOCATION_VIEW", "View warehouse locations.");
        permissions.put("WAREHOUSE_LOCATION_CREATE", "Create warehouse locations.");
        permissions.put("WAREHOUSE_LOCATION_UPDATE", "Update warehouse locations.");
        permissions.put("WAREHOUSE_LOCATION_DELETE", "Deactivate or delete warehouse locations.");

        permissions.put("INVENTORY_VIEW", "View inventory.");
        permissions.put("INVENTORY_ADJUST", "Adjust inventory.");
        permissions.put("INVENTORY_TRANSFER", "Transfer inventory.");
        permissions.put("INVENTORY_CYCLE_COUNT", "Perform inventory cycle counts.");
        permissions.put("INVENTORY_RESERVATION_VIEW", "View inventory reservations.");
        permissions.put("INVENTORY_RESERVATION_CREATE", "Create inventory reservations.");

        permissions.put("PURCHASE_ORDER_VIEW", "View purchase orders.");
        permissions.put("PURCHASE_ORDER_CREATE", "Create purchase orders.");
        permissions.put("PURCHASE_ORDER_UPDATE", "Update purchase orders.");
        permissions.put("PURCHASE_ORDER_APPROVE", "Approve purchase orders.");
        permissions.put("PURCHASE_RECEIPT_VIEW", "View purchase receipts.");
        permissions.put("PURCHASE_RECEIPT_CREATE", "Create purchase receipts.");

        permissions.put("SALES_ORDER_VIEW", "View sales orders.");
        permissions.put("SALES_ORDER_CREATE", "Create sales orders.");
        permissions.put("SALES_ORDER_UPDATE", "Update sales orders.");
        permissions.put("SALES_ORDER_APPROVE", "Approve sales orders.");

        permissions.put("PICK_LIST_VIEW", "View pick lists.");
        permissions.put("PICK_LIST_CREATE", "Create pick lists.");
        permissions.put("PICK_LIST_UPDATE", "Update pick lists.");

        permissions.put("PACKAGE_VIEW", "View packages.");
        permissions.put("PACKAGE_CREATE", "Create packages.");
        permissions.put("PACKAGE_UPDATE", "Update packages.");

        permissions.put("SHIPMENT_VIEW", "View shipments.");
        permissions.put("SHIPMENT_CREATE", "Create shipments.");
        permissions.put("SHIPMENT_UPDATE", "Update shipments.");

        permissions.put("REPORT_VIEW", "View reports.");
        permissions.put("DOCUMENT_VIEW", "View documents.");
        permissions.put("AUDIT_VIEW", "View audit information.");

        return permissions;
    }

    private record UserSpec(
            String username,
            String firstName,
            String lastName,
            String role
    ) {
    }
}
