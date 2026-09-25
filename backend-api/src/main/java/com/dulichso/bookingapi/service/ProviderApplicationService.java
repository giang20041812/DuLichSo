package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ProviderApplicationDtos.*;
import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * UC-NCC-08: NCC tự đăng ký → hồ sơ PENDING trong provider_application (mật khẩu đã băm BCrypt).
 * Provider/Account không có trạng thái chờ duyệt (UC-09), nên tài khoản đăng nhập chỉ được tạo khi Admin duyệt hồ sơ
 * — phần duyệt thuộc module Admin (FR-AD-03), xem docs/ncc-handoff.md.
 */
@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class ProviderApplicationService {
    private final EntityManager em;
    private final AccountRepository accounts;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public RegisterResult register(RegisterInput input) {
        String phone = input.contactPhone().trim();
        String email = blankToNull(input.contactEmail());
        if (identifierTaken(phone) || (email != null && identifierTaken(email)))
            throw conflict("Số điện thoại hoặc email đã được dùng cho một tài khoản đối tác.");
        if (pendingFor(phone).isPresent() || (email != null && pendingFor(email).isPresent()))
            throw conflict("Đã có hồ sơ đăng ký đang chờ duyệt với số điện thoại hoặc email này.");
        ProviderApplication application = ProviderApplication.builder()
                .businessName(input.businessName().trim()).contactName(input.contactName().trim())
                .contactPhone(phone).contactEmail(email).address(input.address().trim())
                .businessLicenseNo(blankToNull(input.businessLicenseNo())).description(blankToNull(input.description()))
                .passwordHash(passwordEncoder.encode(input.password())).createdAt(LocalDateTime.now()).build();
        em.persist(application);
        return new RegisterResult(application.getId(), application.getStatus(),
                "Đã gửi hồ sơ đăng ký. Quản trị viên sẽ thẩm định và bạn có thể đăng nhập bằng số điện thoại/email này sau khi hồ sơ được duyệt.");
    }

    private boolean identifierTaken(String identifier) {return accounts.findByIdentifier(identifier).isPresent();}

    private Optional<ProviderApplication> pendingFor(String identifier) {
        return em.createQuery("select a from ProviderApplication a where (a.contactPhone=:id or a.contactEmail=:id) and a.status=:pending", ProviderApplication.class)
                .setParameter("id", identifier).setParameter("pending", ProviderApplicationStatus.PENDING).setMaxResults(1).getResultStream().findFirst();
    }

    private static String blankToNull(String s) {return s == null || s.isBlank() ? null : s.trim();}
    private static ResponseStatusException conflict(String text) {return new ResponseStatusException(HttpStatus.CONFLICT, text);}
}
