package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ProviderApplicationDtos.RegisterInput;
import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.repository.AccountRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.validation.Validation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ProviderApplicationServiceTest {
    private EntityManager em;
    private AccountRepository accounts;
    private ProviderApplicationService service;

    @BeforeEach
    void setUp() {
        em = mock(EntityManager.class);
        accounts = mock(AccountRepository.class);
        service = new ProviderApplicationService(em, accounts, mock(PasswordEncoder.class));
    }

    private RegisterInput input(String phone, String email) {
        return new RegisterInput("Homestay", "Owner", phone, email, "password123", "Mu Cang Chai", null, null);
    }

    @ParameterizedTest
    @ValueSource(strings = {"09123456789012345678", "abcdefghij", "..........", "091234567", "09123456789"})
    void rejectsInvalidPhonesInDtoAndService(String phone) {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertTrue(factory.getValidator().validate(input(phone, "owner@example.com")).stream()
                    .anyMatch(v -> v.getPropertyPath().toString().equals("contactPhone")));
        }
        var error = assertThrows(ResponseStatusException.class, () -> service.register(input(phone, "owner@example.com")));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(em, never()).persist(any());
    }

    @Test
    void rejectsAlternatePhoneOfExistingAccount() {
        when(accounts.existsByPhone("+84912345678")).thenReturn(true);
        var error = assertThrows(ResponseStatusException.class, () -> service.register(input("0912345678", "owner@example.com")));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertTrue(error.getReason().contains("số điện thoại"));
        verify(em, never()).persist(any());
    }

    @Test
    void rejectsExistingEmailIgnoringCase() {
        emptyPendingQuery();
        when(accounts.existsByEmailIgnoreCase("owner@example.com")).thenReturn(true);
        var error = assertThrows(ResponseStatusException.class, () -> service.register(input("0912345678", "OWNER@example.com")));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertTrue(error.getReason().contains("email"));
        verify(em, never()).persist(any());
    }

    @Test
    void rejectsPendingApplicationPhone() {
        TypedQuery<ProviderApplication> query = emptyPendingQuery();
        when(query.getResultStream()).thenAnswer(invocation -> Stream.of(new ProviderApplication()));
        var error = assertThrows(ResponseStatusException.class, () -> service.register(input("0912345678", "owner@example.com")));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(em, never()).persist(any());
    }

    @Test
    void rejectsPendingApplicationEmail() {
        TypedQuery<ProviderApplication> query = emptyPendingQuery();
        when(query.getResultStream()).thenReturn(Stream.empty(), Stream.empty(), Stream.of(new ProviderApplication()));
        var error = assertThrows(ResponseStatusException.class, () -> service.register(input("0912345678", "OWNER@example.com")));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertTrue(error.getReason().contains("email"));
        verify(query).setParameter("id", "owner@example.com");
        verify(em, never()).persist(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"0912345678", "+84912345678"})
    void acceptsValidUnusedPhoneAndNormalizesEmail(String phone) {
        emptyPendingQuery();
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertTrue(factory.getValidator().validate(input(phone, "OWNER@example.com")).isEmpty());
        }
        service.register(input(phone, "OWNER@example.com"));
        verify(em).persist(argThat(value -> value instanceof ProviderApplication application
                && application.getContactPhone().equals(phone)
                && application.getContactEmail().equals("owner@example.com")));
    }

    @SuppressWarnings("unchecked")
    private TypedQuery<ProviderApplication> emptyPendingQuery() {
        TypedQuery<ProviderApplication> query = mock(TypedQuery.class);
        when(em.createQuery(anyString(), eq(ProviderApplication.class))).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.setMaxResults(1)).thenReturn(query);
        when(query.getResultStream()).thenAnswer(invocation -> Stream.empty());
        return query;
    }
}
