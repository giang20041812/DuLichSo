-- ============================================================================
-- SCRIPT THÊM DỮ LIỆU ĐƠN ĐẶT PHÒNG (BOOKINGS) ĐẦY ĐỦ CÁC TRẠNG THÁI VÀO DATABASE
-- Database: dulichso (MySQL 8.0+)
-- Các trạng thái: PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, COMPLETED, REFUNDED, CANCELLED
-- ============================================================================

USE dulichso;

-- 1. Cập nhật ENUM của bảng booking & booking_status_history để hỗ trợ đầy đủ các trạng thái lưu trú
ALTER TABLE booking MODIFY COLUMN status 
    ENUM('PENDING','AWAITING_PAYMENT','CONFIRMED','CHECKED_IN','CHECKED_OUT','COMPLETED','REFUNDED','CANCELLED','REJECTED','EXPIRED','NO_SHOW') 
    NOT NULL DEFAULT 'PENDING';

ALTER TABLE booking_status_history MODIFY COLUMN from_status 
    ENUM('PENDING','AWAITING_PAYMENT','CONFIRMED','CHECKED_IN','CHECKED_OUT','COMPLETED','REFUNDED','CANCELLED','REJECTED','EXPIRED','NO_SHOW') 
    NULL;

ALTER TABLE booking_status_history MODIFY COLUMN to_status 
    ENUM('PENDING','AWAITING_PAYMENT','CONFIRMED','CHECKED_IN','CHECKED_OUT','COMPLETED','REFUNDED','CANCELLED','REJECTED','EXPIRED','NO_SHOW') 
    NOT NULL;

-- 2. Tạm thời tắt FOREIGN_KEY_CHECKS để chèn an toàn
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa các đơn đặt phòng mẫu cũ nếu đã tồn tại để tránh trùng lặp booking_code
DELETE FROM booking_service_item WHERE booking_id IN (SELECT id FROM booking WHERE booking_code IN ('VJ-782910', 'VJ-653198', 'VJ-419082', 'VJ-312954', 'VJ-881240', 'VJ-552190', 'VJ-901428', 'VJ-229014'));
DELETE FROM booking_night WHERE booking_id IN (SELECT id FROM booking WHERE booking_code IN ('VJ-782910', 'VJ-653198', 'VJ-419082', 'VJ-312954', 'VJ-881240', 'VJ-552190', 'VJ-901428', 'VJ-229014'));
DELETE FROM booking_status_history WHERE booking_id IN (SELECT id FROM booking WHERE booking_code IN ('VJ-782910', 'VJ-653198', 'VJ-419082', 'VJ-312954', 'VJ-881240', 'VJ-552190', 'VJ-901428', 'VJ-229014'));
DELETE FROM booking WHERE booking_code IN ('VJ-782910', 'VJ-653198', 'VJ-419082', 'VJ-312954', 'VJ-881240', 'VJ-552190', 'VJ-901428', 'VJ-229014');

-- ============================================================================
-- 3. INSERT CÁC ĐƠN ĐẶT PHÒNG VỚI MỌI TRẠNG THÁI
-- ============================================================================

