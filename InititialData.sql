-- ============================================================================
--  DATA LOAD SCRIPT — Mù Cang Chải Tourism Platform
--  Sinh tự động từ file DATA_CHÍNH_THỐNG.xlsx (các sheet: Điểm đến, Di chuyển,
--  Nhà hàng, Homestay, Đặc sản, Văn hóa, Homestay reviewer) để nạp vào schema
--  MySQL đã cho (bản chuyển đổi từ PostgreSQL, xem UCS.docx/BR-01..BR-117).
--  Ngày sinh script: 2026-09-21
--
--  !!! CẢNH BÁO LỖI TRONG SCRIPT SCHEMA GỐC (không phải do file data) !!!
--  Trong CREATE TABLE place, dòng:
--    CONSTRAINT fk_place_updated_by FOREIGN KEY (updated_by) REFERENCES accountaccountaccount(id)
--  bị lặp chữ 3 lần ('accountaccountaccount') — đây là lỗi gõ, cần sửa lại
--  thành REFERENCES account(id) thì CREATE TABLE place mới chạy được. Nếu
--  chưa sửa, toàn bộ script bên dưới sẽ fail vì bảng place không tồn tại.
--
--  QUY ƯỚC GHI CHÚ NGUỒN DỮ LIỆU:
--    [FILE]  = lấy trực tiếp từ DATA_CHÍNH_THỐNG.xlsx
--    [SINH]  = dữ liệu KHÔNG có trong file, do script tự sinh/suy luận để thoả
--              constraint hoặc để có khóa ngoại hợp lệ — cần rà soát lại.
--
--  LƯU Ý MySQL Error 1093 (ER_UPDATE_TABLE_USED, 'target table ... for update
--  in FROM clause'): MySQL không cho phép 1 câu INSERT/UPDATE vừa ghi vào 1
--  bảng vừa SELECT từ chính bảng đó trong subquery. Với 2 chỗ tự tham chiếu
--  chính nó (region.parent_id, place.master_place_id khi gộp bản ghi trùng),
--  script dùng session variable (SET @v := LAST_INSERT_ID()) thay vì subquery
--  để tránh lỗi này.
-- ============================================================================

USE dulichso;
SET NAMES utf8mb4;
START TRANSACTION;

-- ============================================================================
-- 1. REGION  [SINH] — cây khu vực suy luận từ địa chỉ trong file, KHÔNG có
--    sheet hành chính riêng trong DATA_CHÍNH_THỐNG.xlsx.
--    Lưu ý: theo địa chỉ ghi trong file (vd 'Yên Bái' xuất hiện nhiều lần ở
--    sheet Homestay reviewer), Mù Cang Chải thuộc tỉnh YÊN BÁI — khác với
--    ví dụ path '/lao-cai/...' trong comment mẫu của script schema gốc.
-- ============================================================================
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('yen-bai', 'Yên Bái', 'yen bai', 1, NULL, '/yen-bai', TRUE);
SET @rg_yen_bai := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('mu-cang-chai', 'Huyện Mù Cang Chải', 'huyen mu cang chai', 2, @rg_yen_bai, '/yen-bai/mu-cang-chai', TRUE);
SET @rg_mu_cang_chai := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('van-chan', 'Huyện Văn Chấn', 'huyen van chan', 2, @rg_yen_bai, '/yen-bai/van-chan', TRUE);
SET @rg_van_chan := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('tt-mu-cang-chai', 'Thị trấn Mù Cang Chải', 'thi tran mu cang chai', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/tt-mu-cang-chai', TRUE);
SET @rg_tt_mu_cang_chai := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('la-pan-tan', 'Xã La Pán Tẩn', 'xa la pan tan', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/la-pan-tan', TRUE);
SET @rg_la_pan_tan := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('che-cu-nha', 'Xã Chế Cu Nha', 'xa che cu nha', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/che-cu-nha', TRUE);
SET @rg_che_cu_nha := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('de-xu-phinh', 'Xã Dế Xu Phình', 'xa de xu phinh', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/de-xu-phinh', TRUE);
SET @rg_de_xu_phinh := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('nam-khat', 'Xã Nậm Khắt', 'xa nam khat', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/nam-khat', TRUE);
SET @rg_nam_khat := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('mo-de', 'Xã Mồ Dề', 'xa mo de', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/mo-de', TRUE);
SET @rg_mo_de := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('kim-noi', 'Xã Kim Nọi', 'xa kim noi', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/kim-noi', TRUE);
SET @rg_kim_noi := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('pung-luong', 'Xã Púng Luông', 'xa pung luong', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/pung-luong', TRUE);
SET @rg_pung_luong := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('cao-pha', 'Xã Cao Phạ', 'xa cao pha', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/cao-pha', TRUE);
SET @rg_cao_pha := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('nam-co', 'Xã Nậm Có', 'xa nam co', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/nam-co', TRUE);
SET @rg_nam_co := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('che-tao', 'Xã Chế Tạo', 'xa che tao', 3, @rg_mu_cang_chai, '/yen-bai/mu-cang-chai/che-tao', TRUE);
SET @rg_che_tao := LAST_INSERT_ID();
INSERT INTO region (code, name, name_norm, level, parent_id, path, is_active) VALUES ('tu-le', 'Xã Tú Lệ', 'xa tu le', 3, @rg_van_chan, '/yen-bai/van-chan/tu-le', TRUE);
SET @rg_tu_le := LAST_INSERT_ID();

-- ============================================================================
-- 2. CATEGORY & AMENITY SEED
--    Khởi tạo danh mục (category) chuẩn hoá & danh sách tiện ích (amenity)
-- ============================================================================
INSERT IGNORE INTO category (kind, slug, name, sort_order) VALUES
  ('HOMESTAY',   'luu-tru',   'Lưu trú / Homestay',               1),
  ('RESTAURANT', 'nha-hang',  'Nhà hàng & Quán ăn',               2),
  ('CUISINE',    'am-thuc',   'Ẩm thực & Món ngon bản địa',       3),
  ('ATTRACTION', 'diem-den',  'Điểm đến & Thắng cảnh',            4),
  ('PHOTO',      'chup-anh',  'Điểm & Dịch vụ Chụp ảnh',          5),
  ('RENTAL',     'thue-do',   'Cho thuê trang phục & Phương tiện',6),
  ('TRANSPORT',  'di-chuyen', 'Di chuyển',                        7),
  ('SERVICE',    'dich-vu',   'Dịch vụ',                          8),
  ('CULTURE',    'van-hoa',   'Văn hóa',                          9);

INSERT IGNORE INTO amenity (code, name, scope, is_essential) VALUES
  ('HOT_WATER',         'Nước nóng',                 'PLACE', TRUE),
  ('HEATER',            'Sưởi / điều hòa ấm',        'PLACE', TRUE),
  ('BACKUP_POWER',      'Điện dự phòng',             'PLACE', TRUE),
  ('STABLE_WATER',      'Nước ổn định',              'PLACE', TRUE),
  ('WIFI',              'Wifi',                      'PLACE', FALSE),
  ('PARKING',           'Bãi đỗ xe',                 'PLACE', FALSE),
  ('RESTAURANT',        'Nhà hàng tại chỗ',          'PLACE', FALSE),
  ('AIR_CONDITIONING',  'Điều hòa không khí',        'ROOM',  FALSE),
  ('BALCONY',           'Ban công view núi / ruộng', 'ROOM',  FALSE),
  ('KITCHEN',           'Bếp nấu tự do',             'PLACE', FALSE),
  ('BATHTUB',           'Bồn tắm ngâm thảo dược',    'ROOM',  FALSE),
  ('BBQ_AREA',          'Sân nướng BBQ ngoài trời',  'PLACE', FALSE),
  ('MOTORBIKE_RENTAL',  'Cho thuê xe máy',           'PLACE', FALSE),
  ('FIREPLACE',         'Lò sưởi củi sinh hoạt chung','PLACE',FALSE);

-- ============================================================================
-- 3+4. HOMESTAY — sheet 'Homestay ' (chính thống, source_type=OFFICIAL)
--      Mỗi Homestay bắt buộc có Provider (BR-06) -> tạo 1 provider + 1
--      account PROVIDER [SINH: password_hash là placeholder, cần đổi khi
--      go-live; email để NULL vì file không có email].
-- ============================================================================

-- ---- Homestay: Hello Mu Cang Chai Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Hello Mu Cang Chai Homestay', NULL, '0379292222', 'La Pán Tẩn', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0379292222', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Hello Mu Cang Chai Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('hello-mu-cang-chai-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Hello Mu Cang Chai Homestay' ORDER BY id DESC LIMIT 1),
  'Hello Mu Cang Chai Homestay', 'hello mu cang chai homestay', 'Wifi miễn phí, bình nóng lạnh, nhà hàng phục vụ món ăn bản địa Mông, dịch vụ giặt ủi, cho thuê xe máy, tổ chức tour trekking/hướng dẫn bản địa, bãi đỗ xe',
  @rg_la_pan_tan, 'La Pán Tẩn', 150000, 1200000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.849120, 104.092450);
SET @place_hello_mu_cang_chai_homestay := LAST_INSERT_ID();
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'PHONE', '0379292222', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'FACEBOOK', 'https://www.facebook.com/hellomucangchai', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'PRO', 'Chủ nhà (anh A Dê và gia đình) rất thân thiện, hiếu khách; đồ ăn ngon mang hương vị địa phương; view ngắm ruộng bậc thang xuất sắc; có dịch vụ tour dẫn đường tiện lợi', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'CON', 'Đường lên bản trên đồi cao dốc và quanh co, hạn chế xe ô tô lớn vào tận nơi; vào mùa cao điểm lúa chín thường xuyên cháy phòng', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'TIP', 'Đón bình minh đẹp nhất từ 5:30 - 6:30 sáng ngay tại ban công nhìn xuống thung lũng La Pán Tẩn. Đoạn dốc lên homestay khá gắt, nếu tay lái yếu nên liên hệ anh A Dê ra đón hoặc hỗ trợ kéo xe. Buổi tối nhớ đặt trước lẩu gà đen bản địa và thưởng thức rượu ngô men lá cùng gia đình.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho hello-mu-cang-chai-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_hello_mu_cang_chai_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_hello_mu_cang_chai_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='MOTORBIKE_RENTAL'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'Bungalow Gỗ View Ruộng Bậc Thang', 'Bungalow gỗ pơ mu khép kín, ban công riêng nhìn trọn cảnh thung lũng mâm xôi, trang bị bình nóng lạnh, máy sưởi ấm mùa đông.', 2, 4, 'YES', 20.0, 800000, 'ACTIVE');
SET @rt_hello_mu_cang_chai_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_hello_mu_cang_chai_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hello_mu_cang_chai_homestay_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hello_mu_cang_chai_homestay_1, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hello_mu_cang_chai_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hello_mu_cang_chai_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'Phòng Gia Đình 2 Giường Lớn', 'Không gian rộng rãi ấm cúng cho gia đình, view núi thoáng mát, nội thất gỗ tự nhiên mộc mạc.', 4, 2, 'YES', 30.0, 1200000, 'ACTIVE');
SET @rt_hello_mu_cang_chai_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_hello_mu_cang_chai_homestay_2, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hello_mu_cang_chai_homestay_2, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hello_mu_cang_chai_homestay_2, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hello_mu_cang_chai_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hello_mu_cang_chai_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'Giường Đơn Gian Ngủ Nhà Sàn Cộng Đồng', 'Đệm đơn êm ái trên sàn gỗ truyền thống người H\'Mông, có rèm che riêng tư, chăn đệm ấm áp và ổ cắm điện riêng.', 1, 12, 'NO', 60.0, 180000, 'ACTIVE');
SET @rt_hello_mu_cang_chai_homestay_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_hello_mu_cang_chai_homestay_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hello_mu_cang_chai_homestay_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hello_mu_cang_chai_homestay_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Mu Cang Chai Eco Lodge ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Mu Cang Chai Eco Lodge', NULL, '0989090908', 'Nậm Khắt', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0989090908', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mu Cang Chai Eco Lodge' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('mu-cang-chai-eco-lodge', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mu Cang Chai Eco Lodge' ORDER BY id DESC LIMIT 1),
  'Mu Cang Chai Eco Lodge', 'mu cang chai eco lodge', 'Nhà hàng phục vụ ẩm thực Tây Bắc, quầy bar sân hiên, wifi, bãi đỗ xe riêng, lò sưởi sinh hoạt chung, dịch vụ cho thuê xe máy, hỗ trợ tour đi bộ/trekking',
  @rg_nam_khat, 'Nậm Khắt', 750000, 1600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.782100, 104.148200);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'PHONE', '0989090908', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'FACEBOOK', 'https://www.facebook.com/mucangchaiecolodge', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'PRO', 'Không gian rộng rãi, thoáng đãng, cực kỳ trong lành và yên bình; kiến trúc tự nhiên ấn tượng; nhân viên thân thiện, nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'CON', 'Nằm tách biệt, cách trung tâm thị trấn Mù Cang Chải khoảng 15–20km; xung quanh không có nhiều hàng quán ngoài dịch vụ nội khu; tiện nghi phòng tối giản, mộc mạc (không điều hòa/TV để giữ tiêu chí sinh thái)', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'TIP', 'Khu nghỉ dưỡng nằm biệt lập tại Nậm Khắt, không khí mát lạnh như Đà Lạt. Nên đi dạo quanh đồi chè và đồi thông vào sáng sớm khi sương chưa tan. Khuôn viên rộng rãi rất thích hợp cho các buổi thiền, yoga hoặc đốt lửa trại sưởi ấm buổi tối.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho mu-cang-chai-eco-lodge
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_mu_cang_chai_eco_lodge := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_mu_cang_chai_eco_lodge);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='FIREPLACE'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'Bungalow Độc Lập View Đồi Thông (Sơn Trà / Lúa)', 'Nhà sàn gỗ thông độc lập, thiết kế sinh thái hài hòa, bồn tắm gỗ ngâm thảo dược và ban công ngắm hoàng hôn.', 2, 5, 'YES', 32.0, 1200000, 'ACTIVE');
SET @rt_mu_cang_chai_eco_lodge_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_chai_eco_lodge_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_1, (SELECT id FROM amenity WHERE code='BATHTUB'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_1, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'Phòng Superior Gia Đình (Family Suite)', 'Phòng gia đình trên cao, trần mái vòm gỗ thông thoáng khí, không gian tiếp khách trà chiều sang trọng.', 4, 3, 'YES', 45.0, 1600000, 'ACTIVE');
SET @rt_mu_cang_chai_eco_lodge_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_chai_eco_lodge_2, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_2, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_2, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'Phòng Deluxe Double View Thung Lũng', 'Phòng đôi cao cấp ấm cúng, nội thất tối giản phong cách Bắc Âu kết hợp hoa văn bản địa Tây Bắc.', 2, 4, 'YES', 28.0, 950000, 'ACTIVE');
SET @rt_mu_cang_chai_eco_lodge_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_chai_eco_lodge_3, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_3, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_3, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_eco_lodge_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Dò Gừ Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Dò Gừ Homestay', NULL, '0977363345', 'La Pán Tẩn', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0977363345', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Dò Gừ Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('do-gu-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Dò Gừ Homestay' ORDER BY id DESC LIMIT 1),
  'Dò Gừ Homestay', 'do gu homestay', 'Wifi, bình tắm nước nóng, phục vụ ăn uống đặc sản bản địa (gà đồi, thịt lợn bản, rau rừng), sân ngắm cảnh, hỗ trợ thuê xe máy và chỉ đường đi bộ',
  @rg_la_pan_tan, 'La Pán Tẩn', 120000, 800000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.851200, 104.090100);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'PHONE', '0977363345', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'FACEBOOK', 'https://www.facebook.com/DoGuHomestay', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'PRO', 'Vị trí đắc địa ngay tại trung tâm "thủ phủ" ruộng bậc thang La Pán Tẩn; gia chủ người Mông rất mộc mạc, thật thà và mến khách; chi phí sinh hoạt hợp lý', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'CON', 'Đường lên bản nhiều đoạn dốc và cua ngoằn ngoèo (phù hợp đi xe máy số hơn ô tô gầm thấp); trang thiết bị ở mức cơ bản, nhà vệ sinh chung ở khu vực gian ngủ sàn', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'TIP', 'Nằm ngay trung tâm La Pán Tẩn, chỉ mất 10 phút đi bộ ra các thửa ruộng bậc thang đẹp nhất. Anh Dò Gừ là thổ địa chụp ảnh có tiếng, bạn có thể nhờ anh hướng dẫn các góc chụp không đụng hàng trên đồi Mâm Xôi.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho do-gu-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_do_gu_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_do_gu_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='MOTORBIKE_RENTAL'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'Bungalow Gỗ Riêng Biệt View Mây', 'Bungalow gỗ ấm áp vách thông ngát hương, cửa sổ kính panorama nhìn thẳng thung lũng lúa, vệ sinh riêng.', 2, 3, 'YES', 22.0, 650000, 'ACTIVE');
SET @rt_do_gu_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_do_gu_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_do_gu_homestay_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_do_gu_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_do_gu_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'Phòng Đôi Tiêu Chuẩn Vách Gỗ', 'Phòng riêng vách gỗ mộc mạc, sạch sẽ, thoáng mát về mùa hè và kín gió ấm cúng về mùa đông.', 2, 4, 'NO', 18.0, 450000, 'ACTIVE');
SET @rt_do_gu_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_do_gu_homestay_2, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_do_gu_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_do_gu_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'Chỗ Ngủ Đệm Gian Nhà Sàn Bản Mông', 'Trải nghiệm văn hóa sinh hoạt cộng đồng người H\'Mông, đệm bông gạo êm ái, rèm ngăn cách từng chỗ ngủ.', 1, 15, 'NO', 80.0, 150000, 'ACTIVE');
SET @rt_do_gu_homestay_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_do_gu_homestay_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_do_gu_homestay_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_do_gu_homestay_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Mù Cang Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Mù Cang Homestay', NULL, '0946052233', 'Tổ 2, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0946052233', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mù Cang Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('mu-cang-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mù Cang Homestay' ORDER BY id DESC LIMIT 1),
  'Mù Cang Homestay', 'mu cang homestay', 'Wifi, bình nước nóng lạnh, phục vụ ăn uống (đặc sản Tây Bắc), sân đỗ xe máy/ô tô, hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Tổ 2, TT Mù Cang Chải', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.859340, 104.084210);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'PHONE', '0946052233', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'FACEBOOK', 'https://www.facebook.com/profile.php?id=100057368952482', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'PRO', 'Nằm ngay thị trấn nên rất thuận tiện đi lại, gần chợ phiên và các quán ăn địa phương; chi phí hợp lý; chủ nhà mến khách', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'CON', 'Không nằm trên triền đồi ngắm ruộng bậc thang trực diện như ở La Pán Tẩn hay Púng Luông; khu vực sàn tập thể dùng chung tiện ích vệ sinh', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'TIP', 'Vị trí nằm ngay Bản Thái gần trung tâm thị trấn Mù Cang Chải, đi chợ đêm hay dạo bờ suối rất gần. Buổi tối nên trải nghiệm giao lưu văn nghệ múa xòe Thái và thưởng thức món cá chép suối nướng pa pỉnh tộp nức tiếng.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho mu-cang-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_mu_cang_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_mu_cang_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='MOTORBIKE_RENTAL'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'Phòng Riêng Nhà Sàn View Suối Nậm Kim', 'Phòng riêng trên tầng 2 nhà sàn, cửa sổ hướng ra suối mát rượi quanh năm, trang bị nệm cao su êm ái.', 2, 4, 'NO', 18.0, 400000, 'ACTIVE');
SET @rt_mu_cang_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'Phòng 3 Người Cho Nhóm Bạn', 'Phòng gỗ rộng rãi gồm 1 giường đôi và 1 giường đơn, thoáng đãng, view bản làng yên bình.', 3, 3, 'NO', 24.0, 550000, 'ACTIVE');
SET @rt_mu_cang_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_homestay_2, 'DOUBLE', 1);
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_homestay_2, 'SINGLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'Chỗ Ngủ Gian Sàn Cộng Đồng Bản Thái', 'Nhà sàn gỗ lim cao ráo sạch bóng, đệm gối hoa văn thổ cẩm Thái rực rỡ, trang bị màn tuyn chống muỗi riêng.', 1, 20, 'NO', 100.0, 120000, 'ACTIVE');
SET @rt_mu_cang_homestay_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_homestay_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_homestay_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_homestay_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Ngọc Thúy Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Ngọc Thúy Homestay', NULL, '0971447265', 'Bản Thái, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0971447265', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Ngọc Thúy Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('ngoc-thuy-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Ngọc Thúy Homestay' ORDER BY id DESC LIMIT 1),
  'Ngọc Thúy Homestay', 'ngoc thuy homestay', 'Wifi, bình tắm nước nóng, sân để xe máy/ô tô, dịch vụ ăn uống ẩm thực Thái (cá nướng pa pỉnh tộp, thịt trâu gác bếp, xôi nếp nương), cho thuê trang phục dân tộc, cho thuê xe máy',
  @rg_tt_mu_cang_chai, 'Bản Thái, TT Mù Cang Chải', 120000, 700000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.857100, 104.085300);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'PHONE', '0971447265', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'FACEBOOK', 'https://www.facebook.com/homestaymucangchai', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'PRO', 'Nằm ngay sát trung tâm thị trấn nên đường đi bằng phẳng, ô tô vào tận nơi thuận tiện; nhà sàn thoáng mát, sạch sẽ; chủ nhà nhiệt tình, nấu ăn ngon', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'CON', 'Không gian nhà sàn sinh hoạt cộng đồng nên cách âm giữa các gian ngủ chưa cao; mùa cao điểm khá đông đúc', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'TIP', 'Homestay nằm ở Bản Thái, đường xe ô tô 29 chỗ vào tận sân dễ dàng. Chị Thúy nấu ăn cực ngon, đặc biệt món xôi nếp nương ngũ sắc hạt dẻo thơm ăn cùng thịt lợn mán nướng mắc khén. Nên đặt xe máy số tại đây để đi phượt Đồi Móng Ngựa.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho ngoc-thuy-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_ngoc_thuy_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_ngoc_thuy_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), (SELECT id FROM amenity WHERE code='MOTORBIKE_RENTAL'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'Phòng Riêng Gia Đình Khép Kín', 'Phòng riêng có vệ sinh khép kín với bình tắm nóng lạnh hiện đại, cửa sổ nhìn ra cánh đồng lúa Bản Thái.', 3, 3, 'YES', 22.0, 600000, 'ACTIVE');
SET @rt_ngoc_thuy_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_ngoc_thuy_homestay_1, 'DOUBLE', 1);
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_ngoc_thuy_homestay_1, 'SINGLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_ngoc_thuy_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_ngoc_thuy_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'Phòng Đôi Tiêu Chuẩn Gỗ Lim', 'Phòng gỗ lim ấm áp, yên tĩnh, view nhìn ra vườn cây ăn trái và núi rừng mờ sương.', 2, 5, 'NO', 16.0, 400000, 'ACTIVE');
SET @rt_ngoc_thuy_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_ngoc_thuy_homestay_2, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_ngoc_thuy_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_ngoc_thuy_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'Nệm Ngủ Sàn Gỗ Cộng Đồng Truyền Thống', 'Sàn gỗ sạch bóng mát mẻ, chăn đệm thơm tho, không gian thoáng đãng đậm nét sinh hoạt làng bản.', 1, 25, 'NO', 120.0, 130000, 'ACTIVE');
SET @rt_ngoc_thuy_homestay_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_ngoc_thuy_homestay_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_ngoc_thuy_homestay_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_ngoc_thuy_homestay_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Mong Ngua Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Mong Ngua Homestay', NULL, '0367858988', 'Mồ Dề', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0367858988', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mong Ngua Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('mong-ngua-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mong Ngua Homestay' ORDER BY id DESC LIMIT 1),
  'Mong Ngua Homestay', 'mong ngua homestay', 'Wifi, bình nước nóng lạnh, phục vụ ăn uống (gà bản nướng, lợn mán, cơm lam), dịch vụ xe ôm chở lên đồi ngắm cảnh, hỗ trợ thuê xe máy',
  @rg_mo_de, 'Mồ Dề', 120000, 750000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.882100, 104.062100);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'PHONE', '0367858988', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'PRO', 'Vị trí đắc địa gần sát Đồi Móng Ngựa nên không lo muộn giờ đón hoàng hôn/bình minh; không gian yên bình, đậm nét bản địa', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'CON', 'Đường lên bản và lên đồi dốc cao, cua tay áo (chủ yếu di chuyển bằng xe máy số hoặc thuê xe ôm bản địa); tiện nghi ở mức cơ bản', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'TIP', 'Vị trí vàng cách điểm ngắm hoàng hôn Đồi Móng Ngựa chỉ vài phút. Thời điểm đẹp nhất để ngắm lúa là từ 16:30 đến 17:45 chiều khi nắng vàng đổ tràn khắp các vòng cung ruộng. Homestay có đội ngũ xe ôm chuyên chở lên dốc Móng Ngựa rất an toàn.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho mong-ngua-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_mong_ngua_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_mong_ngua_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='MOTORBIKE_RENTAL'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'Phòng Riêng View Đồi Móng Ngựa', 'Phòng gỗ có ban công riêng nhìn bao quát vòng cung lúa Móng Ngựa, buổi chiều ngắm hoàng hôn rực rỡ từ phòng.', 2, 4, 'YES', 20.0, 700000, 'ACTIVE');
SET @rt_mong_ngua_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mong_ngua_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mong_ngua_homestay_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mong_ngua_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mong_ngua_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'Phòng Riêng 2 Giường Đôi Tiêu Chuẩn', 'Phòng 2 giường đôi thích hợp nhóm bạn săn ảnh hoàng hôn, vách gỗ pơ mu tự nhiên cách âm tốt.', 4, 3, 'NO', 26.0, 750000, 'ACTIVE');
SET @rt_mong_ngua_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mong_ngua_homestay_2, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mong_ngua_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mong_ngua_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'Gian Nhà Sàn Dân Tộc H\'Mông', 'Chỗ ngủ đệm sàn truyền thống, ấm cúng và đầy đủ chăn len, thích hợp cho đoàn phượt.', 1, 16, 'NO', 70.0, 140000, 'ACTIVE');
SET @rt_mong_ngua_homestay_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mong_ngua_homestay_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mong_ngua_homestay_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mong_ngua_homestay_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: La Pan Tan Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('La Pan Tan Homestay', NULL, '0854650589', 'La Pán Tẩn', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0854650589', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='La Pan Tan Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('la-pan-tan-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='La Pan Tan Homestay' ORDER BY id DESC LIMIT 1),
  'La Pan Tan Homestay', 'la pan tan homestay', 'Wifi, bình nước nóng lạnh, dịch vụ ăn uống ẩm thực H\'Mông, sân hiên ngắm cảnh, hỗ trợ thuê xe máy và hướng dẫn tour đi bộ xuyên bản',
  @rg_la_pan_tan, 'La Pán Tẩn', 150000, 850000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.848300, 104.094500);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'PHONE', '0854650589', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'FACEBOOK', 'https://www.facebook.com/profile.php?id=100064932032609', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'PRO', 'Tầm nhìn đắt giá nhìn trọn ruộng bậc thang; không khí trong lành, tĩnh lặng; chủ nhà thân thiện và hỗ trợ chu đáo', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'CON', 'Đường lên bản dốc đứng, nhiều đoạn quanh co (xe ga khó đi, ưu tiên xe số hoặc tay lái cứng); tiện nghi mang tính cơ bản của nhà dân', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'TIP', 'Homestay nằm ở vị trí cao tại La Pán Tẩn, buổi sáng biển mây thường tràn sát bậc cửa sổ. Nếu muốn trekking vào Rừng Trúc hoặc bãi đá cổ, hãy báo chủ nhà chuẩn bị cơm lam gà nướng mang theo làm bữa trưa dã ngoại.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho la-pan-tan-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_la_pan_tan_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_la_pan_tan_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), (SELECT id FROM amenity WHERE code='MOTORBIKE_RENTAL'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), (SELECT id FROM amenity WHERE code='FIREPLACE'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'Bungalow Mái Lá Khép Kín View Thung Lũng', 'Bungalow lợp lá cọ truyền thống, vách kính view 180 độ nhìn biển mây La Pán Tẩn, vệ sinh khép kín có bình nóng lạnh.', 2, 3, 'YES', 22.0, 750000, 'ACTIVE');
SET @rt_la_pan_tan_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_la_pan_tan_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_la_pan_tan_homestay_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_la_pan_tan_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_la_pan_tan_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'Phòng Đôi Riêng Tư Vách Gỗ', 'Phòng ấm cúng cho cặp đôi, chăn ga thổ cẩm thủ công, cửa sổ đón nắng sớm dịu nhẹ.', 2, 4, 'NO', 16.0, 450000, 'ACTIVE');
SET @rt_la_pan_tan_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_la_pan_tan_homestay_2, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_la_pan_tan_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_la_pan_tan_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'Chỗ Ngủ Sàn Gỗ Cộng Đồng Mộc Mạc', 'Gian ngủ chung nhà sàn truyền thống rộng rãi, màn chống muỗi và rèm riêng từng giường.', 1, 18, 'NO', 75.0, 140000, 'ACTIVE');
SET @rt_la_pan_tan_homestay_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_la_pan_tan_homestay_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_la_pan_tan_homestay_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_la_pan_tan_homestay_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Homestay Cường Tú ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Homestay Cường Tú', NULL, '0385179642', 'Kim Nọi', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0385179642', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Cường Tú' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('homestay-cuong-tu', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Cường Tú' ORDER BY id DESC LIMIT 1),
  'Homestay Cường Tú', 'homestay cuong tu', 'Wifi, bình tắm nước nóng, sân để xe rộng rãi, phục vụ ăn uống (đặc sản cơm lam, lợn bản, gà nướng mác khén), hỗ trợ thuê xe máy',
  @rg_kim_noi, 'Kim Nọi', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.854200, 104.072100);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'PHONE', '0385179642', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'TIKTOK', 'https://www.tiktok.com/@vn.cng8742?_r=1&_t=ZS-99pdoOCSCrh', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'PRO', 'Vị trí gần trung tâm thị trấn Mù Cang Chải (chỉ cách khoảng 1–2km), đường đi bằng phẳng xe ô tô vào tận nơi thuận tiện; chủ nhà thân thiện, nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'CON', 'Không gian nhà sàn sinh hoạt cộng đồng nên khả năng cách âm còn hạn chế; mùa lễ hội cao điểm khá đông khách', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'TIP', 'Tọa lạc tại bản Kim Nọi êm đềm, cách thị trấn chỉ hơn 1km. Homestay có khoảng sân vườn rộng ngát hoa, thích hợp nướng BBQ buổi tối bên bờ suối. Chủ nhà có dịch vụ cho thuê xe cào cào và xe số leo đèo rất khỏe.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho homestay-cuong-tu
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_homestay_cuong_tu := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_homestay_cuong_tu);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='MOTORBIKE_RENTAL'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'Phòng Riêng View Vườn & Suối', 'Phòng riêng yên tĩnh ven suối mát mẻ, nội thất gỗ ấm cúng, có bàn trà nhỏ trước hiên.', 2, 4, 'YES', 20.0, 550000, 'ACTIVE');
SET @rt_homestay_cuong_tu_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_cuong_tu_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_cuong_tu_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_cuong_tu_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_cuong_tu_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'Phòng Gia Đình 2 Giường Rộng', 'Phòng cho gia đình nhỏ hoặc nhóm bạn 4 người, không gian thoáng đãng sạch sẽ.', 4, 2, 'NO', 28.0, 700000, 'ACTIVE');
SET @rt_homestay_cuong_tu_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_cuong_tu_2, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_cuong_tu_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_cuong_tu_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'Chỗ Ngủ Đệm Nhà Sàn Kim Nọi', 'Gian ngủ sàn gỗ cổ truyền, chăn đệm sạch thơm, view nhìn ra cánh đồng lúa bao la.', 1, 20, 'NO', 90.0, 120000, 'ACTIVE');
SET @rt_homestay_cuong_tu_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_cuong_tu_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_cuong_tu_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_cuong_tu_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Nhà nghỉ cộng đồng Lương Văn Bản ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Nhà nghỉ cộng đồng Lương Văn Bản', NULL, '0344443620', 'Tổ 9, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0344443620', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Nhà nghỉ cộng đồng Lương Văn Bản' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-nghi-cong-dong-luong-van-ban', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Nhà nghỉ cộng đồng Lương Văn Bản' ORDER BY id DESC LIMIT 1),
  'Nhà nghỉ cộng đồng Lương Văn Bản', 'nha nghi cong dong luong van ban', 'Wifi, bình nước nóng lạnh, phục vụ các món ăn truyền thống dân tộc, sân đỗ xe máy và ô tô, hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Tổ 9, TT Mù Cang Chải', 100000, 500000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.861000, 104.086200);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 'PHONE', '0344443620', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 'PRO', 'Nằm ngay tại thị trấn nên đường sá thuận tiện, dễ tiếp cận các hàng quán và chợ trung tâm; chi phí dịch vụ bình dân; chủ nhà nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 'CON', 'Tiện nghi mang tính cơ bản của nhà nghỉ cộng đồng vùng cao; không gian ngủ chung trên sàn nên cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 'TIP', 'Điểm dừng chân lâu đời tại thị trấn, không gian thuần chất văn hóa Thái. Bạn có thể nhờ bác Bản dẫn đi trải nghiệm bắt cá suối hoặc dệt thổ cẩm cùng các mẹ, các chị trong bản.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho nha-nghi-cong-dong-luong-van-ban
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_nha_nghi_cong_dong_luong_van_ban := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_nha_nghi_cong_dong_luong_van_ban);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 'Phòng Riêng Tiêu Chuẩn Gia Đình', 'Phòng riêng ấm cúng có vách ngăn kín đáo, trang bị đệm bông tự nhiên và cửa sổ đón gió mát.', 2, 5, 'NO', 18.0, 380000, 'ACTIVE');
SET @rt_nha_nghi_cong_dong_luong_van_ban_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_nha_nghi_cong_dong_luong_van_ban_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_nha_nghi_cong_dong_luong_van_ban_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_nha_nghi_cong_dong_luong_van_ban_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 'Chỗ Ngủ Đệm Sàn Gỗ Bản Thái', 'Không gian sàn gỗ lim cao ráo, mát vào mùa hè ấm vào mùa đông, đệm chiếu sạch tinh tươm.', 1, 22, 'NO', 110.0, 110000, 'ACTIVE');
SET @rt_nha_nghi_cong_dong_luong_van_ban_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_nha_nghi_cong_dong_luong_van_ban_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_nha_nghi_cong_dong_luong_van_ban_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_nha_nghi_cong_dong_luong_van_ban_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Homestay Tùng Teng ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Homestay Tùng Teng', NULL, '0961917927', 'Kim Nọi', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0961917927', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Tùng Teng' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('homestay-tung-teng', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Tùng Teng' ORDER BY id DESC LIMIT 1),
  'Homestay Tùng Teng', 'homestay tung teng', 'Wifi, bình nước nóng lạnh, phục vụ ăn uống (món ngon người Thái, rượu ngô, gà đồi nướng), bãi đỗ xe rộng, hỗ trợ thuê xe máy',
  @rg_kim_noi, 'Kim Nọi', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.853800, 104.071500);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'PHONE', '0961917927', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'PRO', 'Nằm rất gần trung tâm thị trấn Mù Cang Chải (cách tầm 1,5 km), đường đi bằng phẳng ô tô vào tận nơi; chủ nhà hiếu khách, nấu ăn ngon', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'CON', 'Tiện nghi mang tính cơ bản; sinh hoạt chung nhà sàn nên mức độ cách âm giữa các gian ngủ chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'TIP', 'Không gian trẻ trung, chill bên vườn hoa tại Kim Nọi. Buổi tối rất thích hợp đốt lửa nướng khoai bắp và ngắm trăng ngắm sao. Homestay chuẩn bị đồ ăn sáng xôi nếp nương muối vừng rất thơm.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho homestay-tung-teng
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_homestay_tung_teng := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_homestay_tung_teng);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'Phòng Riêng Bungalow Cây Xanh', 'Bungalow xinh xắn giữa vườn cây, có ban công nhỏ ngồi đọc sách ngắm cảnh núi đồi.', 2, 3, 'YES', 20.0, 500000, 'ACTIVE');
SET @rt_homestay_tung_teng_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_tung_teng_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tung_teng_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tung_teng_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tung_teng_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'Phòng Đôi Vách Gỗ Mộc Mạc', 'Phòng đôi yên tĩnh, đệm êm, rèm vải thô tự nhiên mang lại cảm giác bình yên thư thái.', 2, 4, 'NO', 16.0, 350000, 'ACTIVE');
SET @rt_homestay_tung_teng_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_tung_teng_2, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tung_teng_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tung_teng_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'Chỗ Ngủ Sàn Cộng Đồng Trẻ Trung', 'Gian ngủ tập thể trang trí hoa văn thổ cẩm dễ thương, ổ cắm sạc đèn ngủ riêng biệt từng đệm.', 1, 15, 'NO', 70.0, 120000, 'ACTIVE');
SET @rt_homestay_tung_teng_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_tung_teng_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tung_teng_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tung_teng_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Homestay A De ----
-- [FILE+SUY LUẬN] SĐT liên hệ (0379292222) trùng với 'Hello Mu Cang Chai Homestay' và mô tả cùng
--   nhắc tới cùng một chủ nhà -> coi đây là bản ghi trùng lặp của cùng 1
--   Provider/Place thực tế (áp dụng BR-96: gán master_place_id).
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('homestay-a-de', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Hello Mu Cang Chai Homestay' ORDER BY id DESC LIMIT 1),
  'Homestay A De', 'homestay a de', 'Wifi, bình tắm nước nóng, phục vụ ẩm thực địa phương (lẩu gà đồi, thịt lợn gác bếp, xôi nếp nương), sân hiên uống trà ngắm cảnh, hỗ trợ thuê xe máy, tổ chức tour trekking dẫn đường bản địa',
  @rg_la_pan_tan, 'La Pán Tẩn', 150000, 1000000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.847500, 104.093200);
