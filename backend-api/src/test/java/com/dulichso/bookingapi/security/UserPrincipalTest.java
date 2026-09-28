package com.dulichso.bookingapi.security;

import com.dulichso.bookingapi.entity.enums.AccountRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UserPrincipalTest {

    private static Set<String> authorities(UserPrincipal p) {
        return p.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toSet());
    }

    @Test
    @DisplayName("Admin cấp N có quyền của cấp N và các cấp thấp hơn")
    void adminLevelsAreCumulative() {
        assertEquals(Set.of("ROLE_ADMIN", "ADMIN_L1", "ADMIN_L2", "ADMIN_L3"), authorities(new UserPrincipal(1L, "a", AccountRole.ADMIN, null, 1)));
        assertEquals(Set.of("ROLE_ADMIN", "ADMIN_L2", "ADMIN_L3"), authorities(new UserPrincipal(2L, "b", AccountRole.ADMIN, null, 2)));
        assertEquals(Set.of("ROLE_ADMIN", "ADMIN_L3"), authorities(new UserPrincipal(3L, "c", AccountRole.ADMIN, null, 3)));
    }

    @Test
    @DisplayName("Admin không nêu cấp được coi là cấp 1; cấp ngoài khoảng bị kẹp về 1..3")
    void missingOrOutOfRangeLevel() {
        assertEquals(Set.of("ROLE_ADMIN", "ADMIN_L1", "ADMIN_L2", "ADMIN_L3"), authorities(new UserPrincipal(1L, "a", AccountRole.ADMIN, null)));
        assertEquals(Set.of("ROLE_ADMIN", "ADMIN_L3"), authorities(new UserPrincipal(1L, "a", AccountRole.ADMIN, null, 9)));
    }

    @Test
    @DisplayName("NCC không có bất kỳ quyền Admin nào")
    void providerHasNoAdminAuthority() {
        assertEquals(Set.of("ROLE_PROVIDER"), authorities(new UserPrincipal(5L, "p", AccountRole.PROVIDER, 8L)));
    }
}
