package com.nextware.security;

import com.nextware.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
                jwtProperties.getSecret()
                        .getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generateToken(
            UUID userId,
            UUID companyId,
            String username,
            List<String> roles,
            List<String> permissions
    ) {

        Instant now = Instant.now();

        Instant expiration = now.plusSeconds(
                jwtProperties.getExpirationMinutes() * 60
        );

        return Jwts.builder()
                .subject(userId.toString())
                .claim("companyId", companyId.toString())
                .claim("username", username)
                .claim("roles", roles)
                .claim("permissions", permissions)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extractClaims(String token) {

        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractUserId(String token) {

        return UUID.fromString(
                extractClaims(token)
                        .getSubject()
        );
    }

    public UUID extractCompanyId(String token) {

        return UUID.fromString(
                extractClaims(token)
                        .get("companyId", String.class)
        );
    }

    public String extractUsername(String token) {

        return extractClaims(token)
                .get("username", String.class);
    }

    public boolean isTokenValid(String token) {

        try {
            Claims claims = extractClaims(token);

            return claims.getExpiration()
                    .after(new Date());

        } catch (Exception exception) {
            return false;
        }
    }
}