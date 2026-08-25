package com.nextware.config;

import com.nextware.entity.Permission;
import com.nextware.entity.Role;
import com.nextware.entity.User;
import com.nextware.repository.CompanyRepository;
import com.nextware.repository.PermissionRepository;
import com.nextware.repository.RoleRepository;
import com.nextware.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@Profile("dev")
public class DevelopmentSecurityBootstrap implements CommandLineRunner {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    private final boolean enabled;
    private final String companyId;
    private final String username;
    private final String email;
    private final String password;

    public DevelopmentSecurityBootstrap(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            PasswordEncoder passwordEncoder,
            @Value("${nextware.security.bootstrap.enabled:false}")
            boolean enabled,
            @Value("${nextware.security.bootstrap.company-id:}")
            String companyId,
            @Value("${nextware.security.bootstrap.username:admin}")
            String username,
            @Value("${nextware.security.bootstrap.email:admin@nextware.local}")
            String email,
            @Value("${nextware.security.bootstrap.password:}")
            String password
    ) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.companyId = companyId;
        this.username = username;
        this.email = email;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(String... args) {

        if (!enabled) {
            return;
        }

        if (companyId == null || companyId.isBlank()) {
            throw new IllegalStateException(
                    "Development security bootstrap is enabled, " +
                    "but NEXTWARE_BOOTSTRAP_COMPANY_ID is not configured."
            );
        }

        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "Development security bootstrap is enabled, " +
                    "but NEXTWARE_BOOTSTRAP_PASSWORD is not configured."
            );
        }

        UUID configuredCompanyId;

        try {
            configuredCompanyId = UUID.fromString(companyId);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "NEXTWARE_BOOTSTRAP_COMPANY_ID must be a valid UUID.",
                    exception
            );
        }

        companyRepository
                .findByIdAndActiveTrue(configuredCompanyId)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Development bootstrap company was not found or is inactive: "
                                        + configuredCompanyId
                        )
                );

        Role adminRole = roleRepository
                .findByCompanyIdAndName(
                        configuredCompanyId,
                        "ADMIN"
                )
                .orElseGet(() -> {
                    Role role = new Role();

                    role.setCompanyId(configuredCompanyId);
                    role.setName("ADMIN");
                    role.setDescription(
                            "Development administrator with full Nextware access."
                    );
                    role.setActive(true);

                    return roleRepository.save(role);
                });

        if (!adminRole.isActive()) {
            adminRole.setActive(true);
        }

        Map<String, String> permissionDefinitions =
                permissionDefinitions();

        Set<Permission> adminPermissions =
                new LinkedHashSet<>();

        for (Map.Entry<String, String> entry :
                permissionDefinitions.entrySet()) {

            Permission permission = permissionRepository
                    .findByCode(entry.getKey())
                    .orElseGet(() -> {

                        Permission newPermission =
                                new Permission();

                        newPermission.setCode(
                                entry.getKey()
                        );

                        newPermission.setDescription(
                                entry.getValue()
                        );

                        return permissionRepository.save(
                                newPermission
                        );
                    });

            adminPermissions.add(permission);
        }

        adminRole.getPermissions()
                .addAll(adminPermissions);

        adminRole = roleRepository.save(adminRole);

        User adminUser = userRepository
                .findByCompanyIdAndUsername(
                        configuredCompanyId,
                        username
                )
                .orElseGet(() -> {

                    User user = new User();

                    user.setCompanyId(
                            configuredCompanyId
                    );

                    user.setUsername(username);
                    user.setEmail(email);

                    user.setFirstName("Admin");
                    user.setLastName("User");

                    user.setActive(true);

                    return user;
                });

        adminUser.setEmail(email);
        adminUser.setActive(true);

        adminUser.setPasswordHash(
                passwordEncoder.encode(password)
        );

        adminUser.getRoles()
                .add(adminRole);

        userRepository.save(adminUser);

        System.out.println(
                "Nextware development security bootstrap completed "
                        + "for company "
                        + configuredCompanyId
                        + " and user "
                        + username
        );
    }

    private Map<String, String> permissionDefinitions() {

        Map<String, String> permissions =
                new LinkedHashMap<>();

        permissions.put(
                "COMPANY_VIEW",
                "View company information."
        );

        permissions.put(
                "COMPANY_CREATE",
                "Create companies."
        );

        permissions.put(
                "COMPANY_UPDATE",
                "Update company information."
        );

        permissions.put(
                "USER_VIEW",
                "View users."
        );

        permissions.put(
                "USER_CREATE",
                "Create users."
        );

        permissions.put(
                "USER_UPDATE",
                "Update users."
        );

        permissions.put(
                "USER_DELETE",
                "Deactivate or delete users."
        );

        permissions.put(
                "ROLE_VIEW",
                "View roles."
        );

        permissions.put(
                "ROLE_CREATE",
                "Create roles."
        );

        permissions.put(
                "ROLE_UPDATE",
                "Update roles."
        );

        permissions.put(
                "ROLE_DELETE",
                "Deactivate or delete roles."
        );

        permissions.put(
                "PERMISSION_VIEW",
                "View permissions."
        );

        permissions.put(
                "PRODUCT_VIEW",
                "View products."
        );

        permissions.put(
                "PRODUCT_CREATE",
                "Create products."
        );

        permissions.put(
                "PRODUCT_UPDATE",
                "Update products."
        );

        permissions.put(
                "PRODUCT_DELETE",
                "Deactivate or delete products."
        );

        permissions.put(
                "CATEGORY_VIEW",
                "View product categories."
        );

        permissions.put(
                "CATEGORY_CREATE",
                "Create product categories."
        );

        permissions.put(
                "CATEGORY_UPDATE",
                "Update product categories."
        );

        permissions.put(
                "CATEGORY_DELETE",
                "Deactivate or delete product categories."
        );

        permissions.put(
                "UNIT_OF_MEASURE_VIEW",
                "View units of measure."
        );

        permissions.put(
                "UNIT_OF_MEASURE_CREATE",
                "Create units of measure."
        );

        permissions.put(
                "UNIT_OF_MEASURE_UPDATE",
                "Update units of measure."
        );

        permissions.put(
                "UNIT_OF_MEASURE_DELETE",
                "Deactivate or delete units of measure."
        );

        permissions.put(
                "CUSTOMER_VIEW",
                "View customers."
        );

        permissions.put(
                "CUSTOMER_CREATE",
                "Create customers."
        );

        permissions.put(
                "CUSTOMER_UPDATE",
                "Update customers."
        );

        permissions.put(
                "CUSTOMER_DELETE",
                "Deactivate or delete customers."
        );

        permissions.put(
                "SUPPLIER_VIEW",
                "View suppliers."
        );

        permissions.put(
                "SUPPLIER_CREATE",
                "Create suppliers."
        );

        permissions.put(
                "SUPPLIER_UPDATE",
                "Update suppliers."
        );

        permissions.put(
                "SUPPLIER_DELETE",
                "Deactivate or delete suppliers."
        );

        permissions.put(
                "WAREHOUSE_VIEW",
                "View warehouses."
        );

        permissions.put(
                "WAREHOUSE_CREATE",
                "Create warehouses."
        );

        permissions.put(
                "WAREHOUSE_UPDATE",
                "Update warehouses."
        );

        permissions.put(
                "WAREHOUSE_DELETE",
                "Deactivate or delete warehouses."
        );

        permissions.put(
                "WAREHOUSE_LOCATION_VIEW",
                "View warehouse locations."
        );

        permissions.put(
                "WAREHOUSE_LOCATION_CREATE",
                "Create warehouse locations."
        );

        permissions.put(
                "WAREHOUSE_LOCATION_UPDATE",
                "Update warehouse locations."
        );

        permissions.put(
                "WAREHOUSE_LOCATION_DELETE",
                "Deactivate or delete warehouse locations."
        );

        permissions.put(
                "INVENTORY_VIEW",
                "View inventory."
        );

        permissions.put(
                "INVENTORY_ADJUST",
                "Adjust inventory."
        );

        permissions.put(
                "INVENTORY_TRANSFER",
                "Transfer inventory."
        );

        permissions.put(
                "INVENTORY_CYCLE_COUNT",
                "Perform inventory cycle counts."
        );

        permissions.put(
                "INVENTORY_RESERVATION_VIEW",
                "View inventory reservations."
        );

        permissions.put(
                "INVENTORY_RESERVATION_CREATE",
                "Create inventory reservations."
        );

        permissions.put(
                "PURCHASE_ORDER_VIEW",
                "View purchase orders."
        );

        permissions.put(
                "PURCHASE_ORDER_CREATE",
                "Create purchase orders."
        );

        permissions.put(
                "PURCHASE_ORDER_UPDATE",
                "Update purchase orders."
        );

        permissions.put(
                "PURCHASE_ORDER_APPROVE",
                "Approve purchase orders."
        );

        permissions.put(
                "PURCHASE_RECEIPT_VIEW",
                "View purchase receipts."
        );

        permissions.put(
                "PURCHASE_RECEIPT_CREATE",
                "Create purchase receipts."
        );

        permissions.put(
                "SALES_ORDER_VIEW",
                "View sales orders."
        );

        permissions.put(
                "SALES_ORDER_CREATE",
                "Create sales orders."
        );

        permissions.put(
                "SALES_ORDER_UPDATE",
                "Update sales orders."
        );

        permissions.put(
                "SALES_ORDER_APPROVE",
                "Approve sales orders."
        );

        permissions.put(
                "PICK_LIST_VIEW",
                "View pick lists."
        );

        permissions.put(
                "PICK_LIST_CREATE",
                "Create pick lists."
        );

        permissions.put(
                "PICK_LIST_UPDATE",
                "Update pick lists."
        );

        permissions.put(
                "PACKAGE_VIEW",
                "View packages."
        );

        permissions.put(
                "PACKAGE_CREATE",
                "Create packages."
        );

        permissions.put(
                "PACKAGE_UPDATE",
                "Update packages."
        );

        permissions.put(
                "SHIPMENT_VIEW",
                "View shipments."
        );

        permissions.put(
                "SHIPMENT_CREATE",
                "Create shipments."
        );

        permissions.put(
                "SHIPMENT_UPDATE",
                "Update shipments."
        );

        permissions.put(
                "REPORT_VIEW",
                "View reports."
        );

        permissions.put(
                "DOCUMENT_VIEW",
                "View documents."
        );

        permissions.put(
                "AUDIT_VIEW",
                "View audit information."
        );

        return permissions;
    }
}