UPDATE place SET master_place_id = @place_hello_mu_cang_chai_homestay WHERE slug='homestay-a-de';  -- BR-96: merge bản ghi trùng
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'PHONE', '0379292222', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'PRO', 'Chủ nhà (anh A Dê) rất năng động, nhiệt huyết và am hiểu địa phương, hướng dẫn viên tour bản địa nhiệt tình; view ngắm lúa xuất sắc; ẩm thực tự nấu tươi ngon', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'CON', 'Đường lên bản dốc và nhiều cua khúc khuỷu đặc trưng địa hình vùng cao (ưu tiên di chuyển bằng xe máy số); mùa lúa chín rất nhanh kín phòng', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'TIP', 'Anh A Dê là hướng dẫn viên bản địa kỳ cựu ở La Pán Tẩn. Nếu thích trekking mạo hiểm khám phá các con suối hoang sơ và bản H\'Mông xa xôi, đây là lựa chọn số một. Homestay có trà thảo mộc nương rẫy thơm dịu miễn phí.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho homestay-a-de
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_homestay_a_de := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_homestay_a_de);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), (SELECT id FROM amenity WHERE code='FIREPLACE'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'Nhà Gỗ Bungalow View Thung Lũng Mâm Xôi', 'Căn nhà gỗ biệt lập trên sườn đồi, view trực diện ruộng bậc thang, vệ sinh khép kín trang bị bình nước nóng năng lượng cao.', 2, 3, 'YES', 22.0, 700000, 'ACTIVE');
SET @rt_homestay_a_de_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_a_de_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_a_de_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_a_de_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_a_de_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'Phòng Riêng 2 Giường Đôi Cho Đoàn', 'Phòng ngủ gia đình 2 giường đôi, không gian gỗ tự nhiên thoáng mát, view núi non hùng vĩ.', 4, 2, 'NO', 28.0, 750000, 'ACTIVE');
SET @rt_homestay_a_de_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_a_de_2, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_a_de_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_a_de_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'Chỗ Ngủ Đệm Gian Nhà Sàn Bản Mông', 'Trải nghiệm cuộc sống mộc mạc vùng cao, chăn ấm đệm dày đảm bảo giấc ngủ ngon giữa cái lạnh sương đêm.', 1, 15, 'NO', 65.0, 130000, 'ACTIVE');
SET @rt_homestay_a_de_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_a_de_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_a_de_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_a_de_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Lương Hưng Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Lương Hưng Homestay', NULL, '0964716235', 'Bản Thái, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0964716235', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Lương Hưng Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('luong-hung-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Lương Hưng Homestay' ORDER BY id DESC LIMIT 1),
  'Lương Hưng Homestay', 'luong hung homestay', 'Wifi, bình tắm nước nóng, sân đỗ xe ô tô và xe máy, phục vụ cơm gia đình với các món đặc sản dân tộc Thái, hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Bản Thái, TT Mù Cang Chải', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.858000, 104.084800);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 'PHONE', '0964716235', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 'PRO', 'Nằm ngay sát trung tâm thị trấn nên đường sá bằng phẳng, xe ô tô đi vào tận nơi dễ dàng; chủ nhà đón tiếp chu đáo, mộc mạc; giá cả phải chăng', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 'CON', 'Không gian ngủ chung trên sàn truyền thống nên cách âm còn hạn chế; không có view nhìn trực diện ruộng bậc thang trên đồi cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 'TIP', 'Nằm ngay trung tâm thị trấn, cực kỳ thuận tiện cho gia đình có người lớn tuổi hoặc trẻ nhỏ ngại đi đường đèo dốc. Gần chợ trung tâm, trạm xăng và bến xe khách liên tỉnh.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho luong-hung-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_luong_hung_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_luong_hung_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 'Phòng Riêng Gia Đình Khép Kín', 'Phòng tầng trệt rộng rãi, vệ sinh khép kín sạch sẽ, cửa sổ đón ánh sáng tự nhiên.', 3, 4, 'YES', 24.0, 500000, 'ACTIVE');
SET @rt_luong_hung_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_luong_hung_homestay_1, 'DOUBLE', 1);
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_luong_hung_homestay_1, 'SINGLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_luong_hung_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_luong_hung_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 'Chỗ Ngủ Gian Nhà Sàn Trung Tâm', 'Nhà sàn gỗ truyền thống thoáng gió, đệm chiếu sạch sẽ ngăn nắp.', 1, 20, 'NO', 80.0, 110000, 'ACTIVE');
SET @rt_luong_hung_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_luong_hung_homestay_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_luong_hung_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_luong_hung_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Homestay Minh Ngọc ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Homestay Minh Ngọc', NULL, '0912503469', 'Kim Nọi', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0912503469', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Minh Ngọc' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('homestay-minh-ngoc', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Minh Ngọc' ORDER BY id DESC LIMIT 1),
  'Homestay Minh Ngọc', 'homestay minh ngoc', 'Wifi, bình nước nóng lạnh, dịch vụ nấu ăn đặc sản người Thái (thịt lợn nướng, cá suối, xôi ngũ sắc), sân đỗ xe, hỗ trợ thuê xe máy',
  @rg_kim_noi, 'Kim Nọi', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.853100, 104.073400);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 'PHONE', '0912503469', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 'PRO', 'Nằm rất gần trung tâm thị trấn Mù Cang Chải (cách khoảng 1–2 km), đường sá thuận lợi cho xe ô tô vào tận nơi; chủ nhà đón tiếp chu đáo, nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 'CON', 'Không gian nhà sàn tập thể nên khả năng cách âm còn hạn chế; tiện nghi mang tính cơ bản của mô hình homestay nông thôn', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 'TIP', 'Không gian bình dị tại Kim Nọi với vườn đào và mận nở trắng vào mùa xuân. Cô chú chủ nhà cực kỳ đôn hậu, bữa cơm gia đình có món canh măng chua rừng nấu thịt băm thanh mát lạ miệng.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho homestay-minh-ngoc
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_homestay_minh_ngoc := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_homestay_minh_ngoc);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 'Phòng Riêng Đôi Vách Gỗ Ấm Cúng', 'Phòng đôi riêng tư sạch sẽ, cửa sổ trông ra vườn hoa mận và rặng tre xanh.', 2, 4, 'NO', 17.0, 380000, 'ACTIVE');
SET @rt_homestay_minh_ngoc_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_minh_ngoc_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_minh_ngoc_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_minh_ngoc_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 'Nệm Ngủ Sàn Gỗ Kim Nọi', 'Sàn gỗ thông mát rượi, đệm êm, trang bị chăn ấm và màn chống muỗi đầy đủ.', 1, 18, 'NO', 75.0, 110000, 'ACTIVE');
SET @rt_homestay_minh_ngoc_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_minh_ngoc_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_minh_ngoc_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_minh_ngoc_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Suối Kim 2 Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Suối Kim 2 Homestay', NULL, '0329961420', 'Ngã Ba Kim, Púng Luông', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0329961420', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Suối Kim 2 Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('suoi-kim-2-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Suối Kim 2 Homestay' ORDER BY id DESC LIMIT 1),
  'Suối Kim 2 Homestay', 'suoi kim 2 homestay', 'Wifi, bình nước nóng lạnh, phục vụ ăn uống bình dân và đặc sản địa phương, sân để xe máy/ô tô, hỗ trợ thuê xe máy',
  @rg_pung_luong, 'Ngã Ba Kim, Púng Luông', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.821400, 104.112300);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'PHONE', '0329961420', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'FACEBOOK', 'https://www.facebook.com/suoikim2homestay', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'PRO', 'Vị trí giao thông cực kỳ thuận lợi, dễ tìm, ngay ngã ba sầm uất với nhiều cửa hàng tạp hóa, quán ăn và trạm xăng; chi phí phòng nghỉ hợp lý', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'CON', 'Nằm gần trục đường giao thông chính nên có thể nghe tiếng xe qua lại ban ngày; không gian và tầm view không ôm trọn ruộng bậc thang như các homestay sâu trong bản', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'TIP', 'Tọa lạc tại khu Ngã Ba Kim, điểm giao thoa giữa đường lên Mù Cang Chải và sang Trạm Tấu. Có chỗ để ô tô tải và xe du lịch lớn rất thoải mái. Giá cả dịch vụ ăn uống và phòng ốc tại đây rất bình dân.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho suoi-kim-2-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_suoi_kim_2_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_suoi_kim_2_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'Phòng Riêng 2 Giường Ngã Ba Kim', 'Phòng riêng khép kín tiện nghi, giường đệm lò xo êm ái, bãi đỗ xe ngay trước cửa.', 3, 6, 'YES', 22.0, 450000, 'ACTIVE');
SET @rt_suoi_kim_2_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_suoi_kim_2_homestay_1, 'DOUBLE', 1);
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_suoi_kim_2_homestay_1, 'SINGLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_suoi_kim_2_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_suoi_kim_2_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'Chỗ Ngủ Sàn Nhà Gỗ Suối Kim', 'Khu sàn gỗ tập thể rộng rãi dành cho đoàn lữ hành, giá cực kỳ tiết kiệm.', 1, 25, 'NO', 90.0, 100000, 'ACTIVE');
SET @rt_suoi_kim_2_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_suoi_kim_2_homestay_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_suoi_kim_2_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_suoi_kim_2_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Nhà nghỉ cộng đồng Nông Văn Êm ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Nhà nghỉ cộng đồng Nông Văn Êm', NULL, '0367765445', 'Tổ 9, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0367765445', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Nhà nghỉ cộng đồng Nông Văn Êm' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-nghi-cong-dong-nong-van-em', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Nhà nghỉ cộng đồng Nông Văn Êm' ORDER BY id DESC LIMIT 1),
  'Nhà nghỉ cộng đồng Nông Văn Êm', 'nha nghi cong dong nong van em', 'Wifi, bình tắm nước nóng, sân để xe máy và ô tô, phục vụ ăn uống gia đình với các món đặc sản địa phương, hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Tổ 9, TT Mù Cang Chải', 100000, 500000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.860500, 104.087100);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 'PHONE', '0367765445', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 'PRO', 'Vị trí gần trung tâm thị trấn nên việc đi lại, ăn uống ngoài và tiếp cận dịch vụ rất dễ dàng; không gian rộng rãi, thoáng mát; chủ nhà thân thiện', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 'CON', 'Trang thiết bị mang tính cơ bản của nhà nghỉ cộng đồng vùng cao; không gian sinh hoạt chung trên sàn nên cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 'TIP', 'Vị trí sát chợ phiên thị trấn, dễ dàng thức dậy sớm mua xôi nếp Tú Lệ và táo mèo tươi mang về làm quà. Chú Êm hỗ trợ thuê xe máy giao tận nơi nhanh chóng.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho nha-nghi-cong-dong-nong-van-em
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_nha_nghi_cong_dong_nong_van_em := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_nha_nghi_cong_dong_nong_van_em);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 'Phòng Đôi Riêng Tư Thị Trấn', 'Phòng riêng vách gỗ kín đáo, yên tĩnh, đệm đôi dày dặn ấm áp.', 2, 4, 'NO', 16.0, 350000, 'ACTIVE');
SET @rt_nha_nghi_cong_dong_nong_van_em_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_nha_nghi_cong_dong_nong_van_em_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_nha_nghi_cong_dong_nong_van_em_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_nha_nghi_cong_dong_nong_van_em_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 'Nệm Ngủ Sàn Tập Thể Nhà Sàn', 'Không gian sàn gỗ thoáng rộng, trang bị màn che và đèn đọc sách nhỏ tại mỗi chỗ.', 1, 18, 'NO', 80.0, 100000, 'ACTIVE');
SET @rt_nha_nghi_cong_dong_nong_van_em_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_nha_nghi_cong_dong_nong_van_em_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_nha_nghi_cong_dong_nong_van_em_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_nha_nghi_cong_dong_nong_van_em_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Homestay Tư Nguyệt ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Homestay Tư Nguyệt', NULL, '0813772213', 'Kim Nọi', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0813772213', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Tư Nguyệt' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('homestay-tu-nguyet', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Tư Nguyệt' ORDER BY id DESC LIMIT 1),
  'Homestay Tư Nguyệt', 'homestay tu nguyet', 'Wifi, bình tắm nước nóng, sân để xe máy và ô tô, phục vụ ăn uống gia đình với các món đặc sản dân tộc Thái, hỗ trợ thuê xe máy',
  @rg_kim_noi, 'Kim Nọi', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.852900, 104.072800);
SET @place_homestay_tu_nguyet := LAST_INSERT_ID();
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'PHONE', '0813772213', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'FACEBOOK', 'https://www.facebook.com/tungluong992', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'PRO', 'Nằm rất gần trung tâm thị trấn Mù Cang Chải (cách khoảng 1–2 km), đường đi bằng phẳng ô tô vào tận nơi; chủ nhà đón tiếp chu đáo, niềm nở', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'CON', 'Trang thiết bị tiện nghi mang tính cơ bản của nhà dân vùng cao; sinh hoạt chung trên sàn tập thể nên khả năng cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'TIP', 'Homestay nằm tại Bản Thái thanh bình, có dịch vụ cho thuê trang phục dân tộc Thái và H\'Mông chụp ảnh rất đẹp. Bữa trưa có thể nhờ chủ nhà nướng thịt ba chỉ xiên mắc khén bên bờ suối.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho homestay-tu-nguyet
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_homestay_tu_nguyet := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_homestay_tu_nguyet);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'Phòng Riêng Đôi Bản Thái', 'Phòng riêng trên tầng nhà sàn, vách gỗ thông ngát hương, có ban công nhìn ra vườn rau xanh.', 2, 5, 'NO', 18.0, 400000, 'ACTIVE');
SET @rt_homestay_tu_nguyet_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_tu_nguyet_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tu_nguyet_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tu_nguyet_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'Gian Ngủ Sàn Gỗ Tập Thể Thơ Mộng', 'Sàn gỗ sạch bóng mát lành, chăn gối thơm phức với họa tiết thêu tay thổ cẩm sắc sảo.', 1, 20, 'NO', 95.0, 120000, 'ACTIVE');
SET @rt_homestay_tu_nguyet_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_tu_nguyet_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tu_nguyet_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tu_nguyet_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Homestay Quyết Đoản ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Homestay Quyết Đoản', NULL, '0329153287', 'Bản Thái Ít, Lìm Mông, Cao Phạ', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0329153287', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Quyết Đoản' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('homestay-quyet-doan', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Quyết Đoản' ORDER BY id DESC LIMIT 1),
  'Homestay Quyết Đoản', 'homestay quyet doan', 'Wifi, bình tắm nước nóng, sân để xe rộng rãi, phục vụ ăn uống đặc sản dân tộc Thái (cá suối nướng, gà đồi, xôi nếp nương), hỗ trợ thuê xe máy',
  @rg_cao_pha, 'Bản Thái Ít, Lìm Mông, Cao Phạ', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.802100, 104.175400);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'PHONE', '0329153287', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'TIKTOK', 'https://vt.tiktok.com/ZSqtJaVhA/', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'PRO', 'Vị trí đắc địa ngay cửa ngõ thung lũng Cao Phạ - Lìm Mông; không gian làng bản mộc mạc, bình yên; chủ nhà thân thiện, nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'CON', 'Nằm ở khu vực Cao Phạ (cách trung tâm thị trấn Mù Cang Chải khoảng 25–30 km); trang thiết bị mang tính cơ bản của nhà sàn cộng đồng', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'TIP', 'Nằm ngay chân đèo Khau Phạ phía Cao Phạ, điểm xuất phát lý tưởng trước khi vượt đèo săn mây hoặc bay dù lượn tại Đèo Gió. Buổi sáng đèo Khau Phạ thường có biển mây cuồn cuộn tràn qua sườn núi.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho homestay-quyet-doan
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_homestay_quyet_doan := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_homestay_quyet_doan);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'Phòng Riêng View Thung Lũng Cao Phạ', 'Phòng gỗ có cửa sổ nhìn thẳng thung lũng Cao Phạ bát ngát, đón trọn làn gió mát từ đèo Khau Phạ thổi về.', 2, 4, 'YES', 20.0, 500000, 'ACTIVE');
SET @rt_homestay_quyet_doan_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_quyet_doan_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_quyet_doan_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_quyet_doan_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_quyet_doan_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'Chỗ Ngủ Sàn Gỗ Chân Đèo Khau Phạ', 'Gian ngủ nhà sàn rộng thoáng, chăn đệm cực ấm chống lại sương lạnh vùng núi cao.', 1, 25, 'NO', 100.0, 120000, 'ACTIVE');
SET @rt_homestay_quyet_doan_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_quyet_doan_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_quyet_doan_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_quyet_doan_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Hoai Phuong Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Hoai Phuong Homestay', NULL, '0339908404', 'Kim Nọi', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0339908404', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Hoai Phuong Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('hoai-phuong-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Hoai Phuong Homestay' ORDER BY id DESC LIMIT 1),
  'Hoai Phuong Homestay', 'hoai phuong homestay', 'Wifi, bình tắm nước nóng, sân để xe máy và ô tô, phục vụ ăn uống đặc sản dân tộc Thái (gà nướng mác khén, lợn bản, xôi ngũ sắc), hỗ trợ thuê xe máy',
  @rg_kim_noi, 'Kim Nọi', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.853500, 104.071900);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 'PHONE', '0339908404', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 'PRO', 'Vị trí rất gần trung tâm thị trấn Mù Cang Chải (cách khoảng 1,5 km), đường đi bằng phẳng ô tô vào tận nơi thuận tiện; chủ nhà đón tiếp nhiệt tình, chu đáo', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 'CON', 'Tiện nghi mang tính cơ bản của mô hình homestay nông thôn; gian ngủ trên sàn tập thể nên khả năng cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 'TIP', 'Homestay nằm ở bản Kim Nọi, không gian sân vườn hoa lá nở rộ quanh năm. Buổi tối chủ nhà thường nhóm lửa sưởi ấm, thưởng trà san tuyết cổ thụ và trò chuyện về phong tục người Thái.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho hoai-phuong-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_hoai_phuong_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_hoai_phuong_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 'Phòng Riêng Ban Công Hoa Kim Nọi', 'Phòng riêng xinh xắn, ban công nhỏ rợp bóng hoa lan, trang bị bình nóng lạnh và máy sấy tóc.', 2, 4, 'YES', 19.0, 480000, 'ACTIVE');
SET @rt_hoai_phuong_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_hoai_phuong_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hoai_phuong_homestay_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hoai_phuong_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hoai_phuong_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 'Nệm Ngủ Sàn Bản Sắc Văn Hóa Thái', 'Trải nghiệm ngủ sàn gỗ cổ truyền, có rèm che chia ngăn riêng tư, chăn đệm dầy dặn sạch sẽ.', 1, 18, 'NO', 80.0, 120000, 'ACTIVE');
SET @rt_hoai_phuong_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_hoai_phuong_homestay_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hoai_phuong_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_hoai_phuong_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Home Stay Duy Cường ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Home Stay Duy Cường', NULL, '0964864094', 'Tổ 7, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0964864094', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Home Stay Duy Cường' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('home-stay-duy-cuong', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Home Stay Duy Cường' ORDER BY id DESC LIMIT 1),
  'Home Stay Duy Cường', 'home stay duy cuong', 'Wifi, bình nước nóng lạnh, phục vụ các món ăn gia đình/đặc sản Tây Bắc, bãi đỗ xe máy và ô tô, hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Tổ 7, TT Mù Cang Chải', 100000, 500000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.862100, 104.088300);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'PHONE', '0964864094', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'FACEBOOK', 'https://www.facebook.com/nhanghiphuotmcc', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'PRO', 'Tọa lạc ngay khu vực thị trấn nên đường sá bằng phẳng, thuận tiện đi lại, mua sắm và ăn uống; gia chủ niềm nở, nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'CON', 'Tiện nghi mang tính cơ bản của mô hình lưu trú cộng đồng; không gian ngủ chung trên sàn nên khả năng cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'TIP', 'Gần cầu Mù Cang Chải, ô tô ra vào đỗ bãi thuận tiện. Có phục vụ cơm bình dân và lẩu cá hồi, cá tầm nóng sốt cho đoàn đông với chi phí hợp lý.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho home-stay-duy-cuong
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_home_stay_duy_cuong := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_home_stay_duy_cuong);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'Phòng Riêng Tiêu Chuẩn 1 Giường Đôi', 'Phòng riêng tư khép kín, tiện nghi đầy đủ, cửa sổ thoáng gió hướng ra suối Nậm Kim.', 2, 5, 'YES', 20.0, 450000, 'ACTIVE');
SET @rt_home_stay_duy_cuong_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_home_stay_duy_cuong_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_home_stay_duy_cuong_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_home_stay_duy_cuong_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'Gian Nhà Sàn Tập Thể Duy Cường', 'Khu sàn gỗ nhà sàn truyền thống cao ráo, thích hợp cho đoàn khách phượt đông người.', 1, 22, 'NO', 90.0, 110000, 'ACTIVE');
SET @rt_home_stay_duy_cuong_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_home_stay_duy_cuong_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_home_stay_duy_cuong_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_home_stay_duy_cuong_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay: Gà Tre Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Gà Tre Homestay', NULL, '0944529942', 'Tổ 2, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0944529942', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Gà Tre Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('ga-tre-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Gà Tre Homestay' ORDER BY id DESC LIMIT 1),
  'Gà Tre Homestay', 'ga tre homestay', 'Wifi, bình tắm nước nóng, sân để xe máy/ô tô, phục vụ ăn uống gia đình (gà nướng, thịt bản, cá suối), hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Tổ 2, TT Mù Cang Chải', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT(), 21.859800, 104.083900);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 'PHONE', '0944529942', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 'PRO', 'Nằm ngay tại thị trấn nên giao thông thuận tiện, dễ tiếp cận hàng quán và chợ Mù Cang Chải; chi phí dịch vụ bình dân; chủ nhà chu đáo', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 'CON', 'Trang thiết bị tiện nghi mang tính cơ bản của nhà dân; không gian ngủ chung trên sàn nên cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 'TIP', 'Không gian sinh thái mộc mạc bên rặng tre xanh mát. Chủ homestay nuôi gà thả vườn đồi nên món gà nướng lá chanh tại đây có thịt dai ngọt đặc trưng, nhớ đặt trước 2 tiếng để chủ nhà ướp gia vị đậm đà.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho ga-tre-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_ga_tre_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_ga_tre_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 'Phòng Gỗ Riêng View Vườn Tre', 'Phòng vách gỗ thơm thoang thoảng, rợp bóng tre mát mẻ cả ngày, không khí cực kỳ trong lành.', 2, 4, 'NO', 18.0, 380000, 'ACTIVE');
SET @rt_ga_tre_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_ga_tre_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_ga_tre_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_ga_tre_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 'Chỗ Ngủ Đệm Gian Nhà Sàn Gà Tre', 'Gian ngủ tập thể sàn gỗ bản sắc, chăn đệm sạch sẽ với phong cách sinh hoạt cộng đồng ấm áp.', 1, 16, 'NO', 75.0, 120000, 'ACTIVE');
SET @rt_ga_tre_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_ga_tre_homestay_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_ga_tre_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_ga_tre_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ============================================================================
-- 5. HOMESTAY (nguồn cộng đồng/reviewer) — sheet 'Homestay reviewer'.
--    source_type = PUBLIC_TRUSTED. Cũng bắt buộc có Provider (BR-06).
-- ============================================================================

-- ---- Homestay (reviewer): Mù Cang Chải Village Home ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Mù Cang Chải Village Home', '0396483968', 'Khu trung tâm, gần La Pán Tẩn', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0396483968', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mù Cang Chải Village Home' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('mu-cang-chai-village-home', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mù Cang Chải Village Home' ORDER BY id DESC LIMIT 1),
  'Mù Cang Chải Village Home', 'mu cang chai village home', 'WiFi miễn phí, bãi đỗ xe miễn phí, nhà hàng tại chỗ (món Á/Việt/chay), xe đạp cho thuê, ấm đun nước điện + bộ pha trà/cà phê, sân thượng chung, dịch vụ đưa đón miễn phí, lễ tân 24/24, dọn phòng hàng ngày, cho mang thú cưng (có phí/theo yêu cầu)',
  @rg_la_pan_tan, 'Khu trung tâm, gần La Pán Tẩn', 500000, 800000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.booking.com/Share-mjTVoaf', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.851900, 104.089500);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'PHONE', '0396483968', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/RAw7MSjqSykHLe3T6', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'PRO', 'chủ nhà hỗ trợ nhiệt tình kể cả khi khách đến muộn/đổi lịch', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'CON', '1 khách bị xếp qua homestay lân cận khác với homestay đã đặt; 1 khách phản ánh không có bữa tối dù đã đặt trước (dịp lễ); có thể ồn vào buổi tối dịp lễ do karaoke, hoặc nằm gần đường', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'TIP', 'Nằm trên triền đồi cao nhìn xuống toàn cảnh thung lũng lúa, không gian bungalow biệt lập yên tĩnh tuyệt đối. Rất lý tưởng cho những ai muốn \'trốn khói bụi\', ngắm sao trời về đêm và đón bình minh rực rỡ bên tách cà phê nóng.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho mu-cang-chai-village-home
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_mu_cang_chai_village_home := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_mu_cang_chai_village_home);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'Family Bungalow 2 Tầng View Ruộng', 'Bungalow gia đình 2 tầng riêng biệt, ban công gỗ ngắm mây trời, trang bị bồn tắm gỗ thảo dược và lò sưởi ấm.', 5, 3, 'YES', 42.0, 1500000, 'ACTIVE');
SET @rt_mu_cang_chai_village_home_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_chai_village_home_1, 'DOUBLE', 2);
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_chai_village_home_1, 'SINGLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_village_home_1, (SELECT id FROM amenity WHERE code='BATHTUB'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_village_home_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_village_home_1, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_village_home_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_village_home_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'Deluxe Bungalow Đôi Lãng Mạn', 'Bungalow gỗ pơ mu dành riêng cho cặp đôi, cửa kính panorama view hoàng hôn thung lũng, vệ sinh khép kín cao cấp.', 2, 6, 'YES', 25.0, 850000, 'ACTIVE');
SET @rt_mu_cang_chai_village_home_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_chai_village_home_2, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_village_home_2, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_village_home_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_village_home_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Mù Cang Chải Big View Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Mù Cang Chải Big View Homestay', '0865847890', 'Dề Thàng, Chế Cu Nha, Mù Cang Chai, Yen Bai, Vietnam', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0865847890', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mù Cang Chải Big View Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('mu-cang-chai-big-view-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mù Cang Chải Big View Homestay' ORDER BY id DESC LIMIT 1),
  'Mù Cang Chải Big View Homestay', 'mu cang chai big view homestay', 'WiFi miễn phí, bãi đỗ xe miễn phí, lễ tân 24/24, sân thượng đón nắng, vườn, quầy bar, bàn/tủ đồ trong phòng, ấm đun nước + trái cây ở một số phòng, bếp đầy đủ dùng chung (cho khách dorm), có cổng chắn an toàn cho em bé, hỗ trợ đặt tour (xe máy, xe đạp, trekking)',
  @rg_che_cu_nha, 'Dề Thàng, Chế Cu Nha, Mù Cang Chai, Yen Bai, Vietnam', 538000, 538000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.booking.com/Share-OLGp0RN', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.868200, 104.053100);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'PHONE', '0865847890', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/1GcKqw1nDvVW4Z1t9', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'PRO', 'chủ nhà (chị Chua) đón khách nhiệt tình kể cả khi đến rất muộn trong đêm, yên bình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'CON', 'Chưa có thông tin hạn chế', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'TIP', 'Đúng như tên gọi \'Big View\' tại xã Chế Cu Nha, tầm nhìn từ sân ngắm cảnh bao trọn các mâm xôi lúa kỳ vĩ trên sườn dốc đứng. Nên chuẩn bị áo khoác dày vì buổi tối trên Chế Cu Nha gió lộng và lạnh hơn dưới thị trấn.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho mu-cang-chai-big-view-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_mu_cang_chai_big_view_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_mu_cang_chai_big_view_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'Phòng Self-Contained Double Big View', 'Phòng riêng độc lập có khu vực tiếp khách trà đạo, phòng thay đồ riêng và ban công ngắm toàn cảnh Chế Cu Nha.', 2, 4, 'YES', 28.0, 750000, 'ACTIVE');
