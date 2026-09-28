package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.NotificationDto;
import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.enums.BookingStatus;

import java.util.List;

public interface NotificationService {
    NotificationDto notifyBookingStatusChange(Booking booking, BookingStatus newStatus, String reason);
    NotificationDto notifyBookingChangeRequestDecision(Booking booking, boolean approved, String rejectionReason);
    NotificationDto notifyReviewReply(Booking booking, String providerReply);
    List<NotificationDto> getNotificationsForCustomer(String email, String phone, Long accountId);
    NotificationDto markAsRead(Long id);
    void markAllAsRead(String email, String phone, Long accountId);
}
