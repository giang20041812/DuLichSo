-- =============================================================
--  verified_deploy.sql — SINH TỰ ĐỘNG bởi gen_verified_deploy.py, KHÔNG sửa tay.
--  Nguồn: requirements/DATA ĐÃ XÁC THỰC.xlsx (sheet Homestay). Cột 'Sức chứa' bỏ qua.
--  Chạy SAU khi Liquibase đã cập nhật schema (tới changeset 021).
--  Xóa toàn bộ dữ liệu nghiệp vụ rồi nạp lại. Giữ nguyên: amenity (upsert), notification_template,
--  media_asset/place_media/room_type_media (ảnh gắn tay giữ được vì id place/room_type cố định).
--  Tài khoản: password_hash = '{seed-pending}' -> khởi động backend với APP_SEED_INITIAL_PASSWORD
--  để hệ thống tự băm BCrypt (xem SeedAccountPasswordInitializer).
-- =============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. XÓA DỮ LIỆU CŨ
TRUNCATE TABLE place_highlight;
TRUNCATE TABLE place_contact;
TRUNCATE TABLE place_amenity;
TRUNCATE TABLE place_tag;
TRUNCATE TABLE place_opening_hour;
TRUNCATE TABLE place_specialty;
TRUNCATE TABLE room_amenity;
TRUNCATE TABLE room_bed;
TRUNCATE TABLE room_inventory_day;
TRUNCATE TABLE room_special_price;
TRUNCATE TABLE room_type;
TRUNCATE TABLE homestay_profile;
TRUNCATE TABLE homestay_service_offer;
TRUNCATE TABLE cancellation_policy;
TRUNCATE TABLE booking_service_item;
TRUNCATE TABLE booking_night;
TRUNCATE TABLE booking_response_deadline;
TRUNCATE TABLE booking_status_history;
TRUNCATE TABLE booking_change_request;
TRUNCATE TABLE booking_admin_note;
TRUNCATE TABLE booking_evaluation;
TRUNCATE TABLE booking_info_request;
TRUNCATE TABLE booking;
TRUNCATE TABLE review;
TRUNCATE TABLE commission_ledger;
TRUNCATE TABLE payment_transaction;
TRUNCATE TABLE refund;
TRUNCATE TABLE affiliate_link;
TRUNCATE TABLE audit_log;
TRUNCATE TABLE notification;
TRUNCATE TABLE sos_request;
TRUNCATE TABLE emergency_contact;
TRUNCATE TABLE partner_change_request;
TRUNCATE TABLE provider_application;
TRUNCATE TABLE support_ticket;
TRUNCATE TABLE password_reset_token;
TRUNCATE TABLE traveler;
DELETE FROM place;
DELETE FROM account;
DELETE FROM provider;
DELETE FROM region;
DELETE FROM category;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. REGION
INSERT INTO region (id, code, name, name_norm, level, parent_id, path, is_active) VALUES
(1, 'YEN_BAI', 'Yên Bái', 'yen bai', 1, NULL, '/1', 1),
(2, 'MU_CANG_CHAI', 'Mù Cang Chải', 'mu cang chai', 2, 1, '/1/2', 1),
(3, 'TT_MU_CANG_CHAI', 'Thị trấn Mù Cang Chải', 'thi tran mu cang chai', 3, 2, '/1/2/3', 1);

-- 3. CATEGORY
INSERT INTO category (id, kind, slug, name, description, icon_media_id, sort_order, is_active) VALUES
(1, 'HOMESTAY', 'homestay', 'Homestay / Khách sạn', NULL, NULL, 1, 1);