SET @rt_mu_cang_chai_big_view_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_chai_big_view_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_big_view_homestay_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_big_view_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_big_view_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'Phòng Twin 2 Giường Đơn View Núi', 'Phòng 2 giường đơn thoáng đãng, vách kính đón nắng sớm, tiện nghi khép kín đầy đủ.', 2, 3, 'YES', 24.0, 700000, 'ACTIVE');
SET @rt_mu_cang_chai_big_view_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_chai_big_view_homestay_2, 'SINGLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_big_view_homestay_2, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_big_view_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_big_view_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Chải Eco House ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Chải Eco House', '0975727510', 'Tổ 2, Mù Cang Chải, Yên Bái', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0975727510', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Chải Eco House' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('chai-eco-house', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Chải Eco House' ORDER BY id DESC LIMIT 1),
  'Chải Eco House', 'chai eco house', 'Điều hòa, khu ăn uống riêng trong phòng, phòng tắm riêng (bồn cầu có vòi xịt vệ sinh, dép đi trong nhà), sàn lát gạch, bàn làm việc, WiFi miễn phí, lễ tân 24/24, bãi đỗ xe riêng miễn phí, nhận thú cưng, không phục vụ bữa sáng',
  @rg_mu_cang_chai, 'Tổ 2, Mù Cang Chải, Yên Bái', 300000, 350000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.booking.com/hotel/vn/chai-eco-house.html', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.858800, 104.084500);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 'PHONE', '0975727510', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/my9i3aNaKRNmNnES8', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 'CON', 'Mùa đông lạnh. Home không nấu ăn; khách phải dùng BBQ hoặc đi ăn ngoài', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 'TIP', 'Phong cách thiết kế mộc mạc tinh tế, sự giao thoa hài hòa giữa kiến trúc gỗ vùng cao và nội thất tối giản hiện đại. Có quán cà phê sân thượng ngắm trọn dãy núi Hoàng Liên Sơn hùng vĩ trong ráng chiều hoàng hôn.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho chai-eco-house
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_chai_eco_house := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_chai_eco_house);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 'Phòng Đôi Eco Cozy View Núi', 'Phòng đôi thiết kế tối giản, tông màu gỗ ấm áp, trang bị nệm nhập khẩu êm ái và phòng tắm khép kín hiện đại.', 2, 5, 'YES', 22.0, 680000, 'ACTIVE');
SET @rt_chai_eco_house_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_chai_eco_house_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_chai_eco_house_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_chai_eco_house_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_chai_eco_house_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 'Phòng Triple 3 Người Ban Công Lớn', 'Phòng rộng gồm 1 giường đôi và 1 giường đơn, ban công lớn view cánh đồng lúa và đồi thông.', 3, 3, 'YES', 30.0, 950000, 'ACTIVE');
SET @rt_chai_eco_house_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_chai_eco_house_2, 'DOUBLE', 1);
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_chai_eco_house_2, 'SINGLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_chai_eco_house_2, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_chai_eco_house_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_chai_eco_house_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): A Su Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('A Su Homestay', '0373749322', 'Tà Chí Lừ, La Pán Tẩn, Mù Cang Chải, Yên Bái (độ cao ~1.500m, cách trung tâm thị trấn ~9,9km)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0373749322', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='A Su Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('a-su-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='A Su Homestay' ORDER BY id DESC LIMIT 1),
  'A Su Homestay', 'a su homestay', 'WiFi miễn phí, bãi đỗ xe miễn phí, bếp chung đầy đủ, nhà hàng tại chỗ (có món chay/không gluten), máy sưởi + nước nóng + máy pha cà phê trong phòng, lò sưởi ngoài trời, bồn tắm ngoài trời, sân vườn, quầy bar, dịch vụ tour/trekking, cho thuê xe, lớp học nấu ăn, giữ hành lý, nhận thú cưng',
  @rg_la_pan_tan, 'Tà Chí Lừ, La Pán Tẩn, Mù Cang Chải, Yên Bái (độ cao ~1.500m, cách trung tâm thị trấn ~9,9km)', 400000, 1000000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.booking.com/Share-KDX7Gmz', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.846500, 104.095800);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'PHONE', '0373749322', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/Ek3bZnenUaE7Lg2V8', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'PRO', 'Chủ nhà (anh A Su) cực kỳ thân thiện, coi khách như người nhà; phòng ~50m2 mới, sạch, có máy sưởi/nước nóng/máy pha cà phê; view bao quát cả huyện + biển mây. Quy mô nhỏ, có thể phù hợp khách thích lưu trú gia đình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'CON', 'Đường leo dốc lên homestay khá dốc (không quá dài nhưng cần cẩn thận); có review ghi nhận nước nóng không đủ để tắm thoải mái', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'TIP', 'Gia đình anh A Su ở La Pán Tẩn có nghề rèn nông cụ và làm sáp ong truyền thống. Du khách có thể đăng ký trải nghiệm vẽ tranh sáp ong trên vải lanh và thưởng thức rượu táo mèo ủ chum hạ thổ.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho a-su-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_a_su_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_a_su_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='MOTORBIKE_RENTAL'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'Phòng Double Khép Kín View Thung Lũng', 'Phòng đôi khép kín ấm áp, cửa sổ nhìn xuống các thửa ruộng bậc thang thoai thoải uốn quanh bản.', 2, 4, 'YES', 20.0, 600000, 'ACTIVE');
SET @rt_a_su_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_a_su_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_a_su_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_a_su_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'Phòng Twin 2 Giường Đơn Tiêu Chuẩn', 'Phòng 2 giường đơn vách gỗ mộc, chăn đệm thổ cẩm êm dịu, không gian yên tĩnh nghỉ ngơi.', 2, 4, 'NO', 18.0, 450000, 'ACTIVE');
SET @rt_a_su_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_a_su_homestay_2, 'SINGLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_a_su_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_a_su_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'Chỗ Ngủ Sàn Gỗ Nhà Truyền Thống A Su', 'Không gian sàn nhà gỗ H\'Mông cổ truyền, thoáng đãng vào ban ngày và ấm áp vào ban đêm.', 1, 15, 'NO', 60.0, 120000, 'ACTIVE');
SET @rt_a_su_homestay_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_a_su_homestay_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_a_su_homestay_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_a_su_homestay_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Wind's Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Wind\'s Homestay', '0339817462', 'Đồi Mâm Xôi, Mù Cang Chải', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0339817462', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Wind\'s Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('wind-s-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Wind\'s Homestay' ORDER BY id DESC LIMIT 1),
  'Wind\'s Homestay', 'wind\'s homestay', 'Wi-Fi miễn phí, phục vụ ăn uống đặc sản, quầy bar, bãi đỗ xe riêng, dịch vụ lửa trại, múa xòe/múa sạp',
  @rg_mu_cang_chai, 'Đồi Mâm Xôi, Mù Cang Chải', 300000, 800000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.facebook.com/dinhho21/', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.848800, 104.091900);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'PHONE', '0339817462', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/uiiyHmXmWGQ9eCXM6', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'PRO', 'Phải đi bộ/xe ôm leo dốc tầm 20-30 phút từ chân đồi lên nếu không quen đi đường đèo dốc, tiện nghi ở mức cơ bản', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'CON', 'Có thể đông, ồn và phụ thuộc mùa lúa', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'TIP', 'Nằm ngay gần khu vực Đồi Mâm Xôi, lộng gió và trong lành. Bạn có thể dậy lúc 5:00 sáng tản bộ lên đỉnh Mâm Xôi đón những tia nắng đầu tiên chiếu rọi giọt sương trên hạt lúa óng vàng.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho wind-s-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_wind_s_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_wind_s_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='FIREPLACE'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'Bungalow Gỗ Riêng View Mâm Xôi', 'Bungalow mộc mạc vách thông, ban công lộng gió ngắm đồi Mâm Xôi nổi tiếng, vệ sinh riêng khép kín.', 2, 4, 'YES', 22.0, 750000, 'ACTIVE');
SET @rt_wind_s_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_wind_s_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_wind_s_homestay_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_wind_s_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_wind_s_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'Phòng Dorm Nhà Sàn Săn Gió', 'Khu đệm sàn tập thể cao ráo, chăn ấm đệm dày, rèm ngăn che riêng tư từng giường.', 1, 16, 'NO', 70.0, 150000, 'ACTIVE');
SET @rt_wind_s_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_wind_s_homestay_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_wind_s_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_wind_s_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Homestay Chù Chỏ ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Homestay Chù Chỏ', '0832074131', 'Tà Chí Lừ, Púng Luông, Mù Cang Chải (ĐT: 0832074131)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0832074131', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Chù Chỏ' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('homestay-chu-cho', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Chù Chỏ' ORDER BY id DESC LIMIT 1),
  'Homestay Chù Chỏ', 'homestay chu cho', 'Điều hòa, phòng tắm riêng (vòi sen, dép đi trong nhà), ban công view núi, khu ăn uống riêng, ấm đun nước điện, bộ dụng cụ bếp, WiFi miễn phí, bãi đỗ xe riêng miễn phí, bữa sáng kiểu Á, an ninh/an toàn',
  @rg_pung_luong, 'Tà Chí Lừ, Púng Luông, Mù Cang Chải (ĐT: 0832074131)', 630000, 630000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.vacationcottage.com/property/homestay-ch%C3%B9-ch%E1%BB%8F/BC-14820133', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.825100, 104.108500);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'PHONE', '0832074131', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/gCQfooX8gSEe3Qsy8', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'PRO', 'bữa sáng kiểu Á, phòng rẻ, chị chủ người dân tộc chân chất thật thà, nấu ăn ngon', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'CON', 'Đường lên khá nhỏ và dốc — khách được cảnh báo cẩn thận khi lái xe gia đình (ô tô) lên đây', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'TIP', 'Thích hợp cho cả gia đình hoặc nhóm bạn 6 - 10 người bao trọn nguyên căn nhà gỗ 4 phòng ngủ tại Púng Luông. Có gian bếp đầy đủ xoong nồi, bếp gas và gia vị để tự nấu nướng theo khẩu vị riêng.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho homestay-chu-cho
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_homestay_chu_cho := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_homestay_chu_cho);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='KITCHEN'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'Nguyên Căn Nhà Gỗ 4 Phòng Ngủ (Whole House)', 'Bao trọn nguyên căn nhà 4 phòng ngủ riêng tư, phòng khách rộng, gian bếp tự nấu nướng và sân ngắm cảnh.', 10, 1, 'YES', 120.0, 2800000, 'ACTIVE');
SET @rt_homestay_chu_cho_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_chu_cho_1, 'DOUBLE', 4);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_chu_cho_1, (SELECT id FROM amenity WHERE code='KITCHEN'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_chu_cho_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_chu_cho_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_chu_cho_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'Phòng Ngủ Riêng Lẻ Trong Căn Gỗ', 'Phòng ngủ riêng sạch sẽ ấm cúng trong căn nhà gỗ, dùng chung phòng khách và ban công lớn.', 2, 4, 'NO', 20.0, 450000, 'ACTIVE');
SET @rt_homestay_chu_cho_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_chu_cho_2, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_chu_cho_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_chu_cho_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Bamboo Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Bamboo Homestay', '0812170480', 'Bản Hấu Đề, La Pán Tẩn, Mù Cang Chải', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0812170480', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Bamboo Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('bamboo-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Bamboo Homestay' ORDER BY id DESC LIMIT 1),
  'Bamboo Homestay', 'bamboo homestay', 'Wi-Fi Internet, phục vụ cơm bản địa theo yêu cầu, khu vực đốt lửa trại/nướng BBQ ngoài trời, hỗ trợ thuê xe máy và dẫn tour trekking bản địa',
  @rg_la_pan_tan, 'Bản Hấu Đề, La Pán Tẩn, Mù Cang Chải', 100000, 400000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.facebook.com/p/Bamboo-Homestay-61556306561022/https://digiticket.vn/blog/homestay-mu-cang-chai/', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.850400, 104.093800);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'PHONE', '0812170480', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/HnJfeuFoXt5SoB4Y8', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'PRO', 'Cơ sở vật chất sạch sẽ, vệ sinh khép kín. Anh chị chủ nhiệt tình, thân thiện, chu đáo (có chú chó đáng yêu), nấu ăn ngon', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'CON', 'Đường dốc hơi khó đi, suối chảy siết nên cẩn thận. Nhiều côn trùng bay vào phòng ban đêm vì sát ruộng', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'TIP', 'Toàn bộ kiến trúc trang trí bằng tre nứa tự nhiên độc đáo, râm mát dịu dàng. Bữa tối dưới ánh đèn vàng ấm cúng bên hiên tre nghe tiếng dế mèn và suối reo là trải nghiệm xoa dịu tâm hồn tuyệt vời.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho bamboo-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_bamboo_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_bamboo_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), (SELECT id FROM amenity WHERE code='FIREPLACE'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'Phòng Riêng Tre Mộc View Đồi Tre', 'Phòng đôi thiết kế tre thủ công tinh xảo, vệ sinh khép kín với vòi sen nước nóng mạnh mẽ.', 2, 3, 'YES', 22.0, 600000, 'ACTIVE');
SET @rt_bamboo_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_bamboo_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bamboo_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bamboo_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'Chỗ Ngủ Đệm Gian Nhà Tre Lớn', 'Gian ngủ sàn tre thoáng mát lạ kỳ, đệm đơn êm ái cùng chăn thổ cẩm dệt tay giữ ấm cực tốt.', 1, 14, 'NO', 65.0, 130000, 'ACTIVE');
SET @rt_bamboo_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_bamboo_homestay_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bamboo_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bamboo_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Sùng A Hờ Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Sùng A Hờ Homestay', '0838921888', 'Tà Chơ, Mù Cang Chải', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0838921888', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Sùng A Hờ Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('sung-a-ho-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Sùng A Hờ Homestay' ORDER BY id DESC LIMIT 1),
  'Sùng A Hờ Homestay', 'sung a ho homestay', 'Phòng tắm riêng (vòi sen, dép, máy sấy tóc), 1 số phòng cách âm, ban công, WiFi miễn phí, bãi đỗ xe riêng miễn phí, bữa sáng buffet/kiểu Á, có quầy cà phê + bar tại chỗ, cho phép mang vật nuôi',
  @rg_mu_cang_chai, 'Tà Chơ, Mù Cang Chải', 170000, 500000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://dsdhome.vn/tin-tuc/homestay-mu-cang-chai.html', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.856200, 104.079200);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'PHONE', '0838921888', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/3xDSdCPuWAxoq9EaA', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'PRO', 'Không gian thanh bình, dân dã, được nhiều bạn trẻ đi phượt lựa chọn (theo ghi chú trước); có tiện ích cà phê/bar riêng — khá hiếm ở nhóm homestay nhỏ', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'CON', 'quy mô nhỏ (3 phòng) nên dễ hết phòng cao điểm', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'TIP', 'Gia đình anh Sùng A Hờ cực kỳ hiếu khách tại Tổ Chờ. Tại đây có món măng rừng luộc chấm chẩm chéo cay nồng và rượu táo mèo thơm phức đãi khách đường xa.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho sung-a-ho-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_sung_a_ho_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_sung_a_ho_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'Phòng Riêng Gia Đình Vách Gỗ', 'Phòng riêng dành cho gia đình 3-4 người, không gian gỗ tự nhiên thoáng sạch, cửa sổ nhìn ra đồi nương.', 4, 3, 'NO', 24.0, 600000, 'ACTIVE');
SET @rt_sung_a_ho_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_sung_a_ho_homestay_1, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_sung_a_ho_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_sung_a_ho_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'Nệm Ngủ Sàn Gỗ Bản H\'Mông', 'Khu ngủ sàn tập thể truyền thống, chăn đệm ấm cúng, trải nghiệm trọn vẹn nét văn hóa vùng cao.', 1, 15, 'NO', 70.0, 120000, 'ACTIVE');
SET @rt_sung_a_ho_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_sung_a_ho_homestay_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_sung_a_ho_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_sung_a_ho_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Suối Kim Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Suối Kim Homestay', '0367765445', 'Cách thị trấn Mù Cang Chải ~18km, sát QL32', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
-- [GHI CHÚ] SĐT 0367765445 đã được dùng để tạo account cho 1 provider khác trong
--   file (nghi ngờ lỗi nhập liệu trùng SĐT giữa 2 homestay khác nhau) ->
--   KHÔNG tạo thêm account cho 'Suối Kim Homestay' để tránh vi phạm UNIQUE
--   KEY account.phone. Provider vẫn được tạo nhưng CHƯA có tài khoản đăng
--   nhập -> cần rà soát/nhập SĐT đúng rồi tạo account thủ công.
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('suoi-kim-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Suối Kim Homestay' ORDER BY id DESC LIMIT 1),
  'Suối Kim Homestay', 'suoi kim homestay', 'Wi-Fi internet, phục vụ ăn uống đặc sản Tây Bắc tại nhà sàn, khoảng sân rộng có chỗ đỗ xe ô tô (từ 4 đến 16 chỗ), không gian thưởng trà ngắm cảnh ngoài hành lang.',
  @rg_tt_mu_cang_chai, 'Cách thị trấn Mù Cang Chải ~18km, sát QL32', 100000, 500000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://sinhtour.vn/homestay-o-mu-cang-chai/', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.819800, 104.114200);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'PHONE', '0367765445', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/R37C2LAoSnfdrLtd6', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'PRO', 'Không gian rộng rãi, đồ ăn nấu ngon, gia đình chủ nhiệt', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'CON', 'Cách khá xa trung tâm thị trấn (~18km, ~30 phút xe máy). Có phản hồi hủy phòng của khách không báo trước', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'TIP', 'Nằm ven quốc lộ 32 gần khu Ngã Ba Kim, bãi đỗ xe thênh thang cho xe ô tô 45 chỗ. Đây là điểm dừng nghỉ chân ăn trưa và lưu trú rất tiện cho các đoàn caravan phượt Tây Bắc.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho suoi-kim-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_suoi_kim_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_suoi_kim_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'Phòng Riêng 2 Giường Tiện Nghi', 'Phòng 2 giường đôi trang bị điều hòa 2 chiều sưởi ấm, vệ sinh khép kín sạch sẽ.', 4, 6, 'YES', 26.0, 650000, 'ACTIVE');
SET @rt_suoi_kim_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_suoi_kim_homestay_1, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_suoi_kim_homestay_1, (SELECT id FROM amenity WHERE code='AIR_CONDITIONING'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_suoi_kim_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_suoi_kim_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'Khu Sàn Gỗ Tập Thể Đoàn Lớn', 'Sàn gỗ diện tích lớn có thể ngăn thành các cụm riêng biệt, phục vụ đoàn khách đông người.', 1, 30, 'NO', 130.0, 110000, 'ACTIVE');
SET @rt_suoi_kim_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_suoi_kim_homestay_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_suoi_kim_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_suoi_kim_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Bluehome Homestay (Khau Phạ) ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Bluehome Homestay (Khau Phạ)', '0865186456', 'Bản Ít Thái, xã Cao Phạ, Mù Cang Chải, Yên Bái (gần điểm nhảy dù đèo Khau Phạ, cách trung tâm thị trấn ~19,9km)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0865186456', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Bluehome Homestay (Khau Phạ)' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('bluehome-homestay-khau-pha', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Bluehome Homestay (Khau Phạ)' ORDER BY id DESC LIMIT 1),
  'Bluehome Homestay (Khau Phạ)', 'bluehome homestay (khau pha)', 'WiFi miễn phí, bãi đỗ xe an toàn, dịch vụ phòng, lễ tân 24/24, tắm khoáng nóng/bồn tắm ngoài trời miễn phí, nhà hàng nguyên liệu tươi tại chỗ, sân hiên riêng mỗi phòng, ấm đun nước điện, bàn ăn, giá treo đồ, máy sấy tóc, đồ vệ sinh cá nhân miễn phí, bữa sáng kiểu Á',
  @rg_cao_pha, 'Bản Ít Thái, xã Cao Phạ, Mù Cang Chải, Yên Bái (gần điểm nhảy dù đèo Khau Phạ, cách trung tâm thị trấn ~19,9km)', 500000, 500000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://vietdovetravel.com/3-best-homestays-in-mu-cang-chai-with-amazing-views-2026-guide/', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.801200, 104.178900);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'PHONE', '0865186456', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/i6qHcWjUzYQqbCCE7', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'PRO', 'Trải nghiệm văn hóa Thái đậm nét (cơm nhà, nước lá rừng, khèn Mông); có dịch vụ tắm khoáng nóng + văn nghệ dân tộc miễn phí — hiếm thấy ở các homestay khác đã tra; vị trí thuận lợi tới nhiều điểm tham quan (đèo Khau Phạ, ruộng bậc thang Tú Lệ, La Pán Tẩn)', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'CON', 'Có thể ồn vào ban đêm khi homestay kín phòng, Cách trung tâm khá xa (~20km)', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'TIP', 'Điểm săn mây đỉnh đèo Khau Phạ cực phẩm. Bạn có thể ngắm dù lượn rực rỡ sắc màu bay lượn trên thung lũng ngay từ ban công homestay. Đêm xuống nhớ nhâm nhi tách trà gừng nóng ngắm sao trời bao la.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho bluehome-homestay-khau-pha
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_bluehome_homestay_khau_pha := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_bluehome_homestay_khau_pha);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='FIREPLACE'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'Bungalow Săn Mây Đỉnh Đèo Khau Phạ', 'Bungalow riêng tư trên vách núi, ban công ngắm biển mây cuồn cuộn thung lũng lúa, vệ sinh khép kín cao cấp.', 2, 4, 'YES', 25.0, 900000, 'ACTIVE');
SET @rt_bluehome_homestay_khau_pha_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_bluehome_homestay_khau_pha_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bluehome_homestay_khau_pha_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bluehome_homestay_khau_pha_1, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bluehome_homestay_khau_pha_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bluehome_homestay_khau_pha_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'Phòng Quadruple 4 Người View Đèo', 'Phòng 4 người rộng rãi 2 giường lớn, ban công kính nhìn thẳng bãi cất cánh dù lượn Khau Phạ.', 4, 3, 'YES', 32.0, 1100000, 'ACTIVE');
SET @rt_bluehome_homestay_khau_pha_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_bluehome_homestay_khau_pha_2, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bluehome_homestay_khau_pha_2, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bluehome_homestay_khau_pha_2, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bluehome_homestay_khau_pha_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bluehome_homestay_khau_pha_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'Chỗ Ngủ Sàn Gỗ Đèo Gió Cộng Đồng', 'Chỗ ngủ đệm sàn ấm áp, chăn bông lông vũ dày dặn, gió đèo thổi rì rào ngoài khung cửa.', 1, 16, 'NO', 70.0, 160000, 'ACTIVE');
SET @rt_bluehome_homestay_khau_pha_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_bluehome_homestay_khau_pha_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bluehome_homestay_khau_pha_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_bluehome_homestay_khau_pha_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Pú Nhu Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Pú Nhu Homestay', '0941584153', 'Bản Pú Nhu Háng Sung, xã La Pán Tẩn, Mù Cang Chải, Yên Bái', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0941584153', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Pú Nhu Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('pu-nhu-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Pú Nhu Homestay' ORDER BY id DESC LIMIT 1),
  'Pú Nhu Homestay', 'pu nhu homestay', 'WiFi miễn phí toàn khu, bãi đỗ xe (tại chỗ + gần đó), lễ tân 24/24 (tiếng Anh + Việt), dọn phòng hàng ngày, giữ hành lý, ấm đun nước điện mọi phòng, phòng cách âm, khu hút thuốc riêng (toàn khu không hút thuốc trong phòng), máy sấy tóc + đồ vệ sinh cá nhân ở 1 số phòng',
  @rg_la_pan_tan, 'Bản Pú Nhu Háng Sung, xã La Pán Tẩn, Mù Cang Chải, Yên Bái', 432000, 432000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://digiticket.vn/blog/homestay-mu-cang-chai/', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.849800, 104.096500);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'PHONE', '0941584153', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/XZFApebXWu7kTFhP9', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'PRO', 'Quy mô lớn (29 phòng) nên khả năng nhận khách cao hơn hẳn các homestay nhỏ khác', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'CON', 'Mới mở nên mùa cao điểm thường xuyên kín phòng — khách cần đặt trước 2–3 tuầnKhông có dịch vụ đưa đón sân bay (khác với nhiều homestay khác có hỗ trợ); là 1 trong số ít nơi ghi rõ "không nhận thú cưng" — cần lưu ý nếu khách mang theo pet', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'TIP', 'Nằm ngay gần Thác Pú Nhu hoang sơ mát lạnh. Đi bộ 15 phút là đến chân thác nước tung bọt trắng xóa giữa rừng đại ngàn. Homestay có khuôn viên rộng rãi, có hồ câu cá và vườn rau hữu cơ.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho pu-nhu-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_pu_nhu_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_pu_nhu_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'Phòng Riêng Điều Hòa View Thác Nước', 'Phòng riêng tiện nghi có điều hòa nhiệt độ 2 chiều, vệ sinh khép kín hiện đại, nghe tiếng suối reo êm dịu.', 2, 8, 'YES', 24.0, 600000, 'ACTIVE');
