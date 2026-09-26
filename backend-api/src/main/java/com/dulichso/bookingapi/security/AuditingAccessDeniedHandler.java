package com.dulichso.bookingapi.security;

import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * NFR-SEC-05: ghi audit log khi người dùng đã xác thực bị từ chối truy cập (vd: NCC gọi API Admin),
 * rồi trả về đúng phản hồi 403 mặc định của Spring Security để không đổi hành vi phía client.
 * Chỉ ghi đường dẫn (không ghi query string) để không lưu dữ liệu cá nhân trong tham số.
 */
@Component
public class AuditingAccessDeniedHandler implements AccessDeniedHandler {

    private final AuditLogService auditLogService;
    private final AccessDeniedHandler delegate = new AccessDeniedHandlerImpl();

    public AuditingAccessDeniedHandler(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, jakarta.servlet.ServletException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            ActorType actor = principal.role() == AccountRole.PROVIDER ? ActorType.PROVIDER : ActorType.ADMIN;
            String endpoint = request.getMethod() + " " + request.getRequestURI();
            auditLogService.recordEvent(actor, principal.accountId(), "ACCESS_DENIED", "Endpoint", null,
                    AuditLogService.RESULT_DENIED, ClientIp.of(request), endpoint,
                    Map.of("role", principal.role().name()));
        }
        delegate.handle(request, response, accessDeniedException);
    }
}
