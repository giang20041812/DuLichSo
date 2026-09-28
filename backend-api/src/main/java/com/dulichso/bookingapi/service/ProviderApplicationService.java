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
            throw conflict("Thông tin đăng nhập đã được sử dụng. Vui lòng kiểm tra tài khoản đối tác đã có.");
        if (pendingFor(phone).isPresent() || (email != null && pendingFor(email).isPresent()))
            throw conflict("Hồ sơ đang chờ xét duyệt với số điện thoại hoặc email này; không tạo hồ sơ trùng.");
        ProviderApplication application = ProviderApplication.builder()
                .businessName(input.businessName().trim()).contactName(input.contactName().trim())
                .contactPhone(phone).contactEmail(email).address(input.address().trim())
                .businessLicenseNo(blankToNull(input.businessLicenseNo())).description(blankToNull(input.description()))
                .passwordHash(passwordEncoder.encode(input.password())).createdAt(LocalDateTime.now()).build();
        em.persist(application);
        return new RegisterResult(application.getId(), application.getStatus(),
                "Đã tiếp nhận hồ sơ đăng ký Nhà cung cấp. Mã hồ sơ: " + application.getId()
                        + ". Quản trị viên sẽ thẩm định; bạn đăng nhập được bằng số điện thoại/email này sau khi hồ sơ được duyệt.");
    }

    /** UC-NCC-01 "Xem trạng thái": tra cứu bằng mã hồ sơ + số điện thoại đã đăng ký. */
    public StatusResult status(StatusInput input) {
        ProviderApplication a = em.find(ProviderApplication.class, input.applicationId());
        if (a == null || !a.getContactPhone().equals(input.contactPhone().trim()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ với mã và số điện thoại này.");
        String label = switch (a.getStatus()) {
            case PENDING -> "Hồ sơ đang chờ xét duyệt";
            case APPROVED -> "Hồ sơ đã được duyệt — bạn có thể đăng nhập Cổng đối tác";
            case REJECTED -> "Hồ sơ chưa được duyệt";
        };
        return new StatusResult(a.getId(), a.getBusinessName(), a.getStatus(), label, a.getReviewNote(), a.getCreatedAt(), a.getReviewedAt());
    }

    private boolean identifierTaken(String identifier) {return accounts.findByIdentifier(identifier).isPresent();}

    private Optional<ProviderApplication> pendingFor(String identifier) {
        return em.createQuery("select a from ProviderApplication a where (a.contactPhone=:id or a.contactEmail=:id) and a.status=:pending", ProviderApplication.class)
                .setParameter("id", identifier).setParameter("pending", ProviderApplicationStatus.PENDING).setMaxResults(1).getResultStream().findFirst();
    }

    private static String blankToNull(String s) {return s == null || s.isBlank() ? null : s.trim();}
    private static ResponseStatusException conflict(String text) {return new ResponseStatusException(HttpStatus.CONFLICT, text);}
}
