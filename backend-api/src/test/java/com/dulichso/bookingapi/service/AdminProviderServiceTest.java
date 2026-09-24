package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminProviderDtos.*;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.ProviderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminProviderServiceTest {

    @Mock
    private ProviderRepository providerRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditLogService auditLogService;

    private AdminProviderService service;

    @BeforeEach
    void setUp() {
        service = new AdminProviderService(providerRepository, accountRepository, passwordEncoder, auditLogService);
    }

    @Test
    @DisplayName("getProviders: Lấy danh sách NCC kèm thống kê số lượng điểm đến và tài khoản")
    void getProviders_Success() {
        Provider p = Provider.builder()
                .id(100L)
                .name("Bản Lìm Mông Eco Lodge")
                .status(ProviderStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(providerRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(p));
        List<Object[]> placeCounts = new ArrayList<>();
        placeCounts.add(new Object[]{100L, 5L});
        when(providerRepository.countPlacesByProvider()).thenReturn(placeCounts);

        List<Object[]> accountCounts = new ArrayList<>();
        accountCounts.add(new Object[]{100L, 2L});
        when(providerRepository.countAccountsByProvider()).thenReturn(accountCounts);

        List<ProviderSummaryDto> result = service.getProviders(null);
        assertEquals(1, result.size());
        assertEquals("Bản Lìm Mông Eco Lodge", result.get(0).getName());
        assertEquals(5L, result.get(0).getPlaceCount());
        assertEquals(2L, result.get(0).getAccountCount());
    }

    @Test
    @DisplayName("createProviderWithAccount: Tạo NCC ở trạng thái ACTIVE và tạo tài khoản đầu tiên trong 1 bước")
    void createProviderWithAccount_Success() {
        CreateProviderWithAccountRequest req = CreateProviderWithAccountRequest.builder()
                .name("Homestay Hoa Mộc Miên")
                .contactName("Lò Văn A")
                .contactPhone("0977112233")
                .contactEmail("hoamocmien@taybactrails.vn")
                .accountEmail("hoamocmien@taybactrails.vn")
                .accountPassword("NccPass@123")
                .accountFullName("Lò Văn A")
                .build();

        when(accountRepository.existsByEmail("hoamocmien@taybactrails.vn")).thenReturn(false);
        when(passwordEncoder.encode("NccPass@123")).thenReturn("$2a$10$encodedPass");

        Provider savedProvider = Provider.builder()
                .id(200L)
                .name("Homestay Hoa Mộc Miên")
                .contactName("Lò Văn A")
                .status(ProviderStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(providerRepository.save(any(Provider.class))).thenReturn(savedProvider);

        ProviderSummaryDto dto = service.createProviderWithAccount(req, 1L);
        assertNotNull(dto);
        assertEquals(200L, dto.getId());
        assertEquals(ProviderStatus.ACTIVE, dto.getStatus());

        // Kiểm tra tài khoản NCC đã được lưu với vai trò PROVIDER và ACTIVE
        verify(accountRepository, times(1)).save(argThat(acc ->
                acc.getEmail().equals("hoamocmien@taybactrails.vn")
                        && acc.getRole() == AccountRole.PROVIDER
                        && acc.getStatus() == AccountStatus.ACTIVE
        ));

        // Kiểm tra ghi audit log
        verify(auditLogService, times(1)).record(eq(1L), eq("CREATE_PROVIDER"), eq("Provider"), eq(200L), anyString(), isNull(), anyMap());
    }

    @Test
    @DisplayName("updateProviderStatus: Đổi trạng thái NCC sang SUSPENDED và ghi audit log")
    void updateProviderStatus_Success() {
        Provider p = Provider.builder()
                .id(300L)
                .name("Cơ sở Vi Phạm")
                .status(ProviderStatus.ACTIVE)
                .build();

        when(providerRepository.findById(300L)).thenReturn(Optional.of(p));
        when(providerRepository.save(any(Provider.class))).thenAnswer(i -> i.getArgument(0));

        UpdateProviderStatusRequest req = UpdateProviderStatusRequest.builder()
                .status(ProviderStatus.SUSPENDED)
                .reason("Tạm đình chỉ do phản ánh an toàn")
                .build();

        ProviderSummaryDto dto = service.updateProviderStatus(300L, req, 1L);
        assertEquals(ProviderStatus.SUSPENDED, dto.getStatus());
        verify(auditLogService, times(1)).record(eq(1L), eq("UPDATE_PROVIDER_STATUS"), eq("Provider"), eq(300L), eq("Tạm đình chỉ do phản ánh an toàn"), anyMap(), anyMap());
    }
}
