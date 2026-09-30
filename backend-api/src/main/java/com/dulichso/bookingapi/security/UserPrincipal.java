package com.dulichso.bookingapi.security;

import com.dulichso.bookingapi.entity.enums.AccountRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Record đại diện cho principal đã xác thực trong Spring Security context.
 * Được inject qua @AuthenticationPrincipal UserPrincipal trong controllers.
 *
 * <p>{@code adminLevel}: cấp quản trị của ADMIN (1 = cao nhất … 3 = thấp nhất), null với PROVIDER. Cấp thấp hơn có
 * ít quyền hơn: ADMIN cấp N nhận các authority {@code ADMIN_L<N>..ADMIN_L3}, nên "tối thiểu cấp 2" là
 * {@code hasAuthority("ADMIN_L2")} (xem SecurityConfig).
 */
public record UserPrincipal(
        Long accountId,
        String identifier,
        AccountRole role,
        Long providerId,
        Integer adminLevel
) implements UserDetails {

    public static final int LOWEST_ADMIN_LEVEL = 3;

    /** Tiện cho nơi chỉ cần role/providerId (PROVIDER, test): ADMIN không nêu cấp được coi là cấp 1. */
    public UserPrincipal(Long accountId, String identifier, AccountRole role, Long providerId) {
        this(accountId, identifier, role, providerId, role == AccountRole.ADMIN ? 1 : null);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        if (role == AccountRole.ADMIN) {
            int level = adminLevel == null ? 1 : Math.max(1, Math.min(LOWEST_ADMIN_LEVEL, adminLevel));
            for (int l = level; l <= LOWEST_ADMIN_LEVEL; l++) {
                authorities.add(new SimpleGrantedAuthority("ADMIN_L" + l));
            }
        }
        return authorities;
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return identifier;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
