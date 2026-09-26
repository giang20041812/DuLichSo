-- ============================================================================
-- SCRIPT DEPLOY V2 - TOÀN BỘ DATA MẪU PHỤC VỤ TESTING
-- Đảm bảo tất cả các trường hợp, trạng thái booking, và địa điểm phù hợp theo thời gian.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate toàn bộ dữ liệu (bắt đầu từ bảng con đến bảng cha)
TRUNCATE TABLE festival_occurrence;
TRUNCATE TABLE festival;
TRUNCATE TABLE notification;
TRUNCATE TABLE notification_template;
TRUNCATE TABLE audit_log;
TRUNCATE TABLE review;
TRUNCATE TABLE refund;
TRUNCATE TABLE payment_transaction;
TRUNCATE TABLE payment_gateway;
TRUNCATE TABLE booking_status_history;
TRUNCATE TABLE booking_service_item;
TRUNCATE TABLE booking_night;
TRUNCATE TABLE booking;
TRUNCATE TABLE room_inventory_day;
TRUNCATE TABLE room_special_price;
TRUNCATE TABLE room_type_media;
TRUNCATE TABLE room_amenity;
TRUNCATE TABLE room_bed;
TRUNCATE TABLE room_type;
TRUNCATE TABLE cancellation_policy;
TRUNCATE TABLE homestay_profile;
TRUNCATE TABLE place_media;
TRUNCATE TABLE place_highlight;
TRUNCATE TABLE place_tag;
TRUNCATE TABLE place_amenity;
TRUNCATE TABLE place_opening_hour;
TRUNCATE TABLE place_contact;
TRUNCATE TABLE place;
TRUNCATE TABLE account;
TRUNCATE TABLE provider;
TRUNCATE TABLE media_asset;
TRUNCATE TABLE category_field_def;
TRUNCATE TABLE tag;
TRUNCATE TABLE amenity;
TRUNCATE TABLE category;
TRUNCATE TABLE region;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. MASTER DATA
-- ============================================================================

INSERT INTO region (id, code, name, name_norm, level, parent_id, path, is_active) VALUES
(1, 'YB', 'Yên Bái', 'yen bai', 1, NULL, '/yen-bai', 1),
(2, 'MCC', 'Mù Cang Chải', 'mu cang chai', 2, 1, '/yen-bai/mu-cang-chai', 1),
(3, 'LPT', 'La Pán Tẩn', 'la pan tan', 3, 2, '/yen-bai/mu-cang-chai/la-pan-tan', 1),
(4, 'DXP', 'Dế Xu Phình', 'de xu phinh', 3, 2, '/yen-bai/mu-cang-chai/de-xu-phinh', 1);

INSERT INTO category (id, kind, slug, name, description, sort_order, is_active) VALUES
(1, 'HOMESTAY', 'homestay', 'Homestay', 'Các điểm lưu trú homestay', 1, 1),
(2, 'RESTAURANT', 'nha-hang', 'Nhà Hàng', 'Nhà hàng, quán ăn', 2, 1),
(3, 'ATTRACTION', 'diem-den', 'Điểm Đến', 'Danh lam thắng cảnh, điểm tham quan', 3, 1),
(4, 'CUISINE', 'dac-san', 'Đặc Sản', 'Đặc sản địa phương', 4, 1);

INSERT INTO amenity (id, code, name, scope, is_essential, sort_order, is_active) VALUES
(1, 'WIFI', 'Wi-Fi miễn phí', 'PLACE', 1, 1, 1),
(2, 'PARKING', 'Bãi đỗ xe', 'PLACE', 1, 2, 1),
(3, 'AC', 'Điều hoà', 'ROOM', 0, 3, 1),
(4, 'HEATER', 'Máy sưởi', 'ROOM', 1, 4, 1),
(5, 'HOT_WATER', 'Nước nóng', 'ROOM', 1, 5, 1);

INSERT INTO tag (id, group_code, slug, name, is_active) VALUES
(1, 'VIEW', 'view-ruong-bac-thang', 'View Ruộng Bậc Thang', 1),
(2, 'VIEW', 'view-nui', 'View Núi', 1),
(3, 'AUDIENCE', 'danh-cho-gia-dinh', 'Dành cho gia đình', 1),
(4, 'AUDIENCE', 'danh-cho-cap-doi', 'Cặp đôi', 1);

INSERT INTO media_asset (id, storage_key, public_url, mime_type, width_px, height_px, size_bytes) VALUES
(1, 'img/homestay1_cover.jpg', 'https://example.com/hs1.jpg', 'image/jpeg', 1920, 1080, 500000),
(2, 'img/homestay2_cover.jpg', 'https://example.com/hs2.jpg', 'image/jpeg', 1920, 1080, 500000),
(3, 'img/attraction1_cover.jpg', 'https://example.com/at1.jpg', 'image/jpeg', 1920, 1080, 500000);