SET @rt_pu_nhu_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_pu_nhu_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_pu_nhu_homestay_1, (SELECT id FROM amenity WHERE code='AIR_CONDITIONING'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_pu_nhu_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_pu_nhu_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'Phòng Gia Đình 2 Giường Lớn Pú Nhu', 'Phòng rộng cho 4 người lớn, không gian thoáng đãng đón trọn bầu không khí trong lành của núi rừng.', 4, 6, 'YES', 32.0, 850000, 'ACTIVE');
SET @rt_pu_nhu_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_pu_nhu_homestay_2, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_pu_nhu_homestay_2, (SELECT id FROM amenity WHERE code='AIR_CONDITIONING'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_pu_nhu_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_pu_nhu_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'Gian Nhà Sàn Tập Thể Pú Nhu', 'Khu nhà sàn quy mô lớn phục vụ đoàn khách đông, đệm chiếu sạch tinh, bình tắm nóng lạnh dồi dào.', 1, 30, 'NO', 120.0, 120000, 'ACTIVE');
SET @rt_pu_nhu_homestay_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_pu_nhu_homestay_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_pu_nhu_homestay_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_pu_nhu_homestay_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Dòng Suối Hmong Homestay & Bungalow ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Dòng Suối Hmong Homestay & Bungalow', '0354727980', 'Chế Cu Nha, Mù Cang Chải (cách trung tâm thị trấn ~4km, bên bờ suối)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0354727980', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Dòng Suối Hmong Homestay & Bungalow' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('dong-suoi-hmong-homestay-bungalow', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Dòng Suối Hmong Homestay & Bungalow' ORDER BY id DESC LIMIT 1),
  'Dòng Suối Hmong Homestay & Bungalow', 'dong suoi hmong homestay & bungalow', 'Điều hòa, máy sấy tóc, đồ vệ sinh cá nhân, ấm đun nước điện, TV màn hình phẳng, phòng khách riêng (ở bungalow), sân thượng đón nắng, phòng họp/hội nghị (phù hợp nhóm công tác), sân picnic, khu ăn ngoài trời, đưa đón sân bay',
  @rg_che_cu_nha, 'Chế Cu Nha, Mù Cang Chải (cách trung tâm thị trấn ~4km, bên bờ suối)', 150000, 550000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.booking.com/homestay/city/vn/mu-cang-chai.html', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.869500, 104.051800);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'PHONE', '0354727980', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/raxv3F2gSDrxFY3w9', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'PRO', 'Phòng ốc sạch sẽ. Ông chủ người pháp, bà chủ người việt, homestay nằm kế bên con suối, sau lưng là ruộng bậc thang . Bữa tối được khen đặc biệt xuất sắc, món đặc trưng (mứt xoài-chanh dây, nem) được nhắc nhiều lần; chủ nhà am hiểu, hỗ trợ tour/trekking/xe máy có hướng dẫn địa phương; giờ yên tĩnh rõ ràng (22h-5h)', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'CON', 'Đồ ăn giá cao hơn bên ngoài. Không nhận tiệc độc thân/hen party; yêu cầu thanh toán trước qua chuyển khoản trước khi nhận phòng (khác với phần lớn homestay khác chỉ cần đặt cọc/thanh toán tại chỗ)', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'TIP', 'Homestay nằm cạnh con suối trong vắt róc rách suốt ngày đêm tại Chế Cu Nha. Trẻ con và người lớn đều rất thích lội suối bắt ốc, ngâm chân thư giãn sau một ngày dài leo đồi chụp ảnh.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho dong-suoi-hmong-homestay-bungalow
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_dong_suoi_hmong_homestay_bungalow := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_dong_suoi_hmong_homestay_bungalow);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'Bungalow Ven Suối Hmong Nghỉ Dưỡng', 'Căn bungalow gỗ nằm sát bờ suối, hiên ngồi uống trà thư giãn nghe suối chảy, vệ sinh khép kín cao cấp.', 2, 5, 'YES', 26.0, 850000, 'ACTIVE');
SET @rt_dong_suoi_hmong_homestay_bungalow_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'Phòng Gia Đình 2 Giường Đôi View Suối', 'Phòng gia đình ấm cúng, cửa sổ lớn nhìn ra con suối và nương ngô xanh mướt, tiện nghi đầy đủ.', 4, 4, 'YES', 32.0, 1100000, 'ACTIVE');
SET @rt_dong_suoi_hmong_homestay_bungalow_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_2, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_2, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'Chỗ Ngủ Đệm Gian Sàn Tiếng Suối Reo', 'Gian ngủ nhà sàn gỗ mộc mạc, gió suối mát lành ru giấc ngủ ngon lành.', 1, 15, 'NO', 70.0, 140000, 'ACTIVE');
SET @rt_dong_suoi_hmong_homestay_bungalow_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_3, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_dong_suoi_hmong_homestay_bungalow_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Mù Cang Chải Dream House ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Mù Cang Chải Dream House', '0786166222', 'Ngã Ba Kim', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0786166222', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mù Cang Chải Dream House' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('mu-cang-chai-dream-house', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mù Cang Chải Dream House' ORDER BY id DESC LIMIT 1),
  'Mù Cang Chải Dream House', 'mu cang chai dream house', 'WiFi miễn phí, nhà hàng + quầy bar tại chỗ, sân vườn, sân thượng đón nắng, tủ lạnh, phòng tắm có vòi xịt vệ sinh + đồ vệ sinh cá nhân + máy sấy tóc, lễ tân 24/24, bữa sáng buffet/gọi món/kiểu Á,',
  @rg_mu_cang_chai, 'Ngã Ba Kim', 800000, 800000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://atravel.vn/homestay-mu-cang-chai', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.821900, 104.111800);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'PHONE', '0786166222', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/945DKvhca8KtYo66A', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'PRO', 'Có 1 review 10/10: khách khen "cảm thấy như ở nhà", nhân viên chu đáo giữ ấm dù thời tiết lạnh bất thường hôm đó', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'CON', 'Chưa có thông tin về hạn chế', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'TIP', 'Những căn cabin gỗ chữ A xinh xắn tọa lạc tại Ngã Ba Kim, góc check-in siêu \'nghệ\' với nhiều góc sống ảo lãng mạn. Rất phù hợp cho các bạn trẻ và cặp đôi đi tuần trăng mật.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho mu-cang-chai-dream-house
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_mu_cang_chai_dream_house := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_mu_cang_chai_dream_house);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'Cabin Gỗ Chữ A Dream House', 'Căn cabin gỗ hình chữ A ấm cúng, thiết kế gác lửng độc đáo, có ban công ngắm núi rừng mộng mơ.', 2, 4, 'YES', 24.0, 700000, 'ACTIVE');
SET @rt_mu_cang_chai_dream_house_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_chai_dream_house_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_dream_house_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_dream_house_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_dream_house_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'Phòng Riêng Cabin 2 Phòng Ngủ Nhóm', 'Căn cabin 2 phòng ngủ riêng biệt, phòng khách chung xinh xắn, thích hợp nhóm 4-5 bạn trẻ.', 4, 2, 'YES', 38.0, 1200000, 'ACTIVE');
SET @rt_mu_cang_chai_dream_house_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_mu_cang_chai_dream_house_2, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_dream_house_2, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_dream_house_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_mu_cang_chai_dream_house_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Súa Su Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Súa Su Homestay', '0866554428', 'Đèo Khau Phạ, Mù Cang Chải, Khu vực Tú Lệ', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0866554428', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Súa Su Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('sua-su-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Súa Su Homestay' ORDER BY id DESC LIMIT 1),
  'Súa Su Homestay', 'sua su homestay', 'Chỗ đỗ xe máy và ô tô rộng rãi.Phục vụ ăn uống tại chỗ với các món đặc sản Tây Bắc (gà đồi, lợn bản, xôi nếp Tú Lệ) theo yêu cầu.Hỗ trợ tư vấn lịch trình chi tiết, thuê xe ôm bản địa dẫn đường đi trekking.',
  @rg_tu_le, 'Đèo Khau Phạ, Mù Cang Chải, Khu vực Tú Lệ', 100000, 450000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://vietdovetravel.com/3-best-homestays-in-mu-cang-chai-with-amazing-views-2026-guide/', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.803500, 104.174200);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'PHONE', '0866554428', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/aFH3viSqy2SBXth29', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'PRO', 'Nơi ở sạch sẽ, view ra thung lũng. Anh chủ thân thiện dễ', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'CON', 'Phòng được mô tả là đơn giản, chưa quá đủ thiết bị bàn ghế', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'TIP', 'Nằm ngay khu vực Đèo Khau Phạ, bao bọc bởi đồi thông reo và ruộng bậc thang tầng tầng lớp lớp. Khí hậu mát rượi, buổi chiều sương mù phủ trắng bảng lảng như chốn tiên cảnh.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho sua-su-homestay
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_sua_su_homestay := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_sua_su_homestay);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), (SELECT id FROM amenity WHERE code='FIREPLACE'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'Bungalow Vách Kính View Đèo Khau Phạ', 'Bungalow vách kính chịu lực nhìn thẳng thung lũng lúa, sáng thức dậy thấy mây trôi trước mặt, vệ sinh khép kín.', 2, 4, 'YES', 24.0, 800000, 'ACTIVE');
SET @rt_sua_su_homestay_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_sua_su_homestay_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_sua_su_homestay_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_sua_su_homestay_1, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_sua_su_homestay_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_sua_su_homestay_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'Chỗ Ngủ Sàn Gỗ Không Gian Mở', 'Nhà sàn gỗ cấu trúc mở thoáng đãng, chăn bông ấm áp, mang đậm nét sinh hoạt cộng đồng vùng cao.', 1, 20, 'NO', 90.0, 130000, 'ACTIVE');
SET @rt_sua_su_homestay_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_sua_su_homestay_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_sua_su_homestay_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_sua_su_homestay_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Homestay Tư Nguyệt ----
-- [FILE+SUY LUẬN] Tên homestay trùng khớp tuyệt đối với 1 bản ghi đã có ở
--   sheet 'Homestay' (chính thống) -> coi là cùng 1 nơi, dùng lại Provider
--   và gán master_place_id (BR-96) thay vì tạo Provider/Account mới.
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('homestay-tu-nguyet-2', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Tư Nguyệt' ORDER BY id DESC LIMIT 1),
  'Homestay Tư Nguyệt', 'homestay tu nguyet', 'Mở cửa 24h, TV, tủ lạnh, bình nước nóng/lạnh, cho thuê xe máy, đặt tour/vé máy bay, đốt lửa trại + giao lưu văn nghệ dân tộc, ẩm thực dân tộc tại chỗ, bãi đỗ xe an ninh',
  @rg_tt_mu_cang_chai, 'Bản Thái, thị trấn Mù Cang Chải', 120000, 250000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://ticotravel.com.vn/homestay-mu-cang-chai/', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.857600, 104.085100);
UPDATE place SET master_place_id = @place_homestay_tu_nguyet WHERE slug='homestay-tu-nguyet-2';  -- BR-96: merge bản ghi trùng (xem mục 3+4)
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'PHONE', '0813772213', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/YuxQEGbChk2wYqXbA', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'PRO', 'Đã kinh doanh nhiều năm', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'CON', 'Chính sách hủy khá chặt: hủy trong vòng 6 ngày trước check-in bị tính phí 100%; dịp lễ Tết không được hủy/đổi/hoàn dưới mọi hình thức — cần lưu ý khi tư vấn khách đặt dịp cao điểm', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'TIP', 'Cơ sở 2 của nhà sàn Tư Nguyệt với quy mô lớn hơn, chuyên phục vụ các đoàn khách du lịch gia đình và lữ hành. Đội ngũ nhân viên nhanh nhẹn, chu đáo, hỗ trợ đặt xe ôm tham quan các điểm.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho homestay-tu-nguyet-2
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_homestay_tu_nguyet_2 := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_homestay_tu_nguyet_2);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), (SELECT id FROM amenity WHERE code='BBQ_AREA'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'Phòng Riêng 2 Giường Tiêu Chuẩn Cao', 'Phòng riêng khép kín tiện nghi, trang bị đệm dày dặn, bình nước nóng dồi dào, view cánh đồng thung lũng.', 4, 10, 'YES', 25.0, 600000, 'ACTIVE');
SET @rt_homestay_tu_nguyet_2_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_tu_nguyet_2_1, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tu_nguyet_2_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tu_nguyet_2_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'Gian Ngủ Sàn Tập Thể Quy Mô Lớn', 'Hệ thống 3 gian sàn gỗ rộng lớn, chăn đệm sạch sẽ tiêu chuẩn, phục vụ cùng lúc lên đến 60 khách.', 1, 40, 'NO', 180.0, 120000, 'ACTIVE');
SET @rt_homestay_tu_nguyet_2_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_homestay_tu_nguyet_2_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tu_nguyet_2_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_homestay_tu_nguyet_2_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): Indigenous Homestay – Trek & Local Life ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Indigenous Homestay – Trek & Local Life', '0355014012', 'Bản Hấu Đề, xã La Pán Tẩn, Mù Cang Chải (cách trung tâm thị trấn ~12km về phía đông nam)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0355014012', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Indigenous Homestay – Trek & Local Life' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('indigenous-homestay-trek-local-life', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Indigenous Homestay – Trek & Local Life' ORDER BY id DESC LIMIT 1),
  'Indigenous Homestay – Trek & Local Life', 'indigenous homestay – trek & local life', 'WiFi miễn phí, phòng tắm riêng, bàn làm việc, bãi đỗ xe (miễn phí + có valet), khu gửi xe đạp, sân thượng đón nắng, sân vườn, lò sưởi ngoài trời, khu picnic, phòng chơi trong nhà, đưa đón sân bay, nhà hàng phục vụ chay/vegan/không gluten/không sữa',
  @rg_la_pan_tan, 'Bản Hấu Đề, xã La Pán Tẩn, Mù Cang Chải (cách trung tâm thị trấn ~12km về phía đông nam)', 300000, 300000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://digiticket.vn/blog/homestay-mu-cang-chai/', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.847100, 104.094100);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'PHONE', '0355014012', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/Y2RLdXETXeDzuHiFA', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'PRO', 'Chủ nhà nhiệt tình, món ăn ngon, có tour trekking/xe đạp đi kèm;', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'CON', 'Hơi khó tiếp cận bằng xe máy (1 khách khuyên nên gọi trước cho chủ nhà để được chỉ đường từ đường chính); vị trí xa trung tâm ~12km', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'TIP', 'Trải nghiệm văn hóa H\'Mông chân thực nhất: sinh hoạt cùng gia đình 6 người của chủ nhà tại bản Hấu Đề (La Pán Tẩn). Bạn sẽ được cùng gia đình nấu mèn mén, hái rau dớn trên nương và đi trekking theo những lối mòn hoang sơ không có khách du lịch.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho indigenous-homestay-trek-local-life
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_indigenous_homestay_trek_local_life := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_indigenous_homestay_trek_local_life);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='FIREPLACE'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'Phòng Riêng Gia Đình Vách Gỗ Bản Địa', 'Phòng gỗ mộc ấm cúng giữa bản làng bình yên, cửa sổ nhìn ra đồi ngô và đàn bò thả tự nhiên, vệ sinh sạch sẽ.', 3, 3, 'YES', 22.0, 450000, 'ACTIVE');
SET @rt_indigenous_homestay_trek_local_life_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_indigenous_homestay_trek_local_life_1, 'DOUBLE', 1);
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_indigenous_homestay_trek_local_life_1, 'SINGLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_indigenous_homestay_trek_local_life_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_indigenous_homestay_trek_local_life_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'Chỗ Ngủ Đệm Ấm Sinh Hoạt Gia Đình Bản Hấu Đề', 'Chỗ ngủ đệm êm ái trên sàn gỗ nhà người H\'Mông truyền thống, không gian tĩnh lặng tuyệt đối.', 1, 10, 'NO', 50.0, 150000, 'ACTIVE');
SET @rt_indigenous_homestay_trek_local_life_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_indigenous_homestay_trek_local_life_2, 'FLOOR_MATTRESS', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_indigenous_homestay_trek_local_life_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_indigenous_homestay_trek_local_life_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ---- Homestay (reviewer): GARRYA Mù Cang Chải ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('GARRYA Mù Cang Chải', '02163878989', 'Bản Pú Nhu, xã Púng Luông, Mù Cang Chải (sát điểm ngắm Mâm Xôi)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('02163878989', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='GARRYA Mù Cang Chải' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes, latitude, longitude) VALUES ('garrya-mu-cang-chai', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='GARRYA Mù Cang Chải' ORDER BY id DESC LIMIT 1),
  'GARRYA Mù Cang Chải', 'garrya mu cang chai', 'Hồ bơi ngoài trời + trong nhà, spa đầy đủ dịch vụ, phòng gym miễn phí, 2 nhà hàng + 2 quầy bar/lounge + 1 quán cà phê, dịch vụ đưa đón sân bay, minibar, két an toàn, bồn tắm riêng (ở villa), điều hòa, TV cáp, đưa đón taxi nội thành, giặt là, hồ bơi riêng ở villa',
  @rg_pung_luong, 'Bản Pú Nhu, xã Púng Luông, Mù Cang Chải (sát điểm ngắm Mâm Xôi)', NULL, NULL,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.garrya.com/en/destinations/mu-cang-chai', 'VERIFIED', '2026-09-16', JSON_OBJECT(), 21.824200, 104.109800);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'PHONE', '02163878989', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/K2rVWVMjv3TBsvc2A', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'PRO', 'Điểm 10/10 và 9.8/10 trên nhiều nền tảng; quản lý phản hồi trực tiếp từng review chi tiết, kể cả review chê, mức độ chuyên nghiệp CSKH cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'CON', 'phân khúc giá cao, không đại diện cho trải nghiệm \'homestay\' phổ thông của đa số khách mục tiêu nền tảng. Phí phát sinh cao: giường phụ ~1.757.700đ/người/đêm, xe đưa đón Hà Nội riêng ~2.700.000đ/lượt — chi phí tổng thể có thể vượt xa mức giá phòng niêm yết nếu đi gia đình đông người', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'TIP', 'Khu nghỉ dưỡng sang trọng bậc nhất Mù Cang Chải theo tiêu chuẩn Banyan Group quốc tế. Nằm sát đồi Mâm Xôi với hồ bơi vô cực view ruộng bậc thang tráng lệ. Hãy thử trải nghiệm liệu trình spa thảo dược Dao đỏ và tiệc trà chiều hoàng hôn bên hồ bơi.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
-- Chính sách huỷ phòng & Hồ sơ homestay cho garrya-mu-cang-chai
INSERT INTO cancellation_policy (place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 1, 'Chính sách huỷ tiêu chuẩn linh hoạt', 24, 'NO_REFUND', 'Miễn phí huỷ phòng trước 24 giờ so với giờ nhận phòng (14:00 ngày nhận). Huỷ muộn sau thời gian này không hoàn tiền.');
SET @policy_garrya_mu_cang_chai := LAST_INSERT_ID();
INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, current_policy_id) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), '14:00:00', '12:00:00', 'Không hút thuốc trong phòng kín; giữ trật tự chung sau 22:30; tôn trọng văn hoá bản địa và trang phục khi vào bản làng.', @policy_garrya_mu_cang_chai);
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='AIR_CONDITIONING'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='BATHTUB'), 'YES');
INSERT IGNORE INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'Deluxe Room King View Ruộng Bậc Thang', 'Phòng Deluxe sang trọng chuẩn quốc tế với 1 giường King siêu lớn, ban công riêng nhìn bao quát thung lũng Mâm Xôi, bồn tắm nằm cao cấp.', 2, 8, 'YES', 45.0, 3800000, 'ACTIVE');
SET @rt_garrya_mu_cang_chai_1 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_garrya_mu_cang_chai_1, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_1, (SELECT id FROM amenity WHERE code='BATHTUB'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_1, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_1, (SELECT id FROM amenity WHERE code='AIR_CONDITIONING'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_1, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_1, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_1, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'Grand Deluxe King Suite Ban Công Panorama', 'Suite đẳng cấp với phòng ngủ và phòng khách tách biệt, nội thất tre nghệ thuật, minibar và bồn tắm ngâm thảo dược view núi.', 3, 6, 'YES', 60.0, 5500000, 'ACTIVE');
SET @rt_garrya_mu_cang_chai_2 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_garrya_mu_cang_chai_2, 'DOUBLE', 1);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_2, (SELECT id FROM amenity WHERE code='BATHTUB'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_2, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_2, (SELECT id FROM amenity WHERE code='AIR_CONDITIONING'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_2, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_2, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_2, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'Pool Villa 2 Phòng Ngủ Hồ Bơi Riêng', 'Biệt thự nghỉ dưỡng đỉnh cao có hồ bơi nước ấm riêng biệt ngoài trời, 2 phòng ngủ lớn, quản gia phục vụ chu đáo tận tâm.', 6, 2, 'YES', 120.0, 9500000, 'ACTIVE');
SET @rt_garrya_mu_cang_chai_3 := LAST_INSERT_ID();
INSERT INTO room_bed (room_type_id, bed_type, quantity) VALUES (@rt_garrya_mu_cang_chai_3, 'DOUBLE', 2);
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_3, (SELECT id FROM amenity WHERE code='BATHTUB'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_3, (SELECT id FROM amenity WHERE code='BALCONY'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_3, (SELECT id FROM amenity WHERE code='AIR_CONDITIONING'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_3, (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_3, (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO room_amenity (room_type_id, amenity_id, value) VALUES (@rt_garrya_mu_cang_chai_3, (SELECT id FROM amenity WHERE code='WIFI'), 'YES');

-- ============================================================================
-- 6. ĐIỂM ĐẾN (place, kind=ATTRACTION) — sheet 'Điểm đến'. Không có Provider
--    (attraction không bắt buộc thuộc Provider theo BR-06, chỉ Homestay mới
--    bắt buộc). provider_id để NULL.
-- ============================================================================

-- ---- Điểm đến: La Pán Tẩn ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('la-pan-tan', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'La Pán Tẩn', 'la pan tan', '-Một trong những khu vực ruộng bậc thang đẹp và nổi tiếng nhất Mù Cang Chải.
-Nổi bật với những thửa ruộng hình mâm xôi.
-Đẹp nhất vào mùa lúa chín, thường khoảng tháng 9–10.
-Rất phù hợp để săn ảnh bình minh/hoàng hôn.', @rg_la_pan_tan,
  'Đồi Mâm Xôi nằm tại La Pán Tẩn, cách trung tâm Mù Cang Chải hơn 8 km', NULL, NULL, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.850120, 104.092100);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan'), 'TIP', 'Xu hướng khách: Cao điểm: cuối tháng 9 – tháng 10.
Nhóm khách nổi bật về hành vi: chụp ảnh, check-in, ngắm ruộng bậc thang.
Mùa nước đổ tháng 5–6 cũng có sức hút, nhưng thấp hơn mùa vàng theo các nguồn du lịch.
Chưa có số liệu công khai về giới tính và độ tuổi.', TRUE);

-- ---- Điểm đến: Đồi Mâm Xôi ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('doi-mam-xoi', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Đồi Mâm Xôi', 'doi mam xoi', 'Biểu tượng du lịch của Mù Cang Chải.
Nằm tại khu vực La Pán Tẩn.
Có thể đi xe lên gần khu vực tham quan rồi đi bộ/xe trung chuyển tùy thời điểm.
Đây gần như là điểm không nên bỏ qua nếu lần đầu đến Mù Cang Chải.', @rg_mu_cang_chai,
  NULL, 30000, 30000, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.848500, 104.091200);

-- ---- Điểm đến: Chế Cu Nha ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('che-cu-nha', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Chế Cu Nha', 'che cu nha', 'Một trong những vùng ruộng bậc thang đẹp nhất.
Ít cảm giác "điểm du lịch đại trà" hơn một số điểm trung tâm.
Đường lên có nhiều đoạn dốc, nhưng cảnh núi và ruộng rất đẹp.', @rg_che_cu_nha,
  'Khu vực Chế Cu Nha, Mù Cang Chải, Lào Cai', NULL, NULL, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.871200, 104.048900);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='che-cu-nha'), 'TIP', 'Xu hướng khách: xu hướng sản phẩm của Chế Cu Nha đang chuyển từ chỉ ngắm cảnh sang du lịch cộng đồng + văn hóa + trải nghiệm.', TRUE);

-- ---- Điểm đến: Dế Xu Phình ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('de-xu-phinh', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Dế Xu Phình', 'de xu phinh', 'Nổi tiếng với những thửa ruộng bậc thang trải rộng trên sườn núi.
Có nhiều góc chụp toàn cảnh.
Có thể kết hợp với La Pán Tẩn trong cùng một buổi.', @rg_de_xu_phinh,
  'Khu vực Dế Xu Phình, Mù Cang Chải, Lào Cai', NULL, NULL, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.889500, 104.032100);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='de-xu-phinh'), 'TIP', 'Xu hướng khách: Về xu hướng, điểm này phù hợp với:

nhiếp ảnh;
ngắm ruộng bậc thang;
trekking;
trải nghiệm bản làng;
khách muốn tìm không gian ít đô thị hóa hơn.
Mùa đẹp        🌾 Tháng 9–10
Mùa nước đổ        🌱 Tháng 5–6', TRUE);

-- ---- Điểm đến: Đèo Khau Phạ ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('deo-khau-pha', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Đèo Khau Phạ', 'deo khau pha', 'Một trong tứ đại đỉnh đèo của Tây Bắc.
Cung đường nằm giữa Tú Lệ và Mù Cang Chải.
Có thể ngắm toàn cảnh núi rừng và thung lũng.
Là nơi tổ chức dù lượn mùa vàng vào một số thời điểm.', @rg_cao_pha,
  'Khu vực Cao Phạ – Tú Lệ, trên QL32', 1500000, 3000000, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.798500, 104.181200);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='deo-khau-pha'), 'TIP', 'Xu hướng khách: Ngoài ngắm cảnh, Khau Phạ nổi bật với hoạt động dù lượn "Bay trên mùa vàng", cho phép du khách nhìn xuống thung lũng Lìm Mông trong mùa lúa chín.', TRUE);

-- ---- Điểm đến: Thung lũng Tú Lệ ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('thung-lung-tu-le', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Thung lũng Tú Lệ', 'thung lung tu le', 'Nằm trên cung đường Hà Nội → Mù Cang Chải.
Nổi tiếng với ruộng lúa, núi và bản làng người Thái.
Có thể kết hợp nghỉ 1 đêm ở Tú Lệ nếu muốn chuyến đi thong thả.', @rg_tu_le,
  'Thung lũng Tú Lệ, khu vực Văn Chấn', 0, 0, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.765400, 104.221500);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='thung-lung-tu-le'), 'TIP', 'Xu hướng khách: Điểm này nổi bật với:

ruộng bậc thang;
văn hóa người Thái;
nếp Tú Lệ;
cốm;
thung lũng Tú Lệ;
Lìm Mông – Lìm Thá', TRUE);

-- ---- Điểm đến: Thác Pú Nhu ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('thac-pu-nhu', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Thác Pú Nhu', 'thac pu nhu', 'Thác nước nằm giữa núi rừng.
Không khí mát, khá thích hợp để nghỉ chân sau khi đi các điểm ruộng bậc thang.
Có đường đi bộ ngắn vào thác.', @rg_la_pan_tan,
  'Bản Pú Nhu, khu vực La Pán Tẩn
Khoảng 10 km từ trung tâm Mù Cang Chải', 0, 0, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.843200, 104.098700);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='thac-pu-nhu'), 'TIP', 'Xu hướng khách: Khám phá thiên nhiên
Không gian rừng núi, nước và đá tạo cảm giác mát mẻ, tách khỏi khu vực đông khách.

📸 Chụp ảnh
Thác nhiều tầng và vách đá tạo góc chụp khác với các điểm ruộng bậc thang.

🥾 Đi bộ nhẹ / khám phá
Không phải dạng trekking dài như Sống lưng khủng long; phù hợp với khách muốn trải nghiệm thiên nhiên nhưng không muốn vận động quá nặng.

👨‍👩‍👧‍👦 Đi theo nhóm/gia đình
Đường tiếp cận tương đối ngắn nên có thể phù hợp với nhóm gia đình hoặc nhóm bạn, tùy điều kiện thời tiết và đường thực tế
Tháng 5–6        💧 Nước nhiều, kết hợp mùa nước đổ
Tháng 7–8        🌿 Xanh mát, thích hợp tránh nóng
Tháng 9–10        🌾 Có thể kết hợp mùa vàng và tham quan thác
Sau mưa lớn        💦 Thác có thể mạnh và đẹp hơn nhưng cần chú ý an toàn', TRUE);

-- ---- Điểm đến: Thác Mơ ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('thac-mo', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Thác Mơ', 'thac mo', 'Một điểm thiên nhiên khác ở Mù Cang Chải.
Có dòng nước chảy giữa núi rừng, cảnh khá nguyên sơ.
Phù hợp nếu bạn muốn chuyến đi có thêm thiên nhiên thay vì chỉ săn ruộng lúa.', @rg_mo_de,
  'Giữa đỉnh Nả Háng A và Nả Háng B, khu vực Mồ Dề', 0, 0, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.884500, 104.059800);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='thac-mo'), 'TIP', 'Xu hướng khách: nh quan thác – suối

Thác Mơ có dòng nước trong, chảy giữa không gian núi rừng. Đây là điểm có tính chất sinh thái rõ hơn các điểm ruộng bậc thang như Mâm Xôi hay Móng Ngựa.

🌿 Không gian xanh và mát

Đây là lợi thế để phát triển trải nghiệm nghỉ ngơi, tránh nóng và hòa mình vào thiên nhiên.

🏊 Tắm suối

Nguồn du lịch địa phương ghi nhận khu vực Thác Mơ phù hợp với hoạt động tắm suối và thư giãn.

📸 Chụp ảnh

Thác, đá, cây rừng và dòng nước tạo ra một dạng cảnh quan khác biệt so với hình ảnh ruộng bậc thang vốn là sản phẩm chủ đạo của Mù Cang Chải.
Tháng 5–6        💧 Mùa nước, cảnh quan xanh
Tháng 7–8        🌿 Mát mẻ, phù hợp trải nghiệm thiên nhiên
Tháng 9–10        🌾 Kết hợp Thác Mơ + mùa vàng
Sau mưa lớn        💦 Nước có thể mạnh hơn → cần chú ý an toàn', TRUE);

-- ---- Điểm đến: Đồi Móng Ngựa ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('doi-mong-ngua', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Đồi Móng Ngựa', 'doi mong ngua', 'Ruộng bậc thang uốn cong hình móng ngựa/võng
Điểm hấp dẫn nhất của Đồi Móng Ngựa là các thửa ruộng bậc thang uốn thành những vòng cung lớn, tạo hiệu ứng thị giác rất rõ khi nhìn từ trên cao. Đây là kiểu cảnh quan đặc biệt phù hợp với nhiếp ảnh và check-in.', @rg_mu_cang_chai,
  'Khu vực Sáng Nhù, Mù Cang Chải, Lào Cai
Hơn 2 km từ trung tâm Mù Cang Chải', 30000, 30000, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.881200, 104.061200);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='doi-mong-ngua'), 'TIP', 'Xu hướng khách: Check-in, chụp ảnh, ngắm lúa, săn ảnh mùa vàng
Mùa cao điểm        Khoảng tháng 9 – tháng 10
Mùa nước đổ        Khoảng tháng 5 – tháng 6', TRUE);

-- ---- Điểm đến: Rừng Trúc ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('rung-truc', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Rừng Trúc', 'rung truc', 'Rừng trúc lâu năm, không gian xanh, nguyên sơ
Tuổi rừng Khoảng 60 năm', @rg_mo_de,
  'Mồ Dề – Nả Háng Tủa, Mù Cang Chải, Lào Cai
Khoảng 20 km từ trung tâm Mù Cang Chải', 30000, 30000, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.895400, 104.052100);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='rung-truc'), 'TIP', 'Xu hướng khách: Đi bộ, trekking, chụp ảnh, khám phá thiên nhiên
Mùa cao điểm        Không phụ thuộc mạnh vào mùa lúa như Mâm Xôi/Móng Ngựa', TRUE);

-- ---- Điểm đến: Sống Lưng Khủng Long ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('song-lung-khung-long', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Sống Lưng Khủng Long', 'song lung khung long', 'Sống núi đá nhô ra như lưng khủng long
Điểm gây ấn tượng là con đường mòn nằm cheo leo trên sườn núi, với các phiến đá xếp nối tiếp nhau tạo hình giống những chiếc gai trên lưng khủng long. Từ trên cao có thể quan sát một vùng rộng của ruộng bậc thang và các bản làng phía dưới', @rg_de_xu_phinh,
  'Bản Phình Hồ, Dế Xu Phình
~19 km từ trung tâm', 30000, 30000, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT(), 21.892100, 104.029800);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='song-lung-khung-long'), 'TIP', 'Xu hướng khách: Trekking / chinh phục
Đường đến điểm cuối có nhiều đoạn dốc, cua, đá và đất. Khi gần tới điểm ngắm cảnh, du khách phải đi bộ lên khoảng 100 bậc đất, mất khoảng 10 phút theo chia sẻ của một nhiếp ảnh gia địa phương.

📸 Chụp ảnh
Có góc nhìn rộng xuống thung lũng, ruộng bậc thang và núi rừng. Vì vậy điểm này đặc biệt phù hợp với nhóm khách thích nhiếp ảnh và khám phá.

🌾 Ngắm mùa vàng
Vào mùa lúa chín, từ trên sống núi có thể nhìn được các vùng ruộng bậc thang rộng lớn. VnExpress cũng đưa Sống lưng khủng long vào nhóm điểm tiêu biểu khi du khách chỉ có một ngày ở Mù Cang Chải.', TRUE);

-- ============================================================================
-- 7. NHÀ HÀNG (place, kind=FOOD) — sheet 'Nhà hàng'. provider_id NULL (chưa
--    rõ chủ sở hữu/không có thông tin đăng ký nhà cung cấp trong file).
--    Cột 'Đánh giá' trong file (vd '4,4 sao') KHÔNG được nạp vào
--    place.rating_avg vì cột này là denormalized, phải do hệ thống tự tính
--    lại từ bảng review — thay vào đó lưu nguyên văn vào place_highlight TIP.
-- ============================================================================

-- ---- Nhà hàng: Nhà hàng Quyền Hường ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-hang-quyen-huong', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Nhà hàng Quyền Hường', 'nha hang quyen huong', @rg_mu_cang_chai, 'khu trung tâm, QL32',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.858500, 104.084100);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-quyen-huong'), 'PHONE', '0942447103', TRUE);

-- ---- Nhà hàng: Nhà Sàn Quán Mạnh Thơm ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-san-quan-manh-thom', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Nhà Sàn Quán Mạnh Thơm', 'nha san quan manh thom', @rg_mu_cang_chai, 'QL32',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.857900, 104.083500);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-san-quan-manh-thom'), 'PHONE', '0972003166', TRUE);

-- ---- Nhà hàng: Nhà Hàng Tuấn Thuý ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-hang-tuan-thuy', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Nhà Hàng Tuấn Thuý', 'nha hang tuan thuy', @rg_mu_cang_chai, 'QL32',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.859100, 104.084900);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-tuan-thuy'), 'PHONE', '0977279165', TRUE);

-- ---- Nhà hàng: NHÀ HÀNG Thắng Dung ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-hang-thang-dung', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'NHÀ HÀNG Thắng Dung', 'nha hang thang dung', @rg_mu_cang_chai, 'khu thị trấn',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.859900, 104.085500);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-thang-dung'), 'PHONE', '0986675935', TRUE);

-- ---- Nhà hàng: Nhà Hàng Hằng Béo ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-hang-hang-beo', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Nhà Hàng Hằng Béo', 'nha hang hang beo', @rg_mu_cang_chai, '181 Tổ 3',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.860800, 104.086100);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-hang-beo'), 'PHONE', '0944904047', TRUE);

-- ---- Nhà hàng: Nhà Hàng A Tân Quán ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-hang-a-tan-quan', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Nhà Hàng A Tân Quán', 'nha hang a tan quan', @rg_mu_cang_chai, 'Tổ 1',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.857200, 104.082900);

-- ---- Nhà hàng: Nhà Hàng Thùy Linh ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-hang-thuy-linh', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Nhà Hàng Thùy Linh', 'nha hang thuy linh', @rg_mu_cang_chai, 'Thôn 2',
  150000, 1500000, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.856500, 104.082100);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-thuy-linh'), 'PHONE', '919809352', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-thuy-linh'), 'TIP', 'Đánh giá tham khảo từ nguồn ngoài (chưa qua hệ thống review nội bộ): Đánh giá 4,4 sao', TRUE);

-- ---- Nhà hàng: Nhà hàng Vườn Đào ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-hang-vuon-dao', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Nhà hàng Vườn Đào', 'nha hang vuon dao', @rg_mu_cang_chai, 'Tổ 2',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.858900, 104.084300);

