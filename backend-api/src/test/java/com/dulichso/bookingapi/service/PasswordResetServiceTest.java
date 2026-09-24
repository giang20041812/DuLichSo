package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.PasswordResetToken;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.Traveler;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.PasswordResetTokenRepository;
import com.dulichso.bookingapi.repository.TravelerRepository;
import com.dulichso.bookingapi.service.PasswordResetService.InvalidResetException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private TravelerRepository travelerRepository;
    @Mock private PasswordResetTokenRepository tokenRepository;
    @Mock private MailService mailService;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        service = new PasswordResetService(accountRepository, travelerRepository, tokenRepository, encoder,
                mailService, 10, 3, 60, 5, false);
    }

    private Account account(String email) {
        return Account.builder().id(1L).email(email).fullName("Admin").status(AccountStatus.ACTIVE).passwordHash("old").build();
    }

    private PasswordResetToken token(String otp, int attempts, LocalDateTime expires) {
        return PasswordResetToken.builder().id(9L).subjectType("ACCOUNT").subjectId(1L).email("a@x.vn")
                .otpHash(encoder.encode(otp)).attempts(attempts).expiresAt(expires).build();
    }

    @Test
    @DisplayName("requestReset: tài khoản có email → lưu OTP đã băm và gửi mail chứa OTP 6 số")
    void requestReset_sendsOtp() {
        when(accountRepository.findByIdentifier("a@x.vn")).thenReturn(Optional.of(account("a@x.vn")));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account("a@x.vn")));
        when(tokenRepository.findFirstBySubjectTypeAndSubjectIdOrderByIdDesc(any(), any())).thenReturn(Optional.empty());
        when(tokenRepository.countBySubjectTypeAndSubjectIdAndCreatedAtAfter(any(), any(), any())).thenReturn(0L);

        service.requestReset("A@X.vn");

        ArgumentCaptor<PasswordResetToken> saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(saved.capture());
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(mailService).sendText(eq("a@x.vn"), anyString(), body.capture());
        String otp = body.getValue().replaceAll("(?s).*Mã xác nhận của bạn: (\\d{6}).*", "$1");
        assertTrue(otp.matches("\\d{6}"));
        assertTrue(encoder.matches(otp, saved.getValue().getOtpHash()));
        assertNotEquals(otp, saved.getValue().getOtpHash());
        verify(tokenRepository).invalidateAll(eq("ACCOUNT"), eq(1L), any());
    }

    @Test
    @DisplayName("requestReset: NCC đăng nhập bằng SĐT → gửi tới email liên hệ của cơ sở")
    void requestReset_usesProviderContactEmail() {
        Provider p = Provider.builder().id(5L).name("HS").contactEmail("ncc@hs.vn").build();
        Account a = account(null);
        a.setProvider(p);
        when(accountRepository.findByIdentifier("0379292222")).thenReturn(Optional.of(a));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(a));
        when(tokenRepository.findFirstBySubjectTypeAndSubjectIdOrderByIdDesc(any(), any())).thenReturn(Optional.empty());

        service.requestReset("0379292222");

        verify(mailService).sendText(eq("ncc@hs.vn"), anyString(), anyString());
    }

    @Test
    @DisplayName("requestReset: định danh không tồn tại, không có email, bị khóa hoặc quá nhanh → không gửi gì")
    void requestReset_silentlyIgnored() {
        when(accountRepository.findByIdentifier(any())).thenReturn(Optional.empty());
        when(travelerRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(travelerRepository.findByPhone(any())).thenReturn(Optional.empty());
        service.requestReset("nobody@x.vn");

        // không có email
        when(accountRepository.findByIdentifier("0900")).thenReturn(Optional.of(account(null)));
        service.requestReset("0900");

        // bị khóa
        Account locked = account("l@x.vn");
        locked.setStatus(AccountStatus.INACTIVE);
        when(accountRepository.findByIdentifier("l@x.vn")).thenReturn(Optional.of(locked));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(locked));
        service.requestReset("l@x.vn");

        // yêu cầu quá nhanh
        Account ok = account("ok@x.vn");
        when(accountRepository.findByIdentifier("ok@x.vn")).thenReturn(Optional.of(ok));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(ok));
        when(tokenRepository.findFirstBySubjectTypeAndSubjectIdOrderByIdDesc(any(), any()))
                .thenReturn(Optional.of(PasswordResetToken.builder().createdAt(LocalDateTime.now().minusSeconds(10)).build()));
        service.requestReset("ok@x.vn");

        verify(mailService, never()).sendText(any(), any(), any());
        verify(tokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("requestReset: vượt số yêu cầu mỗi giờ thì bị bỏ qua")
    void requestReset_hourlyLimit() {
        Account a = account("a@x.vn");
        when(accountRepository.findByIdentifier("a@x.vn")).thenReturn(Optional.of(a));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(a));
        when(tokenRepository.findFirstBySubjectTypeAndSubjectIdOrderByIdDesc(any(), any())).thenReturn(Optional.empty());
        when(tokenRepository.countBySubjectTypeAndSubjectIdAndCreatedAtAfter(any(), any(), any())).thenReturn(5L);

        service.requestReset("a@x.vn");

        verify(mailService, never()).sendText(any(), any(), any());
    }

    @Test
    @DisplayName("resetPassword: OTP đúng → đổi mật khẩu (băm) và vô hiệu mọi OTP")
    void resetPassword_success() {
        Account a = account("a@x.vn");
        when(accountRepository.findByIdentifier("a@x.vn")).thenReturn(Optional.of(a));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(a));
        when(tokenRepository.findFirstBySubjectTypeAndSubjectIdAndUsedAtIsNullOrderByIdDesc("ACCOUNT", 1L))
                .thenReturn(Optional.of(token("123456", 0, LocalDateTime.now().plusMinutes(5))));

        service.resetPassword("a@x.vn", "123456", "NewPass@1");

        assertTrue(encoder.matches("NewPass@1", a.getPasswordHash()));
        verify(accountRepository).save(a);
        verify(tokenRepository).invalidateAll(eq("ACCOUNT"), eq(1L), any());
    }

    @Test
    @DisplayName("resetPassword: OTP sai tăng số lần thử và không đổi mật khẩu")
    void resetPassword_wrongOtp() {
        Account a = account("a@x.vn");
        PasswordResetToken t = token("123456", 0, LocalDateTime.now().plusMinutes(5));
        when(accountRepository.findByIdentifier("a@x.vn")).thenReturn(Optional.of(a));
        when(tokenRepository.findFirstBySubjectTypeAndSubjectIdAndUsedAtIsNullOrderByIdDesc("ACCOUNT", 1L)).thenReturn(Optional.of(t));

        assertThrows(InvalidResetException.class, () -> service.resetPassword("a@x.vn", "000000", "NewPass@1"));

        assertEquals(1, t.getAttempts());
        verify(tokenRepository).save(t);
        verify(accountRepository, never()).save(any());
        assertEquals("old", a.getPasswordHash());
    }

    @Test
    @DisplayName("resetPassword: hết lượt thử hoặc hết hạn thì từ chối kể cả OTP đúng")
    void resetPassword_lockedOrExpired() {
        Account a = account("a@x.vn");
        when(accountRepository.findByIdentifier("a@x.vn")).thenReturn(Optional.of(a));

        when(tokenRepository.findFirstBySubjectTypeAndSubjectIdAndUsedAtIsNullOrderByIdDesc("ACCOUNT", 1L))
                .thenReturn(Optional.of(token("123456", 3, LocalDateTime.now().plusMinutes(5))));
        assertThrows(InvalidResetException.class, () -> service.resetPassword("a@x.vn", "123456", "NewPass@1"));

        when(tokenRepository.findFirstBySubjectTypeAndSubjectIdAndUsedAtIsNullOrderByIdDesc("ACCOUNT", 1L))
                .thenReturn(Optional.of(token("123456", 0, LocalDateTime.now().minusMinutes(1))));
        assertThrows(InvalidResetException.class, () -> service.resetPassword("a@x.vn", "123456", "NewPass@1"));

        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("resetPassword: mật khẩu quá ngắn / tài khoản không tồn tại")
    void resetPassword_validation() {
        assertThrows(IllegalArgumentException.class, () -> service.resetPassword("a@x.vn", "123456", "123"));
        when(accountRepository.findByIdentifier(any())).thenReturn(Optional.empty());
        when(travelerRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(travelerRepository.findByPhone(any())).thenReturn(Optional.empty());
        assertThrows(InvalidResetException.class, () -> service.resetPassword("ghost@x.vn", "123456", "NewPass@1"));
    }

    @Test
    @DisplayName("resetPassword: khách du lịch đặt lại được mật khẩu")
    void resetPassword_traveler() {
        Traveler tr = Traveler.builder().id(3L).email("k@x.vn").fullName("Khach").status(AccountStatus.ACTIVE).build();
        when(accountRepository.findByIdentifier(any())).thenReturn(Optional.empty());
        when(travelerRepository.findByEmailIgnoreCase("k@x.vn")).thenReturn(Optional.of(tr));
        when(travelerRepository.findById(3L)).thenReturn(Optional.of(tr));
        PasswordResetToken t = PasswordResetToken.builder().id(1L).subjectType("TRAVELER").subjectId(3L).email("k@x.vn")
                .otpHash(encoder.encode("654321")).expiresAt(LocalDateTime.now().plusMinutes(5)).build();
        when(tokenRepository.findFirstBySubjectTypeAndSubjectIdAndUsedAtIsNullOrderByIdDesc("TRAVELER", 3L)).thenReturn(Optional.of(t));

        service.resetPassword("k@x.vn", "654321", "Khach@123");

        assertTrue(encoder.matches("Khach@123", tr.getPasswordHash()));
        verify(travelerRepository).save(tr);
    }
}
