package com.dulichso.bookingapi.service.impl;

import com.dulichso.bookingapi.dto.NotificationDto;
import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.Notification;
import com.dulichso.bookingapi.entity.NotificationTemplate;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.entity.enums.NotificationChannel;
import com.dulichso.bookingapi.entity.enums.NotificationStatus;
import com.dulichso.bookingapi.entity.enums.RecipientType;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.NotificationRepository;
import com.dulichso.bookingapi.repository.NotificationTemplateRepository;
import com.dulichso.bookingapi.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationTemplateRepository templateRepository;
    private final BookingRepository bookingRepository;

    @Override
    @Transactional
    public NotificationDto notifyBookingStatusChange(Booking booking, BookingStatus newStatus, String reason) {
        if (booking == null || newStatus == null) return null;
        if (newStatus != BookingStatus.CONFIRMED && newStatus != BookingStatus.REJECTED && newStatus != BookingStatus.CANCELLED) {
            return null;
        }

        String templateCode;
        String title;
        String message;
        String placeName = booking.getPlace() != null ? booking.getPlace().getName() : "Homestay";

        if (newStatus == BookingStatus.CONFIRMED) {
            templateCode = "BOOKING_CONFIRMED";
            title = "Đặt phòng đã được xác nhận";
            message = "Đơn đặt phòng " + booking.getBookingCode() + " tại " + placeName + " đã được xác nhận thành công. Chúc bạn có kỳ nghỉ tuyệt vời!";
        } else if (newStatus == BookingStatus.REJECTED) {
            templateCode = "BOOKING_REJECTED";
            title = "Đơn đặt phòng bị từ chối";
            String reasonText = (reason != null && !reason.isBlank()) ? (" Lý do: " + reason.trim()) : "";
            message = "Rất tiếc, đơn đặt phòng " + booking.getBookingCode() + " tại " + placeName + " đã bị từ chối." + reasonText;
        } else {
            templateCode = "BOOKING_CANCELLED_PROVIDER_LOCKED";
            title = "Đơn đặt phòng đã bị hủy";
            message = "Đơn đặt phòng " + booking.getBookingCode() + " tại " + placeName + " đã bị hủy do Homestay/NCC ngừng phục vụ." +
                    ((reason == null || reason.isBlank()) ? "" : " Lý do: " + reason.trim());
        }

        NotificationTemplate template = ensureTemplateExists(templateCode, title, message);

        Map<String, Object> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("message", message);
        payload.put("bookingCode", booking.getBookingCode());
        payload.put("bookingStatus", newStatus.name());
        payload.put("placeName", placeName);
        payload.put("isRead", false);
        if (booking.getTotalAmount() != null) {
            payload.put("totalAmount", booking.getTotalAmount());
        }

        Notification notification = Notification.builder()
                .template(template)
                .channel(NotificationChannel.IN_APP)
                .recipientType(RecipientType.CUSTOMER)
                .recipientEmail(booking.getGuestEmail())
                .recipientPhone(booking.getGuestPhone())
                .relatedEntityType("booking")
                .relatedEntityId(booking.getId())
                .payload(payload)
                .status(NotificationStatus.SENT)
                .createdAt(LocalDateTime.now())
                .sentAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Đã tạo thông báo IN_APP cho khách {} về booking {} trạng thái {}",
                booking.getGuestEmail() != null ? booking.getGuestEmail() : booking.getGuestPhone(),
                booking.getBookingCode(), newStatus);

        return mapToDto(saved);
    }

    @Override
    @Transactional
    public NotificationDto notifyBookingChangeRequestDecision(Booking booking, boolean approved, String rejectionReason) {
        if (booking == null) return null;

        String title = approved ? "Yêu cầu thay đổi Booking đã được duyệt" : "Yêu cầu thay đổi Booking bị từ chối";
        String message = approved
                ? "Yêu cầu thay đổi của Booking " + booking.getBookingCode() + " đã được nhà cung cấp duyệt."
                : "Yêu cầu thay đổi của Booking " + booking.getBookingCode() + " đã bị từ chối."
                    + ((rejectionReason == null || rejectionReason.isBlank()) ? "" : " Lý do: " + rejectionReason.trim());
        String templateCode = approved ? "BOOKING_CHANGE_APPROVED" : "BOOKING_CHANGE_REJECTED";
        NotificationTemplate template = ensureTemplateExists(templateCode, title, message);

        Map<String, Object> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("message", message);
        payload.put("bookingCode", booking.getBookingCode());
        payload.put("bookingStatus", approved ? "CHANGE_APPROVED" : "CHANGE_REJECTED");
        payload.put("isRead", false);
        if (!approved && rejectionReason != null && !rejectionReason.isBlank()) {
            payload.put("rejectionReason", rejectionReason.trim());
        }

        Notification saved = notificationRepository.save(Notification.builder()
                .template(template)
                .channel(NotificationChannel.IN_APP)
                .recipientType(RecipientType.CUSTOMER)
                .recipientEmail(booking.getGuestEmail())
                .recipientPhone(booking.getGuestPhone())
                .relatedEntityType("booking_change_request")
                .relatedEntityId(booking.getId())
                .payload(payload)
                .status(NotificationStatus.SENT)
                .createdAt(LocalDateTime.now())
                .sentAt(LocalDateTime.now())
                .build());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public NotificationDto notifyReviewReply(Booking booking, String providerReply) {
        if (booking == null || providerReply == null || providerReply.isBlank()) return null;

        String placeName = booking.getPlace() != null ? booking.getPlace().getName() : "Homestay";
        String title = "Nhà cung cấp đã phản hồi đánh giá";
        String message = "NCC tại " + placeName + " đã phản hồi đánh giá của bạn cho đơn "
                + booking.getBookingCode() + ".";
        NotificationTemplate template = ensureTemplateExists("REVIEW_PROVIDER_REPLY", title, message);

        Map<String, Object> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("message", message);
        payload.put("bookingCode", booking.getBookingCode());
        payload.put("bookingStatus", "REVIEW_REPLY");
        payload.put("placeName", placeName);
        payload.put("isRead", false);

        Notification saved = notificationRepository.save(Notification.builder()
                .template(template)
                .channel(NotificationChannel.IN_APP)
                .recipientType(RecipientType.CUSTOMER)
                .recipientEmail(booking.getGuestEmail())
                .recipientPhone(booking.getGuestPhone())
                .relatedEntityType("review")
                .relatedEntityId(booking.getId())
                .payload(payload)
                .status(NotificationStatus.SENT)
                .createdAt(LocalDateTime.now())
                .sentAt(LocalDateTime.now())
                .build());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public List<NotificationDto> getNotificationsForCustomer(String email, String phone, Long accountId) {
        String safeEmail = (email != null && !email.isBlank()) ? email.trim() : null;
        String safePhone = (phone != null && !phone.isBlank()) ? phone.trim() : null;

        if (safeEmail == null && safePhone == null && accountId == null) {
            return Collections.emptyList();
        }

        List<Notification> list = notificationRepository.findNotificationsForCustomer(safeEmail, safePhone, accountId);
        List<NotificationDto> result = new ArrayList<>();
        for (Notification n : list) {
            result.add(mapToDto(n));
        }
        return result;
    }

    @Override
    @Transactional
    public NotificationDto markAsRead(Long id) {
        if (id == null) return null;
        // Endpoint công khai: chỉ thông báo của khách; thông báo gửi cho Admin có API riêng (cần đăng nhập ADMIN).
        Optional<Notification> opt = notificationRepository.findById(id)
                .filter(n -> n.getRecipientType() == com.dulichso.bookingapi.entity.enums.RecipientType.CUSTOMER);
        if (opt.isPresent()) {
            Notification n = opt.get();
            Map<String, Object> payload = n.getPayload();
            if (payload == null) payload = new HashMap<>();
            else payload = new HashMap<>(payload);
            payload.put("isRead", true);
            n.setPayload(payload);
            Notification saved = notificationRepository.save(n);
            return mapToDto(saved);
        }
        return null;
    }

    @Override
    @Transactional
    public void markAllAsRead(String email, String phone, Long accountId) {
        String safeEmail = (email != null && !email.isBlank()) ? email.trim() : null;
        String safePhone = (phone != null && !phone.isBlank()) ? phone.trim() : null;
        List<Notification> list = notificationRepository.findNotificationsForCustomer(safeEmail, safePhone, accountId);
        for (Notification n : list) {
            Map<String, Object> payload = n.getPayload();
            if (payload != null && Boolean.FALSE.equals(payload.get("isRead"))) {
                Map<String, Object> updated = new HashMap<>(payload);
                updated.put("isRead", true);
                n.setPayload(updated);
                notificationRepository.save(n);
            }
        }
    }

    private NotificationTemplate ensureTemplateExists(String code, String subject, String body) {
        return templateRepository.findByCode(code).orElseGet(() -> {
            NotificationTemplate newTpl = NotificationTemplate.builder()
                    .code(code)
                    .channel(NotificationChannel.IN_APP)
                    .subject(subject)
                    .bodyTemplate(body)
                    .isActive(true)
                    .build();
            try {
                return templateRepository.save(newTpl);
            } catch (Exception ex) {
                return templateRepository.findByCode(code).orElse(newTpl);
            }
        });
    }

    private NotificationDto mapToDto(Notification n) {
        Map<String, Object> payload = n.getPayload() != null ? n.getPayload() : Collections.emptyMap();
        String bookingCode = payload.get("bookingCode") != null ? String.valueOf(payload.get("bookingCode")) : null;
        String title = payload.get("title") != null ? String.valueOf(payload.get("title")) : "Thông báo đơn đặt phòng";
        String message = payload.get("message") != null ? String.valueOf(payload.get("message")) : "";
        String bookingStatus = payload.get("bookingStatus") != null ? String.valueOf(payload.get("bookingStatus")) : null;
        Boolean isRead = Boolean.TRUE.equals(payload.get("isRead"));

        return NotificationDto.builder()
                .id(n.getId())
                .templateCode(n.getTemplate() != null ? n.getTemplate().getCode() : null)
                .channel(n.getChannel() != null ? n.getChannel().name() : null)
                .recipientType(n.getRecipientType() != null ? n.getRecipientType().name() : null)
                .recipientEmail(n.getRecipientEmail())
                .recipientPhone(n.getRecipientPhone())
                .relatedEntityType(n.getRelatedEntityType())
                .relatedEntityId(n.getRelatedEntityId())
                .bookingCode(bookingCode)
                .title(title)
                .message(message)
                .bookingStatus(bookingStatus)
                .isRead(isRead)
                .createdAt(n.getCreatedAt())
                .payload(payload)
                .build();
    }
}
