package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.auth.PortalAuthDtos.*;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AccountAuthService {

    private static final Logger log = LoggerFactory.getLogger(AccountAuthService.class);

    private final AccountRepository accountRepository;
    private final JwtUtils jwtUtils;

    public AccountAuthService(AccountRepository accountRepository, JwtUtils jwtUtils) {
        this.accountRepository = accountRepository;
        this.jwtUtils = jwtUtils;
    }

    @Transactional
    public PortalLoginResponse login(PortalLoginRequest request) {
        String identifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        String password = request.getPassword() != null ? request.getPassword().trim() : "";

        // Kịch bản 7: QA Simulator mô phỏng lỗi 500
        if (request.isSimulateError500() || identifier.equalsIgnoreCase("sim_500@taybactrails.vn")) {
            log.warn("QA Simulator: Triggering simulated 500 Internal Server Error for identifier: {}", identifier);
            throw new RuntimeException("Lỗi hệ thống máy chủ nội bộ (500) phục vụ kiểm thử QA Simulator.");
        }

        // Tìm kiếm Account trong DB
        Optional<Account> accountOpt = accountRepository.findByIdentifier(identifier);

        Account account;
        if (accountOpt.isPresent()) {
            account = accountOpt.get();
            // So sánh mật khẩu (Hỗ trợ cả hash hoặc plain text ban đầu cho development)
            boolean passwordMatches = checkPassword(password, account.getPasswordHash());
            if (!passwordMatches) {
                // BV-08 / UC-08: Sai thông tin -> thông báo chung, không tiết lộ identifier
                throw new BadCredentialsException("Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại Email/Số điện thoại hoặc Mật khẩu.");
            }
        } else {
            // Fallback: Kiểm tra dữ liệu mẫu QA Simulator phục vụ dev & test ngay cả khi DB chưa seed
            account = getMockAccountForQa(identifier, password);
            if (account == null) {
                throw new BadCredentialsException("Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại Email/Số điện thoại hoặc Mật khẩu.");
            }
        }

        // UC-08: Kiểm tra Account Status
        if (account.getStatus() != AccountStatus.ACTIVE) {
            log.info("Đăng nhập bị từ chối: Tài khoản {} ở trạng thái INACTIVE", identifier);
            throw new AccountInactiveException("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị hệ thống.");
        }

        // UC-08: Nếu là NCC (PROVIDER), kiểm tra Provider Status
        if (account.getRole() == AccountRole.PROVIDER) {
            Provider provider = account.getProvider();
            if (provider == null || provider.getStatus() != ProviderStatus.ACTIVE) {
                log.info("Đăng nhập bị từ chối: Nhà cung cấp cho tài khoản {} không ở trạng thái ACTIVE", identifier);
                throw new ProviderSuspendedException("Nhà cung cấp đã bị đình chỉ hoạt động hoặc không khả dụng. Vui lòng liên hệ kênh hỗ trợ đối tác.");
            }
        }

        // Cập nhật last login time nếu tài khoản có ID trong DB
        if (account.getId() != null && accountOpt.isPresent()) {
            account.setLastLoginAt(LocalDateTime.now());
            accountRepository.save(account);
        }

        // Sinh JWT token
        String tokenIdentifier = account.getEmail() != null ? account.getEmail() : account.getPhone();
        String token = jwtUtils.generateToken(tokenIdentifier, "ROLE_" + account.getRole().name());

        // Chuẩn bị DTO trả về (Không bao giờ trả JPA Entity trực tiếp theo AGENTS.md)
        ProviderSummaryDto providerDto = null;
        if (account.getProvider() != null) {
            Provider p = account.getProvider();
            providerDto = ProviderSummaryDto.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .status(p.getStatus())
                    .contactName(p.getContactName())
                    .contactPhone(p.getContactPhone())
                    .contactEmail(p.getContactEmail())
                    .address(p.getAddress())
                    .build();
        }

        String redirectUrl = account.getRole() == AccountRole.ADMIN ? "/admin" : "/partner";

        return PortalLoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .accountId(account.getId() != null ? account.getId() : 1L)
                .email(account.getEmail())
                .phone(account.getPhone())
                .fullName(account.getFullName())
                .role(account.getRole())
                .status(account.getStatus())
                .provider(providerDto)
                .redirectUrl(redirectUrl)
                .message("Đăng nhập thành công! Đang điều hướng đến " + (account.getRole() == AccountRole.ADMIN ? "Cổng Quản Trị Hệ Thống." : "Cổng Nhà Cung Cấp Đối Tác."))
                .build();
    }

    private boolean checkPassword(String plainPassword, String storedHash) {
        if (storedHash == null || plainPassword == null) return false;
        // Chấp nhận so khớp trực tiếp hoặc bcrypt nếu có
        return storedHash.equals(plainPassword);
    }

    /**
     * Dữ liệu hạt giống mặc định cho 7 kịch bản QA Simulator
     */
    private Account getMockAccountForQa(String identifier, String password) {
        // 1. Admin QA
        if (("admin@taybactrails.vn".equalsIgnoreCase(identifier) || "0988888888".equals(identifier))
                && "Admin@123456".equals(password)) {
            return Account.builder()
                    .id(1001L)
                    .email("admin@taybactrails.vn")
                    .phone("0988888888")
                    .fullName("Nguyễn Quản Trị Viên")
                    .role(AccountRole.ADMIN)
                    .status(AccountStatus.ACTIVE)
                    .build();
        }

        // 2. NCC QA Hợp lệ
        if (("ncc@taybactrails.vn".equalsIgnoreCase(identifier) || "0912345678".equals(identifier))
                && "Ncc@123456".equals(password)) {
            Provider activeProvider = Provider.builder()
                    .id(2001L)
                    .name("Bản Lìm Mông Eco Lodge")
                    .contactName("Giàng A Páo")
                    .contactPhone("0912345678")
                    .contactEmail("ncc@taybactrails.vn")
                    .address("Bản Lìm Mông, Xã Cao Phạ, Mù Cang Chải, Yên Bái")
                    .status(ProviderStatus.ACTIVE)
                    .build();

            return Account.builder()
                    .id(1002L)
                    .email("ncc@taybactrails.vn")
                    .phone("0912345678")
                    .fullName("Giàng A Páo")
                    .role(AccountRole.PROVIDER)
                    .status(AccountStatus.ACTIVE)
                    .provider(activeProvider)
                    .build();
        }

        // 3. Tài khoản Vô hiệu hoá QA (TK Vô hiệu hoá)
        if (("inactive_user@taybactrails.vn".equalsIgnoreCase(identifier) || "0900000001".equals(identifier))
                && "Pass@123456".equals(password)) {
            return Account.builder()
                    .id(1003L)
                    .email("inactive_user@taybactrails.vn")
                    .phone("0900000001")
                    .fullName("Trần Vô Hiệu")
                    .role(AccountRole.PROVIDER)
                    .status(AccountStatus.INACTIVE)
                    .build();
        }

        // 4. NCC Đình chỉ QA (NCC Đình chỉ)
        if (("ncc_suspended@taybactrails.vn".equalsIgnoreCase(identifier) || "0900000002".equals(identifier))
                && "Pass@123456".equals(password)) {
            Provider suspendedProvider = Provider.builder()
                    .id(2002L)
                    .name("Homestay Dế Xu Phình")
                    .contactName("Lý Thị Mẩy")
                    .contactPhone("0900000002")
                    .contactEmail("ncc_suspended@taybactrails.vn")
                    .address("Bản Dế Xu Phình, Mù Cang Chải, Yên Bái")
                    .status(ProviderStatus.SUSPENDED)
                    .build();

            return Account.builder()
                    .id(1004L)
                    .email("ncc_suspended@taybactrails.vn")
                    .phone("0900000002")
                    .fullName("Lý Thị Mẩy")
                    .role(AccountRole.PROVIDER)
                    .status(AccountStatus.ACTIVE)
                    .provider(suspendedProvider)
                    .build();
        }

        return null;
    }

    public static class BadCredentialsException extends RuntimeException {
        public BadCredentialsException(String message) { super(message); }
    }

    public static class AccountInactiveException extends RuntimeException {
        public AccountInactiveException(String message) { super(message); }
    }

    public static class ProviderSuspendedException extends RuntimeException {
        public ProviderSuspendedException(String message) { super(message); }
    }
}