-- 4. DANH MỤC TIỆN ÍCH (upsert, không xóa để giữ liên kết room_amenity/place_amenity cũ)
INSERT INTO amenity (code, name, scope, is_essential, sort_order, is_active) VALUES
('HOT_WATER', 'Nước nóng', 'PLACE', 0, 1, 1),
('HEATER', 'Sưởi / điều hòa ấm', 'PLACE', 0, 2, 1),
('BACKUP_POWER', 'Điện dự phòng', 'PLACE', 0, 3, 1),
('STABLE_WATER', 'Nước ổn định', 'PLACE', 0, 4, 1),
('WIFI', 'Wifi', 'PLACE', 0, 5, 1),
('PARKING', 'Bãi đỗ xe', 'PLACE', 0, 6, 1),
('RESTAURANT', 'Ăn uống tại chỗ', 'PLACE', 0, 7, 1),
('AIR_CONDITIONING', 'Điều hòa', 'PLACE', 0, 8, 1),
('BALCONY', 'Ban công', 'PLACE', 0, 9, 1),
('KITCHEN', 'Bếp dùng chung', 'PLACE', 0, 10, 1),
('BATHTUB', 'Bồn tắm ngâm thảo dược', 'ROOM', 0, 11, 1),
('BBQ_AREA', 'Khu nướng / BBQ', 'PLACE', 0, 12, 1),
('MOTORBIKE_RENTAL', 'Cho thuê xe máy', 'PLACE', 0, 13, 1),
('FIREPLACE', 'Lửa trại', 'PLACE', 0, 14, 1),
('PET_FRIENDLY', 'Cho phép thú cưng', 'PLACE', 0, 15, 1),
('GARDEN', 'Sân vườn', 'PLACE', 0, 16, 1),
('TERRACE', 'Sân hiên / sân thượng', 'PLACE', 0, 17, 1),
('BREAKFAST', 'Bữa sáng', 'PLACE', 0, 18, 1),
('HOT_TUB', 'Bể sục', 'PLACE', 0, 19, 1),
('CAR_RENTAL', 'Cho thuê ô tô', 'PLACE', 0, 20, 1),
('AIRPORT_SHUTTLE', 'Đưa đón sân bay', 'PLACE', 0, 21, 1),
('TREKKING_SUPPORT', 'Tư vấn trekking / lịch trình', 'PLACE', 0, 22, 1),
('LAUNDRY', 'Dịch vụ giặt ủi', 'PLACE', 0, 23, 1),
('BICYCLE_RENTAL', 'Cho thuê xe đạp', 'PLACE', 0, 24, 1),
('BAR', 'Quầy bar', 'PLACE', 0, 25, 1),
('ELECTRIC_KETTLE', 'Ấm đun nước', 'PLACE', 0, 26, 1),
('TEA_COFFEE', 'Bộ pha trà / cà phê', 'PLACE', 0, 27, 1),
('BABY_FRIENDLY', 'Tiện nghi cho trẻ em', 'PLACE', 0, 28, 1),
('FRONT_DESK_24H', 'Lễ tân 24/24', 'PLACE', 0, 29, 1),
('HOUSEKEEPING', 'Dọn phòng hàng ngày', 'PLACE', 0, 30, 1),
('TOWELS', 'Khăn tắm', 'PLACE', 0, 31, 1),
('HAIR_DRYER', 'Máy sấy tóc', 'PLACE', 0, 32, 1),
('TOILETRIES', 'Đồ vệ sinh cá nhân', 'PLACE', 0, 33, 1),
('COMMON_LOUNGE', 'Phòng/khu sinh hoạt chung', 'PLACE', 0, 34, 1),
('TV', 'Tivi', 'PLACE', 0, 35, 1),
('CULTURAL_SHOW', 'Văn nghệ dân tộc', 'PLACE', 0, 36, 1),
('BUS_TICKET', 'Đặt vé xe khách', 'PLACE', 0, 37, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), scope = VALUES(scope), sort_order = VALUES(sort_order), is_active = 1;

-- 5. TÀI KHOẢN ADMIN (mật khẩu đặt bởi backend từ APP_SEED_INITIAL_PASSWORD)
INSERT INTO account (id, email, phone, password_hash, role, status, provider_id, full_name, token_version, created_at) VALUES
(1, 'admin@dulichso.vn', NULL, '{seed-pending}', 'ADMIN', 'ACTIVE', NULL, 'Quản trị viên', 0, NOW());

