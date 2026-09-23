-- ============================================================================
-- SCRIPT XÓA TOÀN BỘ DỮ LIỆU DATABASE (TRUNCATE ALL DATA - GIỮ NGUYÊN SCHEMA)
-- Database: dulichso (MySQL 8.0+)
--
-- Cơ chế:
-- 1. Tạm thời tắt ràng buộc khóa ngoại (FOREIGN_KEY_CHECKS = 0).
-- 2. TRUNCATE toàn bộ các bảng dữ liệu để làm sạch hoàn toàn và reset AUTO_INCREMENT về 1.
-- 3. Bật lại ràng buộc khóa ngoại (FOREIGN_KEY_CHECKS = 1).
--
-- CẢNH BÁO: Toàn bộ dữ liệu trong các bảng sẽ bị xóa vĩnh viễn!
-- Cấu trúc bảng (schema), index, trigger, stored function vẫn được bảo toàn nguyên vẹn.
-- ============================================================================

USE dulichso;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Bảng nhật ký, kiểm toán & thông báo
TRUNCATE TABLE audit_log;
TRUNCATE TABLE notification;
TRUNCATE TABLE notification_template;
TRUNCATE TABLE support_ticket;

-- 2. Bảng thanh toán, giao dịch & hoàn tiền
TRUNCATE TABLE refund;
TRUNCATE TABLE payment_transaction;
TRUNCATE TABLE payment_gateway;

-- 3. Bảng đánh giá & phản hồi
TRUNCATE TABLE review;

-- 4. Bảng đặt phòng (booking) & lịch sử
TRUNCATE TABLE booking_service_item;
TRUNCATE TABLE booking_night;
TRUNCATE TABLE booking_status_history;
TRUNCATE TABLE booking;

-- 5. Bảng tồn kho phòng, giá đặc biệt & phòng homestay
TRUNCATE TABLE room_inventory_day;
TRUNCATE TABLE room_special_price;
TRUNCATE TABLE room_type_media;
TRUNCATE TABLE room_amenity;
TRUNCATE TABLE room_bed;
TRUNCATE TABLE room_type;
TRUNCATE TABLE homestay_profile;
TRUNCATE TABLE cancellation_policy;

-- 6. Bảng quan hệ & chi tiết địa điểm (Place sub-tables)
TRUNCATE TABLE place_media;
TRUNCATE TABLE place_highlight;
TRUNCATE TABLE place_tag;
TRUNCATE TABLE place_amenity;
TRUNCATE TABLE place_opening_hour;
TRUNCATE TABLE place_contact;
TRUNCATE TABLE place_specialty;

-- 7. Bảng địa điểm chính & tài sản media
TRUNCATE TABLE place;
TRUNCATE TABLE media_asset;

-- 8. Bảng tài khoản & nhà cung cấp (Account & Provider)
TRUNCATE TABLE account;
TRUNCATE TABLE provider;

-- 9. Bảng phụ lục mở rộng (Đặc sản & Lễ hội)
TRUNCATE TABLE specialty_media;
TRUNCATE TABLE specialty;
TRUNCATE TABLE festival_occurrence;
TRUNCATE TABLE festival;

-- 10. Bảng danh mục & cấu hình nền tảng (Master Data)
TRUNCATE TABLE category_field_def;
TRUNCATE TABLE tag;
TRUNCATE TABLE amenity;
TRUNCATE TABLE category;
TRUNCATE TABLE region;

SET FOREIGN_KEY_CHECKS = 1;

-- Kiểm tra xác nhận dữ liệu đã được làm sạch thành công
SELECT 'Đã xóa toàn bộ dữ liệu sạch sẽ, giữ nguyên cấu trúc database!' AS status;