-- ---- Nhà hàng: Nhà Hàng Thành Oanh Thắng Cố Ngựa ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-hang-thanh-oanh-thang-co-ngua', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Nhà Hàng Thành Oanh Thắng Cố Ngựa', 'nha hang thanh oanh thang co ngua', @rg_mu_cang_chai, 'khu Mù Cang Chải',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.861200, 104.086800);

-- ---- Nhà hàng: Nhà Hàng Nguyệt Thắng ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nha-hang-nguyet-thang', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Nhà Hàng Nguyệt Thắng', 'nha hang nguyet thang', @rg_tt_mu_cang_chai, '127 thị trấn Mù Cang Chải',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.860100, 104.085800);

-- ---- Nhà hàng: Quán Thuật Hà ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('quan-thuat-ha', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Quán Thuật Hà', 'quan thuat ha', @rg_mu_cang_chai, 'QL32',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.858200, 104.083800);

-- ---- Nhà hàng: Quán Ăn Mu Cang Chai ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('quan-an-mu-cang-chai', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Quán Ăn Mu Cang Chai', 'quan an mu cang chai', @rg_mu_cang_chai, 'QL32',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.858600, 104.084200);

-- ---- Nhà hàng: Quán con khỉ ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('quan-con-khi', (SELECT id FROM category WHERE slug='nha-hang'), 'RESTAURANT',
  'Quán con khỉ', 'quan con khi', @rg_mu_cang_chai, 'khu Mù Cang Chải',
  30000, 300000, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT(), 21.859400, 104.084600);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='quan-con-khi'), 'PHONE', '988820608', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='quan-con-khi'), 'TIP', 'Đánh giá tham khảo từ nguồn ngoài (chưa qua hệ thống review nội bộ): 4,7 sao', TRUE);

-- ============================================================================
-- 8. DI CHUYỂN / NHÀ XE (place, kind=TRANSPORT) — sheet 'Di chuyển'.
--    provider_id NULL (nhà xe liên tỉnh, không phải Provider đăng ký trên
--    nền tảng). Gộp Loại hình/Giá vé/Thời gian/Tuyến đường vào description.
-- ============================================================================

-- ---- Nhà xe: Hà Trang (Lai Châu) ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('ha-trang-lai-chau', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Hà Trang (Lai Châu)', 'ha trang (lai chau)', 'Loại hình: Giường nằm 42 phòng; Thời gian: ~7,5 giờ; Tuyến đường: Hà Nội ↔ Mù Cang Chải', @rg_mu_cang_chai,
  NULL, NULL, 'Theo ngày', 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='ha-trang-lai-chau'), 'PHONE', '0975559911', TRUE);

-- ---- Nhà xe: Sơn Phương ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('son-phuong', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Sơn Phương', 'son phuong', 'Loại hình: Giường nằm; Thời gian: ~7 giờ 25 phút; Tuyến đường: 3 chuyến/ngày trên RedBus', @rg_mu_cang_chai,
  300000, 300000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='son-phuong'), 'PHONE', '0976232118', TRUE);

-- ---- Nhà xe: Hưng Thành (Lai Châu) ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('hung-thanh-lai-chau', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Hưng Thành (Lai Châu)', 'hung thanh (lai chau)', 'Loại hình: Giường nằm; Thời gian: ~7–8 giờ; Tuyến đường: Có tuyến Hà Nội – Mù Cang Chải', @rg_mu_cang_chai,
  NULL, NULL, 'Liên hệ', 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='hung-thanh-lai-chau'), 'PHONE', '0981202525', TRUE);

-- ---- Nhà xe: Cường Lan ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('cuong-lan', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Cường Lan', 'cuong lan', 'Loại hình: Giường nằm/Limousine; Thời gian: ~7–8 giờ; Tuyến đường: Có tuyến qua Yên Bái', @rg_mu_cang_chai,
  350000, 350000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='cuong-lan'), 'PHONE', '0963856856', TRUE);

-- ---- Nhà xe: Anh Khang Authentic ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('anh-khang-authentic', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Anh Khang Authentic', 'anh khang authentic', 'Loại hình: Limousine 9 chỗ', @rg_mu_cang_chai,
  380000, 380000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='anh-khang-authentic'), 'PHONE', '0986359477', TRUE);

-- ---- Nhà xe: Gia Khánh ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('gia-khanh', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Gia Khánh', 'gia khanh', 'Loại hình: Có chuyến đêm', @rg_mu_cang_chai,
  250000, 250000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='gia-khanh'), 'PHONE', '0981413413/1900202708', TRUE);

-- ---- Nhà xe: Cường Lan ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('cuong-lan-2', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Cường Lan', 'cuong lan', 'Loại hình: Nhiều khung giờ', @rg_mu_cang_chai,
  350000, 350000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='cuong-lan-2'), 'PHONE', '0347842842', TRUE);

-- ---- Nhà xe: Nam Thắng Limousine ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('nam-thang-limousine', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Nam Thắng Limousine', 'nam thang limousine', 'Loại hình: Ghế massage', @rg_mu_cang_chai,
  280000, 280000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nam-thang-limousine'), 'PHONE', '02430936036', TRUE);

-- ---- Nhà xe: Golden Limousine ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('golden-limousine', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Golden Limousine', 'golden limousine', 'Loại hình: Limousine', @rg_mu_cang_chai,
  300000, 300000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='golden-limousine'), 'PHONE', '19006772', TRUE);

-- ---- Nhà xe: An Bình Limousine ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('an-binh-limousine', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'An Bình Limousine', 'an binh limousine', 'Loại hình: Mức giá thấp hơn', @rg_mu_cang_chai,
  200000, 200000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='an-binh-limousine'), 'PHONE', '0988050310', TRUE);

-- ---- Nhà xe: Xe Ghép Yên Bái ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('xe-ghep-yen-bai', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Xe Ghép Yên Bái', 'xe ghep yen bai', 'Loại hình: 5–7 chỗ; Tuyến đường: Tận nơi Hà Nội ↔ Mù Cang Chải', @rg_mu_cang_chai,
  700000, 700000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='xe-ghep-yen-bai'), 'PHONE', '0962535333', TRUE);

-- ---- Nhà xe: Xe ghép Yên Bái – Chế Cu Nha ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('xe-ghep-yen-bai-che-cu-nha', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Xe ghép Yên Bái – Chế Cu Nha', 'xe ghep yen bai – che cu nha', 'Loại hình: 5–7 chỗ; Tuyến đường: Tận nhà Chế Cu Nha ↔ Hà Nội', @rg_mu_cang_chai,
  700000, 700000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='xe-ghep-yen-bai-che-cu-nha'), 'PHONE', '0888521007', TRUE);

-- ---- Nhà xe: Xe ghép Yên Bái – Chế Tạo ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('xe-ghep-yen-bai-che-tao', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Xe ghép Yên Bái – Chế Tạo', 'xe ghep yen bai – che tao', 'Loại hình: 5–7 chỗ; Tuyến đường: Tận nơi Chế Tạo ↔ Hà Nội', @rg_mu_cang_chai,
  700000, 700000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='xe-ghep-yen-bai-che-tao'), 'PHONE', '0962535333', TRUE);

-- ---- Nhà xe: Xe ghép Yên Bái – Nậm Có ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes, latitude, longitude) VALUES ('xe-ghep-yen-bai-nam-co', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Xe ghép Yên Bái – Nậm Có', 'xe ghep yen bai – nam co', 'Loại hình: 5–7 chỗ; Tuyến đường: Tận nơi Nậm Có ↔ Hà Nội', @rg_mu_cang_chai,
  700000, 700000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT(), 21.859000, 104.084000);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='xe-ghep-yen-bai-nam-co'), 'PHONE', '0962535333', TRUE);

-- ============================================================================
-- 9. ĐẶC SẢN / SẢN VẬT -> bảng 'specialty' (mục 14.1 phụ lục Phase 1.5).
--    Bảng specialty KHÔNG có cột source_url/source_name riêng -> URL nguồn
--    trong file được gộp vào cuối 'cultural_note' để không mất thông tin.
--    consume_type: bảng chỉ cho phép EAT_IN/TAKE_AWAY/BOTH — cột 'Ăn tại
--    chỗ/Mua làm quà' trong file được map: 'Ăn tại chỗ'->EAT_IN,
--    'Mua làm quà'->TAKE_AWAY, có cả 2 cụm hoặc mơ hồ -> BOTH [SUY LUẬN].
-- ============================================================================

-- ---- Đặc sản: Xôi nếp Tú Lệ / xôi ngũ sắc ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'xoi-nep-tu-le-xoi-ngu-sac', 'Xôi nếp Tú Lệ / xôi ngũ sắc', 'xoi nep tu le / xoi ngu sac', 'MON_AN',
  'Xôi dẻo thơm từ nếp đặc sản Tú Lệ; xôi ngũ sắc tạo màu từ nguyên liệu tự nhiên.', 'Hạt dẻo, thơm; màu sắc bắt mắt, thường dùng trong mâm cơm và dịp lễ.', 'Nếp Tú Lệ; lá/củ tạo màu tự nhiên', 'EAT_IN',
  30000, 80000, 'Xôi ngũ sắc gắn với văn hóa ẩm thực các dân tộc vùng cao Tây Bắc.

Nguồn tham khảo: https://vnexpress.net/cam-nang-du-lich-mu-cang-chai-4158151.html; https://pystravel.vn/tin/1430-kham-pha-am-thuc-mu-cang-chai-ngon-nuc-tieng-khap-vung-tay-bac.html

Ghi chú: Giá suất ăn tham khảo, nên hỏi trước tại điểm bán.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Homestay, quán ăn bản làng Tú Lệ và Mù Cang Chải' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Cá suối nướng ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'ca-suoi-nuong', 'Cá suối nướng', 'ca suoi nuong', 'MON_AN',
  'Cá suối nhỏ làm sạch, tẩm ướp và nướng than.', 'Thịt thơm, vị ngọt tự nhiên, thường ăn nóng cùng rau và gia vị Tây Bắc.', 'Cá suối; muối, gia vị địa phương', 'EAT_IN',
  100000, 250000, 'Thể hiện cách tận dụng sản vật sông suối trong bữa ăn vùng núi.

Nguồn tham khảo: https://vnexpress.net/cam-nang-du-lich-mu-cang-chai-4158151.html

Ghi chú: Mức giá thay đổi theo kích cỡ và số người ăn.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Quán ăn, homestay và chợ phiên Mù Cang Chải' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Pa pỉnh tộp ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'pa-pinh-top', 'Pa pỉnh tộp', 'pa pinh top', 'MON_AN',
  'Cá nướng kiểu Thái Tây Bắc, thường mổ dọc lưng, nhồi gia vị rồi nướng.', 'Thơm mùi mắc khén, rau thơm; cá chín vàng và giữ độ ngọt.', 'Cá; mắc khén, rau thơm, sả, ớt', 'EAT_IN',
  180000, 350000, 'Là món cá truyền thống tiêu biểu của người Thái Tây Bắc.

Nguồn tham khảo: https://vnexpress.net/cam-nang-du-lich-mu-cang-chai-4158151.html; https://pystravel.vn/tin/1430-kham-pha-am-thuc-mu-cang-chai-ngon-nuc-tieng-khap-vung-tay-bac.html

Ghi chú: Tên món có thể được ghi là cá nướng kiểu Thái.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Nhà hàng và homestay phục vụ món Thái ở Mù Cang Chải, Tú Lệ' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Thịt lợn bản kẹp cây rừng nướng ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'thit-lon-ban-kep-cay-rung-nuong', 'Thịt lợn bản kẹp cây rừng nướng', 'thit lon ban kep cay rung nuong', 'MON_AN',
  'Thịt lợn bản/thịt lợn đen thái miếng, kẹp que hoặc cây rừng rồi nướng.', 'Thịt săn chắc, thơm khói và gia vị rừng.', 'Thịt lợn bản; mắc khén, hạt dổi, rau thơm', 'EAT_IN',
  180000, 350000, 'Gắn với chăn nuôi bản địa và cách chế biến nướng truyền thống.

Nguồn tham khảo: https://triphunter.vn/places/mu-cang-chai-tu-le/items/dac-san-mu-cang-chai; https://vnexpress.net/cam-nang-du-lich-mu-cang-chai-4158151.html

Ghi chú: Nên hỏi rõ phần ăn tính theo đĩa hay theo kg.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Quán ăn bản địa, homestay, chợ và khu ẩm thực Mù Cang Chải' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Gà đen Mù Cang Chải ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'ga-den-mu-cang-chai', 'Gà đen Mù Cang Chải', 'ga den mu cang chai', 'MON_AN',
  'Gà đen giống địa phương, có thể hấp, nướng hoặc chế biến thành món khác.', 'Thịt chắc, thơm; thường được xem là sản vật vùng cao.', 'Gà đen; gia vị địa phương', 'EAT_IN',
  250000, 450000, 'Gắn với giống vật nuôi và sinh kế hộ gia đình vùng cao.

Nguồn tham khảo: https://www.bachhoaxanh.com/kinh-nghiem-hay/tong-hop-12-dac-san-mu-cang-chai-doc-dao-nhat-dinh-phai-thu-mot-lan-1401527

Ghi chú: Nguồn du lịch tổng hợp; nên xác nhận giống và giá tại địa phương.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Nhà hàng, homestay và bếp gia đình ở Mù Cang Chải' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Gà nướng lá mắc mật ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'ga-nuong-la-mac-mat', 'Gà nướng lá mắc mật', 'ga nuong la mac mat', 'MON_AN',
  'Gà ướp gia vị, nhồi hoặc bọc lá mắc mật rồi nướng.', 'Mùi lá mắc mật thơm đặc trưng, da gà vàng và thịt đậm vị.', 'Gà; lá mắc mật, gia vị', 'EAT_IN',
  250000, 450000, 'Phản ánh kỹ thuật dùng lá thơm bản địa trong ẩm thực miền núi.

Nguồn tham khảo: https://www.bachhoaxanh.com/kinh-nghiem-hay/tong-hop-12-dac-san-mu-cang-chai-doc-dao-nhat-dinh-phai-thu-mot-lan-1401527

Ghi chú: Giá tùy trọng lượng gà.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Quán ăn và homestay vùng Mù Cang Chải' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Cá hồi, cá tầm Khau Phạ ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'ca-hoi-ca-tam-khau-pha', 'Cá hồi, cá tầm Khau Phạ', 'ca hoi, ca tam khau pha', 'MON_AN',
  'Cá nuôi ở vùng núi cao, thường chế biến lẩu, hấp hoặc nướng.', 'Thịt cá chắc, phù hợp thời tiết mát lạnh vùng cao.', 'Cá hồi/cá tầm; rau, nấm, gia vị lẩu', 'EAT_IN',
  250000, 500000, 'Cho thấy mô hình nuôi thủy sản nước lạnh thích ứng vùng núi cao.

Nguồn tham khảo: https://vnexpress.net/cam-nang-du-lich-mu-cang-chai-4158151.html

Ghi chú: Giá lẩu thường tính theo nồi hoặc số người.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Khu vực đèo Khau Phạ và nhà hàng trên tuyến Tú Lệ–Mù Cang Chải' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Cua suối rang muối ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'cua-suoi-rang-muoi', 'Cua suối rang muối', 'cua suoi rang muoi', 'MON_AN',
  'Cua suối nhỏ rang giòn với muối và gia vị.', 'Giòn, thơm, vị mặn đậm; là món ăn dân dã theo mùa.', 'Cua suối; muối, dầu và gia vị', 'EAT_IN',
  100000, 220000, 'Gắn với nguồn thực phẩm tự nhiên và nhịp sống ven suối.

Nguồn tham khảo: https://digiticket.vn/blog/dac-san-mu-cang-chai/

Ghi chú: Sản lượng phụ thuộc mùa và nguồn khai thác.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Quán ăn địa phương và chợ phiên' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Châu chấu rang ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'chau-chau-rang', 'Châu chấu rang', 'chau chau rang', 'MON_AN',
  'Châu chấu làm sạch, rang giòn với muối hoặc gia vị.', 'Béo, giòn; phổ biến hơn vào mùa gặt lúa.', 'Châu chấu; muối, dầu, lá chanh tùy cách làm', 'BOTH',
  80000, 180000, 'Gắn với mùa gặt và tập quán sử dụng sản vật đồng ruộng.

Nguồn tham khảo: https://vnexpress.net/cam-nang-du-lich-mu-cang-chai-4158151.html

Ghi chú: Nên dùng trong ngày; hỏi nguồn và cách sơ chế.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Chợ phiên, quán ăn và khu vực ruộng bậc thang mùa gặt' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Nhộng ong rừng ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'nhong-ong-rung', 'Nhộng ong rừng', 'nhong ong rung', 'MON_AN',
  'Nhộng ong chế biến xào hoặc rang, thường xuất hiện theo mùa.', 'Béo, mềm; là món đặc sản không có quanh năm.', 'Nhộng ong; gia vị, rau thơm', 'EAT_IN',
  150000, 300000, 'Gắn với sản vật rừng và kinh nghiệm chế biến của người địa phương.

Nguồn tham khảo: https://vnexpress.net/cam-nang-du-lich-mu-cang-chai-4158151.html

Ghi chú: Có thể gây dị ứng; nên ăn thử lượng nhỏ.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Quán ăn, homestay và chợ phiên khi vào mùa' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Măng đắng, rau rừng/cải mèo ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'mang-dang-rau-rung-cai-meo', 'Măng đắng, rau rừng/cải mèo', 'mang dang, rau rung/cai meo', 'SAN_VAT',
  'Măng và rau bản địa luộc, xào hoặc ăn kèm các món khác.', 'Vị đắng nhẹ, thơm tự nhiên; thường dùng trong bữa cơm vùng cao.', 'Măng rừng; rau rừng/cải mèo; gia vị', 'BOTH',
  40000, 150000, 'Thể hiện sự đa dạng của nguồn rau bản địa và tri thức hái lượm.

Nguồn tham khảo: https://vnexpress.net/cam-nang-du-lich-mu-cang-chai-4158151.html; https://cafef.vn/ghe-mu-cang-chai-bay-du-ngam-lua-chin-dung-quen-mua-nhung-dac-san-nay-ve-lam-qua-20220909151630572.chn

Ghi chú: Tên măng theo mùa có thể khác nhau, ví dụ măng Sặt.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Chợ phiên, hàng nông sản và homestay' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Bánh chưng đen ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'banh-chung-den', 'Bánh chưng đen', 'banh chung den', 'MON_AN',
  'Bánh chưng nếp có màu đen từ nguyên liệu tạo màu tự nhiên, gói theo cách địa phương.', 'Màu đen đặc trưng, dẻo thơm, thường có nhân đậu xanh và thịt.', 'Gạo nếp; lá dong; đậu xanh, thịt; lá/than thảo mộc tạo màu tùy địa phương', 'BOTH',
  60000, 150000, 'Gắn với ẩm thực và dịp lễ, Tết của một số cộng đồng vùng cao.

Nguồn tham khảo: https://digiticket.vn/blog/dac-san-mu-cang-chai/

Ghi chú: Công thức tạo màu có thể khác theo bản.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Chợ phiên, hộ gia đình và điểm bán đặc sản' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Cốm Tú Lệ ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'com-tu-le', 'Cốm Tú Lệ', 'com tu le', 'SAN_VAT',
  'Cốm làm từ lúa nếp non Tú Lệ, rang và giã theo phương pháp truyền thống.', 'Màu xanh tự nhiên, hạt dẻo, thơm; mùa chính khoảng tháng 9–10.', 'Lúa nếp Tan/nếp Tú Lệ non', 'TAKE_AWAY',
  90000, 120000, 'Được gọi là “ngọc xanh” của người Thái; nghề làm cốm vừa là phong tục vừa tạo sinh kế.

Nguồn tham khảo: https://danviet.vn/nhin-nguoi-thai-tay-bac-lam-com-tu-le-dac-san-ma-cu-nhu-dang-xem-luyen-cong-20221006004138859-d1047954.html; https://cafef.vn/ghe-mu-cang-chai-bay-du-ngam-lua-chin-dung-quen-mua-nhung-dac-san-nay-ve-lam-qua-20220909151630572.chn

Ghi chú: Cốm tươi dễ giảm chất lượng; có thể hỏi túi hút chân không/cách bảo quản.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Các lò cốm ở xã Tú Lệ, bản Nà Lóng, dọc QL32/đèo Khau Phạ' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Táo mèo / sơn tra và rượu táo mèo ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'tao-meo-son-tra-va-ruou-tao-meo', 'Táo mèo / sơn tra và rượu táo mèo', 'tao meo / son tra va ruou tao meo', 'SAN_VAT',
  'Quả sơn tra vị chua, chát nhẹ; có thể mua tươi hoặc ngâm rượu.', 'Quả thường vào mùa 8–10; rượu có mùi thơm và vị chua chát đặc trưng.', 'Quả sơn tra; rượu trắng, đường/mật ong tùy cách ngâm', 'TAKE_AWAY',
  20000, 35000, 'Sơn tra là sản vật núi cao và thường được dùng làm quà, đồ ngâm truyền thống.

Nguồn tham khảo: https://cafef.vn/ghe-mu-cang-chai-bay-du-ngam-lua-chin-dung-quen-mua-nhung-dac-san-nay-ve-lam-qua-20220909151630572.chn; https://vietpowertravel.com.vn/blog/2016/07/28/dac-san-tao-meo-mu-cang-chai/

Ghi chú: Rượu có cồn; kiểm tra nhãn, nguồn gốc và quy định vận chuyển.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Ngã Ba Kim, chợ thị trấn Mù Cang Chải và các quầy đặc sản' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ---- Đặc sản: Mật ong rừng; lạp xưởng; thịt hun khói/gác bếp; nếp Tú Lệ; măng khô ----
INSERT INTO specialty (slug, name, name_norm, group_code, short_desc, highlight, ingredients, consume_type, price_ref_min, price_ref_max, cultural_note, visibility, verification, last_verified_at) VALUES (
  'mat-ong-rung-lap-xuong-thit-hun-khoi-gac-bep-nep-tu-le-mang-kho', 'Mật ong rừng; lạp xưởng; thịt hun khói/gác bếp; nếp Tú Lệ; măng khô', 'mat ong rung; lap xuong; thit hun khoi/gac bep; nep tu le; mang kho', 'SAN_VAT',
  'Nhóm quà khô và nông sản chế biến có thể bảo quản, mang về.', 'Hương vị khói/gia vị rừng; thuận tiện đóng gói; nếp Tú Lệ là nguyên liệu đặc sản.', 'Mật ong; thịt lợn/trâu; thịt xay; nếp; măng khô', 'TAKE_AWAY',
  250000, 1000000, 'Phản ánh kỹ thuật bảo quản thực phẩm và trao đổi hàng hóa của vùng cao.

Nguồn tham khảo: https://cafef.vn/ghe-mu-cang-chai-bay-du-ngam-lua-chin-dung-quen-mua-nhung-dac-san-nay-ve-lam-qua-20220909151630572.chn; https://digiticket.vn/blog/dac-san-mu-cang-chai/

Ghi chú: Nên hỏi ngày sản xuất, khối lượng tịnh, cách bảo quản và nguồn gốc trước khi mua.', 'PUBLISHED', 'VERIFIED', '2026-09-16'
);
-- [GHI CHÚ] 'Địa điểm có thể tìm/mua' = 'Chợ thị trấn Mù Cang Chải, chợ phiên, cửa hàng đặc sản và nhà dân' — KHÔNG tự động nối vào
--   bảng place_specialty vì tên địa điểm trong file là mô tả chung chung (vd 'chợ
--   phiên', 'homestay và quán ăn') chứ không khớp tên place cụ thể đã tạo ở trên;
--   cần rà soát thủ công rồi INSERT INTO place_specialty (place_id, specialty_id, note).

-- ============================================================================
-- 10. LỄ HỘI/SỰ KIỆN VĂN HÓA -> bảng 'festival' (mục 14.2 phụ lục Phase 1.5).
--     Sheet 'Văn hóa' trong file thực chất gồm NHIỀU bảng khác nhau xếp
--     chung 1 sheet: (a) 5 dòng lễ hội/sự kiện đầu tiên — dùng ở đây;
--     (b) bảng 'Tài nguyên văn hóa' (Khèn Mông, Thổ cẩm, Ruộng bậc thang...);
--     (c) bảng 'Phân khúc khách'; (d) bảng 'Sản phẩm tour đề xuất'.
--     (b),(c),(d) KHÔNG có bảng tương ứng trong schema hiện tại (không phải
--     festival, không phải place) nên KHÔNG được nạp ở đây — cần thiết kế
--     bảng riêng (vd 'cultural_resource', 'customer_segment', 'tour_product')
--     nếu muốn lưu, hoặc PO xác nhận phạm vi trước khi làm ở Phase sau.
--     festival_occurrence (ngày cụ thể) cũng KHÔNG được sinh vì file chỉ có
--     mô tả mùa/thời điểm dạng văn bản tự do (vd 'Đầu năm mới'), không có
--     period_start/period_end cụ thể (cột NOT NULL) để tự bịa ngày.
-- ============================================================================

-- ---- Lễ hội: Gầu Tào ----
INSERT INTO festival (slug, name, name_norm, season_note, core_value, suitable_experience, etiquette_dont, region_id, visibility, is_suitable_by_time) VALUES (
  'gau-tao', 'Gầu Tào', 'gau tao', 'Đầu năm mới; lịch cụ thể theo địa phương', 'Cầu phúc, cầu mệnh, mùa màng, sức khỏe; sinh hoạt cộng đồng',
  'Xem phần hội được phép; nghe giới thiệu bối cảnh; giao lưu khèn/múa; ẩm thực cộng đồng
Nhóm khách phù hợp: Khách văn hóa, nghiên cứu, khách quốc tế, nhóm nhỏ
Dịch vụ có thể bán: Hướng dẫn bản địa, homestay, ăn uống, tour văn hóa', 'Tự ý quay/chụp nghi lễ; diễn lại phần thiêng; chen lấn', @rg_mu_cang_chai, 'PUBLISHED', FALSE
);

-- ---- Lễ hội: Mừng cơm mới ----
INSERT INTO festival (slug, name, name_norm, season_note, core_value, suitable_experience, etiquette_dont, region_id, visibility, is_suitable_by_time) VALUES (
  'mung-com-moi', 'Mừng cơm mới', 'mung com moi', 'Sau vụ lúa; tùy gia đình', 'Biết ơn tổ tiên, trời đất; đoàn tụ và mừng mùa',
  'Trải nghiệm nông nghiệp, nghe kể chuyện, thưởng thức món từ gạo mới khi được mời
Nhóm khách phù hợp: Gia đình, khách giáo dục, khách chậm
Dịch vụ có thể bán: Bữa cơm bản địa, tour ruộng, lưu trú', 'Biến lễ gia đình thành show; áp đặt lễ vật/lịch', @rg_mu_cang_chai, 'PUBLISHED', TRUE
);

-- ---- Lễ hội: Festival Khèn Mông ----
INSERT INTO festival (slug, name, name_norm, season_note, core_value, suitable_experience, etiquette_dont, region_id, visibility, is_suitable_by_time) VALUES (
  'festival-khen-mong', 'Festival Khèn Mông', 'festival khen mong', 'Thường gắn chào xuân', 'Tôn vinh nghệ thuật khèn và trao truyền',
  'Xem trình diễn; workshop khèn; gặp nghệ nhân; mua nhạc cụ hợp pháp
Nhóm khách phù hợp: Khách trẻ, khách văn hóa, nhiếp ảnh
Dịch vụ có thể bán: Vé sự kiện, workshop, bán sản phẩm, lưu trú', 'Chỉ dùng khèn như tiết mục minh họa thiếu bối cảnh', @rg_mu_cang_chai, 'PUBLISHED', FALSE
);

-- ---- Lễ hội: Hoa Tớ Dày ----
INSERT INTO festival (slug, name, name_norm, season_note, core_value, suitable_experience, etiquette_dont, region_id, visibility, is_suitable_by_time) VALUES (
  'hoa-to-day', 'Hoa Tớ Dày', 'hoa to day', 'Cuối năm–đầu năm', 'Cảnh quan hoa và không khí chào xuân',
  'Ngắm hoa có kiểm soát, chụp ảnh, đi bộ, kết hợp bản làng
Nhóm khách phù hợp: Khách nghỉ dưỡng, nhiếp ảnh, gia đình
Dịch vụ có thể bán: Tour cảnh quan, homestay, ẩm thực', 'Bẻ cành, giẫm cây, xả rác, quá tải điểm hoa', @rg_mu_cang_chai, 'PUBLISHED', FALSE
);

-- ---- Lễ hội: Mùa vàng/khám phá ruộng bậc thang ----
INSERT INTO festival (slug, name, name_norm, season_note, core_value, suitable_experience, etiquette_dont, region_id, visibility, is_suitable_by_time) VALUES (
  'mua-vang-kham-pha-ruong-bac-thang', 'Mùa vàng/khám phá ruộng bậc thang', 'mua vang/kham pha ruong bac thang', 'Mùa lúa chín', 'Lao động, cảnh quan và sinh kế nông nghiệp',
  'Trekking, nhiếp ảnh, trải nghiệm gặt/làm nông khi được phép
Nhóm khách phù hợp: Khách cảnh quan, trekking, nhiếp ảnh
Dịch vụ có thể bán: Hướng dẫn, xe địa phương, nông sản, homestay', 'Đi vào ruộng, phá bờ thửa, gây cản trở sản xuất', @rg_mu_cang_chai, 'PUBLISHED', TRUE
);


-- ============================================================================
-- 10. ĐIỂM & DỊCH VỤ CHỤP ẢNH (PHOTO) & CHO THUÊ TRANG PHỤC / PHƯƠNG TIỆN (RENTAL)
-- ============================================================================

-- ---- PHOTO: Điểm Săn Hoàng Hôn & Flycam Đồi Móng Ngựa ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Dịch Vụ Nhiếp Ảnh & Cho Thuê Móng Ngựa', 'A Lù', '0912345671', 'Bản Mồ Dề, Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0912345671', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Dịch Vụ Nhiếp Ảnh & Cho Thuê Móng Ngựa' ORDER BY id DESC LIMIT 1));
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, latitude, longitude, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'diem-san-hoang-hon-doi-mong-ngua', (SELECT id FROM category WHERE slug='chup-anh'), 'PHOTO', (SELECT id FROM provider WHERE name='Dịch Vụ Nhiếp Ảnh & Cho Thuê Móng Ngựa' ORDER BY id DESC LIMIT 1),
  'Điểm Săn Hoàng Hôn & Flycam Đồi Móng Ngựa', 'diem san hoang hon flycam doi mong ngua', 'Điểm dừng chân ngắm cảnh và dịch vụ quay chụp flycam chuyên nghiệp tại Đồi Móng Ngựa, bắt trọn khoảnh khắc hoàng hôn dát vàng trên từng bậc thang lúa.',
  @rg_mo_de, 'Đồi Móng Ngựa, xã Mồ Dề', 21.881200, 104.061200, 150000, 500000, '/gói chụp',
  'PUBLISHED', 'OFFICIAL', 'Khảo sát thực địa Mù Cang Chải', 'VERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='diem-san-hoang-hon-doi-mong-ngua'), 'PHONE', '0912345671', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='diem-san-hoang-hon-doi-mong-ngua'), 'PRO', 'Góc nhìn trọn vẹn toàn cảnh móng ngựa lúa vàng; có thợ máy chụp chuyên nghiệp và cho mượn đạo cụ ô dù bản địa.', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='diem-san-hoang-hon-doi-mong-ngua'), 'TIP', 'Nên có mặt trước 16:15 chiều để nhận vị trí đẹp và căn góc đón nắng xiên hoàn hảo nhất.', TRUE);