-- 6. NHÀ CUNG CẤP
INSERT INTO provider (id, name, contact_name, contact_phone, contact_email, address, note, status, created_at, updated_at) VALUES
(1, 'Homestay Anh Túc', NULL, '0963000708', NULL, 'Tổ 5, TT Mù Cang Chải, Huyện Mù Cang Chải, Yên Bái (Cách chợ trung tâm Mù Cang Chải 500 mét)', NULL, 'ACTIVE', NOW(), NOW()),
(2, 'New Highland Hotel', NULL, '0966242337', NULL, 'Tổ 2 thị trấn Mù Cang Chải, Yên Bái (Cách đồi Móng Ngựa 2km)', NULL, 'ACTIVE', NOW(), NOW()),
(3, 'Trai Bản Homestay', NULL, '0979929101', NULL, 'Nằm ngay mặt đường Quốc lộ 32 (QL32), Mù Cang Chải, Yên Bái (Khu vực giáp ranh thị trấn, hệ thống bản đồ đôi khi hiển thị định vị hành chính thuộc Lào Cai nhưng thực tế đây là tuyến đường chính đi qua thủ phủ Mù Cang Chải).', NULL, 'ACTIVE', NOW(), NOW()),
(4, 'Hoa Sơn Trà Hotel', NULL, '0974664911', NULL, 'Tổ 2, thị trấn Mù Cang Chải, huyện Mù Cang Chải, Yên Bá', NULL, 'ACTIVE', NOW(), NOW()),
(5, 'Baan Mali Homestay', NULL, '0983994669', NULL, 'QL 32, tổ 2, Trung tâm Mù Cang Chair', NULL, 'ACTIVE', NOW(), NOW()),
(6, 'Homestay Hoà Thảo', NULL, '0974503699', NULL, 'QL 32, Trung tâm Mù Cang Chải', NULL, 'ACTIVE', NOW(), NOW()),
(7, 'Cô Gái Thái Homestay', NULL, NULL, NULL, NULL, NULL, 'ACTIVE', NOW(), NOW()),
(8, 'Bulgalow Xuân giang', NULL, NULL, NULL, NULL, NULL, 'ACTIVE', NOW(), NOW());

-- 7. TÀI KHOẢN NCC (đăng nhập bằng SĐT; mật khẩu đặt bởi backend)
INSERT INTO account (id, email, phone, password_hash, role, status, provider_id, full_name, token_version, created_at) VALUES
(2, NULL, '0963000708', '{seed-pending}', 'PROVIDER', 'ACTIVE', 1, 'Homestay Anh Túc', 0, NOW()),
(3, NULL, '0966242337', '{seed-pending}', 'PROVIDER', 'ACTIVE', 2, 'New Highland Hotel', 0, NOW()),
(4, NULL, '0979929101', '{seed-pending}', 'PROVIDER', 'ACTIVE', 3, 'Trai Bản Homestay', 0, NOW()),
(5, NULL, '0974664911', '{seed-pending}', 'PROVIDER', 'ACTIVE', 4, 'Hoa Sơn Trà Hotel', 0, NOW()),
(6, NULL, '0983994669', '{seed-pending}', 'PROVIDER', 'ACTIVE', 5, 'Baan Mali Homestay', 0, NOW()),
(7, NULL, '0974503699', '{seed-pending}', 'PROVIDER', 'ACTIVE', 6, 'Homestay Hoà Thảo', 0, NOW());

-- 8. PLACE
INSERT INTO place (id, slug, category_id, kind, provider_id, name, name_norm, description, region_id, address,
                   price_ref_min, price_ref_max, price_unit_note, visibility, operation_status, is_deleted,
                   google_rating, source_type, source_name, verification, last_verified_at,
                   rating_avg, rating_count, attributes, created_at, updated_at, created_by, updated_by) VALUES
