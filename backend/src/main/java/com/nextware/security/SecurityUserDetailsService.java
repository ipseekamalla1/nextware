package com.nextware.security;

import com.nextware.entity.User;
import com.nextware.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SecurityUserDetailsService
        implements UserDetailsService {

    private final UserRepository userRepository;

    public SecurityUserDetailsService(
            UserRepository userRepository
    ) {
        this.userRepository = userRepository;
    }

    public UserDetails loadUserByCompanyAndUsername(
            UUID companyId,
            String username
    ) {

        User user = userRepository
                .findByCompanyIdAndUsername(
                        companyId,
                        username
                )
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        )
                );

        return buildUserDetails(user);
    }

    @Override
    public UserDetails loadUserByUsername(
            String username
    ) {

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        )
                );

        return buildUserDetails(user);
    }

    private UserDetails buildUserDetails(User user) {

        var authorities =
                user.getRoles()
                        .stream()
                        .flatMap(role ->
                                role.getPermissions()
                                        .stream()
                        )
                        .map(permission ->
                                permission.getCode()
                        )
                        .map(org.springframework.security.core.authority.SimpleGrantedAuthority::new)
                        .toList();

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .disabled(!user.isActive())
                .build();
    }
}