-- ============================================================================
-- 2. TÀI KHOẢN & PROVIDER
-- ============================================================================

INSERT INTO provider (id, name, contact_name, contact_phone, contact_email, status) VALUES
(1, 'Mù Cang Chải Ecolodge', 'Nguyễn Văn A', '0912345678', 'contact@ecolodge.com', 'ACTIVE'),
(2, 'Hello MCC Homestay', 'Trần Thị B', '0987654321', 'hello@mcc.com', 'ACTIVE');

-- Password mặc định (đã hash): 'password123' -> $2a$10$xyz... (dùng một chuỗi hash giả lập Bcrypt)
INSERT INTO account (id, email, phone, password_hash, role, status, provider_id, full_name) VALUES
(1, 'admin@dulichso.com', '0123456789', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIvi', 'ADMIN', 'ACTIVE', NULL, 'System Admin'),
(2, 'provider1@ecolodge.com', '0912345678', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIvi', 'PROVIDER', 'ACTIVE', 1, 'Provider Nguyễn Văn A'),
(3, 'provider2@mcc.com', '0987654321', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIvi', 'PROVIDER', 'ACTIVE', 2, 'Provider Trần Thị B');

-- ============================================================================
-- 3. PLACE (Homestay & Attraction)
-- ============================================================================

INSERT INTO place (id, slug, category_id, kind, provider_id, name, name_norm, region_id, address, visibility, operation_status, price_ref_min, price_ref_max, is_suitable_by_time, suitable_date_start, suitable_date_end, rating_avg, rating_count, created_by) VALUES
-- Homestay 1
(1, 'mu-cang-chai-ecolodge', 1, 'HOMESTAY', 1, 'Mù Cang Chải Ecolodge', 'mu cang chai ecolodge', 3, 'Xã La Pán Tẩn, Mù Cang Chải', 'PUBLISHED', 'OPERATING', 500000, 2000000, 0, NULL, NULL, 4.8, 12, 1),
-- Homestay 2
(2, 'hello-mcc-homestay', 1, 'HOMESTAY', 2, 'Hello MCC Homestay', 'hello mcc homestay', 4, 'Dế Xu Phình, Mù Cang Chải', 'PUBLISHED', 'OPERATING', 300000, 800000, 0, NULL, NULL, 4.5, 8, 1),
-- Attraction 1 (Ruộng Mâm Xôi - Mùa Vàng)
(3, 'doi-mam-xoi-la-pan-tan', 3, 'ATTRACTION', NULL, 'Đồi Mâm Xôi La Pán Tẩn', 'doi mam xoi la pan tan', 3, 'La Pán Tẩn, Mù Cang Chải', 'PUBLISHED', 'OPERATING', 20000, 20000, 1, '2026-09-01', '2026-10-31', 4.9, 150, 1),
-- Attraction 2 (Rừng trúc - Mùa Hè)
(4, 'rung-truc-mu-cang-chai', 3, 'ATTRACTION', NULL, 'Rừng Trúc Mù Cang Chải', 'rung truc mu cang chai', 4, 'Dế Xu Phình', 'PUBLISHED', 'OPERATING', 15000, 15000, 1, '2026-06-01', '2026-08-31', 4.6, 45, 1);

INSERT INTO place_media (place_id, media_id, role, sort_order) VALUES
(1, 1, 'COVER', 1),
(2, 2, 'COVER', 1),
(3, 3, 'COVER', 1);

-- ============================================================================
-- 4. HOMESTAY PROFILE & ROOMS
-- ============================================================================

INSERT INTO cancellation_policy (id, place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES
(1, 1, 1, 'Miễn phí hủy trước 3 ngày', 72, 'NO_REFUND', 'Hủy trước 3 ngày hoàn 100%. Hủy muộn mất cọc.'),
(2, 2, 1, 'Miễn phí hủy trước 1 ngày', 24, 'NO_REFUND', 'Hủy trước 1 ngày hoàn 100%.');

INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES
(1, '14:00:00', '12:00:00', 'Không hút thuốc trong phòng', 1),
(2, '13:00:00', '11:00:00', 'Giữ yên tĩnh sau 22h', 2);

INSERT INTO room_type (id, place_id, name, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES
(1, 1, 'Phòng Bungalow View Lúa', 2, 5, 'YES', 25.0, 1200000, 'ACTIVE'),
(2, 1, 'Phòng Family', 4, 3, 'YES', 40.0, 1800000, 'ACTIVE'),
(3, 2, 'Giường Dorm (Nhà Sàn)', 1, 15, 'NO', 5.0, 150000, 'ACTIVE');

-- Inventory Tháng 9 & 10 (Mẫu một vài ngày cho test)
INSERT INTO room_inventory_day (room_type_id, stay_date, total_rooms, held_rooms, confirmed_rooms, stop_sell) VALUES
(1, '2026-10-10', 5, 0, 1, 0),
(1, '2026-10-11', 5, 0, 1, 0),
(1, '2026-10-20', 5, 0, 1, 0),
(1, '2026-10-21', 5, 0, 1, 0),
(1, '2026-09-10', 5, 0, 1, 0),
(1, '2026-09-11', 5, 0, 1, 0);

-- ============================================================================
-- 5. PAYMENT GATEWAY
-- ============================================================================

INSERT INTO payment_gateway (id, code, name, is_active) VALUES
(1, 'VNPAY', 'VNPay QR', 1),
(2, 'MOMO', 'Ví MoMo', 1),
(3, 'BANK_TRANSFER', 'Chuyển khoản Ngân Hàng', 1);

-- ============================================================================
-- 6. BOOKING & REVIEW (GUEST: vutrggiang@gmail.com)
-- ============================================================================

-- 1. PENDING (Tương lai)
INSERT INTO booking (id, booking_code, place_id, room_type_id, provider_id, check_in, check_out, room_count, guest_count, guest_name, guest_phone, guest_email, status, hold_expires_at, total_amount, currency, policy_id, policy_snapshot) VALUES
(1, 'BK-PENDING', 1, 1, 1, '2026-10-10', '2026-10-12', 1, 2, 'Vũ Trường Giang', '0911223344', 'vutrggiang@gmail.com', 'PENDING', '2026-10-10 12:00:00', 2400000, 'VND', 1, '{"free_cancel_cutoff_hours": 72}');
INSERT INTO booking_night (booking_id, stay_date, unit_price, room_count) VALUES (1, '2026-10-10', 1200000, 1), (1, '2026-10-11', 1200000, 1);
INSERT INTO booking_status_history (booking_id, from_status, to_status, actor) VALUES (1, NULL, 'PENDING', 'CUSTOMER');

-- 2. AWAITING_PAYMENT (Tương lai)
INSERT INTO booking (id, booking_code, place_id, room_type_id, provider_id, check_in, check_out, room_count, guest_count, guest_name, guest_phone, guest_email, status, payment_deadline_at, total_amount, currency, policy_id, policy_snapshot) VALUES
(2, 'BK-AWAITPAY', 1, 1, 1, '2026-10-15', '2026-10-17', 1, 2, 'Vũ Trường Giang', '0911223344', 'vutrggiang@gmail.com', 'AWAITING_PAYMENT', '2026-10-15 12:00:00', 2400000, 'VND', 1, '{"free_cancel_cutoff_hours": 72}');
INSERT INTO booking_night (booking_id, stay_date, unit_price, room_count) VALUES (2, '2026-10-15', 1200000, 1), (2, '2026-10-16', 1200000, 1);
INSERT INTO booking_status_history (booking_id, from_status, to_status, actor) VALUES (2, NULL, 'PENDING', 'CUSTOMER'), (2, 'PENDING', 'AWAITING_PAYMENT', 'PROVIDER');
INSERT INTO payment_transaction (id, booking_id, gateway_id, amount, status) VALUES (1, 2, 1, 2400000, 'INITIATED');

-- 3. CONFIRMED (Tương lai)
INSERT INTO booking (id, booking_code, place_id, room_type_id, provider_id, check_in, check_out, room_count, guest_count, guest_name, guest_phone, guest_email, status, total_amount, currency, policy_id, policy_snapshot, confirmed_at) VALUES
(3, 'BK-CONFIRMED', 1, 1, 1, '2026-10-20', '2026-10-22', 1, 2, 'Vũ Trường Giang', '0911223344', 'vutrggiang@gmail.com', 'CONFIRMED', 2400000, 'VND', 1, '{"free_cancel_cutoff_hours": 72}', CURRENT_TIMESTAMP);
INSERT INTO booking_night (booking_id, stay_date, unit_price, room_count) VALUES (3, '2026-10-20', 1200000, 1), (3, '2026-10-21', 1200000, 1);
INSERT INTO payment_transaction (id, booking_id, gateway_id, amount, status, external_txn_id, paid_at) VALUES (2, 3, 2, 2400000, 'SUCCESS', 'TXN12345', CURRENT_TIMESTAMP);

-- 4. REJECTED (Do Provider từ chối)
INSERT INTO booking (id, booking_code, place_id, room_type_id, provider_id, check_in, check_out, room_count, guest_count, guest_name, guest_phone, guest_email, status, total_amount, currency, policy_id, policy_snapshot, closed_at, close_reason, closed_by_actor) VALUES
(4, 'BK-REJECTED', 2, 3, 2, '2026-10-25', '2026-10-26', 1, 1, 'Vũ Trường Giang', '0911223344', 'vutrggiang@gmail.com', 'REJECTED', 150000, 'VND', 2, '{"free_cancel_cutoff_hours": 24}', CURRENT_TIMESTAMP, 'Hết phòng trống', 'PROVIDER');

-- 5. CANCELLED (Do Khách hủy)
INSERT INTO booking (id, booking_code, place_id, room_type_id, provider_id, check_in, check_out, room_count, guest_count, guest_name, guest_phone, guest_email, status, total_amount, currency, policy_id, policy_snapshot, closed_at, close_reason, closed_by_actor) VALUES
(5, 'BK-CANCELLED', 2, 3, 2, '2026-11-01', '2026-11-03', 1, 1, 'Vũ Trường Giang', '0911223344', 'vutrggiang@gmail.com', 'CANCELLED', 300000, 'VND', 2, '{"free_cancel_cutoff_hours": 24}', CURRENT_TIMESTAMP, 'Đổi kế hoạch', 'CUSTOMER');

-- 6. EXPIRED (Quá hạn thanh toán hoặc hold)
INSERT INTO booking (id, booking_code, place_id, room_type_id, provider_id, check_in, check_out, room_count, guest_count, guest_name, guest_phone, guest_email, status, total_amount, currency, policy_id, policy_snapshot, closed_at, close_reason, closed_by_actor) VALUES
(6, 'BK-EXPIRED', 1, 2, 1, '2026-11-10', '2026-11-12', 1, 4, 'Vũ Trường Giang', '0911223344', 'vutrggiang@gmail.com', 'EXPIRED', 3600000, 'VND', 1, '{"free_cancel_cutoff_hours": 72}', CURRENT_TIMESTAMP, 'Quá hạn thanh toán', 'SYSTEM');

-- 7. COMPLETED (Đã ở xong, có review)
INSERT INTO booking (id, booking_code, place_id, room_type_id, provider_id, check_in, check_out, room_count, guest_count, guest_name, guest_phone, guest_email, status, total_amount, currency, policy_id, policy_snapshot, closed_at) VALUES
(7, 'BK-COMPLETED', 1, 1, 1, '2026-09-10', '2026-09-12', 1, 2, 'Vũ Trường Giang', '0911223344', 'vutrggiang@gmail.com', 'COMPLETED', 2400000, 'VND', 1, '{"free_cancel_cutoff_hours": 72}', '2026-09-12 12:00:00');
INSERT INTO payment_transaction (id, booking_id, gateway_id, amount, status, external_txn_id, paid_at) VALUES (3, 7, 1, 2400000, 'SUCCESS', 'TXN99999', '2026-09-09 10:00:00');
INSERT INTO review (id, place_id, booking_id, rating, content, status, editable_until) VALUES
(1, 1, 7, 5, 'Chỗ ở rất tuyệt vời, nhân viên thân thiện. View lúa siêu đẹp!', 'VISIBLE', '2026-09-19 12:00:00');

-- 8. NO_SHOW (Khách không đến)
INSERT INTO booking (id, booking_code, place_id, room_type_id, provider_id, check_in, check_out, room_count, guest_count, guest_name, guest_phone, guest_email, status, total_amount, currency, policy_id, policy_snapshot, closed_at, close_reason, closed_by_actor) VALUES
(8, 'BK-NOSHOW', 2, 3, 2, '2026-09-01', '2026-09-03', 1, 1, 'Vũ Trường Giang', '0911223344', 'vutrggiang@gmail.com', 'NO_SHOW', 300000, 'VND', 2, '{"free_cancel_cutoff_hours": 24}', '2026-09-02 12:00:00', 'Khách không check-in', 'PROVIDER');
INSERT INTO payment_transaction (id, booking_id, gateway_id, amount, status, external_txn_id, paid_at) VALUES (4, 8, 2, 300000, 'SUCCESS', 'TXN88888', '2026-08-30 10:00:00');

-- ============================================================================
-- 7. FESTIVAL 
-- ============================================================================

INSERT INTO festival (id, slug, name, name_norm, visibility, is_suitable_by_time, suitable_date_start, suitable_date_end, region_id) VALUES
(1, 'le-hoi-kham-pha-ruong-bac-thang-2026', 'Lễ hội Khám phá Di tích Quốc gia đặc biệt Ruộng bậc thang Mù Cang Chải 2026', 'le hoi kham pha di tich quoc gia dac biet ruong bac thang mu cang chai 2026', 'PUBLISHED', 1, '2026-09-01', '2026-09-30', 2);

INSERT INTO festival_occurrence (festival_id, period_start, period_end, note) VALUES
(1, '2026-09-01', '2026-09-30', 'Sự kiện chính vào giữa tháng');
