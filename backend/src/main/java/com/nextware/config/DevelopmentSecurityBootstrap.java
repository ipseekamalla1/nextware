package com.nextware.config;

import com.nextware.entity.Permission;
import com.nextware.entity.Role;
import com.nextware.entity.User;
import com.nextware.repository.PermissionRepository;
import com.nextware.repository.RoleRepository;
import com.nextware.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
@Profile("dev")
public class DevelopmentSecurityBootstrap implements CommandLineRunner {

    private static final String ADMIN_ROLE = "ADMIN";

    private static final List<String> BOOTSTRAP_PERMISSIONS = List.of(
            "PRODUCT_VIEW",
            "PRODUCT_CREATE",
            "PRODUCT_UPDATE",
            "PRODUCT_DELETE",

            "CATEGORY_VIEW",
            "CATEGORY_CREATE",
            "CATEGORY_UPDATE",
            "CATEGORY_DELETE",

            "UNIT_OF_MEASURE_VIEW",
            "UNIT_OF_MEASURE_CREATE",
            "UNIT_OF_MEASURE_UPDATE",
            "UNIT_OF_MEASURE_DELETE",

            "CUSTOMER_VIEW",
            "CUSTOMER_CREATE",
            "CUSTOMER_UPDATE",
            "CUSTOMER_DELETE",

            "SUPPLIER_VIEW",
            "SUPPLIER_CREATE",
            "SUPPLIER_UPDATE",
            "SUPPLIER_DELETE",

            "WAREHOUSE_VIEW",
            "WAREHOUSE_CREATE",
            "WAREHOUSE_UPDATE",
            "WAREHOUSE_DELETE",

            "WAREHOUSE_LOCATION_VIEW",
            "WAREHOUSE_LOCATION_CREATE",
            "WAREHOUSE_LOCATION_UPDATE",
            "WAREHOUSE_LOCATION_DELETE",

            "INVENTORY_VIEW",
            "INVENTORY_ADJUST",

            "PURCHASE_ORDER_CREATE",
            "PURCHASE_ORDER_APPROVE",

            "SALES_ORDER_CREATE",
            "SALES_ORDER_APPROVE"
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${nextware.security.bootstrap.enabled:false}")
    private boolean enabled;

    @Value("${nextware.security.bootstrap.company-id:}")
    private String companyId;

    @Value("${nextware.security.bootstrap.username:admin}")
    private String username;

    @Value("${nextware.security.bootstrap.email:admin@nextware.local}")
    private String email;

    @Value("${nextware.security.bootstrap.password:}")
    private String password;

    public DevelopmentSecurityBootstrap(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {

        if (!enabled) {
            return;
        }

        UUID bootstrapCompanyId = parseRequiredUuid(
                companyId,
                "nextware.security.bootstrap.company-id"
        );

        validatePassword();

        Role adminRole = getOrCreateAdminRole(
                bootstrapCompanyId
        );

        Set<Permission> permissions =
                getOrCreatePermissions();

        adminRole.setPermissions(permissions);

        adminRole = roleRepository.save(adminRole);

        User adminUser = getOrCreateAdminUser(
                bootstrapCompanyId
        );

        Set<Role> roles = new LinkedHashSet<>();
        roles.add(adminRole);

        adminUser.setRoles(roles);

        userRepository.save(adminUser);
    }

    private Role getOrCreateAdminRole(
            UUID bootstrapCompanyId
    ) {

        return roleRepository
                .findByCompanyIdAndName(
                        bootstrapCompanyId,
                        ADMIN_ROLE
                )
                .orElseGet(() -> {

                    Role role = new Role();

                    role.setCompanyId(
                            bootstrapCompanyId
                    );

                    role.setName(ADMIN_ROLE);

                    role.setDescription(
                            "Development administrator"
                    );

                    role.setActive(true);

                    return role;
                });
    }

    private Set<Permission> getOrCreatePermissions() {

        Set<Permission> permissions =
                new LinkedHashSet<>();

        for (String code : BOOTSTRAP_PERMISSIONS) {

            Permission permission =
                    permissionRepository
                            .findByCode(code)
                            .orElseGet(() -> {

                                Permission newPermission =
                                        new Permission();

                                newPermission.setCode(code);

                                newPermission.setDescription(
                                        "Nextware permission: " + code
                                );

                                return permissionRepository.save(
                                        newPermission
                                );
                            });

            permissions.add(permission);
        }

        return permissions;
    }

    private User getOrCreateAdminUser(
            UUID bootstrapCompanyId
    ) {

        return userRepository
                .findByCompanyIdAndUsername(
                        bootstrapCompanyId,
                        username
                )
                .map(existingUser -> {

                    existingUser.setActive(true);

                    existingUser.setPasswordHash(
                            passwordEncoder.encode(password)
                    );

                    return existingUser;
                })
                .orElseGet(() -> {

                    User user = new User();

                    user.setCompanyId(
                            bootstrapCompanyId
                    );

                    user.setUsername(username);

                    user.setEmail(email);

                    user.setPasswordHash(
                            passwordEncoder.encode(password)
                    );

                    user.setFirstName("Admin");

                    user.setLastName("User");

                    user.setActive(true);

                    return user;
                });
    }

    private UUID parseRequiredUuid(
            String value,
            String propertyName
    ) {

        if (value == null || value.isBlank()) {

            throw new IllegalStateException(
                    "Missing required property: "
                            + propertyName
            );
        }

        try {

            return UUID.fromString(value);

        } catch (IllegalArgumentException exception) {

            throw new IllegalStateException(
                    "Invalid UUID for property: "
                            + propertyName,
                    exception
            );
        }
    }

    private void validatePassword() {

        if (password == null || password.isBlank()) {

            throw new IllegalStateException(
                    "Development bootstrap password is missing."
            );
        }

        if (password.length() < 8) {

            throw new IllegalStateException(
                    "Development bootstrap password must "
                            + "contain at least 8 characters."
            );
        }
    }
}