-- ---- PHOTO: Tiệm Ảnh Bản Sắc Púng Luông ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Tiệm Ảnh Bản Sắc Púng Luông', 'Giàng A Tủa', '0912345672', 'Xã Púng Luông, Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0912345672', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Tiệm Ảnh Bản Sắc Púng Luông' ORDER BY id DESC LIMIT 1));
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, latitude, longitude, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'tiem-anh-ban-sac-pung-luong', (SELECT id FROM category WHERE slug='chup-anh'), 'PHOTO', (SELECT id FROM provider WHERE name='Tiệm Ảnh Bản Sắc Púng Luông' ORDER BY id DESC LIMIT 1),
  'Tiệm Ảnh Bản Sắc Púng Luông', 'tiem anh ban sac pung luong', 'Studio check-in kết hợp chụp ảnh ngoại cảnh cùng trang phục dân tộc H\'Mông, Thái truyền thống giữa thiên nhiên đại ngàn.',
  @rg_pung_luong, 'Ngã Ba Púng Luông, Mù Cang Chải', 21.824200, 104.109800, 200000, 800000, '/gói ảnh',
  'PUBLISHED', 'OFFICIAL', 'Khảo sát thực địa Mù Cang Chải', 'VERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='tiem-anh-ban-sac-pung-luong'), 'PHONE', '0912345672', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='tiem-anh-ban-sac-pung-luong'), 'PRO', 'Trang phục chuẩn hoa văn dệt tay thổ cẩm; thợ trang điểm am hiểu phong cách vùng cao.', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='tiem-anh-ban-sac-pung-luong'), 'TIP', 'Đặt lịch chụp sáng sớm (7:30 - 9:00) để ánh sáng tự nhiên mềm mại và không bị đông đúc.', TRUE);

-- ---- PHOTO: Góc Check-in Mùa Vàng La Pán Tẩn ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Góc Sống Ảo La Pán Tẩn', 'Thào A Sinh', '0912345673', 'Bản La Pán Tẩn, Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0912345673', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Góc Sống Ảo La Pán Tẩn' ORDER BY id DESC LIMIT 1));
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, latitude, longitude, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'goc-checkin-mua-vang-la-pan-tan', (SELECT id FROM category WHERE slug='chup-anh'), 'PHOTO', (SELECT id FROM provider WHERE name='Góc Sống Ảo La Pán Tẩn' ORDER BY id DESC LIMIT 1),
  'Góc Check-in Mùa Vàng La Pán Tẩn', 'goc checkin mua vang la pan tan', 'Điểm ngắm cảnh và chụp ảnh với xích đu gỗ, cầu mây và chòi lá view thẳng ra thung lũng mâm xôi bát ngát.',
  @rg_la_pan_tan, 'Bản La Pán Tẩn, Mù Cang Chải', 21.849120, 104.092450, 30000, 100000, '/lượt vào chòi',
  'PUBLISHED', 'OFFICIAL', 'Khảo sát thực địa Mù Cang Chải', 'VERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='goc-checkin-mua-vang-la-pan-tan'), 'PHONE', '0912345673', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='goc-checkin-mua-vang-la-pan-tan'), 'TIP', 'Có phục vụ trà thảo mộc nương ấm nóng và bắp ngô nướng ngay tại chòi nghỉ ngơi.', TRUE);

-- ---- RENTAL: Tiệm Cho Thuê Trang Phục Dân Tộc Hoa Bản ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Tiệm Trang Phục Dân Tộc Hoa Bản', 'Lò Thị Mai', '0988776651', 'Thị trấn Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0988776651', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Tiệm Trang Phục Dân Tộc Hoa Bản' ORDER BY id DESC LIMIT 1));
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, latitude, longitude, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'tiem-cho-thue-trang-phuc-hoa-ban', (SELECT id FROM category WHERE slug='thue-do'), 'RENTAL', (SELECT id FROM provider WHERE name='Tiệm Trang Phục Dân Tộc Hoa Bản' ORDER BY id DESC LIMIT 1),
  'Tiệm Cho Thuê Trang Phục Dân Tộc Hoa Bản', 'tiem cho thue trang phuc dan toc hoa ban', 'Chuyên cho thuê trang phục truyền thống và cách tân dân tộc Thái, H\'Mông, Dao đỏ; kèm đầy đủ phụ kiện vòng bạc, khèn bè, gùi hoa, ô dù che nắng.',
  @rg_tt_mu_cang_chai, 'QL32, Tổ 3, Thị trấn Mù Cang Chải', 21.858500, 104.084100, 50000, 150000, '/bộ/ngày',
  'PUBLISHED', 'OFFICIAL', 'Khảo sát thực địa Mù Cang Chải', 'VERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='tiem-cho-thue-trang-phuc-hoa-ban'), 'PHONE', '0988776651', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='tiem-cho-thue-trang-phuc-hoa-ban'), 'PRO', 'Đồ giặt sấy thơm tho sạch sẽ; mẫu mã cập nhật liên tục, có đủ size cho nam, nữ và trẻ em.', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='tiem-cho-thue-trang-phuc-hoa-ban'), 'TIP', 'Thuê 2 ngày trở lên được giảm 10% và miễn phí mượn phụ kiện vòng bạc, gùi hoa.', TRUE);

-- ---- RENTAL: Cho Thuê Xe Máy Phượt Cường Tới ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Cho Thuê Xe Máy Phượt Cường Tới', 'Nguyễn Cường', '0988776652', 'Tổ 2, Thị trấn Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0988776652', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Cho Thuê Xe Máy Phượt Cường Tới' ORDER BY id DESC LIMIT 1));
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, latitude, longitude, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'cho-thue-xe-may-phuot-cuong-toi', (SELECT id FROM category WHERE slug='thue-do'), 'RENTAL', (SELECT id FROM provider WHERE name='Cho Thuê Xe Máy Phượt Cường Tới' ORDER BY id DESC LIMIT 1),
  'Cho Thuê Xe Máy Phượt Cường Tới', 'cho thue xe may phuot cuong toi', 'Dịch vụ cho thuê xe máy chuyên leo đèo Mù Cang Chải (Wave Alpha, Blade, Sirius, cào cào XR150); giao xe tận nơi miễn phí tại khách sạn, homestay và bến xe.',
  @rg_tt_mu_cang_chai, 'Gần Cầu Mù Cang Chải, Thị trấn Mù Cang Chải', 21.859100, 104.084900, 120000, 250000, '/xe/ngày',
  'PUBLISHED', 'OFFICIAL', 'Khảo sát thực địa Mù Cang Chải', 'VERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='cho-thue-xe-may-phuot-cuong-toi'), 'PHONE', '0988776652', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='cho-thue-xe-may-phuot-cuong-toi'), 'PRO', 'Xe bảo dưỡng định kỳ thay dầu và phanh trước mỗi chuyến đi; tặng kèm 2 mũ bảo hiểm, áo mưa và bản đồ phượt.', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='cho-thue-xe-may-phuot-cuong-toi'), 'TIP', 'Đường lên La Pán Tẩn và Đồi Móng Ngựa dốc gắt, khuyến khích chọn xe số như Wave hoặc Sirius thay vì xe ga.', TRUE);

-- ---- RENTAL: Cho Thuê Đồ Cắm Trại & Bếp Nướng Đồi Mâm Xôi ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Cho Thuê Lều Trại Mâm Xôi Camp', 'Hờ A Sử', '0988776653', 'La Pán Tẩn, Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0988776653', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Cho Thuê Lều Trại Mâm Xôi Camp' ORDER BY id DESC LIMIT 1));
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, latitude, longitude, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'thue-do-cam-trai-mam-xoi-camp', (SELECT id FROM category WHERE slug='thue-do'), 'RENTAL', (SELECT id FROM provider WHERE name='Cho Thuê Lều Trại Mâm Xôi Camp' ORDER BY id DESC LIMIT 1),
  'Cho Thuê Lều Trại & Bếp Nướng Mâm Xôi Camp', 'cho thue leu trai bep nuong mam xoi camp', 'Cho thuê trọn gói đồ dã ngoại cắm trại: lều chống mưa tuyết 2 - 4 - 6 người, túi ngủ lông vũ giữ ấm, bếp nướng dã ngoại, bàn ghế gấp dã ngoại ngắm cảnh thung lũng.',
  @rg_la_pan_tan, 'Khu vực Đồi Mâm Xôi, La Pán Tẩn', 21.848500, 104.091200, 100000, 350000, '/bộ lều/đêm',
  'PUBLISHED', 'OFFICIAL', 'Khảo sát thực địa Mù Cang Chải', 'VERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='thue-do-cam-trai-mam-xoi-camp'), 'PHONE', '0988776653', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='thue-do-cam-trai-mam-xoi-camp'), 'PRO', 'Lều chống thấm nước 2 lớp chất lượng cao, trang bị đệm hơi cách nhiệt nền đất êm ấm.', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='thue-do-cam-trai-mam-xoi-camp'), 'TIP', 'Nên đặt trước than hoa và vỉ nướng nếu dự định tổ chức tiệc BBQ nướng thịt ngoài trời ngắm sao đêm.', TRUE);

-- ============================================================================
-- PATCH: Cập nhật tọa độ GPS (update_coordinates.sql)
-- ============================================================================
-- Update tọa độ GPS cho các Homestay (Place 1 -> 37)
UPDATE place SET latitude = 21.849120, longitude = 104.092450 WHERE id = 1;  -- Hello Mu Cang Chai (La Pán Tẩn)
UPDATE place SET latitude = 21.782100, longitude = 104.148200 WHERE id = 2;  -- Mu Cang Chai Eco Lodge (Nậm Khắt)
UPDATE place SET latitude = 21.851200, longitude = 104.090100 WHERE id = 3;  -- Dò Gừ Homestay (La Pán Tẩn)
UPDATE place SET latitude = 21.859340, longitude = 104.084210 WHERE id = 4;  -- Mù Cang Homestay (TT Mù Cang Chải)
UPDATE place SET latitude = 21.857100, longitude = 104.085300 WHERE id = 5;  -- Ngọc Thúy Homestay (TT Mù Cang Chải)
UPDATE place SET latitude = 21.882100, longitude = 104.062100 WHERE id = 6;  -- Mong Ngua Homestay (Mồ Dề)
UPDATE place SET latitude = 21.848300, longitude = 104.094500 WHERE id = 7;  -- La Pan Tan Homestay (La Pán Tẩn)
UPDATE place SET latitude = 21.854200, longitude = 104.072100 WHERE id = 8;  -- Homestay Cường Tới (Kim Nọi)
UPDATE place SET latitude = 21.861000, longitude = 104.086200 WHERE id = 9;  -- Lương Văn Bốn (TT Mù Cang Chải)
UPDATE place SET latitude = 21.853800, longitude = 104.071500 WHERE id = 10; -- Tòng Teng (Kim Nọi)
UPDATE place SET latitude = 21.847500, longitude = 104.093200 WHERE id = 11; -- A Dê (La Pán Tẩn)
UPDATE place SET latitude = 21.858000, longitude = 104.084800 WHERE id = 12; -- Lương Hằng (TT Mù Cang Chải)
UPDATE place SET latitude = 21.853100, longitude = 104.073400 WHERE id = 13; -- Minh Ngọc (Kim Nọi)
UPDATE place SET latitude = 21.821400, longitude = 104.112300 WHERE id = 14; -- Suối Kim 2 (Ngã Ba Kim)
UPDATE place SET latitude = 21.860500, longitude = 104.087100 WHERE id = 15; -- Nông Văn Óm (TT Mù Cang Chải)
UPDATE place SET latitude = 21.852900, longitude = 104.072800 WHERE id = 16; -- Tú Nguyệt (Kim Nọi)
UPDATE place SET latitude = 21.802100, longitude = 104.175400 WHERE id = 17; -- Quyết Đoán (Cao Phạ)
UPDATE place SET latitude = 21.853500, longitude = 104.071900 WHERE id = 18; -- Hoài Phương (Kim Nọi)
UPDATE place SET latitude = 21.862100, longitude = 104.088300 WHERE id = 19; -- Duy Cường (TT Mù Cang Chải)
UPDATE place SET latitude = 21.859800, longitude = 104.083900 WHERE id = 20; -- Gió Tre (TT Mù Cang Chải)
UPDATE place SET latitude = 21.851900, longitude = 104.089500 WHERE id = 21; -- Village Home (gần La Pán Tẩn)
UPDATE place SET latitude = 21.868200, longitude = 104.053100 WHERE id = 22; -- Big View (Chế Cu Nha)
UPDATE place SET latitude = 21.858800, longitude = 104.084500 WHERE id = 23; -- Chải Eco House (TT Mù Cang Chải)
UPDATE place SET latitude = 21.846500, longitude = 104.095800 WHERE id = 24; -- A Su Homestay (La Pán Tẩn)
UPDATE place SET latitude = 21.848800, longitude = 104.091900 WHERE id = 25; -- Wind's Homestay (Đồi Mâm Xôi)
UPDATE place SET latitude = 21.825100, longitude = 104.108500 WHERE id = 26; -- Chí Chơ (Púng Luông)
UPDATE place SET latitude = 21.850400, longitude = 104.093800 WHERE id = 27; -- Bamboo Homestay (La Pán Tẩn)
UPDATE place SET latitude = 21.856200, longitude = 104.079200 WHERE id = 28; -- Sùng A Hờ (Tổ Chờ)
UPDATE place SET latitude = 21.819800, longitude = 104.114200 WHERE id = 29; -- Suối Kim (QL32)
UPDATE place SET latitude = 21.801200, longitude = 104.178900 WHERE id = 30; -- Bluehome (Đèo Khau Phạ)
UPDATE place SET latitude = 21.849800, longitude = 104.096500 WHERE id = 31; -- Pù Nhu Homestay
UPDATE place SET latitude = 21.869500, longitude = 104.051800 WHERE id = 32; -- Dòng Suối Hmong (Chế Cu Nha)
UPDATE place SET latitude = 21.821900, longitude = 104.111800 WHERE id = 33; -- Dream House (Ngã Ba Kim)
UPDATE place SET latitude = 21.803500, longitude = 104.174200 WHERE id = 34; -- Súa Su (Đèo Khau Phạ)
UPDATE place SET latitude = 21.857600, longitude = 104.085100 WHERE id = 35; -- Homestay Tú Nguyệt
UPDATE place SET latitude = 21.847100, longitude = 104.094100 WHERE id = 36; -- Indigenous Homestay
UPDATE place SET latitude = 21.824200, longitude = 104.109800 WHERE id = 37; -- GARRYA Mù Cang Chải

-- Update tọa độ GPS cho các Địa điểm Du Lịch / Check-in nổi tiếng (ATTRACTION 38 -> 48)
UPDATE place SET latitude = 21.850120, longitude = 104.092100 WHERE id = 38; -- La Pán Tẩn
UPDATE place SET latitude = 21.848500, longitude = 104.091200 WHERE id = 39; -- Đồi Mâm Xôi (~0.5km từ La Pán Tẩn)
UPDATE place SET latitude = 21.871200, longitude = 104.048900 WHERE id = 40; -- Chế Cu Nha (~5km)
UPDATE place SET latitude = 21.889500, longitude = 104.032100 WHERE id = 41; -- Dế Xu Phình (~8km)
UPDATE place SET latitude = 21.798500, longitude = 104.181200 WHERE id = 42; -- Đèo Khau Phạ (~12km)
UPDATE place SET latitude = 21.765400, longitude = 104.221500 WHERE id = 43; -- Thung lũng Tú Lệ (~20km)
UPDATE place SET latitude = 21.843200, longitude = 104.098700 WHERE id = 44; -- Thác Pú Nhu (~1.2km)
UPDATE place SET latitude = 21.884500, longitude = 104.059800 WHERE id = 45; -- Thác Mơ (~5.5km)
UPDATE place SET latitude = 21.881200, longitude = 104.061200 WHERE id = 46; -- Đồi Móng Ngựa (~4.8km)
UPDATE place SET latitude = 21.895400, longitude = 104.052100 WHERE id = 47; -- Rừng Trúc Mồ Dề (~6.5km)
UPDATE place SET latitude = 21.892100, longitude = 104.029800 WHERE id = 48; -- Sống Lưng Khủng Long Dế Xu Phình (~9km)

-- Update tọa độ GPS cho các Quán Ăn / Nhà Hàng (FOOD 49 -> 61)
UPDATE place SET latitude = 21.858500, longitude = 104.084100 WHERE id = 49; -- Nhà hàng Quyền Hương (~1.5km)
UPDATE place SET latitude = 21.857900, longitude = 104.083500 WHERE id = 50; -- Nhà Sàn Quán Mạnh Thơm (~1.6km)
UPDATE place SET latitude = 21.859100, longitude = 104.084900 WHERE id = 51; -- Nhà Hàng Tuấn Thuý (~1.5km)
UPDATE place SET latitude = 21.859900, longitude = 104.085500 WHERE id = 52; -- NHÀ HÀNG Thắng Dung (~1.6km)
UPDATE place SET latitude = 21.860800, longitude = 104.086100 WHERE id = 53; -- Nhà Hàng Hưng Béo (~1.7km)
UPDATE place SET latitude = 21.857200, longitude = 104.082900 WHERE id = 54; -- Nhà Hàng A Tân Quán (~1.8km)
UPDATE place SET latitude = 21.856500, longitude = 104.082100 WHERE id = 55; -- Nhà Hàng Thuỳ Linh (~1.9km)
UPDATE place SET latitude = 21.858900, longitude = 104.084300 WHERE id = 56; -- Nhà hàng Vườn Đào (~1.5km)
UPDATE place SET latitude = 21.861200, longitude = 104.086800 WHERE id = 57; -- Thành Oanh Thắng Cố Ngựa (~1.7km)
UPDATE place SET latitude = 21.860100, longitude = 104.085800 WHERE id = 58; -- Nhà Hàng Nguyệt Thắng (~1.6km)
UPDATE place SET latitude = 21.858200, longitude = 104.083800 WHERE id = 59; -- Quán Thuật Hà (~1.5km)
UPDATE place SET latitude = 21.858600, longitude = 104.084200 WHERE id = 60; -- Quán Ăn Mu Cang Chai (~1.5km)
UPDATE place SET latitude = 21.859400, longitude = 104.084600 WHERE id = 61; -- Quán con khỉ (~1.5km)

-- Update tọa độ cho các Nhà xe / Điểm đón (TRANSPORT 62 -> 75)
UPDATE place SET latitude = 21.859000, longitude = 104.084000 WHERE id BETWEEN 62 AND 75;


-- ============================================================================
-- PATCH: Thêm đặc sản / ẩm thực bản địa (insert_cuisine_data.sql)
-- ============================================================================
-- ============================================================
-- Script thêm đặc sản / món ăn bản địa (kind = CUISINE) — MySQL 8.0
-- Idempotent: chạy nhiều lần an toàn nhờ ON DUPLICATE KEY UPDATE
-- category_id = 3 (CUISINE), kind = 'CUISINE'
-- Enum hợp lệ:
--   visibility: DRAFT | PUBLISHED | UNPUBLISHED
--   operation_status: OPERATING | TEMP_CLOSED
--   source_type: OFFICIAL | PROVIDER | PUBLIC_TRUSTED | SOCIAL_COMMUNITY
--   verification: VERIFIED | UNVERIFIED | NEEDS_UPDATE | ARCHIVED
-- ============================================================

-- 1. Thắng Cố Ngựa Mù Cang Chải
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description,
                   region_id, address, latitude, longitude, access_note,
                   price_ref_min, price_ref_max, price_unit_note,
                   visibility, operation_status, source_type, verification,
                   rating_avg, rating_count, attributes)
VALUES (101, 'thang-co-ngua-mu-cang-chai', 3, 'CUISINE',
        'Thắng Cố Ngựa Mù Cang Chải', 'thang co ngua mu cang chai',
        'Món thắng cố ngựa là di sản ẩm thực linh hồn của người Mông vùng cao Tây Bắc — nấu từ nội tạng ngựa, bò, lợn cùng gia vị bản địa như thảo quả, hồi, quế. Hương vị đậm đà, nồng nàn, không thể tìm thấy ở bất kỳ nơi nào khác.',
        1, 'Chợ phiên thị trấn Mù Cang Chải, Yên Bái', 21.8347, 104.0553,
        'Chỉ có vào ngày chợ phiên thứ 7 hàng tuần. Đến trước 8h sáng để có nồi ngon nhất.',
        40000, 80000, '/ bát',
        'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED',
        4.9, 312,
        JSON_OBJECT(
            'coverImageUrl', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
            'tagBadge', 'Đặc Sản Mông',
            'origin', 'Dân tộc Mông — Tây Bắc',
            'bestSeason', 'Chợ phiên thứ 7 hàng tuần',
            'ingredients', 'Thịt ngựa, nội tạng, thảo quả, hồi, quế, gừng tươi',
            'pairing', 'Uống kèm rượu ngô Tú Lệ nấu thủ công',
            'openingHours', 'Sáng thứ 7 — 06:00 đến hết khoảng 11:00',
            'note', 'Mùi đặc trưng mạnh; ăn nóng ngay tại chỗ'
        ))
ON DUPLICATE KEY UPDATE
    name=VALUES(name), description=VALUES(description),
    price_ref_min=VALUES(price_ref_min), price_ref_max=VALUES(price_ref_max),
    rating_avg=VALUES(rating_avg), rating_count=VALUES(rating_count), attributes=VALUES(attributes);

-- 2. Cốm Nếp Nương Tú Lệ
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description,
                   region_id, address, latitude, longitude, access_note,
                   price_ref_min, price_ref_max, price_unit_note,
                   visibility, operation_status, source_type, verification,
                   rating_avg, rating_count, attributes)
VALUES (102, 'com-nep-nuong-tu-le', 3, 'CUISINE',
        'Cốm Nếp Nương Tú Lệ', 'com nep nuong tu le',
        'Cốm Tú Lệ được làm từ lúa nếp nương thơm hái vào tháng 9-10 khi hạt còn đang sữa — giã tay trên cối đá truyền thống. Hương thơm thanh khiết, màu xanh mướt, vị ngọt mộc mạc như chính núi rừng Tây Bắc.',
        11, 'Thung lũng Tú Lệ, Xã Tú Lệ, Văn Chấn, Yên Bái', 21.7532, 104.3229,
        'Có nhiều hộ bán cốm ngay tại bản và chợ Tú Lệ. Mùa cốm ngon nhất tháng 9 - đầu tháng 11.',
        30000, 80000, '/ túi 500g',
        'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED',
        5.0, 486,
        JSON_OBJECT(
            'coverImageUrl', 'https://images.unsplash.com/photo-1603088549-da990c5a2e1d?auto=format&fit=crop&w=800&q=80',
            'tagBadge', 'Mùa Vàng',
            'origin', 'Người Thái Trắng — Tú Lệ',
            'bestSeason', 'Tháng 9 – 11 mùa lúa chín',
            'ingredients', 'Nếp nương Tú Lệ — hạt sữa đòng đòng',
            'pairing', 'Ăn kèm chuối xanh hoặc mứt gừng',
            'openingHours', 'Cả ngày — chỉ có theo mùa vụ',
            'note', 'Có thể mua mang về; đóng gói lá chuối 3-5 ngày'
        ))
ON DUPLICATE KEY UPDATE
    name=VALUES(name), description=VALUES(description),
    price_ref_min=VALUES(price_ref_min), price_ref_max=VALUES(price_ref_max),
    rating_avg=VALUES(rating_avg), rating_count=VALUES(rating_count), attributes=VALUES(attributes);

-- 3. Lợn Cắp Nách Nướng Than Hoa
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description,
                   region_id, address, latitude, longitude, access_note,
                   price_ref_min, price_ref_max, price_unit_note,
                   visibility, operation_status, source_type, verification,
                   rating_avg, rating_count, attributes)
VALUES (103, 'lon-cap-nach-nuong-than-hoa', 3, 'CUISINE',
        'Lợn Cắp Nách Nướng Than Hoa', 'lon cap nach nuong than hoa',
        'Giống lợn đen nhỏ chỉ 5-8kg chạy rông trong rừng — thịt chắc, ngọt đậm. Nướng nguyên con trên than hồi pơ mu, ướp muối đá ớt rừng, xả bản — đặc sản không thể bỏ qua khi đến Mù Cang Chải.',
        5, 'Các bản La Pán Tẩn, Xã La Pán Tẩn, Mù Cang Chải', 21.8501, 104.0921,
        'Cần đặt trước 1 ngày để chủ nhà chuẩn bị. Thường phục vụ theo nhóm từ 4 người trở lên.',
        150000, 350000, '/ kg',
        'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED',
        4.9, 278,
        JSON_OBJECT(
            'coverImageUrl', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            'tagBadge', 'Đặc Sản Bản Địa',
            'origin', 'Người Mông — núi rừng Mù Cang Chải',
            'bestSeason', 'Quanh năm — đặc biệt mùa đông',
            'ingredients', 'Lợn đen bản, muối đá, ớt rừng, xả bản, lá chanh rừng',
            'pairing', 'Chấm với chẩm chéo và rau sống rừng',
            'openingHours', 'Theo đặt hẹn, thường phục vụ buổi tối',
            'note', 'Đặt trước tối thiểu 1 ngày; nhóm lớn nên đặt 2 ngày'
        ))
ON DUPLICATE KEY UPDATE
    name=VALUES(name), description=VALUES(description),
    price_ref_min=VALUES(price_ref_min), price_ref_max=VALUES(price_ref_max),
    rating_avg=VALUES(rating_avg), rating_count=VALUES(rating_count), attributes=VALUES(attributes);

-- 4. Cá Hồi và Cá Tầm Vùng Cao Khau Phạ
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description,
                   region_id, address, latitude, longitude, access_note,
                   price_ref_min, price_ref_max, price_unit_note,
                   visibility, operation_status, source_type, verification,
                   rating_avg, rating_count, attributes)
VALUES (104, 'ca-hoi-ca-tam-khau-pha', 3, 'CUISINE',
        'Cá Hồi và Cá Tầm Vùng Cao Khau Phạ', 'ca hoi ca tam khau pha',
        'Nước suối đầu nguồn mát lạnh từ đỉnh đèo Khau Phạ tạo môi trường lý tưởng nuôi cá hồi và cá tầm. Thịt cá chắc, đỏ hồng, không tanh — nướng muối ớt, hấp gừng hoặc làm sashimi tươi ngay tại trang trại.',
        9, 'Đèo Khau Phạ và trang trại cá nước lạnh, Mù Cang Chải', 21.7428, 104.3198,
        'Một số trang trại cho phép tự câu và chế biến ngay tại chỗ. Hỏi homestay để giới thiệu địa chỉ uy tín.',
        120000, 280000, '/ kg',
        'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED',
        4.8, 195,
        JSON_OBJECT(
            'coverImageUrl', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
            'tagBadge', 'Trang Trại Núi',
            'origin', 'Trang trại cá nước lạnh đầu nguồn suối Khau Phạ',
            'bestSeason', 'Quanh năm — mùa đông cá béo nhất',
            'ingredients', 'Cá hồi / cá tầm nuôi nước lạnh, sả, gừng, ớt hiểm rừng',
            'pairing', 'Ăn kèm cơm nếp nương hấp lá chuối',
            'openingHours', '09:00 - 20:00 (nên đặt trước 1-2 tiếng)',
            'note', 'Cá tươi hàng ngày; có thể mua cá tươi về homestay tự chế biến'
        ))
ON DUPLICATE KEY UPDATE
    name=VALUES(name), description=VALUES(description),
    price_ref_min=VALUES(price_ref_min), price_ref_max=VALUES(price_ref_max),
    rating_avg=VALUES(rating_avg), rating_count=VALUES(rating_count), attributes=VALUES(attributes);

-- 5. Xôi Ngũ Sắc Người Thái Trắng
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description,
                   region_id, address, latitude, longitude, access_note,
                   price_ref_min, price_ref_max, price_unit_note,
                   visibility, operation_status, source_type, verification,
                   rating_avg, rating_count, attributes)
VALUES (105, 'xoi-ngu-sac-nguoi-thai', 3, 'CUISINE',
        'Xôi Ngũ Sắc Người Thái Trắng', 'xoi ngu sac nguoi thai trang',
        'Năm màu sắc — trắng (nếp tự nhiên), đen (lá cơm lam), đỏ (gấc), vàng (nghệ tươi), xanh (lá dứa). Xôi được đồ trong chõ gỗ pơ mu theo truyền thống người Thái Trắng bản Lìm Mông, dẻo thơm nguyên bản.',
        11, 'Bản Lìm Mông, Xã Tú Lệ, Văn Chấn, Yên Bái', 21.7512, 104.3184,
        'Thường được chế biến sẵn buổi sáng sớm. Nhiều homestay phục vụ kèm bữa sáng theo yêu cầu.',
        25000, 50000, '/ phần',
        'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED',
        4.8, 342,
        JSON_OBJECT(
            'coverImageUrl', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
            'tagBadge', 'Văn Hóa Thái',
            'origin', 'Người Thái Trắng — Tú Lệ và Bản Lìm Mông',
            'bestSeason', 'Quanh năm, đặc biệt dịp lễ hội',
            'ingredients', 'Nếp nương, lá dứa, nghệ tươi, lá cơm lam, gấc rừng',
            'pairing', 'Ăn kèm muối vừng hoặc ruốc thịt bản',
            'openingHours', 'Buổi sáng 06:00 - 09:00',
            'note', 'Nhiều homestay phục vụ miễn phí kèm bữa sáng truyền thống'
        ))
ON DUPLICATE KEY UPDATE
    name=VALUES(name), description=VALUES(description),
    price_ref_min=VALUES(price_ref_min), price_ref_max=VALUES(price_ref_max),
    rating_avg=VALUES(rating_avg), rating_count=VALUES(rating_count), attributes=VALUES(attributes);

-- 6. Rượu Ngô Nấu Thủ Công Tú Lệ
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description,
                   region_id, address, latitude, longitude, access_note,
                   price_ref_min, price_ref_max, price_unit_note,
                   visibility, operation_status, source_type, verification,
                   rating_avg, rating_count, attributes)
VALUES (106, 'ruou-ngo-nau-thu-cong-tu-le', 3, 'CUISINE',
        'Rượu Ngô Nấu Thủ Công Tú Lệ', 'ruou ngo nau thu cong tu le',
        'Rượu ngô Tú Lệ — men lá rừng cổ truyền ủ 3-5 ngày, cất qua nồi đồng thủ công. Nồng độ tự nhiên 40-45 độ, hương thơm lúa ngô núi, vị êm không gắt. Người Thái dùng trong mọi lễ hội và đón khách quý.',
        11, 'Bản Nậm Khắt và Bản Lìm Mông, Tú Lệ, Văn Chấn, Yên Bái', 21.7490, 104.3115,
        'Mua trực tiếp tại các hộ nấu rượu truyền thống hoặc qua chủ homestay giới thiệu.',
        50000, 150000, '/ lít',
        'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED',
        4.7, 228,
        JSON_OBJECT(
            'coverImageUrl', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
            'tagBadge', 'Đặc Sản Bản Địa',
            'origin', 'Người Thái Trắng — Tú Lệ',
            'bestSeason', 'Quanh năm',
            'ingredients', 'Ngô nương, men lá rừng, nước suối đầu nguồn',
            'pairing', 'Uống kèm thắng cố ngựa hoặc thịt trâu gác bếp',
            'openingHours', '07:00 - 19:00 tại hộ',
            'note', 'Có thể mua mang về; đóng chai thủy tinh kín, bảo quản nơi thoáng mát'
        ))
ON DUPLICATE KEY UPDATE
    name=VALUES(name), description=VALUES(description),
    price_ref_min=VALUES(price_ref_min), price_ref_max=VALUES(price_ref_max),
    rating_avg=VALUES(rating_avg), rating_count=VALUES(rating_count), attributes=VALUES(attributes);

-- 7. Thịt Trâu Gác Bếp Khói Người Mông
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description,
                   region_id, address, latitude, longitude, access_note,
                   price_ref_min, price_ref_max, price_unit_note,
                   visibility, operation_status, source_type, verification,
                   rating_avg, rating_count, attributes)
