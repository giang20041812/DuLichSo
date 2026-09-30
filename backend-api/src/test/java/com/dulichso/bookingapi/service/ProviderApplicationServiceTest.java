package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ProviderApplicationDtos.RegisterInput;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.ProviderApplicationRepository;
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
    @Mock ProviderApplicationRepository applications;
    @Mock NotificationRecorder notifications;
    final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    ProviderApplicationService service;
    TypedQuery<ProviderApplication> pendingQuery;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setup() {
        service = new ProviderApplicationService(em, accounts, applications, encoder, notifications);
        pendingQuery = mock(TypedQuery.class, RETURNS_SELF);
        lenient().when(pendingQuery.getResultStream()).thenAnswer(i -> Stream.empty());
        lenient().when(em.createQuery(anyString(), eq(ProviderApplication.class))).thenReturn(pendingQuery);
        lenient().when(applications.existsByBusinessLicenseNoAndStatusNot(anyString(), eq(ProviderApplicationStatus.REJECTED))).thenReturn(false);
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
        assertEquals("mai@example.test", saved.getContactEmail());
        assertTrue(encoder.matches("matkhau123", saved.getPasswordHash()));
        verify(notifications).toAdmins(eq("ADMIN_NEW_PROVIDER_APPLICATION"), eq("ProviderApplication"), any(), contains("HTX Mù Cang Chải"), eq("applications"));
    }

    @Test void registerRejectsPhoneOfExistingAccount() {
        when(accounts.existsByPhone("0912345678")).thenReturn(true);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.register(input())).getStatusCode().value());
        verify(em, never()).persist(any());
    }

    @Test void registerRejectsDuplicatePendingApplication() {
        when(pendingQuery.getResultStream()).thenAnswer(i -> Stream.of(ProviderApplication.builder().id(3L).build()));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.register(input())).getStatusCode().value());
        verify(em, never()).persist(any());
    }

    @Test void registerRejectsDuplicateBusinessLicenseNo() {
        when(applications.existsByBusinessLicenseNoAndStatusNot("GP-01", ProviderApplicationStatus.REJECTED)).thenReturn(true);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.register(input())).getStatusCode().value());
        verify(em, never()).persist(any());
    }

    @Test void registerReportsEveryDuplicateFieldAtOnce() {
        when(accounts.existsByPhone("0912345678")).thenReturn(true);
        when(accounts.existsByEmailIgnoreCase("mai@example.test")).thenReturn(true);
        when(applications.existsByBusinessLicenseNoAndStatusNot("GP-01", ProviderApplicationStatus.REJECTED)).thenReturn(true);
        DuplicateFieldsException ex = assertThrows(DuplicateFieldsException.class, () -> service.register(input()));
        assertEquals(409, ex.getStatusCode().value());
        assertEquals(java.util.List.of("contactPhone", "contactEmail", "businessLicenseNo"), ex.getFieldErrors().stream().map(com.dulichso.bookingapi.dto.FieldErrorDto::field).toList());
        verify(em, never()).persist(any());
    }
}