(1, 'homestay-anh-tuc', 1, 'HOMESTAY', 1, 'Homestay Anh Túc', 'homestay anh tuc', '- Mộc mạc, gần gũi thiên nhiên: Homestay mang đậm phong cách nhà sàn vùng cao Tây Bắc với vật liệu chủ đạo là gỗ, tre và mái lá.\n- Sự kết hợp truyền thống & hiện đại: Tuy giữ nét thô mộc truyền thống ở vỏ bọc bên ngoài để hòa hợp với cảnh quan, bên trong phòng ngủ vẫn được cải tiến với hệ thống cửa kính lớn kịch trần để tối ưu ánh sáng và trải nghiệm ngắm cảnh của du khách.', 3, 'Tổ 5, TT Mù Cang Chải, Huyện Mù Cang Chải, Yên Bái (Cách chợ trung tâm Mù Cang Chải 500 mét)', 400000, 1000000, 'VNĐ/đêm/phòng', 'PUBLISHED', 'OPERATING', 0, '4.70', 'PUBLIC_TRUSTED', 'DATA ĐÃ XÁC THỰC.xlsx', 'VERIFIED', CURDATE(), NULL, 0, '{}', NOW(), NOW(), 1, 1),
(2, 'new-highland-hotel', 1, 'HOMESTAY', 2, 'New Highland Hotel', 'new highland hotel', '- Khách sạn boutique hiện đại, thanh lịch với thiết kế tối giản, nội thất gỗ ấm cúng và sở hữu không gian mở đón trọn tầm nhìn ra thung lũng ruộng bậc thang kỳ vĩ.', 3, 'Tổ 2 thị trấn Mù Cang Chải, Yên Bái (Cách đồi Móng Ngựa 2km)', 630000, 1500000, 'VNĐ/đêm/phòng', 'PUBLISHED', 'OPERATING', 0, '5.00', 'PUBLIC_TRUSTED', 'DATA ĐÃ XÁC THỰC.xlsx', 'VERIFIED', CURDATE(), NULL, 0, '{}', NOW(), NOW(), 1, 1),
(3, 'trai-ban-homestay', 1, 'HOMESTAY', 3, 'Trai Bản Homestay', 'trai ban homestay', 'Thiết kế dạng các căn bungalow riêng biệt sử dụng chất liệu mộc mạc, gần gũi với thiên nhiên, kết hợp hài hòa giữa nét hoang sơ vùng cao và sự tiện nghi hiện đại.', 2, 'Nằm ngay mặt đường Quốc lộ 32 (QL32), Mù Cang Chải, Yên Bái (Khu vực giáp ranh thị trấn, hệ thống bản đồ đôi khi hiển thị định vị hành chính thuộc Lào Cai nhưng thực tế đây là tuyến đường chính đi qua thủ phủ Mù Cang Chải).', 600000, 1800000, 'VNĐ/đêm/phòng', 'PUBLISHED', 'OPERATING', 0, NULL, 'PUBLIC_TRUSTED', 'DATA ĐÃ XÁC THỰC.xlsx', 'VERIFIED', CURDATE(), NULL, 0, '{}', NOW(), NOW(), 1, 1),
(4, 'hoa-son-tra-hotel', 1, 'HOMESTAY', 4, 'Hoa Sơn Trà Hotel', 'hoa son tra hotel', NULL, 3, 'Tổ 2, thị trấn Mù Cang Chải, huyện Mù Cang Chải, Yên Bá', 300000, 700000, 'VNĐ/đêm/phòng', 'PUBLISHED', 'OPERATING', 0, NULL, 'PUBLIC_TRUSTED', 'DATA ĐÃ XÁC THỰC.xlsx', 'VERIFIED', CURDATE(), NULL, 0, '{}', NOW(), NOW(), 1, 1),
(5, 'baan-mali-homestay', 1, 'HOMESTAY', 5, 'Baan Mali Homestay', 'baan mali homestay', 'Homestay mộc mạc, gần gũi thiên nhiên, kết hợp không gian lưu trú tiện nghi với nét giản dị của vùng núi Mù Cang Chải.', 2, 'QL 32, tổ 2, Trung tâm Mù Cang Chair', 600000, 1000000, 'VNĐ/đêm/phòng', 'PUBLISHED', 'OPERATING', 0, '5.00', 'PUBLIC_TRUSTED', 'DATA ĐÃ XÁC THỰC.xlsx', 'VERIFIED', CURDATE(), NULL, 0, '{}', NOW(), NOW(), 1, 1),
(6, 'homestay-hoa-thao', 1, 'HOMESTAY', 6, 'Homestay Hoà Thảo', 'homestay hoa thao', 'Homestay mộc mạc, gần gũi thiên nhiên, thiên về trải nghiệm địa phương và du lịch khám phá. Có phòng gia đình, sân hiên, vườn và khu vực sinh hoạt chung.', 2, 'QL 32, Trung tâm Mù Cang Chải', 700000, 1000000, 'VNĐ/đêm/phòng', 'PUBLISHED', 'OPERATING', 0, '4.80', 'PUBLIC_TRUSTED', 'DATA ĐÃ XÁC THỰC.xlsx', 'VERIFIED', CURDATE(), NULL, 0, '{}', NOW(), NOW(), 1, 1),
(7, 'co-gai-thai-homestay', 1, 'HOMESTAY', 7, 'Cô Gái Thái Homestay', 'co gai thai homestay', NULL, 2, NULL, 350000, 900000, 'VNĐ/đêm/phòng', 'PUBLISHED', 'OPERATING', 0, NULL, 'PUBLIC_TRUSTED', 'DATA ĐÃ XÁC THỰC.xlsx', 'VERIFIED', CURDATE(), NULL, 0, '{}', NOW(), NOW(), 1, 1),
(8, 'bulgalow-xuan-giang', 1, 'HOMESTAY', 8, 'Bulgalow Xuân giang', 'bulgalow xuan giang', NULL, 2, NULL, 600000, 1200000, 'VNĐ/đêm/phòng', 'PUBLISHED', 'OPERATING', 0, NULL, 'PUBLIC_TRUSTED', 'DATA ĐÃ XÁC THỰC.xlsx', 'VERIFIED', CURDATE(), NULL, 0, '{}', NOW(), NOW(), 1, 1);