VALUES (107, 'thit-trau-gac-bep-khoi-nguoi-mong', 3, 'CUISINE',
        'Thịt Trâu Gác Bếp Khói Người Mông', 'thit trau gac bep khoi nguoi mong',
        'Trâu bản được thái thành thanh dài, tẩm ướp ớt rừng, muối hạt, gừng tươi, xả bản rồi gác lên giàn bếp củi hun khói 3-5 ngày. Thịt săn, đậm đà mùi khói thơm — đặc sản quà tặng số 1 từ Mù Cang Chải.',
        7, 'Bản Chế Cu Nha, Xã Chế Cu Nha, Mù Cang Chải, Yên Bái', 21.9021, 104.1156,
        'Bán tại hộ dân hoặc chợ phiên thứ 7. Nên mua đủ dùng vì về đồng bằng giá tăng 2-3 lần.',
        200000, 450000, '/ kg',
        'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED',
        4.9, 394,
        JSON_OBJECT(
            'coverImageUrl', 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
            'tagBadge', 'Quà Tặng Số 1',
            'origin', 'Người Mông — Chế Cu Nha và Mù Cang Chải',
            'bestSeason', 'Quanh năm — sản xuất thủ công truyền thống',
            'ingredients', 'Thịt trâu tươi, ớt rừng, muối đá, gừng, xả, lá rừng thơm',
            'pairing', 'Nướng lại trên than hoặc áp chảo với dầu lạc trước khi ăn',
            'openingHours', 'Chợ phiên thứ 7; hộ dân: 07:00 - 17:00',
            'note', 'Bảo quản nơi khô thoáng, tránh ẩm; hút chân không dùng được 3 tháng'
        ))
ON DUPLICATE KEY UPDATE
    name=VALUES(name), description=VALUES(description),
    price_ref_min=VALUES(price_ref_min), price_ref_max=VALUES(price_ref_max),
    rating_avg=VALUES(rating_avg), rating_count=VALUES(rating_count), attributes=VALUES(attributes);

-- 8. Mật Ong Rừng Nguyên Chất Mù Cang Chải
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description,
                   region_id, address, latitude, longitude, access_note,
                   price_ref_min, price_ref_max, price_unit_note,
                   visibility, operation_status, source_type, verification,
                   rating_avg, rating_count, attributes)
VALUES (108, 'mat-ong-rung-nguyen-chat-mcc', 3, 'CUISINE',
        'Mật Ong Rừng Nguyên Chất Mù Cang Chải', 'mat ong rung nguyen chat mu cang chai',
        'Mật ong hoa rừng tự nhiên — ong khoái, ong mật bản địa lấy nhụy từ hoa rừng nguyên sinh Chế Tạo, Nậm Khắt độ cao 1000-1800m. Màu vàng hổ phách trong, độ đặc cao. Không pha trộn, không đun sôi — nguyên sơ nhất Tây Bắc.',
        10, 'Xã Nậm Khắt và Chế Tạo, Mù Cang Chải, Yên Bái', 21.9445, 104.0872,
        'Mua trực tiếp tại hộ nuôi ong hoặc chợ phiên thứ 7. Hỏi chủ homestay để được dẫn tận nguồn.',
        200000, 500000, '/ lít',
        'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED',
        5.0, 267,
        JSON_OBJECT(
            'coverImageUrl', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
            'tagBadge', 'Quà Tặng Thiên Nhiên',
            'origin', 'Ong khoái rừng nguyên sinh Chế Tạo và Nậm Khắt',
            'bestSeason', 'Tháng 3-5 hoa xuân và tháng 9-10 hoa thu',
            'ingredients', '100% mật hoa rừng nguyên chất, không phụ gia',
            'pairing', 'Pha trà gừng, bôi bánh mì hoặc uống thẳng với nước ấm',
            'openingHours', '07:00 - 17:00 theo vụ thu hoạch',
            'note', 'Mật thật kết tinh sau vài tuần bảo quản và không tan ngay trong nước lạnh'
        ))
ON DUPLICATE KEY UPDATE
    name=VALUES(name), description=VALUES(description),
    price_ref_min=VALUES(price_ref_min), price_ref_max=VALUES(price_ref_max),
    rating_avg=VALUES(rating_avg), rating_count=VALUES(rating_count), attributes=VALUES(attributes);



-- ============================================================================
-- PATCH: Thêm dịch vụ vận chuyển bản địa (insert_transport_data.sql)
-- ============================================================================
-- File script an toàn: Dùng INSERT ... ON DUPLICATE KEY UPDATE để tránh lỗi trùng lặp khi chạy lại nhiều lần

-- 1. Cập nhật nhóm cho các nhà xe liên tỉnh hiện tại
UPDATE place SET 
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.categoryGroup', 'INTERCITY_BUS', '$.categoryGroupName', 'Xe khách & Limousine liên tỉnh')
WHERE id IN (62, 63, 64, 65, 66, 67, 68, 69, 70, 71);

-- 2. Cập nhật nhóm cho các xe ghép hiện tại
UPDATE place SET 
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.categoryGroup', 'SHARED_CAR', '$.categoryGroupName', 'Xe ghép liên xã & bán tải')
WHERE id IN (72, 73, 74, 75);

-- 3. Bổ sung các dịch vụ xe ôm & di chuyển (Dùng ON DUPLICATE KEY UPDATE để idempotent)

-- STT 1: Đội xe ôm bản địa chở lên Đồi Móng Ngựa
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description, region_id, address, latitude, longitude, access_note, price_ref_min, price_ref_max, price_unit_note, visibility, operation_status, source_type, verification, rating_avg, rating_count, attributes)
VALUES (82, 'doi-xe-om-ban-dia-doi-mong-ngua', 7, 'TRANSPORT', 
'Đội Xe Ôm Bản Địa — Lên Đồi Móng Ngựa', 'doi xe om ban dia len doi mong ngua',
'Đội xe ôm bản địa chuyên chở du khách từ chân dốc đất đá dựng đứng ngã ba lên tận đỉnh Đồi Móng Ngựa ngắm hoàng hôn rực rỡ. Tay lái siêu luyện, đổ dốc cua tay áo cực nhanh và tự tin.',
9, 'Chân dốc Đồi Móng Ngựa, Xã Mồ Dề, Mù Cang Chải', 21.881200, 104.061200, 
'Đường dốc đứng sát vực hiểm trở, đường đất đá trơn trượt 2-3 km, du khách không nên tự lái xe ga/xe số nếu tay lái yếu.',
60000, 100000, 'khứ hồi', 'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED', 4.8, 142,
JSON_OBJECT(
    'categoryGroup', 'LOCAL_MOTO',
    'categoryGroupName', 'Xe ôm bản địa vượt dốc',
    'vehicleType', 'Xe ôm số chuyên leo dốc đất',
    'distance', 'Khoảng 2 - 3 km từ chân dốc lên đỉnh',
    'duration', 'Khoảng 15 - 20 phút/chuyến',
    'routeSchedule', 'Chân dốc ↔ Đỉnh Đồi Móng Ngựa (60.000đ - 100.000đ/khứ hồi)',
    'positiveReview', 'Tay lái điêu luyện, đổ dốc cua tay áo cực nhanh, quen đường dốc đứng.',
    'negativeReview', 'Đường dốc sát vực, mùa cao điểm giá có thể đẩy lên 120k - 150k lúc hoàng hôn.',
    'painPointNote', 'Khách dễ bị chém giá mùa cao điểm; cảm giác an toàn thấp khi ngồi sau nếu chưa quen.',
    'coverImageUrl', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'
))
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), description = VALUES(description), price_ref_min = VALUES(price_ref_min), price_ref_max = VALUES(price_ref_max), attributes = VALUES(attributes);

-- STT 2: Đội xe ôm bản địa Đồi Mâm Xôi (La Pán Tẩn)
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description, region_id, address, latitude, longitude, access_note, price_ref_min, price_ref_max, price_unit_note, visibility, operation_status, source_type, verification, rating_avg, rating_count, attributes)
VALUES (83, 'doi-xe-om-doi-mam-xoi-la-pan-tan', 7, 'TRANSPORT', 
'Đội Xe Ôm Bản Địa — Đồi Mâm Xôi (La Pán Tẩn)', 'doi xe om ban dia doi mam xoi la pan tan',
'Trung chuyển du khách từ ngã ba đường lớn leo dốc lên mâm xôi (La Pán Tẩn). Tiết kiệm thời gian và sức lực so với đi bộ leo dốc 2-3km đường đất trơn trượt.',
5, 'Ngã ba đường lớn vào Đồi Mâm Xôi, Xã La Pán Tẩn', 21.850120, 104.092100,
'Tập trung tại ngã ba đường lớn rẽ vào Mâm Xôi. Có áo đồng phục hoặc thẻ đội xe ôm tự quản.',
60000, 100000, 'khứ hồi', 'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED', 4.7, 185,
JSON_OBJECT(
    'categoryGroup', 'LOCAL_MOTO',
    'categoryGroupName', 'Xe ôm bản địa vượt dốc',
    'vehicleType', 'Xe Wave/Sirius leo đồi đất',
    'distance', 'Khoảng 2 - 3 km từ ngã ba vào đồi Mâm Xôi',
    'duration', 'Khoảng 15 - 20 phút/chuyến',
    'routeSchedule', 'Ngã ba La Pán Tẩn ↔ Đồi Mâm Xôi (60.000đ - 100.000đ/khứ hồi)',
    'positiveReview', 'Tiết kiệm sức lực tối đa, tài xế bản địa thân thiện, lái chắc tay.',
    'negativeReview', 'Tình trạng chèo kéo khách ngay từ ngã ba đường lớn gây hỗn loạn, bối rối.',
    'painPointNote', 'Khách bối rối không biết đâu là đội xe ôm chính thức của bản, dễ bị chèo kéo ép giá.',
    'coverImageUrl', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'
))
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), description = VALUES(description), price_ref_min = VALUES(price_ref_min), price_ref_max = VALUES(price_ref_max), attributes = VALUES(attributes);

-- STT 3: Dịch vụ xe ôm tour bản địa qua Homestay
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description, region_id, address, latitude, longitude, access_note, price_ref_min, price_ref_max, price_unit_note, visibility, operation_status, source_type, verification, rating_avg, rating_count, attributes)
VALUES (84, 'dich-vu-xe-om-tour-qua-homestay', 7, 'TRANSPORT', 
'Dịch Vụ Xe Ôm Tour Bản Địa (Đặt Qua Homestay)', 'dich vu xe om tour ban dia dat qua homestay',
'Dịch vụ xe ôm bản địa chở khách đi các điểm ruộng bậc thang thông qua homestay kết nối và bảo lãnh đặt trước. Lái xe chắc tay, thông thuộc đường đi vào các góc lúa đẹp nhất.',
4, 'Đón trả tận nơi tại tất cả Homestay trên địa bàn Mù Cang Chải', 21.858500, 104.084100,
'Khách hàng chỉ cần báo trước với chủ Homestay khoảng 30 phút để sắp xếp tài xế uy tín trong bản.',
250000, 350000, 'lượt (3h)', 'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED', 4.9, 96,
JSON_OBJECT(
    'categoryGroup', 'TOUR_MOTO',
    'categoryGroupName', 'Xe ôm tour & ghép đoàn',
    'vehicleType', 'Xe ôm du lịch hợp đồng theo tour',
    'distance', 'Tùy tuyến quanh điểm ruộng bậc thang (10 - 20 km)',
    'duration', 'Trọn gói 2 - 3 tiếng (Phụ thu 100k/giờ nếu quá giờ)',
    'routeSchedule', 'Homestay ↔ Các điểm danh thắng (250.000đ/lượt 3h)',
    'positiveReview', 'Lái xe chắc tay, kiêm hướng dẫn viên chỉ các góc chụp đẹp không mất phí.',
    'negativeReview', 'Homestay phát sinh phụ phí quá giờ sử dụng mà không báo trước rõ ràng.',
    'painPointNote', 'Thiếu quy định niêm yết thời gian sử dụng và khung giá rõ ràng từ đầu, dễ tranh cãi.',
    'coverImageUrl', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'
))
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), description = VALUES(description), price_ref_min = VALUES(price_ref_min), price_ref_max = VALUES(price_ref_max), attributes = VALUES(attributes);

-- STT 4: Thuê xe máy tự lái Hùng Nga (Thị trấn / Ngã Ba Kim)
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description, region_id, address, latitude, longitude, access_note, price_ref_min, price_ref_max, price_unit_note, visibility, operation_status, source_type, verification, rating_avg, rating_count, attributes)
VALUES (85, 'thue-xe-may-tu-lai-hung-nga', 7, 'TRANSPORT', 
'Thuê Xe Máy Tự Lái Hùng Nga (Ngã 3 Kim & TT Mù Cang Chải)', 'thue xe may tu lai hung nga nga 3 kim tt mu cang chai',
'Cho thuê xe số Wave, Sirius, Winner, Exciter chuyên bảo dưỡng định kỳ để du khách tự phượt qua các xã, đèo dốc. Nhận xe tận nơi tại khách sạn, bến xe, thủ tục nhanh gọn chỉ giữ CCCD.',
11, 'Ngã 3 Kim, Xã Púng Luông & TT Mù Cang Chải', 21.824200, 104.109800,
'Cơ sở có 2 điểm nhận xe tại Ngã 3 Kim (thuận tiện cho khách đi xe khách đêm xuống) và trung tâm thị trấn.',
150000, 250000, 'ngày', 'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED', 4.8, 210,
JSON_OBJECT(
    'categoryGroup', 'SELF_DRIVE',
    'categoryGroupName', 'Thuê xe tự lái (Xe máy / Ô tô)',
    'vehicleType', 'Xe số & Côn tay Wave, Sirius, Winner',
    'distance', 'Tự do phượt toàn huyện và các cung đèo',
    'duration', 'Tính theo ngày (24 giờ)',
    'routeSchedule', 'Giao xe tận nơi Bến xe, Homestay, Ngã 3 Kim',
    'positiveReview', 'Giao xe tận nơi, xe bảo dưỡng tốt máy khoẻ, thủ tục giữ CCCD nhanh gọn.',
    'negativeReview', 'Vào mùa đông khách một số xe cũ cần kiểm tra kỹ phanh và lốp trước khi nhận.',
    'painPointNote', 'Rủi ro kỹ thuật xe (phanh, lốp, máy) khi đổ đèo dốc nếu không kiểm tra kỹ.',
    'coverImageUrl', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'
))
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), description = VALUES(description), price_ref_min = VALUES(price_ref_min), price_ref_max = VALUES(price_ref_max), attributes = VALUES(attributes);

-- STT 6: Đội xe ôm vào Rừng Trúc Nả Háng Tủa (Púng Luông)
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description, region_id, address, latitude, longitude, access_note, price_ref_min, price_ref_max, price_unit_note, visibility, operation_status, source_type, verification, rating_avg, rating_count, attributes)
VALUES (86, 'doi-xe-om-rung-truc-na-hang-tua', 7, 'TRANSPORT', 
'Đội Xe Ôm Bản Địa — Rừng Trúc Nả Háng Tủa', 'doi xe om ban dia rung truc na hang tua',
'Dịch vụ xe ôm đưa đón qua đoạn đường đất gập ghềnh đá hộc vào rừng trúc Púng Luông (Nả Háng Tủa). Tay lái cứng, quen đường núi địa hình hiểm trở.',
11, 'Khu vực Bản Nả Háng Tủa, Xã Púng Luông', 21.895400, 104.052100,
'Khoảng 5-7 km từ trung tâm xã Púng Luông vào rừng trúc, đường đất đá hộc gập ghềnh trơn trượt.',
80000, 120000, 'khứ hồi', 'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED', 4.7, 115,
JSON_OBJECT(
    'categoryGroup', 'LOCAL_MOTO',
    'categoryGroupName', 'Xe ôm bản địa vượt dốc',
    'vehicleType', 'Xe ôm bản địa vượt đá hộc',
    'distance', 'Khoảng 5 - 7 km đường xấu, đá hộc',
    'duration', 'Khoảng 20 - 30 phút/chuyến',
    'routeSchedule', 'Chân xã Púng Luông ↔ Rừng trúc Nả Háng Tủa (80.000đ - 120.000đ/khứ hồi)',
    'positiveReview', 'Tay lái cứng, quen đường dốc đá hộc gồ ghề, đưa đón đúng giờ.',
    'negativeReview', 'Đoạn đường xóc nảy người liên tục, đi xong về cảm giác ê ẩm mình mẩy.',
    'painPointNote', 'Đường quá xấu khiến du khách mệt mỏi thể chất sau chuyến đi.',
    'coverImageUrl', 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80'
))
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), description = VALUES(description), price_ref_min = VALUES(price_ref_min), price_ref_max = VALUES(price_ref_max), attributes = VALUES(attributes);

-- STT 7: Xe ôm & Taxi trung chuyển Ngã 3 Kim — Ngã 3 Ba Nhà
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description, region_id, address, latitude, longitude, access_note, price_ref_min, price_ref_max, price_unit_note, visibility, operation_status, source_type, verification, rating_avg, rating_count, attributes)
VALUES (87, 'xe-trung-chuyen-nga-3-kim-ba-nha', 7, 'TRANSPORT', 
'Xe Ôm & Taxi Trung Chuyển (Ngã 3 Kim — Ngã 3 Ba Nhà)', 'xe om taxi trung chuyen nga 3 kim nga 3 ba nha',
'Dịch vụ xe ôm/xe taxi dịch vụ đưa đón qua lại giữa các ngã ba trọng điểm di chuyển (Ngã 3 Kim, Ngã 3 Ba Nhà đi Mâm Xôi). Cực kỳ tiện lợi cho khách đi xe giường nằm xuống giữa đêm muộn về homestay.',
11, 'Ngã 3 Kim & Ngã 3 Ba Nhà, Quốc Lộ 32', 21.835000, 104.102000,
'Túc trực 24/7 đón các chuyến xe khách đêm từ Hà Nội lên lúc 2h - 4h sáng.',
30000, 50000, 'chuyến', 'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED', 4.6, 130,
JSON_OBJECT(
    'categoryGroup', 'LOCAL_MOTO',
    'categoryGroupName', 'Xe ôm bản địa vượt dốc',
    'vehicleType', 'Xe máy & Taxi 4-7 chỗ trung chuyển',
    'distance', 'Khoảng 3 - 5 km giữa các ngã ba',
    'duration', 'Khoảng 10 - 15 phút/chuyến',
    'routeSchedule', 'Ngã 3 Kim ↔ Ngã 3 Ba Nhà ↔ Homestay (30.000đ - 50.000đ/lượt)',
    'positiveReview', 'Tiện lợi cho khách đi xe giường nằm xuống lúc nửa đêm hoặc sáng sớm.',
    'negativeReview', 'Thường xuyên ép giá vào các khung giờ đêm muộn 2h - 4h sáng.',
    'painPointNote', 'Khách đến nơi giữa đêm không có lựa chọn nào khác nên dễ bị ép giá trung chuyển.',
    'coverImageUrl', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'
))
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), description = VALUES(description), price_ref_min = VALUES(price_ref_min), price_ref_max = VALUES(price_ref_max), attributes = VALUES(attributes);

-- STT 8: Dịch vụ thuê xe ô tô 2 cầu bán tải có tài xế bản địa
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description, region_id, address, latitude, longitude, access_note, price_ref_min, price_ref_max, price_unit_note, visibility, operation_status, source_type, verification, rating_avg, rating_count, attributes)
VALUES (88, 'thue-xe-ban-tai-2-cau-co-tai-xe', 7, 'TRANSPORT', 
'Dịch Vụ Thuê Xe Ô Tô 2 Cầu Bán Tải (Kèm Tài Xế Bản Địa)', 'dich vu thue xe o to 2 cau ban tai kem tai xe ban dia',
'Dịch vụ thuê xe 2 cầu bán tải kèm tài xế bản địa chuyên sâu vào bản xa như Lao Chải, Dế Xu Phình, Chế Tạo. An toàn, đi được nhóm đông người trong thời tiết mưa gió lầy lội.',
2, 'Trung tâm Thị trấn Mù Cang Chải (Đón các xã)', 21.859500, 104.084500,
'Chuyên tuyến đường đồi hiểm trở, lầy lội mùa mưa lúa chín mà xe gầm thấp không vào được.',
800000, 1200000, 'ngày', 'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED', 4.9, 78,
JSON_OBJECT(
    'categoryGroup', 'SELF_DRIVE',
    'categoryGroupName', 'Thuê xe tự lái (Xe máy / Ô tô)',
    'vehicleType', 'Xe bán tải 2 cầu 4x4 gầm cao (Hilux, Ranger)',
    'distance', 'Tùy tuyến (Lao Chải, Dế Xu Phình cách TT 10-15 km)',
    'duration', 'Trọn gói theo ngày, linh hoạt dừng đỗ chụp ảnh',
    'routeSchedule', 'Thị trấn Mù Cang Chải ↔ Lao Chải, Chế Tạo, Dế Xu Phình',
    'positiveReview', 'An toàn tuyệt đối, đi được nhóm 4-5 người, xe vượt lầy xuất sắc.',
    'negativeReview', 'Số lượng xe rất ít, khó đặt nếu không liên hệ trước nhiều tuần vào mùa lúa.',
    'painPointNote', 'Khó tiếp cận nguồn cung vì thiếu kênh niêm yết tập trung.',
    'coverImageUrl', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
))
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), description = VALUES(description), price_ref_min = VALUES(price_ref_min), price_ref_max = VALUES(price_ref_max), attributes = VALUES(attributes);

-- STT 9: Xe ôm ghép đoàn phượt đường dài
INSERT INTO place (id, slug, category_id, kind, name, name_norm, description, region_id, address, latitude, longitude, access_note, price_ref_min, price_ref_max, price_unit_note, visibility, operation_status, source_type, verification, rating_avg, rating_count, attributes)
VALUES (89, 'xe-om-ghep-doan-phuot-duong-dai', 7, 'TRANSPORT', 
'Dịch Vụ Xe Ôm Ghép Đoàn Phượt Bản Địa Cả Ngày', 'dich vu xe om ghep doan phuot ban dia ca ngay',
'Thuê xế ôm bản địa đi cùng đoàn cả ngày qua nhiều điểm tham quan (Mâm Xôi, Móng Ngựa, La Pán Tẩn, Tú Lệ). Tài xế kiêm hướng dẫn viên chỉ các góc chụp đẹp, thông thuộc địa hình.',
2, 'Đón tận nơi tại Khách sạn/Homestay toàn huyện Mù Cang Chải', 21.859100, 104.084900,
'Khách được trang bị mũ bảo hiểm chuẩn, hướng dẫn chi tiết lịch trình phượt.',
300000, 400000, 'ngày/người', 'PUBLISHED', 'OPERATING', 'PUBLIC_TRUSTED', 'VERIFIED', 4.9, 105,
JSON_OBJECT(
    'categoryGroup', 'TOUR_MOTO',
    'categoryGroupName', 'Xe ôm tour & ghép đoàn',
    'vehicleType', 'Xe số địa phương kèm tài xế bản địa cả ngày',
    'distance', 'Trọn gói cả ngày, hành trình 40 - 80 km',
    'duration', 'Trọn gói 8 - 9 tiếng (Bao gồm dừng chụp ảnh)',
    'routeSchedule', 'Khám phá trọn gói Mâm Xôi, Móng Ngựa, Rừng Trúc, Lìm Mông',
    'positiveReview', 'Tài xế kiêm thợ chụp ảnh có tâm, rành từng ngóc ngách bản làng.',
    'negativeReview', 'Một số xế trẻ chạy khá ẩu trên đường đèo, cần thỏa thuận tốc độ trước.',
    'painPointNote', 'Cần kiểm tra kỹ trang bị bảo hộ, mũ bảo hiểm đạt chuẩn an toàn cho khách.',
    'coverImageUrl', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'
))
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), description = VALUES(description), price_ref_min = VALUES(price_ref_min), price_ref_max = VALUES(price_ref_max), attributes = VALUES(attributes);

-- Cập nhật Contact điện thoại cho Hùng Nga (STT 4)
INSERT INTO place_contact (id, place_id, channel, value, is_public, sort_order)
VALUES (93, 85, 'PHONE', '0914504688', 1, 0)
ON DUPLICATE KEY UPDATE value = VALUES(value);

INSERT INTO place_contact (id, place_id, channel, value, is_public, sort_order)
VALUES (94, 85, 'PHONE', '092490468x', 1, 1)
ON DUPLICATE KEY UPDATE value = VALUES(value);


-- ============================================================================
-- PATCH: Cập nhật ảnh, rating và festival occurrences (update_places_and_festivals.sql)
-- ============================================================================
-- 1. Insert festival occurrences cho 5 lễ hội trong năm 2026
DELETE FROM festival_occurrence WHERE id > 0;

-- 5: Mùa Vàng Khám Phá Ruộng Bậc Thang (Tháng 9 - 10)
INSERT INTO festival_occurrence (festival_id, period_start, period_end, is_estimated, note)
VALUES (5, '2026-09-12', '2026-10-18', 0, 'Chương trình chính: Khai mạc Festival Mùa Vàng & Dù lượn Bay trên mùa vàng tại đèo Khau Phạ');

-- 2: Lễ Hội Mừng Cơm Mới (Tháng 9 - 11)
INSERT INTO festival_occurrence (festival_id, period_start, period_end, is_estimated, note)
VALUES (2, '2026-09-20', '2026-11-15', 0, 'Nghi lễ tạ ơn cơm mới và giã cốm nếp nương Tú Lệ rộn rã khắp bản Lìm Mông, Nậm Khắt');

-- 3: Festival Khèn Mông (Tháng 12 - 2)
INSERT INTO festival_occurrence (festival_id, period_start, period_end, is_estimated, note)
VALUES (3, '2026-12-20', '2027-01-15', 0, 'Hội thi tiếng khèn gọi bạn và hội diễn nghệ thuật dân gian Mông tại sân vận động Mù Cang Chải');

-- 4: Lễ Hội Hoa Tớ Dày (Tháng 12 - 1)
INSERT INTO festival_occurrence (festival_id, period_start, period_end, is_estimated, note)
VALUES (4, '2026-12-15', '2027-01-20', 0, 'Ngắm hoa đào rừng Tớ Dày nở đỏ rực các triền đồi Nậm Khắt, La Pán Tẩn, Púng Luông');

-- 1: Lễ Hội Gầu Tào (Tháng 1 - 2 Âm lịch / Mùa xuân)
INSERT INTO festival_occurrence (festival_id, period_start, period_end, is_estimated, note)
VALUES (1, '2027-02-05', '2027-02-25', 0, 'Lễ hội cầu phúc, dựng cây nêu linh thiêng của đồng bào Mông tại Dế Xu Phình & Chế Cu Nha');


-- 2. Cập nhật ảnh chất lượng cao và rating cho RESTAURANTS
UPDATE place SET 
    rating_avg = 4.8, rating_count = 124,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Đặc sản Tây Bắc, Lợn bản nướng', '$.openingHours', '07:00 - 22:30')
WHERE id = 49; -- Quyền Hương

UPDATE place SET 
    rating_avg = 4.7, rating_count = 98,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Cơm lam, Gà đồi nướng mọi', '$.openingHours', '06:30 - 22:00')
WHERE id = 50; -- Mạnh Thơm

UPDATE place SET 
    rating_avg = 4.9, rating_count = 156,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Lẩu cá tầm, Cá hồi Khau Phạ', '$.openingHours', '08:00 - 23:00')
WHERE id = 51; -- Tuấn Thuý

UPDATE place SET 
    rating_avg = 4.6, rating_count = 82,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Ẩm thực gia đình vùng cao', '$.openingHours', '07:00 - 21:30')
WHERE id = 52; -- Thắng Dung

UPDATE place SET 
    rating_avg = 4.7, rating_count = 110,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Thịt trâu sấy, Rau dớn xào tỏi', '$.openingHours', '07:30 - 22:00')
WHERE id = 53; -- Hằng Béo

UPDATE place SET 
    rating_avg = 4.8, rating_count = 94,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Cơm bình dân & Lẩu bản', '$.openingHours', '06:00 - 22:00')
WHERE id = 54; -- A Tán Quán

UPDATE place SET 
    rating_avg = 4.6, rating_count = 76,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Đặc sản Tú Lệ & Gà chạy bộ', '$.openingHours', '07:00 - 22:00')
WHERE id = 55; -- Thuỳ Linh

UPDATE place SET 
    rating_avg = 4.9, rating_count = 189,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Đặc sản thịt thú rừng nuôi, Lợn cắp nách', '$.openingHours', '08:00 - 23:00')
WHERE id = 56; -- Vườn Đào

UPDATE place SET 
    rating_avg = 4.8, rating_count = 215,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Thắng cố ngựa truyền thống chuẩn vị Mông', '$.openingHours', '06:00 - 22:00')
WHERE id = 57; -- Thành Oanh Thắng Cố Ngựa

UPDATE place SET 
    rating_avg = 4.7, rating_count = 88,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Lẩu riêu cua bắp bò & đồ nướng đêm', '$.openingHours', '09:00 - 23:30')
WHERE id = 58; -- Nguyệt Thắng

UPDATE place SET 
    rating_avg = 4.5, rating_count = 65,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Cơm nếp nương, Canh rau rừng', '$.openingHours', '06:00 - 21:00')
WHERE id = 59; -- Thuật Hà

UPDATE place SET 
    rating_avg = 4.8, rating_count = 142,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Món ăn dân tộc Thái, Xôi ngũ sắc', '$.openingHours', '07:00 - 22:00')
WHERE id = 60; -- Quán ăn Mu Cang Chai

UPDATE place SET 
    rating_avg = 4.6, rating_count = 73,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', '$.cuisine', 'Ẩm thực đường phố, Đồ nướng than hoa', '$.openingHours', '10:00 - 23:00')
WHERE id = 61; -- Quán con khỉ


-- 3. Cập nhật ảnh chất lượng cao và rating cho ATTRACTIONS (Điểm đến danh thắng)
UPDATE place SET 
    rating_avg = 4.9, rating_count = 320,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', 'Miễn phí / Vé xe ôm bản địa', '$.bestTime', 'Sáng sớm 06:00 - 08:30')
WHERE id = 38; -- La Pán Tẩn

UPDATE place SET 
    rating_avg = 5.0, rating_count = 580,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', '20.000 VNĐ / Người', '$.bestTime', 'Bình minh hoặc hoàng hôn')
WHERE id = 39; -- Đồi Mâm Xôi

UPDATE place SET 
    rating_avg = 4.8, rating_count = 210,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1542159040-3b03f0b2f059?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', 'Miễn phí', '$.bestTime', '08:00 - 16:30')
WHERE id = 40; -- Chế Cu Nha

UPDATE place SET 
    rating_avg = 4.7, rating_count = 180,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', 'Miễn phí', '$.bestTime', 'Cả ngày')
WHERE id = 41; -- Dế Xu Phình

UPDATE place SET 
    rating_avg = 4.9, rating_count = 450,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', 'Miễn phí / Trải nghiệm dù lượn', '$.bestTime', '09:00 - 15:00 khi có nắng săn mây')
WHERE id = 42; -- Đèo Khau Phạ

UPDATE place SET 
    rating_avg = 4.8, rating_count = 310,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', 'Miễn phí', '$.bestTime', 'Tháng 9 - 11 mùa lúa và cốm mới')
WHERE id = 43; -- Thung lũng Tú Lệ

UPDATE place SET 
    rating_avg = 4.7, rating_count = 145,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', '15.000 VNĐ / Người', '$.bestTime', 'Mùa mưa hè & thu nước trong vắt')
WHERE id = 44; -- Thác Pú Nhu

UPDATE place SET 
    rating_avg = 4.8, rating_count = 195,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', '20.000 VNĐ / Người', '$.bestTime', '08:00 - 16:00')
WHERE id = 45; -- Thác Mơ

UPDATE place SET 
    rating_avg = 5.0, rating_count = 620,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', '20.000 VNĐ / Người', '$.bestTime', 'Hoàng hôn rực rỡ 16:30 - 17:45')
WHERE id = 46; -- Đồi Móng Ngựa

UPDATE place SET 
    rating_avg = 4.8, rating_count = 240,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', '30.000 VNĐ / Người', '$.bestTime', 'Sáng nắng rọi qua kẽ lá xanh mướt')
WHERE id = 47; -- Rừng Trúc

UPDATE place SET 
    rating_avg = 4.9, rating_count = 290,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80', '$.ticketPrice', 'Miễn phí', '$.bestTime', '06:00 - 09:00 săn mây cuồn cuộn')
WHERE id = 48; -- Sống Lưng Khủng Long


