package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.FieldErrorDto;
import com.dulichso.bookingapi.dto.ProviderApplicationDtos.*;
import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.ProviderApplicationRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Locale;

/**
 * UC-NCC-08: NCC tự đăng ký → hồ sơ PENDING trong provider_application (mật khẩu đã băm BCrypt).
 * Provider/Account không có trạng thái chờ duyệt (UC-09), nên tài khoản đăng nhập chỉ được tạo khi Admin duyệt hồ sơ
 * — phần duyệt thuộc module Admin (FR-AD-03), xem docs/ncc-handoff.md.
 */
@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class ProviderApplicationService {
    private final EntityManager em;
    private final AccountRepository accounts;
    private final ProviderApplicationRepository applications;
    private final PasswordEncoder passwordEncoder;
    private final NotificationRecorder notifications;

    @Transactional
    public RegisterResult register(RegisterInput input) {
        String phone = input.contactPhone().trim();
        String email = blankToNull(input.contactEmail());
        String businessLicenseNo = input.businessLicenseNo().trim();
        if (!phone.matches("^(0|\\+84)[35789][0-9]{8}$"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không đúng định dạng.");
        if (email != null) email = email.toLowerCase(Locale.ROOT);
        String alternatePhone = phone.startsWith("+84") ? "0" + phone.substring(3) : "+84" + phone.substring(1);
        // Kiểm tra đủ mọi trường trước khi báo, để NCC thấy cùng lúc tất cả thông tin bị trùng (tên trường khớp RegisterInput).
        List<FieldErrorDto> duplicates = new ArrayList<>();
        if (identifierTaken(phone) || identifierTaken(alternatePhone)) duplicates.add(new FieldErrorDto("contactPhone", "Số điện thoại này đã được đăng ký"));
        else if (pendingFor(phone).isPresent() || pendingFor(alternatePhone).isPresent())
            duplicates.add(new FieldErrorDto("contactPhone", "Số điện thoại này đã có hồ sơ đăng ký đang chờ duyệt"));
        if (email != null && identifierTaken(email)) duplicates.add(new FieldErrorDto("contactEmail", "Email này đã được sử dụng"));
        else if (email != null && pendingFor(email).isPresent())
            duplicates.add(new FieldErrorDto("contactEmail", "Email này đã có hồ sơ đăng ký đang chờ duyệt"));
        // Giấy phép trùng với hồ sơ chưa bị từ chối (đang chờ duyệt hoặc đã duyệt) thì không cho gửi hồ sơ mới.
        if (applications.existsByBusinessLicenseNoAndStatusNot(businessLicenseNo, ProviderApplicationStatus.REJECTED))
            duplicates.add(new FieldErrorDto("businessLicenseNo", "Số giấy phép đăng ký kinh doanh này đã được sử dụng"));
        if (!duplicates.isEmpty()) throw new DuplicateFieldsException(duplicates);
        ProviderApplication application = ProviderApplication.builder()
                .businessName(input.businessName().trim()).contactName(input.contactName().trim())
                .contactPhone(phone).contactEmail(email).address(input.address().trim())
                .businessLicenseNo(businessLicenseNo).description(blankToNull(input.description()))
                .passwordHash(passwordEncoder.encode(input.password())).createdAt(LocalDateTime.now()).build();
        em.persist(application);
        notifications.toAdmins("ADMIN_NEW_PROVIDER_APPLICATION", "ProviderApplication", application.getId(),
                "Nhà cung cấp \"" + application.getBusinessName() + "\" (" + application.getContactName() + ") vừa gửi hồ sơ đăng ký, đang chờ duyệt.",
                "applications");
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

    private boolean identifierTaken(String identifier) {
        return accounts.existsByEmailIgnoreCase(identifier) || accounts.existsByPhone(identifier);
    }

    private Optional<ProviderApplication> pendingFor(String identifier) {
        return em.createQuery("select a from ProviderApplication a where (a.contactPhone=:id or lower(a.contactEmail)=lower(:id)) and a.status=:pending", ProviderApplication.class)
                .setParameter("id", identifier).setParameter("pending", ProviderApplicationStatus.PENDING).setMaxResults(1).getResultStream().findFirst();
    }

    private static String blankToNull(String s) {return s == null || s.isBlank() ? null : s.trim();}
}
