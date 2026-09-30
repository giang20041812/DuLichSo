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

    @Mock
    private com.dulichso.bookingapi.repository.ProviderRepository providerRepository;

    @Mock
    private ProviderLockCascadeService providerLockCascadeService;

    private AdminAccountService service;

    @BeforeEach
    void setUp() {
        service = new AdminAccountService(accountRepository, passwordEncoder, auditLogService, providerRepository, providerLockCascadeService);
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

        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(acc));

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

        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(acc));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateAccountStatusRequest req = UpdateAccountStatusRequest.builder()
                .status(AccountStatus.INACTIVE)
                .reason("Vi phạm chính sách")
                .build();

        AccountDto dto = service.updateAccountStatus(2L, req, 1L);
        assertEquals(AccountStatus.INACTIVE, dto.getStatus());
        assertEquals(1, acc.getTokenVersion(), "Khóa tài khoản phải thu hồi phiên đang có (NFR-SEC-03)");
        verify(auditLogService, times(1)).record(eq(1L), eq("UPDATE_ACCOUNT_STATUS"), eq("Account"), eq(2L), anyString(), anyMap(), anyMap());
    }

    @Test
    @DisplayName("updateAccountStatus: Giữ nguyên trạng thái thì không thu hồi phiên")
    void updateAccountStatus_SameStatus_KeepsSessions() {
        Account acc = Account.builder().id(2L).email("u2@taybactrails.vn").status(AccountStatus.ACTIVE).build();
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(acc));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateAccountStatus(2L, UpdateAccountStatusRequest.builder().status(AccountStatus.ACTIVE).build(), 1L);
        assertEquals(0, acc.getTokenVersion());
    }

    @Test
    @DisplayName("updateAccountStatus: Khoá tài khoản bắt buộc có lý do")
    void updateAccountStatus_LockWithoutReason_Rejected() {
        Account acc = Account.builder().id(2L).email("u2@taybactrails.vn").status(AccountStatus.ACTIVE).build();
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(acc));

        UpdateAccountStatusRequest req = UpdateAccountStatusRequest.builder().status(AccountStatus.INACTIVE).build();
        assertThrows(IllegalArgumentException.class, () -> service.updateAccountStatus(2L, req, 1L));
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("updateAccountStatus: Khoá tài khoản NCC (PROVIDER) phải hủy các Booking đang chờ NCC duyệt (ACC-BR-08)")
    void updateAccountStatus_LockProvider_CascadesPendingBookings() {
        com.dulichso.bookingapi.entity.Provider provider = com.dulichso.bookingapi.entity.Provider.builder().id(12L).build();
        Account acc = Account.builder().id(2L).email("ncc@x.vn").role(AccountRole.PROVIDER)
                .status(AccountStatus.ACTIVE).provider(provider).build();
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(acc));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(providerLockCascadeService.cancelPendingBookings(provider)).thenReturn(3);

        UpdateAccountStatusRequest req = UpdateAccountStatusRequest.builder()
                .status(AccountStatus.INACTIVE).reason("NCC ngừng hoạt động").build();
        AccountDto dto = service.updateAccountStatus(2L, req, 1L);

        assertEquals(AccountStatus.INACTIVE, dto.getStatus());
        verify(providerLockCascadeService, times(1)).cancelPendingBookings(provider);
        verify(auditLogService, times(1)).record(eq(1L), eq("UPDATE_ACCOUNT_STATUS"), eq("Account"), eq(2L), anyString(),
                anyMap(), argThat(m -> Integer.valueOf(3).equals(m.get("cancelledPendingBookings"))));
    }

    @Test
    @DisplayName("updateAccountStatus: Mở lại tài khoản NCC không được gọi hủy Booking")
    void updateAccountStatus_UnlockProvider_DoesNotCascade() {
        com.dulichso.bookingapi.entity.Provider provider = com.dulichso.bookingapi.entity.Provider.builder().id(12L).build();
        Account acc = Account.builder().id(2L).email("ncc@x.vn").role(AccountRole.PROVIDER)
                .status(AccountStatus.INACTIVE).provider(provider).build();
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(acc));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateAccountStatus(2L, UpdateAccountStatusRequest.builder().status(AccountStatus.ACTIVE).build(), 1L);
        verify(providerLockCascadeService, never()).cancelPendingBookings(any());
    }

    @Test
    @DisplayName("updateAccountRole: PROVIDER -> ADMIN, bỏ liên kết NCC, thu hồi phiên và ghi audit")
    void updateAccountRole_providerToAdmin() {
        Account acc = Account.builder().id(2L).email("p@x.vn").role(AccountRole.PROVIDER).status(AccountStatus.ACTIVE)
                .provider(com.dulichso.bookingapi.entity.Provider.builder().id(12L).build()).build();
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(acc));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountDto dto = service.updateAccountRole(2L, UpdateAccountRoleRequest.builder().role(AccountRole.ADMIN).reason("Bổ nhiệm").build(), 1L);

        assertEquals(AccountRole.ADMIN, dto.getRole());
        assertNull(acc.getProvider());
        assertEquals(1, acc.getTokenVersion(), "Đổi quyền phải thu hồi phiên đang có (NFR-SEC-03)");
        verify(auditLogService).record(eq(1L), eq("UPDATE_ACCOUNT_ROLE"), eq("Account"), eq(2L), eq("Bổ nhiệm"), anyMap(), anyMap());
    }

    @Test
    @DisplayName("updateAccountRole: ADMIN -> PROVIDER cần NCC hợp lệ và chưa có tài khoản")
    void updateAccountRole_adminToProvider() {
        Account acc = Account.builder().id(2L).email("a@x.vn").role(AccountRole.ADMIN).status(AccountStatus.ACTIVE).build();
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(acc));
        when(accountRepository.countByRoleAndStatus(AccountRole.ADMIN, AccountStatus.ACTIVE)).thenReturn(5L);

        UpdateAccountRoleRequest noProvider = UpdateAccountRoleRequest.builder().role(AccountRole.PROVIDER).reason("Chuyển bộ phận").build();
        assertThrows(IllegalArgumentException.class, () -> service.updateAccountRole(2L, noProvider, 1L));

        com.dulichso.bookingapi.entity.Provider provider = com.dulichso.bookingapi.entity.Provider.builder().id(12L).build();
        when(providerRepository.findById(12L)).thenReturn(Optional.of(provider));
        when(accountRepository.findByProviderIdOrderByIdAsc(12L)).thenReturn(List.of(Account.builder().id(9L).build()));
        UpdateAccountRoleRequest taken = UpdateAccountRoleRequest.builder().role(AccountRole.PROVIDER).providerId(12L).reason("Chuyển bộ phận").build();
        assertThrows(IllegalStateException.class, () -> service.updateAccountRole(2L, taken, 1L));
        assertEquals(AccountRole.ADMIN, acc.getRole());

        when(accountRepository.findByProviderIdOrderByIdAsc(12L)).thenReturn(List.of());
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        AccountDto dto = service.updateAccountRole(2L, taken, 1L);
        assertEquals(AccountRole.PROVIDER, dto.getRole());
        assertSame(provider, acc.getProvider());
    }

    @Test
    @DisplayName("updateAccountRole: chặn tự đổi quyền, thiếu lý do, cùng quyền và hạ quyền Admin cuối cùng")
    void updateAccountRole_guards() {
        Account lastAdmin = Account.builder().id(2L).email("a@x.vn").role(AccountRole.ADMIN).status(AccountStatus.ACTIVE).build();
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(lastAdmin));

        UpdateAccountRoleRequest ok = UpdateAccountRoleRequest.builder().role(AccountRole.PROVIDER).providerId(12L).reason("Lý do").build();
        assertThrows(IllegalStateException.class, () -> service.updateAccountRole(2L, ok, 2L));
        assertThrows(IllegalArgumentException.class, () -> service.updateAccountRole(2L,
                UpdateAccountRoleRequest.builder().role(AccountRole.PROVIDER).providerId(12L).reason(" ").build(), 1L));
        assertThrows(IllegalArgumentException.class, () -> service.updateAccountRole(2L,
                UpdateAccountRoleRequest.builder().role(AccountRole.ADMIN).reason("Lý do").build(), 1L));

        when(accountRepository.countByRoleAndStatus(AccountRole.ADMIN, AccountStatus.ACTIVE)).thenReturn(1L);
        assertThrows(IllegalStateException.class, () -> service.updateAccountRole(2L, ok, 1L));
        assertEquals(AccountRole.ADMIN, lastAdmin.getRole());
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
        assertEquals(1, acc.getTokenVersion(), "Đặt lại mật khẩu phải thu hồi phiên cũ (NFR-SEC-03)");
        verify(accountRepository, times(1)).save(acc);
        verify(auditLogService, times(1)).record(eq(1L), eq("RESET_PASSWORD"), eq("Account"), eq(3L), anyString(), isNull(), anyMap());
    }

    private static Account admin(long id, Integer level) {
        return Account.builder().id(id).email("a" + id + "@taybactrails.vn").role(AccountRole.ADMIN).adminLevel(level)
                .status(AccountStatus.ACTIVE).build();
    }

    @Test
    @DisplayName("createAdminAccount: không nêu cấp thì gán cấp 3 (ít quyền nhất)")
    void createAdminAccount_DefaultsToLowestLevel() {
        CreateAdminAccountRequest req = CreateAdminAccountRequest.builder()
                .email("l3@taybactrails.vn").phone("0981111111").password("Secret@123").fullName("Cấp ba").build();
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        AccountDto dto = service.createAdminAccount(req, 1L);

        assertEquals(3, dto.getAdminLevel());
    }

    @Test
    @DisplayName("createAdminAccount: cấp ngoài 1..3 bị từ chối")
    void createAdminAccount_InvalidLevelRejected() {
        CreateAdminAccountRequest req = CreateAdminAccountRequest.builder()
                .email("x@taybactrails.vn").password("Secret@123").fullName("X").adminLevel(4).build();
        assertThrows(IllegalArgumentException.class, () -> service.createAdminAccount(req, 1L));
    }

    @Test
    @DisplayName("updateAdminLevel: cấp 1 đổi cấp Admin khác và ghi audit")
    void updateAdminLevel_Success() {
        Account target = admin(2L, 3);
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(target));
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        AccountDto dto = service.updateAdminLevel(2L, UpdateAdminLevelRequest.builder().adminLevel(2).reason("Lên vận hành").build(), 1L);

        assertEquals(2, dto.getAdminLevel());
        verify(auditLogService).record(eq(1L), eq("UPDATE_ADMIN_LEVEL"), eq("Account"), eq(2L), anyString(), anyMap(), anyMap());
    }

    @Test
    @DisplayName("updateAdminLevel: không tự đổi cấp của chính mình")
    void updateAdminLevel_SelfBlocked() {
        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(admin(1L, 1)));
        assertThrows(IllegalStateException.class,
                () -> service.updateAdminLevel(1L, UpdateAdminLevelRequest.builder().adminLevel(3).build(), 1L));
    }

    @Test
    @DisplayName("updateAdminLevel: không hạ cấp quản trị viên cấp 1 đang hoạt động cuối cùng")
    void updateAdminLevel_LastLevelOneProtected() {
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(admin(2L, 1)));
        when(accountRepository.countActiveLevelOneAdmins()).thenReturn(1L);
        assertThrows(IllegalStateException.class,
                () -> service.updateAdminLevel(2L, UpdateAdminLevelRequest.builder().adminLevel(2).build(), 1L));
    }

    @Test
    @DisplayName("updateAdminLevel: chỉ áp dụng cho tài khoản Admin")
    void updateAdminLevel_ProviderRejected() {
        Account provider = Account.builder().id(5L).role(AccountRole.PROVIDER).status(AccountStatus.ACTIVE).build();
        when(accountRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(provider));
        assertThrows(IllegalArgumentException.class,
                () -> service.updateAdminLevel(5L, UpdateAdminLevelRequest.builder().adminLevel(2).build(), 1L));
    }

    @Test
    @DisplayName("resetPassword: Admin cấp 2 không được đặt lại mật khẩu của Admin (chống leo thang đặc quyền)")
    void resetPassword_LevelTwoCannotTouchAdmin() {
        when(accountRepository.findById(9L)).thenReturn(Optional.of(admin(9L, 1)));
        when(accountRepository.findById(2L)).thenReturn(Optional.of(admin(2L, 2)));

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.resetPassword(9L, ResetPasswordRequest.builder().newPassword("NewPass@123").build(), 2L));
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("updateAccountStatus: Admin cấp 2 không được khóa Admin nhưng vẫn khóa được tài khoản NCC")
    void updateAccountStatus_LevelTwoBlockedOnAdminOnly() {
        when(accountRepository.findByIdForUpdate(9L)).thenReturn(Optional.of(admin(9L, 3)));
        when(accountRepository.findById(2L)).thenReturn(Optional.of(admin(2L, 2)));
        UpdateAccountStatusRequest lock = UpdateAccountStatusRequest.builder().status(AccountStatus.INACTIVE).reason("x").build();
        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.updateAccountStatus(9L, lock, 2L));

        Account provider = Account.builder().id(7L).role(AccountRole.PROVIDER).status(AccountStatus.ACTIVE).build();
        when(accountRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(provider));
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));
        assertEquals(AccountStatus.INACTIVE, service.updateAccountStatus(7L, lock, 2L).getStatus());
    }

    @Test
    @DisplayName("me: tài khoản QA không có trong DB được coi là cấp 1")
    void me_MockAccountIsLevelOne() {
        assertEquals(1, service.me(null).getAdminLevel());
    }
}