-- 4. Cập nhật ảnh chất lượng cao và rating cho TRANSPORT (Nhà xe, Limousine, Xe ghép)
UPDATE place SET 
    rating_avg = 4.8, rating_count = 135,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe giường nằm 40 chỗ VIP', '$.schedule', 'Hà Nội (Mỹ Đình) ↔ Mù Cang Chải (Hàng ngày)')
WHERE id = 62; -- Hà Trang

UPDATE place SET 
    rating_avg = 4.7, rating_count = 118,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe giường nằm cao cấp', '$.schedule', 'Xuất bến 19:30 & 21:00 đêm')
WHERE id = 63; -- Sơn Phương

UPDATE place SET 
    rating_avg = 4.8, rating_count = 142,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe cabin cung điện đôi & đơn', '$.schedule', 'Hà Nội ↔ Than Uyên - Mù Cang Chải')
WHERE id = 64; -- Hưng Thành

UPDATE place SET 
    rating_avg = 4.7, rating_count = 95,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe giường nằm 34 phòng VIP', '$.schedule', 'Mỹ Đình ↔ Yên Bái - Mù Cang Chải')
WHERE id = 65; -- Cường Lan

UPDATE place SET 
    rating_avg = 4.9, rating_count = 86,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe tour du lịch & xe ghép tiện chuyến', '$.schedule', 'Đón trả tận nơi tại Hà Nội & Homestay')
WHERE id = 66; -- Anh Khang Authentic

UPDATE place SET 
    rating_avg = 4.6, rating_count = 72,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe khách liên tỉnh', '$.schedule', 'Chạy chuyến ngày 06:30 & 13:00')
WHERE id = 67; -- Gia Khánh

UPDATE place SET 
    rating_avg = 4.7, rating_count = 80,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe giường nằm êm ái', '$.schedule', 'Chạy đêm đón tại ngã tư Nội Bài')
WHERE id = 68; -- Cường Lan 2

UPDATE place SET 
    rating_avg = 4.9, rating_count = 210,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Limousine Dcar 9-11 chỗ thương gia', '$.schedule', 'Hà Nội ↔ Mù Cang Chải mỗi 2 tiếng/chuyến')
WHERE id = 69; -- Nam Thắng Limousine

UPDATE place SET 
    rating_avg = 4.9, rating_count = 185,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Limousine ghế massage hạng nhất', '$.schedule', 'Đón tại Nhà Hát Lớn & Sân Bay Nội Bài')
WHERE id = 70; -- Golden Limousine

UPDATE place SET 
    rating_avg = 4.8, rating_count = 160,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Limousine 9 chỗ VIP đưa đón tận nơi', '$.schedule', 'Nhiều chuyến linh hoạt từ 06:00 đến 18:00')
WHERE id = 71; -- An Bình Limousine

UPDATE place SET 
    rating_avg = 4.8, rating_count = 115,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe 7 chỗ Xpander / Fortuner', '$.schedule', 'Kết nối TP Yên Bái ↔ Thị trấn Mù Cang Chải')
WHERE id = 72; -- Xe Ghép Yên Bái

UPDATE place SET 
    rating_avg = 4.7, rating_count = 89,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe gầm cao vào bản Chế Cu Nha', '$.schedule', 'Đưa đón vào tận homestay đồi cao')
WHERE id = 73; -- Xe ghép Yên Bái - Chế Cu Nha

UPDATE place SET 
    rating_avg = 4.8, rating_count = 68,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe bán tải 4x4 vượt địa hình Chế Tạo', '$.schedule', 'Chuyên tuyến mạo hiểm nguyên sinh Chế Tạo')
WHERE id = 74; -- Xe ghép Yên Bái - Chế Tạo

UPDATE place SET 
    rating_avg = 4.7, rating_count = 74,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80', '$.vehicleType', 'Xe 7 chỗ đưa đón Nậm Có - Tú Lệ', '$.schedule', 'Liên hệ trước 1 tiếng')
WHERE id = 75; -- Xe ghép Yên Bái - Nậm Có


-- 5. Cập nhật ảnh chất lượng cao và rating cho PHOTO & RENTAL (Tiện ích, Chụp ảnh, Cho thuê)
UPDATE place SET 
    rating_avg = 4.9, rating_count = 145,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', '$.serviceType', 'Chụp ảnh chuyên nghiệp & Quay Flycam 4K', '$.priceDetails', 'Từ 500.000 VNĐ / Set ảnh nghệ thuật')
WHERE id = 76; -- Điểm Săn Hoàng Hôn & Flycam Đồi Móng Ngựa

UPDATE place SET 
    rating_avg = 4.8, rating_count = 110,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', '$.serviceType', 'Make up bản địa, Chụp concept dân tộc Mông/Thái', '$.priceDetails', 'Combo trọn gói trang phục + Make up + Thợ ảnh')
WHERE id = 77; -- Tiệm Ảnh Bản Sắc Púng Luông

UPDATE place SET 
    rating_avg = 4.9, rating_count = 175,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', '$.serviceType', 'Điểm check-in xích đu, cối xay gió, cầu kính mini', '$.priceDetails', 'Vé vào cửa 30.000 VNĐ kèm nước uống')
WHERE id = 78; -- Góc Check-in Mùa Vàng La Pán Tẩn

UPDATE place SET 
    rating_avg = 4.9, rating_count = 230,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80', '$.rentalType', 'Trang phục Mông hoa, Thái duyên dáng, Áo chàm cổ', '$.priceDetails', 'Chỉ từ 50.000 VNĐ - 100.000 VNĐ / Bộ cả ngày')
WHERE id = 79; -- Tiệm Cho Thuê Trang Phục Dân Tộc Hoa Ban

UPDATE place SET 
    rating_avg = 4.8, rating_count = 320,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80', '$.rentalType', 'Xe Wave, Blade, XR150, Cào cào chuyên leo dốc', '$.priceDetails', 'Từ 150.000 VNĐ/ngày, tặng kèm áo mưa & bản đồ')
WHERE id = 80; -- Cho Thuê Xe Máy Phượt Cường Tới

UPDATE place SET 
    rating_avg = 4.9, rating_count = 165,
    attributes = JSON_SET(COALESCE(attributes, '{}'), '$.coverImageUrl', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80', '$.rentalType', 'Lều chống mưa 2-4-6 người, Túi ngủ, Bếp cồn nướng BBQ', '$.priceDetails', 'Combo trọn gói camping ngắm dải ngân hà')
WHERE id = 81; -- Cho Thuê Lều Trại Mâm Xôi Camp



-- ============================================================================
-- 6. THIẾT KẾ DỮ LIỆU ĐẦY ĐỦ CÁC BẢNG NGHIỆP VỤ (HOMESTAY, ROOM, BOOKING, PAYMENT, REVIEWS)
-- ============================================================================

-- 6.1 Cập nhật is_suitable_by_time, suitable_date_start, suitable_date_end cho các Điểm đến (ATTRACTION) & Ẩm thực (CUISINE)
-- Mùa thu lúa chín & mùa vàng (Tháng 9 - Tháng 10): Đồi Mâm Xôi, Đồi Móng Ngựa, La Pán Tẩn, Khau Phạ, Cốm Tú Lệ phù hợp nhất
UPDATE place SET 
    is_suitable_by_time = TRUE,
    suitable_date_start = '2026-09-10',
    suitable_date_end = '2026-10-25'
WHERE id IN (38, 39, 42, 43, 46, 76, 78, 101, 102);

UPDATE place SET 
    is_suitable_by_time = TRUE,
    suitable_date_start = '2026-09-10',
    suitable_date_end = '2026-10-25'
WHERE slug IN ('do-mam-xoi', 'doi-mong-ngua', 'ruong-bac-thang-la-pan-tan', 'deo-khau-pha', 'thung-lung-tu-le', 'com-nep-tan-tu-le');

-- Các điểm mùa đông / mùa hoa Tớ Dày (Tháng 12 - Tháng 1)
UPDATE place SET 
    is_suitable_by_time = FALSE,
    suitable_date_start = '2026-12-15',
    suitable_date_end = '2027-01-20'
WHERE slug IN ('rung-truc-na-hang-tua', 'thac-mo-mu-cang-chai', 'ban-che-tao');

-- 6.2 Cập nhật is_suitable_by_time và khoảng thời gian cho Homestays đang mùa đẹp
UPDATE place SET 
    is_suitable_by_time = TRUE,
    suitable_date_start = '2026-09-01',
    suitable_date_end = '2026-10-31'
WHERE id IN (1, 2, 4, 7, 8, 12, 15, 82, 83);

-- 6.2b Cập nhật is_suitable_by_time và khoảng thời gian cho Lễ hội (FESTIVAL)
-- Lễ hội Mùa Vàng & Cơm Mới (Tháng 9 - 11): đang vào mùa thích hợp nhất
UPDATE festival SET 
    is_suitable_by_time = TRUE,
    suitable_date_start = '2026-09-12',
    suitable_date_end = '2026-10-18'
WHERE slug = 'mua-vang-kham-pha-ruong-bac-thang';

UPDATE festival SET 
    is_suitable_by_time = TRUE,
    suitable_date_start = '2026-09-20',
    suitable_date_end = '2026-11-15'
WHERE slug = 'mung-com-moi';

-- Festival Khèn Mông & Hoa Tớ Dày (Mùa đông cuối năm)
UPDATE festival SET 
    is_suitable_by_time = FALSE,
    suitable_date_start = '2026-12-20',
    suitable_date_end = '2027-01-15'
WHERE slug = 'festival-khen-mong';

UPDATE festival SET 
    is_suitable_by_time = FALSE,
    suitable_date_start = '2026-12-15',
    suitable_date_end = '2027-01-20'
WHERE slug = 'hoa-to-day';

-- Lễ hội Gầu Tào (Mùa xuân)
UPDATE festival SET 
    is_suitable_by_time = FALSE,
    suitable_date_start = '2027-02-05',
    suitable_date_end = '2027-02-25'
WHERE slug = 'gau-tao';

-- 6.3 HỒ SƠ HOMESTAY (homestay_profile) & CHÍNH SÁCH HỦY (cancellation_policy)
INSERT INTO cancellation_policy (id, place_id, version, name, free_cancel_cutoff_hours, refund_on_late_cancel, content_text)
VALUES 
  (1, 1, 1, 'Chính sách Hủy Linh Hoạt (Bản Lìm Mông)', 24, 'FULL_REFUND', 'Miễn phí hủy trước 24 giờ so với thời điểm nhận phòng. Hủy sau 24h hoàn lại 0% phí đêm đầu.'),
  (2, 2, 1, 'Chính sách Hủy Tiêu Chuẩn (Pơ Mu Khau Phạ)', 48, 'FULL_REFUND', 'Miễn phí hủy trước 48 giờ. Hủy cận ngày chịu phạt 50% tiền cọc.'),
  (3, 4, 1, 'Chính sách Hủy Mùa Cao Điểm (Hello Mù Cang Chải)', 72, 'NO_REFUND', 'Miễn phí hủy trước 72 giờ. Trong vòng 72 giờ trước check-in không hoàn tiền.')
ON DUPLICATE KEY UPDATE name = VALUES(name), content_text = VALUES(content_text);

INSERT INTO homestay_profile (place_id, check_in_from, check_out_until, house_rules, surcharge_note, current_policy_id)
VALUES
  (1, '14:00:00', '12:00:00', 'Giữ im lặng sau 22:30. Không hút thuốc trong phòng ngủ gỗ Pơ Mu. Tôn trọng phong tục bản địa Thái.', 'Nhận phòng sớm trước 10:00 phụ thu 30% giá phòng.', 1),
  (2, '13:30:00', '11:30:00', 'Vui lòng cởi giày dép khi lên sàn gỗ. Sử dụng nước nóng tiết kiệm vào mùa lạnh.', 'Trẻ em dưới 6 tuổi ngủ chung cùng bố mẹ miễn phí.', 2),
  (4, '14:00:00', '12:00:00', 'Tắt các thiết bị sưởi ấm khi rời phòng. Không mang đồ ăn có mùi lên giường ngủ.', 'Phụ thu thêm người lớn thứ 3: 150.000 VNĐ/người/đêm.', 3)
ON DUPLICATE KEY UPDATE house_rules = VALUES(house_rules), surcharge_note = VALUES(surcharge_note);

-- 6.4 LOẠI PHÒNG (room_type) & GIƯỜNG (room_bed) & TIỆN ÍCH PHÒNG (room_amenity)
INSERT INTO room_type (id, place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status)
VALUES
  (1, 1, 'Phòng Bungalow View Ruộng Bậc Thang', 'Bungalow gỗ thông riêng biệt, cửa kính panorama bao trọn thung lũng lúa Cao Phạ.', 2, 4, 'YES', 28.5, 650000, 'ACTIVE'),
  (2, 1, 'Phòng Gia Đình Nhà Sàn Ấm Cúng', 'Phòng rộng rãi phù hợp gia đình 3-4 người, sàn gỗ tự nhiên, ban công đón nắng sớm.', 4, 2, 'YES', 36.0, 950000, 'ACTIVE'),
  (3, 1, 'Giường Đơn Tập Thể Nhà Sàn Cộng Đồng', 'Nệm êm ái trên sàn gỗ truyền thống, có rèm che riêng tư, chăn đệm thổ cẩm sạch sẽ.', 1, 12, 'NO', 70.0, 180000, 'ACTIVE'),
  (4, 2, 'Phòng Đôi Tiêu Chuẩn Gỗ Pơ Mu', 'Phòng ốp gỗ Pơ Mu thơm ngát, view nhìn thẳng ra dãy đèo Khau Phạ mây vờn.', 2, 3, 'YES', 24.0, 500000, 'ACTIVE'),
  (5, 2, 'Phòng Tập Thể Nhóm Phượt (4 Khách)', 'Trang bị 2 giường tầng thông minh, tủ để đồ cá nhân có khóa an toàn.', 4, 2, 'YES', 30.0, 700000, 'ACTIVE'),
  (6, 4, 'Phòng Deluxe Panorama Mù Cang Chải', 'Hạng phòng cao cấp nhất với ban công riêng, bồn tắm ngâm thảo dược ngắm hoàng hôn.', 2, 3, 'YES', 35.0, 850000, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), base_price = VALUES(base_price), total_room_count = VALUES(total_room_count);

INSERT INTO room_bed (id, room_type_id, bed_type, quantity)
VALUES
  (1, 1, 'DOUBLE', 1),
  (2, 2, 'DOUBLE', 1),
  (3, 2, 'SINGLE', 2),
  (4, 3, 'FLOOR_MATTRESS', 12),
  (5, 4, 'DOUBLE', 1),
  (6, 5, 'BUNK', 2),
  (7, 6, 'DOUBLE', 1)
ON DUPLICATE KEY UPDATE bed_type = VALUES(bed_type), quantity = VALUES(quantity);

-- Tiện ích phòng
INSERT IGNORE INTO room_amenity (room_type_id, amenity_id, value)
VALUES
  (1, 8, 'YES'), (1, 9, 'YES'), (1, 11, 'YES'),
  (2, 8, 'YES'), (2, 9, 'YES'),
  (4, 8, 'YES'), (4, 9, 'YES'),
  (6, 8, 'YES'), (6, 9, 'YES'), (6, 11, 'YES');

-- 6.5 GIÁ ĐẶC BIỆT DỊP LỄ HỘI (room_special_price)
INSERT INTO room_special_price (id, room_type_id, name, period_start, period_end, price, created_by)
VALUES
  (1, 1, 'Phụ thu Festival Mùa Vàng 2026', '2026-09-15', '2026-09-25', 850000, 1),
  (2, 6, 'Phụ thu Tuần Lễ Dù Lượn Khau Phạ', '2026-09-18', '2026-09-22', 1100000, 1)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- 6.6 TỒN KHO PHÒNG THEO NGÀY (room_inventory_day)
INSERT INTO room_inventory_day (room_type_id, stay_date, total_rooms, held_rooms, confirmed_rooms, stop_sell)
VALUES
  (1, '2026-09-24', 4, 1, 2, FALSE),
  (1, '2026-09-25', 4, 0, 3, FALSE),
  (1, '2026-09-26', 4, 0, 4, TRUE),
  (1, '2026-09-27', 4, 1, 1, FALSE),
  (2, '2026-09-24', 2, 0, 1, FALSE),
  (2, '2026-09-25', 2, 1, 1, FALSE),
  (4, '2026-09-24', 3, 0, 1, FALSE),
  (6, '2026-09-24', 3, 0, 2, FALSE)
ON DUPLICATE KEY UPDATE total_rooms = VALUES(total_rooms), confirmed_rooms = VALUES(confirmed_rooms);

-- 6.7 CỔNG THANH TOÁN (payment_gateway)
INSERT INTO payment_gateway (id, code, name, is_active)
VALUES
  (1, 'SEPAY', 'Chuyển khoản Ngân hàng Tự động (SEPay QR)', TRUE),
  (2, 'VNPAY', 'Cổng thanh toán điện tử VNPAY-QR', TRUE),
  (3, 'MOMO', 'Ví điện tử MoMo', TRUE),
  (4, 'BANK_TRANSFER', 'Chuyển khoản thủ công ủy nhiệm', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active);

-- 6.8 DANH SÁCH ĐƠN ĐẶT PHÒNG MẪU ĐA DẠNG TRẠNG THÁI (booking)
INSERT INTO booking (
  id, booking_code, place_id, room_type_id, provider_id, check_in, check_out,
  room_count, guest_count, guest_name, guest_phone, guest_email, guest_note,
  status, hold_expires_at, payment_deadline_at, currency, total_amount, policy_id, policy_snapshot,
  created_at, confirmed_at, closed_at, close_reason, closed_by_actor
) VALUES
  -- 1. CONFIRMED: Đã thanh toán và xác nhận lưu trú
  (1, 'VJ-882101', 1, 1, 1, '2026-09-24', '2026-09-26',
   1, 2, 'Nguyễn Hoàng Long', '0988123456', 'hoanglong.travel@gmail.com', 'Đoàn có mặt tầm 15:00 chiều, nhờ homestay chuẩn bị bữa tối cơm lam gà nướng.',
   'CONFIRMED', NULL, NULL, 'VND', 1300000, 1, JSON_OBJECT('policyName', 'Chính sách Hủy Linh Hoạt', 'freeCancelCutoffHours', 24),
   '2026-09-22 09:30:00', '2026-09-22 10:15:00', NULL, NULL, NULL),

  -- 2. PENDING: Đang chờ chủ homestay xác nhận giữ phòng
  (2, 'VJ-654320', 1, 2, 1, '2026-09-27', '2026-09-29',
   1, 4, 'Trần Thị Thu Hà', '0912987654', 'thuha.hanoi@outlook.com', 'Gia đình có 2 bé nhỏ, nhờ kê thêm chăn ấm và hướng dẫn chỗ săn mây đẹp.',
   'PENDING', '2026-09-24 18:00:00', NULL, 'VND', 1900000, 1, JSON_OBJECT('policyName', 'Chính sách Hủy Linh Hoạt', 'freeCancelCutoffHours', 24),
   '2026-09-23 20:00:00', NULL, NULL, NULL, NULL),

  -- 3. AWAITING_PAYMENT: Homestay đã chấp nhận, khách đang thanh toán QR qua SEPay
  (3, 'VJ-912834', 2, 4, 2, '2026-09-25', '2026-09-27',
   1, 2, 'Lê Quốc Bảo', '0977345678', 'baole.photo@yahoo.com', 'Phòng tầng 2 view thoáng ngắm đèo Khau Phạ.',
   'AWAITING_PAYMENT', '2026-09-24 12:00:00', '2026-09-24 09:15:00', 'VND', 1000000, 2, JSON_OBJECT('policyName', 'Chính sách Tiêu Chuẩn', 'freeCancelCutoffHours', 48),
   '2026-09-23 22:45:00', NULL, NULL, NULL, NULL),

  -- 4. COMPLETED: Kỳ nghỉ đã hoàn thành viên mãn
  (4, 'VJ-341908', 4, 6, 4, '2026-09-18', '2026-09-20',
   1, 2, 'Phạm Minh Tuấn', '0936555888', 'tuanpm.tech@gmail.com', 'Chuyến đi ngắm mùa vàng xuất sắc, cảm ơn homestay đã đón tiếp nồng hậu.',
   'COMPLETED', NULL, NULL, 'VND', 1700000, 3, JSON_OBJECT('policyName', 'Chính sách Mùa Cao Điểm', 'freeCancelCutoffHours', 72),
   '2026-09-15 14:20:00', '2026-09-15 14:40:00', '2026-09-20 12:00:00', 'Khách trả phòng đúng hạn', 'SYSTEM'),

  -- 5. CANCELLED: Khách hủy có lý do hoàn trả cọc
  (5, 'VJ-772190', 1, 1, 1, '2026-10-02', '2026-10-04',
   1, 2, 'Vũ Thu Thảo', '0904111222', 'thaovu.hn@gmail.com', 'Gặp việc bận đột xuất gia đình xin hủy lịch hẹn sang tháng sau.',
   'CANCELLED', NULL, NULL, 'VND', 1300000, 1, JSON_OBJECT('policyName', 'Chính sách Hủy Linh Hoạt', 'freeCancelCutoffHours', 24),
   '2026-09-20 11:00:00', '2026-09-20 11:30:00', '2026-09-21 08:30:00', 'Khách báo bận việc đột xuất trước 24h quy định', 'CUSTOMER')
ON DUPLICATE KEY UPDATE guest_name = VALUES(guest_name), status = VALUES(status);

-- 6.9 CHI TIẾT TỪNG ĐÊM NGHỈ (booking_night)
INSERT INTO booking_night (booking_id, stay_date, unit_price, room_count)
VALUES
  (1, '2026-09-24', 650000, 1),
  (1, '2026-09-25', 650000, 1),
  (2, '2026-09-27', 950000, 1),
  (2, '2026-09-28', 950000, 1),
  (3, '2026-09-25', 500000, 1),
  (3, '2026-09-26', 500000, 1),
  (4, '2026-09-18', 850000, 1),
  (4, '2026-09-19', 850000, 1),
  (5, '2026-10-02', 650000, 1),
  (5, '2026-10-03', 650000, 1)
ON DUPLICATE KEY UPDATE unit_price = VALUES(unit_price);

-- 6.10 DỊCH VỤ BỔ SUNG ĐI KÈM BOOKING (booking_service_item) — KHÔNG TÍNH GIÁ
INSERT INTO booking_service_item (id, booking_id, service_name, service_code, note, is_included)
VALUES
  (1, 1, 'Hỗ trợ đón tại Ngã Ba Kim Mù Cang Chải', 'PICKUP_FREE', 'Tài xế homestay ra đón bằng xe máy lúc 14:45', TRUE),
  (2, 1, 'Đốt lò sưởi củi sưởi ấm ban đêm', 'FIREPLACE', 'Chuẩn bị củi thông thơm từ 19:30 tại sân sinh hoạt', TRUE),
  (3, 1, 'Mượn ô và trang phục dân tộc Thái chụp ảnh', 'COSTUME_FREE', '02 bộ nữ Thái truyền thống chụp tại bờ suối', TRUE),
  (4, 2, 'Kê thêm nệm phụ cho em bé', 'EXTRA_BEDDING', 'Miễn phí chăn đệm sạch cho 2 bé nhỏ', TRUE),
  (5, 2, 'Tư vấn lịch trình săn mây đèo Khau Phạ', 'TRAVEL_GUIDE', 'Chủ homestay trực tiếp vẽ bản đồ các điểm mây đẹp', TRUE),
  (6, 3, 'Gửi xe máy qua đêm có mái che an toàn', 'PARKING_FREE', '02 xe máy phượt của khách', TRUE),
  (7, 4, 'Bữa sáng cháo bắp thịt bản & trà sơn tra', 'BREAKFAST_FREE', 'Phục vụ tại ban công lúc 07:15', TRUE),
  (8, 4, 'Ngâm chân nước lá thuốc thảo mộc người Dao', 'HERBAL_FOOT', 'Chuẩn bị thùng gỗ ngâm sau chuyến trekking Mâm Xôi', TRUE)
ON DUPLICATE KEY UPDATE service_name = VALUES(service_name);

-- 6.11 GIAO DỊCH THANH TOÁN (payment_transaction)
INSERT INTO payment_transaction (id, booking_id, gateway_id, external_txn_id, amount, currency, status, initiated_at, paid_at, raw_callback)
VALUES
  (1, 1, 1, 'SEPAY_TXN_20260922_001', 1300000, 'VND', 'SUCCESS', '2026-09-22 10:10:00', '2026-09-22 10:14:35',
   JSON_OBJECT('gateway', 'SEPay', 'accountNumber', '0912345678', 'bankCode', 'MB', 'transferContent', 'VJ 882101')),
  (2, 3, 1, 'SEPAY_TXN_20260923_098', 1000000, 'VND', 'INITIATED', '2026-09-23 22:50:00', NULL, NULL),
  (3, 4, 2, 'VNPAY_TXN_9918231', 1700000, 'VND', 'SUCCESS', '2026-09-15 14:30:00', '2026-09-15 14:38:20',
   JSON_OBJECT('vnp_ResponseCode', '00', 'vnp_TransactionNo', '14092812')),
  (4, 5, 1, 'SEPAY_TXN_20260920_055', 1300000, 'VND', 'SUCCESS', '2026-09-20 11:20:00', '2026-09-20 11:25:10',
   JSON_OBJECT('gateway', 'SEPay', 'transferContent', 'VJ 772190'))
ON DUPLICATE KEY UPDATE status = VALUES(status), amount = VALUES(amount);

-- 6.12 HOÀN TIỀN (refund) CHO ĐƠN ĐÃ HỦY
INSERT INTO refund (id, booking_id, payment_transaction_id, refund_type, amount, reason, status, requested_at, processed_at)
VALUES
  (1, 5, 4, 'FULL_REFUND', 1300000, 'Khách hủy trước 24h theo đúng cam kết chính sách linh hoạt', 'PROCESSED', '2026-09-21 08:35:00', '2026-09-21 09:10:00')
ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = VALUES(status);

-- 6.13 LỊCH SỬ BIẾN ĐỘNG TRẠNG THÁI BOOKING (booking_status_history)
INSERT INTO booking_status_history (id, booking_id, from_status, to_status, actor, actor_id, reason, created_at)
VALUES
  (1, 1, 'PENDING', 'CONFIRMED', 'PROVIDER', 1, 'Chủ nhà Bản Lìm Mông Eco Lodge đã nhận phòng & xác nhận cọc', '2026-09-22 10:15:00'),
  (2, 4, 'PENDING', 'CONFIRMED', 'PROVIDER', 4, 'Chấp nhận đơn đặt phòng mùa vàng', '2026-09-15 14:40:00'),
  (3, 4, 'CONFIRMED', 'COMPLETED', 'SYSTEM', NULL, 'Hệ thống tự động đóng đơn sau khi khách hoàn thành kỳ nghỉ', '2026-09-20 12:00:00'),
  (4, 5, 'PENDING', 'CONFIRMED', 'PROVIDER', 1, 'Đồng ý nhận khách', '2026-09-20 11:30:00'),
  (5, 5, 'CONFIRMED', 'CANCELLED', 'CUSTOMER', NULL, 'Khách gửi yêu cầu hủy vé do bận việc gia đình', '2026-09-21 08:30:00')
ON DUPLICATE KEY UPDATE reason = VALUES(reason);

-- 6.14 ĐÁNH GIÁ CỦA KHÁCH DU LỊCH (review)
INSERT INTO review (id, place_id, booking_id, rating, content, status, editable_until, created_at)
VALUES
  (1, 4, 4, 5, 'Không gian tuyệt vời trên cả kỳ vọng! Sáng sớm thức dậy mở toang rèm là thấy biển mây ùa vào tận hiên nhà. Chị chủ chuẩn bị bữa sáng xôi nếp nương và gà đồi nướng rất ngon. Chắc chắn sẽ quay lại vào mùa hoa Tớ Dày!', 'VISIBLE', '2026-09-27 12:00:00', '2026-09-20 16:30:00')
ON DUPLICATE KEY UPDATE rating = VALUES(rating), content = VALUES(content);

-- 6.15 MẪU THÔNG BÁO (notification_template) & THÔNG BÁO THỰC TẾ (notification)
INSERT INTO notification_template (id, code, channel, subject, body_template, is_active)
VALUES
  (1, 'BOOKING_CREATED', 'SMS', NULL, 'DuLichSo: Don dat phong {{booking_code}} tai {{homestay_name}} da duoc tao thanh cong. Vui long cho xac nhan tu chu nha trong 12h.', TRUE),
  (2, 'BOOKING_CONFIRMED', 'SMS', NULL, 'DuLichSo: Don dat phong {{booking_code}} da duoc XAC NHAN! Vui long thanh toan truoc {{payment_deadline}} qua QR chuyen khoan.', TRUE),
  (3, 'PAYMENT_SUCCESS', 'SMS', NULL, 'DuLichSo: Thanh toan thanh cong {{total_amount}} VND cho don {{booking_code}}. Chuc ban co chuyen di Mu Cang Chai tuyet voi!', TRUE),
  (4, 'NEW_BOOKING_PROVIDER', 'IN_APP', 'Đơn đặt phòng mới', 'Bạn có 1 yêu cầu đặt phòng mới mã {{booking_code}} từ khách {{guest_name}} ({{guest_phone}}). Vui lòng kiểm tra và xác nhận phòng trống.', TRUE)
ON DUPLICATE KEY UPDATE body_template = VALUES(body_template);

INSERT INTO notification (id, template_code, channel, recipient_type, recipient_account_id, recipient_phone, related_entity_type, related_entity_id, payload, status, created_at, sent_at)
VALUES
  (1, 'BOOKING_CREATED', 'SMS', 'CUSTOMER', NULL, '0988123456', 'booking', 1, JSON_OBJECT('booking_code', 'VJ-882101', 'homestay_name', 'Bản Lìm Mông Eco Lodge'), 'SENT', '2026-09-22 09:31:00', '2026-09-22 09:31:15'),
  (2, 'BOOKING_CONFIRMED', 'SMS', 'CUSTOMER', NULL, '0988123456', 'booking', 1, JSON_OBJECT('booking_code', 'VJ-882101', 'payment_deadline', '2026-09-22 11:15'), 'SENT', '2026-09-22 10:15:05', '2026-09-22 10:15:20'),
  (3, 'PAYMENT_SUCCESS', 'SMS', 'CUSTOMER', NULL, '0988123456', 'booking', 1, JSON_OBJECT('booking_code', 'VJ-882101', 'total_amount', '1.300.000'), 'SENT', '2026-09-22 10:15:30', '2026-09-22 10:15:45'),
  (4, 'NEW_BOOKING_PROVIDER', 'IN_APP', 'ACCOUNT', 1, NULL, 'booking', 2, JSON_OBJECT('booking_code', 'VJ-654320', 'guest_name', 'Trần Thị Thu Hà', 'guest_phone', '0912987654'), 'SENT', '2026-09-23 20:00:10', '2026-09-23 20:00:12')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 6.16 NHẬT KÝ HỆ THỐNG (audit_log)
INSERT INTO audit_log (id, actor, actor_id, action, entity_type, entity_id, reason, before_data, after_data, created_at)
VALUES
  (1, 'SYSTEM', NULL, 'SYSTEM_INITIALIZE', 'database', 1, 'Khởi tạo dữ liệu mẫu toàn diện chuẩn Liquibase', NULL, JSON_OBJECT('version', 'v0.2', 'status', 'SUCCESS'), '2026-09-24 00:00:00'),
  (2, 'PROVIDER', 1, 'BOOKING_ACCEPT', 'booking', 1, 'Xác nhận còn phòng Bungalow cho khách Nguyễn Hoàng Long', JSON_OBJECT('status', 'PENDING'), JSON_OBJECT('status', 'CONFIRMED'), '2026-09-22 10:15:00'),
  (3, 'CUSTOMER', NULL, 'BOOKING_CANCEL', 'booking', 5, 'Khách gửi yêu cầu hủy vé sớm', JSON_OBJECT('status', 'CONFIRMED'), JSON_OBJECT('status', 'CANCELLED'), '2026-09-21 08:30:00')
ON DUPLICATE KEY UPDATE action = VALUES(action);

COMMIT;
