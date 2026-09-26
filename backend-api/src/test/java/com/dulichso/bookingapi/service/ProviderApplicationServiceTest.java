package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ProviderApplicationDtos.RegisterInput;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProviderApplicationServiceTest {
    @Mock EntityManager em;
    @Mock AccountRepository accounts;
    final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    ProviderApplicationService service;
    TypedQuery<ProviderApplication> pendingQuery;

    @BeforeEach @SuppressWarnings("unchecked") void setup() {
        service = new ProviderApplicationService(em, accounts, encoder);
        pendingQuery = mock(TypedQuery.class, RETURNS_SELF);
        lenient().when(pendingQuery.getResultStream()).thenAnswer(i -> Stream.empty());
        lenient().when(em.createQuery(anyString(), eq(ProviderApplication.class))).thenReturn(pendingQuery);
    }

    private RegisterInput input() {
        return new RegisterInput("HTX Mù Cang Chải", "Chị Mai", "0912345678", "mai@example.test", "matkhau123", "Xã La Pán Tẩn", "GP-01", null);
    }

    @Test void registerStoresHashedPasswordAndPendingStatus() {
        var result = service.register(input());
        var captor = ArgumentCaptor.forClass(ProviderApplication.class);
        verify(em).persist(captor.capture());
        ProviderApplication saved = captor.getValue();
        assertEquals(ProviderApplicationStatus.PENDING, result.status());
        assertEquals("0912345678", saved.getContactPhone());
        assertNotEquals("matkhau123", saved.getPasswordHash());
        assertTrue(encoder.matches("matkhau123", saved.getPasswordHash()));
    }

    @Test void registerRejectsPhoneOfExistingAccount() {
        when(accounts.findByIdentifier("0912345678")).thenReturn(Optional.of(Account.builder().id(1L).build()));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.register(input())).getStatusCode().value());
        verify(em, never()).persist(any());
    }

    @Test void registerRejectsDuplicatePendingApplication() {
        when(pendingQuery.getResultStream()).thenAnswer(i -> Stream.of(ProviderApplication.builder().id(3L).build()));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.register(input())).getStatusCode().value());
        verify(em, never()).persist(any());
    }
}