-- ĐƠN 1: PENDING (Chờ duyệt)
INSERT INTO booking (
    booking_code, place_id, room_type_id, provider_id,
    check_in, check_out, room_count, guest_count,
    guest_name, guest_phone, guest_email, guest_note,
    status, currency, total_amount, policy_snapshot,
    created_at, hold_expires_at
) VALUES (
    'VJ-782910',
    (SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay' LIMIT 1),
    (SELECT id FROM room_type WHERE place_id=(SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay' LIMIT 1) LIMIT 1),
    (SELECT provider_id FROM place WHERE slug='hello-mu-cang-chai-homestay' LIMIT 1),
    '2026-10-05', '2026-10-07', 1, 2,
    'Vũ Trường Giang', '0987654321', 'giang20041812@gmail.com', 'Phòng tầng 2 view thung lũng lúa mâm xôi thoáng đãng.',
    'PENDING', 'VND', 1600000,
    JSON_OBJECT('policyName', 'Linh hoạt: Miễn phí hủy trước 48h', 'freeCancelCutoffHours', 48, 'description', 'Khách hủy trước 48h được hoàn 100% tiền cọc. Hủy trong vòng 48h tính phí 50% đêm đầu.'),
    '2026-09-24 08:30:00', '2026-09-25 08:30:00'
);

-- ĐƠN 2: CONFIRMED (Đã xác nhận)
INSERT INTO booking (
    booking_code, place_id, room_type_id, provider_id,
    check_in, check_out, room_count, guest_count,
    guest_name, guest_phone, guest_email, guest_note,
    status, currency, total_amount, policy_snapshot,
    created_at, confirmed_at, hold_expires_at
) VALUES (
    'VJ-653198',
    (SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge' LIMIT 1),
    (SELECT id FROM room_type WHERE place_id=(SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge' LIMIT 1) LIMIT 1),
    (SELECT provider_id FROM place WHERE slug='mu-cang-chai-eco-lodge' LIMIT 1),
    '2026-10-12', '2026-10-15', 1, 2,
    'Vũ Trường Giang', '0987654321', 'giang20041812@gmail.com', 'Cần hỗ trợ thuê xe máy giao nhận tại homestay.',
    'CONFIRMED', 'VND', 3600000,
    JSON_OBJECT('policyName', 'Tiêu chuẩn: Miễn phí hủy trước 72h', 'freeCancelCutoffHours', 72, 'description', 'Hủy phòng trước 72h tính từ 14:00 ngày nhận phòng được hoàn 100%.'),
    '2026-09-22 14:15:00', '2026-09-22 15:00:00', '2026-09-23 14:15:00'
);

-- ĐƠN 3: CHECKED_IN (Đang lưu trú)
INSERT INTO booking (
    booking_code, place_id, room_type_id, provider_id,
    check_in, check_out, room_count, guest_count,
    guest_name, guest_phone, guest_email, guest_note,
    status, currency, total_amount, policy_snapshot,
    created_at, confirmed_at
) VALUES (
    'VJ-419082',
    (SELECT id FROM place WHERE slug='do-gu-homestay' LIMIT 1),
    (SELECT id FROM room_type WHERE place_id=(SELECT id FROM place WHERE slug='do-gu-homestay' LIMIT 1) LIMIT 1),
    (SELECT provider_id FROM place WHERE slug='do-gu-homestay' LIMIT 1),
    '2026-09-23', '2026-09-25', 2, 4,
    'Vũ Trường Giang', '0987654321', 'giang20041812@gmail.com', 'Đã nhận phòng, gia đình đang dùng cơm trưa tại nhà sàn.',
    'CHECKED_IN', 'VND', 1300000,
    JSON_OBJECT('policyName', 'Tiêu chuẩn 24h', 'freeCancelCutoffHours', 24, 'description', 'Miễn phí hủy trước 24h.'),
    '2026-09-18 10:00:00', '2026-09-18 10:30:00'
);

-- ĐƠN 4: CHECKED_OUT (Đã trả phòng)
INSERT INTO booking (
    booking_code, place_id, room_type_id, provider_id,
    check_in, check_out, room_count, guest_count,
    guest_name, guest_phone, guest_email, guest_note,
    status, currency, total_amount, policy_snapshot,
    created_at, confirmed_at
) VALUES (
    'VJ-312954',
    (SELECT id FROM place WHERE slug='mu-cang-homestay' LIMIT 1),
    (SELECT id FROM room_type WHERE place_id=(SELECT id FROM place WHERE slug='mu-cang-homestay' LIMIT 1) LIMIT 1),
    (SELECT provider_id FROM place WHERE slug='mu-cang-homestay' LIMIT 1),
    '2026-09-21', '2026-09-23', 1, 2,
    'Vũ Trường Giang', '0987654321', 'giang20041812@gmail.com', 'Đã bàn giao chìa khóa 12h trưa nay.',
    'CHECKED_OUT', 'VND', 800000,
    JSON_OBJECT('policyName', 'Miễn phí hủy trước 48h', 'freeCancelCutoffHours', 48, 'description', 'Miễn phí hủy trước 48h nhận phòng.'),
    '2026-09-15 09:20:00', '2026-09-15 10:00:00'
);

-- ĐƠN 5: COMPLETED (Đã hoàn thành - Có thể đánh giá)
INSERT INTO booking (
    booking_code, place_id, room_type_id, provider_id,
    check_in, check_out, room_count, guest_count,
    guest_name, guest_phone, guest_email, guest_note,
    status, currency, total_amount, policy_snapshot,
    created_at, confirmed_at, closed_at, closed_by_actor
) VALUES (
    'VJ-881240',
    (SELECT id FROM place WHERE slug='ngoc-thuy-homestay' LIMIT 1),
    (SELECT id FROM room_type WHERE place_id=(SELECT id FROM place WHERE slug='ngoc-thuy-homestay' LIMIT 1) LIMIT 1),
    (SELECT provider_id FROM place WHERE slug='ngoc-thuy-homestay' LIMIT 1),
    '2026-09-10', '2026-09-12', 1, 2,
    'Vũ Trường Giang', '0987654321', 'giang20041812@gmail.com', 'Kỳ nghỉ hoàn hảo cùng gia đình.',
    'COMPLETED', 'VND', 1200000,
    JSON_OBJECT('policyName', 'Miễn phí hủy trước 48h', 'freeCancelCutoffHours', 48, 'description', 'Miễn phí hủy trước 48h nhận phòng.'),
    '2026-09-02 11:45:00', '2026-09-02 12:00:00', '2026-09-12 12:00:00', 'SYSTEM'
);

-- ĐƠN 6: COMPLETED (Đã hoàn thành #2)
INSERT INTO booking (
    booking_code, place_id, room_type_id, provider_id,
    check_in, check_out, room_count, guest_count,
    guest_name, guest_phone, guest_email, guest_note,
    status, currency, total_amount, policy_snapshot,
    created_at, confirmed_at, closed_at, closed_by_actor
) VALUES (
    'VJ-552190',
    (SELECT id FROM place WHERE slug='mong-ngua-homestay' LIMIT 1),
    (SELECT id FROM room_type WHERE place_id=(SELECT id FROM place WHERE slug='mong-ngua-homestay' LIMIT 1) LIMIT 1),
    (SELECT provider_id FROM place WHERE slug='mong-ngua-homestay' LIMIT 1),
    '2026-08-15', '2026-08-17', 1, 2,
    'Vũ Trường Giang', '0987654321', 'giang20041812@gmail.com', 'Chủ nhà rất nhiệt tình hỗ trợ đoàn.',
    'COMPLETED', 'VND', 1400000,
    JSON_OBJECT('policyName', 'Tiêu chuẩn 24h', 'freeCancelCutoffHours', 24, 'description', 'Miễn phí hủy trước 24h nhận phòng.'),
    '2026-08-05 16:00:00', '2026-08-05 16:30:00', '2026-08-17 12:00:00', 'SYSTEM'
);

-- ĐƠN 7: REFUNDED (Đã hoàn tiền theo chính sách)
INSERT INTO booking (
    booking_code, place_id, room_type_id, provider_id,
    check_in, check_out, room_count, guest_count,
    guest_name, guest_phone, guest_email, guest_note,
    status, currency, total_amount, policy_snapshot,
    created_at, confirmed_at, closed_at, close_reason, closed_by_actor
) VALUES (
    'VJ-901428',
    (SELECT id FROM place WHERE slug='la-pan-tan-homestay' LIMIT 1),
    (SELECT id FROM room_type WHERE place_id=(SELECT id FROM place WHERE slug='la-pan-tan-homestay' LIMIT 1) LIMIT 1),
    (SELECT provider_id FROM place WHERE slug='la-pan-tan-homestay' LIMIT 1),
    '2026-09-18', '2026-09-20', 1, 2,
    'Vũ Trường Giang', '0987654321', 'giang20041812@gmail.com', 'Đã hoàn tiền 100% qua cổng thanh toán SEPay do ảnh hưởng thời tiết.',
    'REFUNDED', 'VND', 1500000,
    JSON_OBJECT('policyName', 'Linh hoạt thời tiết', 'freeCancelCutoffHours', 24, 'cancelReason', 'Thời tiết sạt lở đường lên Bản', 'refundAmount', 1500000, 'refundStatus', 'APPROVED_FULL', 'description', 'Hỗ trợ hoàn 100% trong trường hợp bão lũ.'),
    '2026-09-12 07:15:00', '2026-09-12 08:00:00', '2026-09-13 10:00:00', 'Thời tiết xấu / sự cố bất khả kháng', 'CUSTOMER'
);

-- ĐƠN 8: CANCELLED (Đã hủy - Đáp ứng ràng buộc ck_booking_close)
INSERT INTO booking (
    booking_code, place_id, room_type_id, provider_id,
    check_in, check_out, room_count, guest_count,
    guest_name, guest_phone, guest_email, guest_note,
    status, currency, total_amount, policy_snapshot,
    created_at, closed_at, close_reason, closed_by_actor
) VALUES (
    'VJ-229014',
    (SELECT id FROM place WHERE slug='homestay-cuong-tu' LIMIT 1),
    (SELECT id FROM room_type WHERE place_id=(SELECT id FROM place WHERE slug='homestay-cuong-tu' LIMIT 1) LIMIT 1),
    (SELECT provider_id FROM place WHERE slug='homestay-cuong-tu' LIMIT 1),
    '2026-09-05', '2026-09-07', 1, 2,
    'Vũ Trường Giang', '0987654321', 'giang20041812@gmail.com', 'Khách hủy trước 48h theo chính sách.',
    'CANCELLED', 'VND', 1100000,
    JSON_OBJECT('policyName', 'Miễn phí hủy trước 48h', 'freeCancelCutoffHours', 48, 'cancelReason', 'Thay đổi kế hoạch du lịch cá nhân', 'description', 'Đã hủy thành công.'),
    '2026-08-28 09:00:00', '2026-08-29 14:00:00', 'Thay đổi kế hoạch du lịch cá nhân', 'CUSTOMER'
);

-- ============================================================================
-- 4. INSERT BOOKING NIGHTS (Giá từng đêm)
-- ============================================================================

INSERT INTO booking_night (booking_id, stay_date, unit_price, room_count)
SELECT id, '2026-10-05', 800000, 1 FROM booking WHERE booking_code='VJ-782910'
UNION ALL
SELECT id, '2026-10-06', 800000, 1 FROM booking WHERE booking_code='VJ-782910'
UNION ALL
SELECT id, '2026-10-12', 1200000, 1 FROM booking WHERE booking_code='VJ-653198'
UNION ALL
SELECT id, '2026-10-13', 1200000, 1 FROM booking WHERE booking_code='VJ-653198'
UNION ALL
SELECT id, '2026-10-14', 1200000, 1 FROM booking WHERE booking_code='VJ-653198'
UNION ALL
SELECT id, '2026-09-23', 650000, 2 FROM booking WHERE booking_code='VJ-419082'
UNION ALL
SELECT id, '2026-09-24', 650000, 2 FROM booking WHERE booking_code='VJ-419082'
UNION ALL
SELECT id, '2026-09-21', 400000, 1 FROM booking WHERE booking_code='VJ-312954'
UNION ALL
SELECT id, '2026-09-22', 400000, 1 FROM booking WHERE booking_code='VJ-312954'
UNION ALL
SELECT id, '2026-09-10', 600000, 1 FROM booking WHERE booking_code='VJ-881240'
UNION ALL
SELECT id, '2026-09-11', 600000, 1 FROM booking WHERE booking_code='VJ-881240'
UNION ALL
SELECT id, '2026-08-15', 700000, 1 FROM booking WHERE booking_code='VJ-552190'
UNION ALL
SELECT id, '2026-08-16', 700000, 1 FROM booking WHERE booking_code='VJ-552190'
UNION ALL
SELECT id, '2026-09-18', 750000, 1 FROM booking WHERE booking_code='VJ-901428'
UNION ALL
SELECT id, '2026-09-19', 750000, 1 FROM booking WHERE booking_code='VJ-901428'
UNION ALL
SELECT id, '2026-09-05', 550000, 1 FROM booking WHERE booking_code='VJ-229014'
UNION ALL
SELECT id, '2026-09-06', 550000, 1 FROM booking WHERE booking_code='VJ-229014';

-- ============================================================================
-- 5. INSERT DỊCH VỤ ĐI KÈM (Booking Service Items)
-- ============================================================================

INSERT INTO booking_service_item (booking_id, service_name, service_code, is_included, note)
SELECT id, 'Bữa sáng bản địa', 'BREAKFAST', 1, 'Miễn phí món bánh chưng đen / xôi ngũ sắc' FROM booking WHERE booking_code='VJ-782910'
UNION ALL
SELECT id, 'Trà thảo mộc chào mừng', 'WELCOME_TEA', 1, 'Trà shan tuyết cổ thụ' FROM booking WHERE booking_code='VJ-653198'
UNION ALL
SELECT id, 'Xe đạp dạo bản miễn phí', 'BIKE_FREE', 1, 'Sử dụng xe đạp tự do tham quan bản' FROM booking WHERE booking_code='VJ-419082'
UNION ALL
SELECT id, 'Tắm lá thuốc người Dao đỏ', 'DAO_BATH', 0, 'Phụ thu 100.000 đ/lần tại homestay' FROM booking WHERE booking_code='VJ-881240';

-- ============================================================================
-- 6. INSERT LỊCH SỬ TRẠNG THÁI (Booking Status History)
-- ============================================================================

INSERT INTO booking_status_history (booking_id, from_status, to_status, actor, reason, created_at)
SELECT id, NULL, 'PENDING', 'CUSTOMER', 'Khách tạo yêu cầu đặt phòng trực tuyến', '2026-09-24 08:30:00' FROM booking WHERE booking_code='VJ-782910'
UNION ALL
SELECT id, 'PENDING', 'CONFIRMED', 'PROVIDER', 'Nhà cung cấp xác nhận còn phòng trống', '2026-09-22 15:00:00' FROM booking WHERE booking_code='VJ-653198'
UNION ALL
SELECT id, 'CONFIRMED', 'CHECKED_IN', 'PROVIDER', 'Khách đã làm thủ tục nhận phòng', '2026-09-23 13:30:00' FROM booking WHERE booking_code='VJ-419082'
UNION ALL
SELECT id, 'CHECKED_IN', 'CHECKED_OUT', 'PROVIDER', 'Khách đã hoàn tất trả phòng và thanh toán dịch vụ phát sinh', '2026-09-23 11:45:00' FROM booking WHERE booking_code='VJ-312954'
UNION ALL
SELECT id, 'CHECKED_OUT', 'COMPLETED', 'SYSTEM', 'Hệ thống tự động đóng đơn sau 24h trả phòng', '2026-09-12 12:00:00' FROM booking WHERE booking_code='VJ-881240'
UNION ALL
SELECT id, 'CONFIRMED', 'REFUNDED', 'SYSTEM', 'Hoàn tiền 100% theo chính sách do ảnh hưởng thời tiết', '2026-09-13 10:00:00' FROM booking WHERE booking_code='VJ-901428'
UNION ALL
SELECT id, 'PENDING', 'CANCELLED', 'CUSTOMER', 'Khách yêu cầu hủy phòng', '2026-08-29 14:00:00' FROM booking WHERE booking_code='VJ-229014';

-- 7. Bật lại FOREIGN_KEY_CHECKS
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- KIỂM TRA KẾT QUẢ ĐÃ CHÈN THÀNH CÔNG
-- ============================================================================
SELECT 
    b.id,
    b.booking_code,
    b.status,
    p.name AS place_name,
    rt.name AS room_name,
    b.guest_name,
    b.guest_phone,
    b.check_in,
    b.check_out,
    b.total_amount
FROM booking b
JOIN place p ON b.place_id = p.id
JOIN room_type rt ON b.room_type_id = rt.id
ORDER BY b.created_at DESC;