-- 9. HOMESTAY_PROFILE (Excel không có giờ nhận/trả phòng, nội quy, chính sách hủy -> NULL)
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, surcharge_note, children_policy,
                              pets_policy, view_highlight, suitability, updated_at) VALUES
(1, NULL, NULL, NULL, NULL, NULL, NULL, 'View với tầm nhìn rộng mở nhìn ra cánh ruộng và đồi, thấy những nếp nhà của đồng bào người Mông thấp thoáng xa xa', 'Phù hợp với nhóm người thích yên tĩnh, yêu thiên nhiên, thích khám phá, trải nghiệm văn hóa bản địa một cách chân thực nhất, tính cách cởi mở và dễ thích nghi.', NOW()),
(2, NULL, NULL, NULL, NULL, NULL, NULL, 'View phố núi kết hợp ruộng bậc thang tầm xa, ở trung tâm thị trấn.', 'Phù hợp với nhóm người thích hòa mình vào thiên nhiên vùng cao vào ban ngày, nhưng đêm phải được ngủ trong một căn phòng sạch sẽ, ấm cúng tiện nghi thay vì ở nhà sàn tập thể.', NOW()),
(3, NULL, NULL, NULL, NULL, NULL, NULL, 'Các phòng nghỉ có view đối diện trực diện ra ruộng bậc thang. Không gian xung quanh rất yên tĩnh, trong lành nhưng lại vô cùng thuận tiện giao thông vì sát ngay trung tâm thị trấn Mù Cang Chải.', 'Cặp đôi hoặc Gia đình nhỏ: Muốn tìm kiếm không gian nghỉ dưỡng bungalow riêng tư, lãng mạn và có view ngắm cảnh đẹp ngay khi mở cửa sổ.\nNhóm bạn trẻ, khách phượt: Yêu thích chụp ảnh check-in ruộng bậc thang và cần một địa điểm di chuyển thuận tiện tới các điểm tham quan xung quanh.', NOW()),
(4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(5, NULL, NULL, NULL, NULL, NULL, 'Được phép đưa thú cưng vào.', '* Không gian ngoài trời/sân hiên.\n* Không gian mở.\n* Bối cảnh núi rừng Mù Cang Chải.\n* Có thể phù hợp chụp ảnh sinh hoạt, nghỉ ngơi và trải nghiệm không gian vùng cao.', 'khách trẻ, cặp đôi và nhóm bạn đi du lịch tự túc, yêu thích trải nghiệm thiên nhiên/vùng cao và không gian homestay mộc mạc.', NOW()),
(6, NULL, NULL, NULL, NULL, NULL, NULL, 'View núi, ruộng lúa/cánh đồng từ cửa sổ phòng là điểm nổi bật. Một số khách đánh giá cao khung cảnh nhìn từ phòng và khu vực ăn sáng. Tuy nhiên, đây không phải kiểu view ruộng bậc thang trực diện.', 'khách trẻ, phượt thủ và khách du lịch tự túc yêu thích trekking, motorbike và thiên nhiên vùng cao.', NOW()),
(7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(8, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW());

-- 10. PLACE_CONTACT (SĐT, fanpage, Google Maps)
INSERT INTO place_contact (place_id, channel, value, is_public, sort_order) VALUES
(1, 'PHONE', '0963000708', 1, 1),
(1, 'PHONE', '0984000708', 1, 2),
(1, 'FACEBOOK', 'https://www.facebook.com/homestayanhtucMCC/?locale=vi_VN', 1, 20),
(1, 'GOOGLE_MAPS', 'https://maps.app.goo.gl/evizD41qYUSaJU7c8', 1, 30),
(2, 'PHONE', '0966242337', 1, 1),
(2, 'FACEBOOK', 'https://www.facebook.com/p/New-Highland-Hotel-100083042035145/', 1, 20),
(2, 'GOOGLE_MAPS', 'https://maps.app.goo.gl/E4CBTnUHFsgaKDFfA', 1, 30),
(3, 'PHONE', '0979929101', 1, 1),
(3, 'FACEBOOK', 'https://www.facebook.com/p/Homestay-Bungalow-Trai-B%E1%BA%A3n-61551259703214/', 1, 20),
(3, 'GOOGLE_MAPS', 'https://share.google/8DiypkFbX16421sHS', 1, 30),
(4, 'PHONE', '0974664911', 1, 1),
(4, 'PHONE', '0328608977', 1, 2),
(4, 'FACEBOOK', 'https://www.facebook.com/p/Nh%C3%A0-Ngh%E1%BB%89-HOA-S%C6%A0N-TRA-100083395147812/', 1, 20),
(4, 'GOOGLE_MAPS', 'https://google.com/maps/place/hòa+sơn+trà+hotel+mù+cang+chải/data=!4m2!3m1!1s0x3132cf59e63ab011:0xb1c648d142fedf2d?sa=X&ved=1t:242&ictx=111', 1, 30),
(5, 'PHONE', '0983994669', 1, 1),
(5, 'GOOGLE_MAPS', 'https://maps.app.goo.gl/MHbrjLv5Pduk2mPD9?g_st=ic', 1, 30),
(6, 'PHONE', '0974503699', 1, 1),
(6, 'GOOGLE_MAPS', 'https://maps.app.goo.gl/zVzRZohebyyyQ1GQA?g_st=ic', 1, 30);

-- 11. PLACE_HIGHLIGHT (Ưu điểm / Hạn chế, mỗi ý một dòng)
INSERT INTO place_highlight (place_id, type, content, is_public, sort_order) VALUES
(1, 'PRO', 'Địa điểm tại trung tâm thị trấn Mù Cang Chải thuận tiện đi lại các điểm tham quan.', 1, 1),
(1, 'PRO', 'Sạch sẽ, home có vườn đẹp, có em chó trông nhà mến khách, anh chị chủ home thân thiện, nhiệt tình, không gian yên tĩnh, thoải mái', 1, 2),
(1, 'CON', 'Chưa có nhiều dịch vụ đi kèm (theo comment khách du lịch)', 1, 1),
(2, 'PRO', 'Phòng sạch sẽ, thoáng mát, được chuẩn bị chu đáo và đầy đủ tiện nghi. Cơ sở vật chất mới và tốt. Nhân viên phục vụ nhiệt tình, lịch sự và hỗ trợ nhanh chóng khi cần ( support khách hàng, tư vấn lịch trình địa điểm tham quan, tư vấn các dịch vụ địa phương: quán ăn, coffe,…), chỗ đỗ xe thoải mái.', 1, 1),
(2, 'PRO', 'Nằm ngay trung tâm thị trấn để thuận tiện đi lại và ăn uống', 1, 2),
(2, 'CON', 'Không có view ruộng vô cực do ở trung tâm thị trấn.', 1, 1),
(2, 'CON', 'Khu vực nhộn nhịp, xe cộ qua lại nhiều nên các phòng ở tầng thấp phía mặt tiền có thể bị ảnh hưởng bởi tiếng ồn.', 1, 2),
(3, 'PRO', 'Vị trí đắc địa, dễ tìm ngay mặt đường QL32, rất gần trung tâm thị trấn nên dễ dàng đi ăn uống, mua sắm.', 1, 1),
(3, 'PRO', 'View ruộng bậc thang siêu đẹp, đặc biệt vào mùa lúa chín (khoảng tháng 9 - tháng 10).', 1, 2),
(3, 'PRO', 'Chủ nhà (chị chủ) cực kỳ thân thiện, dễ thương, hiếu khách và hướng dẫn nhiệt tình.', 1, 3),
(3, 'PRO', 'Nhận được đánh giá tuyệt đối (5/5 sao) từ những khách hàng đã trải nghiệm.', 1, 4),
(3, 'CON', 'Do nằm sát mặt đường lớn QL32, vào những ngày cao điểm mùa du lịch có thể sẽ có chút tiếng ồn từ xe cộ qua lại.', 1, 1),
(4, 'PRO', 'Nằm ở Mù Cang Chải, Hoa Sơn Tra Hotel có khu vườn, phòng chờ chung, sân hiên, cùng Wi-Fi miễn phí ở toàn bộ chỗ nghỉ. Bể sục và dịch vụ cho thuê ô tô có sẵn cho khách sử dụng. Chỗ nghỉ có chỗ đậu xe riêng miễn phí và có cả dịch vụ đưa đón sân bay mất phí. Thành thạo tiếng Anh và tiếng Việt, đội ngũ nhân viên tại lễ tân luôn sẵn lòng đưa ra thông tin hữu ích về khu vực xung quanh.', 1, 1),
(5, 'PRO', 'Không gian ngoài trời/sân hiên.', 1, 1),
(5, 'PRO', 'Không gian mở.', 1, 2),
(5, 'PRO', 'Bối cảnh núi rừng Mù Cang Chải.', 1, 3),
(5, 'PRO', 'Có thể phù hợp chụp ảnh sinh hoạt, nghỉ ngơi và trải nghiệm không gian vùng cao.', 1, 4),
(6, 'PRO', 'View núi, đồng ruộng đẹp.', 1, 1),
(6, 'PRO', 'Chủ nhà được đánh giá rất thân thiện, nhiệt tình.', 1, 2),
(6, 'PRO', 'Phòng sạch, rộng; có phòng gia đình.', 1, 3),
(6, 'PRO', 'Có bữa sáng.', 1, 4),
(6, 'PRO', 'Có chỗ đỗ xe miễn phí.', 1, 5),
(6, 'PRO', 'Hỗ trợ các hoạt động bus – trekking – motorbike đúng như tên homestay.', 1, 6),
(6, 'PRO', 'Đánh giá rất tốt: 9,4/10 trên Booking, hơn 200 đánh giá; riêng nhân viên 9,8–9,9/10 tùy thời điểm dữ liệu.', 1, 7);

-- 12. PLACE_AMENITY
INSERT INTO place_amenity (place_id, amenity_id, value, note) VALUES
(1, (SELECT id FROM amenity WHERE code = 'FIREPLACE'), 'YES', NULL),
(1, (SELECT id FROM amenity WHERE code = 'CULTURAL_SHOW'), 'YES', NULL),
(1, (SELECT id FROM amenity WHERE code = 'GARDEN'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'AIR_CONDITIONING'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'HEATER'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'HOT_WATER'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'WIFI'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'TV'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'HAIR_DRYER'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'TERRACE'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'PARKING'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'MOTORBIKE_RENTAL'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'BUS_TICKET'), 'YES', NULL),
(2, (SELECT id FROM amenity WHERE code = 'TREKKING_SUPPORT'), 'YES', NULL),
(3, (SELECT id FROM amenity WHERE code = 'TOWELS'), 'YES', NULL),
(3, (SELECT id FROM amenity WHERE code = 'HAIR_DRYER'), 'YES', NULL),
(3, (SELECT id FROM amenity WHERE code = 'TOILETRIES'), 'YES', NULL),
(3, (SELECT id FROM amenity WHERE code = 'WIFI'), 'YES', NULL),
(3, (SELECT id FROM amenity WHERE code = 'PARKING'), 'YES', NULL),
(3, (SELECT id FROM amenity WHERE code = 'RESTAURANT'), 'YES', NULL),
(3, (SELECT id FROM amenity WHERE code = 'MOTORBIKE_RENTAL'), 'YES', NULL),
(3, (SELECT id FROM amenity WHERE code = 'TREKKING_SUPPORT'), 'YES', NULL),
(4, (SELECT id FROM amenity WHERE code = 'GARDEN'), 'YES', NULL),
(4, (SELECT id FROM amenity WHERE code = 'TERRACE'), 'YES', NULL),
(4, (SELECT id FROM amenity WHERE code = 'COMMON_LOUNGE'), 'YES', NULL),
(4, (SELECT id FROM amenity WHERE code = 'HOT_TUB'), 'YES', NULL),
(4, (SELECT id FROM amenity WHERE code = 'WIFI'), 'YES', NULL),
(4, (SELECT id FROM amenity WHERE code = 'CAR_RENTAL'), 'YES', NULL),
(4, (SELECT id FROM amenity WHERE code = 'PARKING'), 'YES', NULL),
(4, (SELECT id FROM amenity WHERE code = 'AIRPORT_SHUTTLE'), 'YES', 'Mất phí'),
(5, (SELECT id FROM amenity WHERE code = 'KITCHEN'), 'YES', NULL),
(5, (SELECT id FROM amenity WHERE code = 'PET_FRIENDLY'), 'YES', NULL),
(5, (SELECT id FROM amenity WHERE code = 'TERRACE'), 'YES', NULL),
(6, (SELECT id FROM amenity WHERE code = 'GARDEN'), 'YES', NULL),
(6, (SELECT id FROM amenity WHERE code = 'TERRACE'), 'YES', NULL),
(6, (SELECT id FROM amenity WHERE code = 'COMMON_LOUNGE'), 'YES', NULL),
(6, (SELECT id FROM amenity WHERE code = 'BREAKFAST'), 'YES', NULL),
(6, (SELECT id FROM amenity WHERE code = 'PARKING'), 'YES', NULL),
(6, (SELECT id FROM amenity WHERE code = 'TREKKING_SUPPORT'), 'YES', NULL);

-- 13. ROOM_TYPE (id = place_id * 100 + thứ tự; giá NULL = Excel không có giá cụ thể)
INSERT INTO room_type (id, place_id, name, description, max_occupancy, total_room_count, base_price, weekend_price,
                       private_bathroom, status, created_at, updated_at) VALUES
(101, 1, 'Phòng đơn', NULL, 2, 3, 400000, 800000, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(102, 1, 'Phòng đôi', NULL, 2, 4, 600000, 1000000, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(103, 1, 'Phòng nhà gỗ', NULL, 2, 1, NULL, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(104, 1, 'Phòng sàn', NULL, 2, 1, NULL, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(201, 2, 'Phòng đơn', NULL, 2, 9, 630000, 680000, 'YES', 'ACTIVE', NOW(), NOW()),
(202, 2, 'Phòng đôi', NULL, 2, 12, 630000, 680000, 'YES', 'ACTIVE', NOW(), NOW()),
(203, 2, 'Phòng 4 giường', NULL, 8, 1, 1200000, 1500000, 'YES', 'ACTIVE', NOW(), NOW()),
(301, 3, 'Bungalow 1 giường', NULL, 2, 3, 600000, 900000, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(302, 3, 'Bungalow 2 giường', NULL, 4, 2, 900000, 1400000, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(303, 3, 'Bungalow 3 giường', NULL, 6, 2, 1400000, 1800000, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(304, 3, 'Phòng homestay', NULL, 2, 3, NULL, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(401, 4, 'Phòng thường 1 giường to', NULL, 2, 6, 300000, 500000, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(402, 4, 'Phòng thường 2 giường nhỏ', NULL, 4, 3, 350000, 550000, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(403, 4, 'Phòng đôi (2 giường lớn)', NULL, 4, 3, 400000, 700000, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(501, 5, 'Phòng đơn', NULL, 2, 3, 600000, 700000, 'YES', 'ACTIVE', NOW(), NOW()),
(502, 5, 'Phòng đôi', NULL, 2, 4, 900000, 1000000, 'YES', 'ACTIVE', NOW(), NOW()),
(503, 5, 'Phòng cộng đồng', NULL, 2, 1, NULL, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(601, 6, 'Phòng đơn', NULL, 2, 4, 700000, 800000, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(602, 6, 'Phòng đôi', NULL, 2, 4, 800000, 1000000, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(603, 6, 'Phòng cheap', NULL, 2, 1, NULL, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(604, 6, 'Phòng dorm', NULL, 2, 3, NULL, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(701, 7, 'Phòng đơn', NULL, 2, 2, 350000, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(702, 7, 'Phòng đôi', NULL, 2, 2, 550000, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(703, 7, 'Phòng 3 giường kê đệm', NULL, 6, 2, 900000, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(801, 8, 'Căn đơn 1 giường', NULL, 2, 6, 600000, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(802, 8, 'Căn đơn 2 giường', NULL, 4, 4, 800000, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW()),
(803, 8, 'Căn 3 giường', NULL, 6, 1, 1200000, NULL, 'UNVERIFIED', 'ACTIVE', NOW(), NOW());

SELECT 'verified_deploy.sql executed successfully' AS status;
