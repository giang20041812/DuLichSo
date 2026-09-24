package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminAccountDtos.*;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminAccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditLogService auditLogService;

    private AdminAccountService service;

    @BeforeEach
    void setUp() {
        service = new AdminAccountService(accountRepository, passwordEncoder, auditLogService);
    }

    @Test
    @DisplayName("getAccounts: Tìm kiếm và trả về danh sách DTO")
    void getAccounts_Success() {
        Account acc = Account.builder()
                .id(1L)
                .email("admin@taybactrails.vn")
                .fullName("Admin Test")
                .role(AccountRole.ADMIN)
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        when(accountRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(acc)));

        List<AccountDto> result = service.getAccounts(
                AccountRole.ADMIN, AccountStatus.ACTIVE, "test", null, null, null, "createdAt", "desc", 0, 20).getContent();
        assertEquals(1, result.size());
        assertEquals("admin@taybactrails.vn", result.get(0).getEmail());
    }

    @Test
    @DisplayName("createAdminAccount: Thành công, mã hoá mật khẩu BCrypt và ghi audit log")
    void createAdminAccount_Success() {
        CreateAdminAccountRequest req = CreateAdminAccountRequest.builder()
                .email("newadmin@taybactrails.vn")
                .phone("0981234567")
                .password("Secret@123")
                .fullName("Quản trị mới")
                .build();

        when(accountRepository.existsByEmail("newadmin@taybactrails.vn")).thenReturn(false);
        when(accountRepository.existsByPhone("0981234567")).thenReturn(false);
        when(passwordEncoder.encode("Secret@123")).thenReturn("$2a$10$hashedPasswordSecret");

        Account saved = Account.builder()
                .id(10L)
                .email("newadmin@taybactrails.vn")
                .phone("0981234567")
                .fullName("Quản trị mới")
                .role(AccountRole.ADMIN)
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        when(accountRepository.save(any(Account.class))).thenReturn(saved);

        AccountDto dto = service.createAdminAccount(req, 1L);
        assertNotNull(dto);
        assertEquals(10L, dto.getId());
        assertEquals(AccountRole.ADMIN, dto.getRole());

        verify(auditLogService, times(1)).record(eq(1L), eq("CREATE_ADMIN_ACCOUNT"), eq("Account"), eq(10L), anyString(), isNull(), anyMap());
    }

    @Test
    @DisplayName("createAdminAccount: Thất bại khi email đã tồn tại")
    void createAdminAccount_DuplicateEmail() {
        CreateAdminAccountRequest req = CreateAdminAccountRequest.builder()
                .email("admin@taybactrails.vn")
                .password("Secret@123")
                .fullName("Admin")
                .build();

        when(accountRepository.existsByEmail("admin@taybactrails.vn")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.createAdminAccount(req, 1L));
    }

    @Test
    @DisplayName("updateAccountStatus: Tự khoá tài khoản chính mình bị từ chối")
    void updateAccountStatus_SelfLockBlocked() {
        Account acc = Account.builder()
                .id(1L)
                .email("admin@taybactrails.vn")
                .status(AccountStatus.ACTIVE)
                .build();

        when(accountRepository.findById(1L)).thenReturn(Optional.of(acc));

        UpdateAccountStatusRequest req = UpdateAccountStatusRequest.builder()
                .status(AccountStatus.INACTIVE)
                .reason("Test self lock")
                .build();

        // Caller id = 1L (chính là tài khoản đang thao tác)
        assertThrows(IllegalStateException.class, () -> service.updateAccountStatus(1L, req, 1L));
    }

    @Test
    @DisplayName("updateAccountStatus: Thành công khi khoá tài khoản khác")
    void updateAccountStatus_OtherUser_Success() {
        Account acc = Account.builder()
                .id(2L)
                .email("user2@taybactrails.vn")
                .status(AccountStatus.ACTIVE)
                .build();

        when(accountRepository.findById(2L)).thenReturn(Optional.of(acc));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateAccountStatusRequest req = UpdateAccountStatusRequest.builder()
                .status(AccountStatus.INACTIVE)
                .reason("Vi phạm chính sách")
                .build();

        AccountDto dto = service.updateAccountStatus(2L, req, 1L);
        assertEquals(AccountStatus.INACTIVE, dto.getStatus());
        verify(auditLogService, times(1)).record(eq(1L), eq("UPDATE_ACCOUNT_STATUS"), eq("Account"), eq(2L), anyString(), anyMap(), anyMap());
    }

    @Test
    @DisplayName("updateAccountStatus: Khoá tài khoản bắt buộc có lý do")
    void updateAccountStatus_LockWithoutReason_Rejected() {
        Account acc = Account.builder().id(2L).email("u2@taybactrails.vn").status(AccountStatus.ACTIVE).build();
        when(accountRepository.findById(2L)).thenReturn(Optional.of(acc));

        UpdateAccountStatusRequest req = UpdateAccountStatusRequest.builder().status(AccountStatus.INACTIVE).build();
        assertThrows(IllegalArgumentException.class, () -> service.updateAccountStatus(2L, req, 1L));
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("resetPassword: Mã hoá mật khẩu mới và lưu DB")
    void resetPassword_Success() {
        Account acc = Account.builder()
                .id(3L)
                .email("ncc@taybactrails.vn")
                .build();

        when(accountRepository.findById(3L)).thenReturn(Optional.of(acc));
        when(passwordEncoder.encode("NewPass@123")).thenReturn("$2a$10$newHashedPass");

        ResetPasswordRequest req = ResetPasswordRequest.builder()
                .newPassword("NewPass@123")
                .reason("Khách yêu cầu reset")
                .build();

        service.resetPassword(3L, req, 1L);
        assertEquals("$2a$10$newHashedPass", acc.getPasswordHash());
        verify(accountRepository, times(1)).save(acc);
        verify(auditLogService, times(1)).record(eq(1L), eq("RESET_PASSWORD"), eq("Account"), eq(3L), anyString(), isNull(), anyMap());
    }
}
