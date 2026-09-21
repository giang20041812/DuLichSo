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
-- 2. CATEGORY & AMENITY: dùng lại 7 category + 7 amenity đã insert ở mục 13
--    của script schema gốc (không insert lại ở đây — xem cảnh báo phía trên).
-- ============================================================================

-- ============================================================================
-- 3+4. HOMESTAY — sheet 'Homestay ' (chính thống, source_type=OFFICIAL)
--      Mỗi Homestay bắt buộc có Provider (BR-06) -> tạo 1 provider + 1
--      account PROVIDER [SINH: password_hash là placeholder, cần đổi khi
--      go-live; email để NULL vì file không có email].
-- ============================================================================

-- ---- Homestay: Hello Mu Cang Chai Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Hello Mu Cang Chai Homestay', NULL, '0379292222', 'La Pán Tẩn', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0379292222', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Hello Mu Cang Chai Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'hello-mu-cang-chai-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Hello Mu Cang Chai Homestay' ORDER BY id DESC LIMIT 1),
  'Hello Mu Cang Chai Homestay', 'hello mu cang chai homestay', 'Wifi miễn phí, bình nóng lạnh, nhà hàng phục vụ món ăn bản địa Mông, dịch vụ giặt ủi, cho thuê xe máy, tổ chức tour trekking/hướng dẫn bản địa, bãi đỗ xe',
  @rg_la_pan_tan, 'La Pán Tẩn', 150000, 1200000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
SET @place_hello_mu_cang_chai_homestay := LAST_INSERT_ID();
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'PHONE', '0379292222', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'FACEBOOK', 'https://www.facebook.com/hellomucangchai', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'PRO', 'Chủ nhà (anh A Dê và gia đình) rất thân thiện, hiếu khách; đồ ăn ngon mang hương vị địa phương; view ngắm ruộng bậc thang xuất sắc; có dịch vụ tour dẫn đường tiện lợi', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'CON', 'Đường lên bản trên đồi cao dốc và quanh co, hạn chế xe ô tô lớn vào tận nơi; vào mùa cao điểm lúa chín thường xuyên cháy phòng', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), 'TIP', 'Loại phòng: Bungalow gỗ riêng biệt (18m² – 20m² khép kín), phòng đôi, phòng gia đình, giường tập thể (dorm)
Sức chứa: Khoảng 25 – 35 khách (phục vụ từ khách lẻ, cặp đôi đến đoàn khách)
Phong cách: Kiến trúc mộc mạc bằng gỗ truyền thống của đồng bào dân tộc H\'Mông, hòa hợp với thiên nhiên
View/Điểm nổi bật: Tọa lạc trên đồi cao; tầm nhìn panorama thẳng ra thung lũng núi non và ruộng bậc thang La Pán Tẩn; đón hoàng hôn và bình minh rất đẹp
Phù hợp nhóm khách: Cặp đôi thích không gian yên bình/lãng mạn, khách du lịch quốc tế, nhóm phượt, người yêu thích trekking và văn hóa bản địa
Giá tham khảo (nguyên văn): Khoảng 150.000 – 250.000 VNĐ/người/đêm (phòng tập thể/dorm); 600.000 – 1.200.000 VNĐ/phòng/đêm (Bungalow riêng, tùy hạng phòng và mùa vụ lúa chín)', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='hello-mu-cang-chai-homestay'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Bungalow gỗ riêng biệt (18m² – 20m² khép kín), phòng đôi, ph...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Mu Cang Chai Eco Lodge ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Mu Cang Chai Eco Lodge', NULL, '0989090908', 'Nậm Khắt', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0989090908', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mu Cang Chai Eco Lodge' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'mu-cang-chai-eco-lodge', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mu Cang Chai Eco Lodge' ORDER BY id DESC LIMIT 1),
  'Mu Cang Chai Eco Lodge', 'mu cang chai eco lodge', 'Nhà hàng phục vụ ẩm thực Tây Bắc, quầy bar sân hiên, wifi, bãi đỗ xe riêng, lò sưởi sinh hoạt chung, dịch vụ cho thuê xe máy, hỗ trợ tour đi bộ/trekking',
  @rg_nam_khat, 'Nậm Khắt', 750000, 1600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'PHONE', '0989090908', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'FACEBOOK', 'https://www.facebook.com/mucangchaiecolodge', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'PRO', 'Không gian rộng rãi, thoáng đãng, cực kỳ trong lành và yên bình; kiến trúc tự nhiên ấn tượng; nhân viên thân thiện, nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'CON', 'Nằm tách biệt, cách trung tâm thị trấn Mù Cang Chải khoảng 15–20km; xung quanh không có nhiều hàng quán ngoài dịch vụ nội khu; tiện nghi phòng tối giản, mộc mạc (không điều hòa/TV để giữ tiêu chí sinh thái)', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), 'TIP', 'Loại phòng: Nhà sàn bungalow độc lập (các căn mang tên đặc sản: Lúa, Sơn Trà, Ngô, Chè, Thông), phòng Deluxe, phòng Superior gia đình
Sức chứa: Khoảng 20 – 35 khách
Phong cách: Sinh thái mộc mạc (Ecolodge); kết hợp hài hòa giữa mái nhà gỗ thông của người H\'Mông và nếp nhà sàn của người Thái
View/Điểm nổi bật: Tọa lạc trên đồi cao giữa thung lũng Nậm Khắt; bao bọc bởi đồi chè, rừng thông và ruộng bậc thang thoai thoải; không gian mở đón mây và gió núi
Phù hợp nhóm khách: Khách du lịch nghỉ dưỡng, cặp đôi tìm chốn tĩnh lặng "chữa lành", du khách quốc tế và các gia đình thích hòa mình trọn vẹn vào thiên nhiên
Giá tham khảo (nguyên văn): Khoảng 750.000 – 1.600.000 VNĐ/phòng/đêm (phòng riêng / Superior Bungalow / Deluxe; có chênh lệch theo mùa lúa chín)', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-eco-lodge'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Nhà sàn bungalow độc lập (các căn mang tên đặc sản: Lúa, Sơn...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Dò Gừ Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Dò Gừ Homestay', NULL, '0977363345', 'La Pán Tẩn', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0977363345', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Dò Gừ Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'do-gu-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Dò Gừ Homestay' ORDER BY id DESC LIMIT 1),
  'Dò Gừ Homestay', 'do gu homestay', 'Wifi, bình tắm nước nóng, phục vụ ăn uống đặc sản bản địa (gà đồi, thịt lợn bản, rau rừng), sân ngắm cảnh, hỗ trợ thuê xe máy và chỉ đường đi bộ',
  @rg_la_pan_tan, 'La Pán Tẩn', 120000, 800000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'PHONE', '0977363345', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'FACEBOOK', 'https://www.facebook.com/DoGuHomestay', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'PRO', 'Vị trí đắc địa ngay tại trung tâm "thủ phủ" ruộng bậc thang La Pán Tẩn; gia chủ người Mông rất mộc mạc, thật thà và mến khách; chi phí sinh hoạt hợp lý', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'CON', 'Đường lên bản nhiều đoạn dốc và cua ngoằn ngoèo (phù hợp đi xe máy số hơn ô tô gầm thấp); trang thiết bị ở mức cơ bản, nhà vệ sinh chung ở khu vực gian ngủ sàn', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), 'TIP', 'Loại phòng: Gian ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riêng bungalow gỗ
Sức chứa: Khoảng 20 – 30 khách
Phong cách: Nhà gỗ mộc truyền thống của đồng bào H\'Mông, bình dị và đậm chất đời sống vùng cao
View/Điểm nổi bật: Tọa lạc trên sườn đồi bản La Pán Tẩn, view bao trọn tầng tầng lớp lớp ruộng bậc thang kỳ vĩ; không gian yên ả, mây vờn sườn núi buổi sớm
Phù hợp nhóm khách: Dân phượt, người thích du lịch trải nghiệm khám phá văn hóa bản địa, khách quốc tế (trekker), nhóm bạn trẻ
Giá tham khảo (nguyên văn): Khoảng 120.000 – 200.000 VNĐ/người/đêm (ngủ sàn cộng đồng); khoảng 500.000 – 800.000 VNĐ/phòng riêng/đêm (dao động theo mùa lúa chín)', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='do-gu-homestay'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Gian ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riê...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Mù Cang Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Mù Cang Homestay', NULL, '0946052233', 'Tổ 2, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0946052233', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mù Cang Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'mu-cang-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mù Cang Homestay' ORDER BY id DESC LIMIT 1),
  'Mù Cang Homestay', 'mu cang homestay', 'Wifi, bình nước nóng lạnh, phục vụ ăn uống (đặc sản Tây Bắc), sân đỗ xe máy/ô tô, hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Tổ 2, TT Mù Cang Chải', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'PHONE', '0946052233', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'FACEBOOK', 'https://www.facebook.com/profile.php?id=100057368952482', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'PRO', 'Nằm ngay thị trấn nên rất thuận tiện đi lại, gần chợ phiên và các quán ăn địa phương; chi phí hợp lý; chủ nhà mến khách', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'CON', 'Không nằm trên triền đồi ngắm ruộng bậc thang trực diện như ở La Pán Tẩn hay Púng Luông; khu vực sàn tập thể dùng chung tiện ích vệ sinh', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), 'TIP', 'Loại phòng: Phòng ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riêng
Sức chứa: Khoảng 15 – 25 khách
Phong cách: Nhà sàn gỗ truyền thống, ấm cúng và gần gũi
View/Điểm nổi bật: Tọa lạc ngay gần trung tâm thị trấn, thuận tiện ngắm cảnh núi đồi và dòng suối Nậm Kim
Phù hợp nhóm khách: Dân phượt, học sinh - sinh viên, nhóm bạn trẻ du lịch bụi tiết kiệm chi phí
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 400.000 – 600.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='mu-cang-homestay'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Phòng ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng ri...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Ngọc Thúy Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Ngọc Thúy Homestay', NULL, '0971447265', 'Bản Thái, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0971447265', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Ngọc Thúy Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'ngoc-thuy-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Ngọc Thúy Homestay' ORDER BY id DESC LIMIT 1),
  'Ngọc Thúy Homestay', 'ngoc thuy homestay', 'Wifi, bình tắm nước nóng, sân để xe máy/ô tô, dịch vụ ăn uống ẩm thực Thái (cá nướng pa pỉnh tộp, thịt trâu gác bếp, xôi nếp nương), cho thuê trang phục dân tộc, cho thuê xe máy',
  @rg_tt_mu_cang_chai, 'Bản Thái, TT Mù Cang Chải', 120000, 700000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'PHONE', '0971447265', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'FACEBOOK', 'https://www.facebook.com/homestaymucangchai', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'PRO', 'Nằm ngay sát trung tâm thị trấn nên đường đi bằng phẳng, ô tô vào tận nơi thuận tiện; nhà sàn thoáng mát, sạch sẽ; chủ nhà nhiệt tình, nấu ăn ngon', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'CON', 'Không gian nhà sàn sinh hoạt cộng đồng nên cách âm giữa các gian ngủ chưa cao; mùa cao điểm khá đông đúc', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), 'TIP', 'Loại phòng: Nhà sàn tập thể (đệm ngủ riêng biệt có rèm ngăn/màn), phòng riêng 1–2 giường
Sức chứa: Khoảng 25 – 40 khách
Phong cách: Nhà sàn gỗ truyền thống rộng rãi của đồng bào người Thái vùng Tây Bắc
View/Điểm nổi bật: Tọa lạc tại Bản Thái thanh bình, nằm sát chân núi và bao quanh bởi đồng lúa thung lũng Nậm Kim; cảnh quan mộc mạc, đậm đà bản sắc làng bản
Phù hợp nhóm khách: Khách đoàn đông, hội nhóm phượt, gia đình, du khách muốn tìm hiểu văn hóa ẩm thực và đời sống dân tộc Thái
Giá tham khảo (nguyên văn): Khoảng 120.000 – 180.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 450.000 – 700.000 VNĐ/phòng riêng/đêm (thay đổi tùy mùa cao điểm lúa chín)', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='ngoc-thuy-homestay'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Nhà sàn tập thể (đệm ngủ riêng biệt có rèm ngăn/màn), phòng ...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Mong Ngua Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Mong Ngua Homestay', NULL, '0367858988', 'Mồ Dề', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0367858988', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mong Ngua Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'mong-ngua-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mong Ngua Homestay' ORDER BY id DESC LIMIT 1),
  'Mong Ngua Homestay', 'mong ngua homestay', 'Wifi, bình nước nóng lạnh, phục vụ ăn uống (gà bản nướng, lợn mán, cơm lam), dịch vụ xe ôm chở lên đồi ngắm cảnh, hỗ trợ thuê xe máy',
  @rg_mo_de, 'Mồ Dề', 120000, 750000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'PHONE', '0367858988', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'PRO', 'Vị trí đắc địa gần sát Đồi Móng Ngựa nên không lo muộn giờ đón hoàng hôn/bình minh; không gian yên bình, đậm nét bản địa', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'CON', 'Đường lên bản và lên đồi dốc cao, cua tay áo (chủ yếu di chuyển bằng xe máy số hoặc thuê xe ôm bản địa); tiện nghi ở mức cơ bản', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), 'TIP', 'Loại phòng: Nhà sàn đệm tập thể, phòng riêng vách gỗ
Sức chứa: Khoảng 20 – 30 khách
Phong cách: Nhà gỗ mộc mạc đậm chất đồng bào dân tộc H\'Mông địa phương
View/Điểm nổi bật: Tọa lạc ngay cung đường dẫn lên danh thắng Đồi Móng Ngựa; tầm nhìn hướng thẳng ra các triền ruộng bậc thang uốn lượn hình móng ngựa kỳ vĩ
Phù hợp nhóm khách: Dân săn ảnh (nhiếp ảnh gia), phượt thủ, nhóm bạn trẻ, khách muốn đón hoàng hôn Móng Ngựa thuận tiện
Giá tham khảo (nguyên văn): Khoảng 120.000 – 200.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 450.000 – 750.000 VNĐ/phòng riêng/đêm (dao động theo mùa cao điểm)', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='mong-ngua-homestay'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Nhà sàn đệm tập thể, phòng riêng vách gỗ...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: La Pan Tan Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('La Pan Tan Homestay', NULL, '0854650589', 'La Pán Tẩn', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0854650589', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='La Pan Tan Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'la-pan-tan-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='La Pan Tan Homestay' ORDER BY id DESC LIMIT 1),
  'La Pan Tan Homestay', 'la pan tan homestay', 'Wifi, bình nước nóng lạnh, dịch vụ ăn uống ẩm thực H\'Mông, sân hiên ngắm cảnh, hỗ trợ thuê xe máy và hướng dẫn tour đi bộ xuyên bản',
  @rg_la_pan_tan, 'La Pán Tẩn', 150000, 850000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'PHONE', '0854650589', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'FACEBOOK', 'https://www.facebook.com/profile.php?id=100064932032609', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'PRO', 'Tầm nhìn đắt giá nhìn trọn ruộng bậc thang; không khí trong lành, tĩnh lặng; chủ nhà thân thiện và hỗ trợ chu đáo', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'CON', 'Đường lên bản dốc đứng, nhiều đoạn quanh co (xe ga khó đi, ưu tiên xe số hoặc tay lái cứng); tiện nghi mang tính cơ bản của nhà dân', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), 'TIP', 'Loại phòng: Phòng dorm tập thể nhà sàn, phòng riêng vách gỗ
Sức chứa: Khoảng 20 – 30 khách
Phong cách: Nhà gỗ mộc mạc mang nét kiến trúc truyền thống vùng cao
View/Điểm nổi bật: Tọa lạc trên triền đồi cao La Pán Tẩn, view nhìn thẳng ra thung lũng ruộng bậc thang uốn lượn; điểm săn mây và đón hoàng hôn lý tưởng
Phù hợp nhóm khách: Khách du lịch quốc tế, phượt thủ, người yêu thích trekking và muốn hòa mình vào thiên nhiên vùng cao
Giá tham khảo (nguyên văn): Khoảng 150.000 – 200.000 VNĐ/người/đêm (phòng tập thể/dorm); 500.000 – 850.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan-homestay'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Phòng dorm tập thể nhà sàn, phòng riêng vách gỗ...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Homestay Cường Tú ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Homestay Cường Tú', NULL, '0385179642', 'Kim Nọi', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0385179642', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Cường Tú' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'homestay-cuong-tu', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Cường Tú' ORDER BY id DESC LIMIT 1),
  'Homestay Cường Tú', 'homestay cuong tu', 'Wifi, bình tắm nước nóng, sân để xe rộng rãi, phục vụ ăn uống (đặc sản cơm lam, lợn bản, gà nướng mác khén), hỗ trợ thuê xe máy',
  @rg_kim_noi, 'Kim Nọi', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'PHONE', '0385179642', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'TIKTOK', 'https://www.tiktok.com/@vn.cng8742?_r=1&_t=ZS-99pdoOCSCrh', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'PRO', 'Vị trí gần trung tâm thị trấn Mù Cang Chải (chỉ cách khoảng 1–2km), đường đi bằng phẳng xe ô tô vào tận nơi thuận tiện; chủ nhà thân thiện, nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'CON', 'Không gian nhà sàn sinh hoạt cộng đồng nên khả năng cách âm còn hạn chế; mùa lễ hội cao điểm khá đông khách', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), 'TIP', 'Loại phòng: Nhà sàn đệm tập thể, phòng riêng có vách ngăn
Sức chứa: Khoảng 20 – 35 khách
Phong cách: Nhà sàn gỗ truyền thống thoáng mát của đồng bào người Thái
View/Điểm nổi bật: Tọa lạc tại thung lũng Bản Kim Nọi thanh bình, sát suối và chân đồi, bao quanh bởi những mảng xanh ruộng vườn mộc mạc
Phù hợp nhóm khách: Đoàn đông người, nhóm bạn trẻ đi phượt, gia đình muốn trải nghiệm nếp sống sinh hoạt bản địa ấm cúng
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 400.000 – 600.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='homestay-cuong-tu'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Nhà sàn đệm tập thể, phòng riêng có vách ngăn...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Nhà nghỉ cộng đồng Lương Văn Bản ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Nhà nghỉ cộng đồng Lương Văn Bản', NULL, '0344443620', 'Tổ 9, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0344443620', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Nhà nghỉ cộng đồng Lương Văn Bản' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-nghi-cong-dong-luong-van-ban', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Nhà nghỉ cộng đồng Lương Văn Bản' ORDER BY id DESC LIMIT 1),
  'Nhà nghỉ cộng đồng Lương Văn Bản', 'nha nghi cong dong luong van ban', 'Wifi, bình nước nóng lạnh, phục vụ các món ăn truyền thống dân tộc, sân đỗ xe máy và ô tô, hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Tổ 9, TT Mù Cang Chải', 100000, 500000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 'PHONE', '0344443620', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 'PRO', 'Nằm ngay tại thị trấn nên đường sá thuận tiện, dễ tiếp cận các hàng quán và chợ trung tâm; chi phí dịch vụ bình dân; chủ nhà nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 'CON', 'Tiện nghi mang tính cơ bản của nhà nghỉ cộng đồng vùng cao; không gian ngủ chung trên sàn nên cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), 'TIP', 'Loại phòng: Gian ngủ tập thể nhà sàn (đệm/chiếu truyền thống, có màn che), phòng riêng đơn giản
Sức chứa: Khoảng 20 – 35 khách
Phong cách: Nhà sàn gỗ truyền thống thoáng đãng của đồng bào người Thái
View/Điểm nổi bật: Tọa lạc tại khu vực bình yên ven thị trấn, tầm nhìn bao quát nếp nhà làng bản và những mảng xanh ruộng vườn chân núi
Phù hợp nhóm khách: Đoàn đông người, nhóm bạn sinh viên, dân phượt tìm kiếm điểm lưu trú cộng đồng mộc mạc và tiết kiệm ngân sách
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 350.000 – 500.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-luong-van-ban'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Gian ngủ tập thể nhà sàn (đệm/chiếu truyền thống, có màn che...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Homestay Tùng Teng ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Homestay Tùng Teng', NULL, '0961917927', 'Kim Nọi', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0961917927', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Tùng Teng' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'homestay-tung-teng', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Tùng Teng' ORDER BY id DESC LIMIT 1),
  'Homestay Tùng Teng', 'homestay tung teng', 'Wifi, bình nước nóng lạnh, phục vụ ăn uống (món ngon người Thái, rượu ngô, gà đồi nướng), bãi đỗ xe rộng, hỗ trợ thuê xe máy',
  @rg_kim_noi, 'Kim Nọi', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'PHONE', '0961917927', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'PRO', 'Nằm rất gần trung tâm thị trấn Mù Cang Chải (cách tầm 1,5 km), đường đi bằng phẳng ô tô vào tận nơi; chủ nhà hiếu khách, nấu ăn ngon', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'CON', 'Tiện nghi mang tính cơ bản; sinh hoạt chung nhà sàn nên mức độ cách âm giữa các gian ngủ chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), 'TIP', 'Loại phòng: Phòng ngủ chung nhà sàn (đệm/chiếu truyền thống), phòng riêng
Sức chứa: Khoảng 20 – 30 khách
Phong cách: Nhà sàn gỗ truyền thống, thoáng mát và đậm nét văn hóa Thái Tây Bắc
View/Điểm nổi bật: Tọa lạc giữa bản Kim Nọi thanh bình, không gian mở nhìn ra triền núi xanh và những nương lúa thoai thoải ven thung lũng
Phù hợp nhóm khách: Đoàn phượt, nhóm sinh viên, du khách thích du lịch cộng đồng trải nghiệm ẩm thực và đời sống bản địa
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 400.000 – 600.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='homestay-tung-teng'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Phòng ngủ chung nhà sàn (đệm/chiếu truyền thống), phòng riên...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Homestay A De ----
-- [FILE+SUY LUẬN] SĐT liên hệ (0379292222) trùng với 'Hello Mu Cang Chai Homestay' và mô tả cùng
--   nhắc tới cùng một chủ nhà -> coi đây là bản ghi trùng lặp của cùng 1
--   Provider/Place thực tế (áp dụng BR-96: gán master_place_id).
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'homestay-a-de', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Hello Mu Cang Chai Homestay' ORDER BY id DESC LIMIT 1),
  'Homestay A De', 'homestay a de', 'Wifi, bình tắm nước nóng, phục vụ ẩm thực địa phương (lẩu gà đồi, thịt lợn gác bếp, xôi nếp nương), sân hiên uống trà ngắm cảnh, hỗ trợ thuê xe máy, tổ chức tour trekking dẫn đường bản địa',
  @rg_la_pan_tan, 'La Pán Tẩn', 150000, 1000000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
UPDATE place SET master_place_id = @place_hello_mu_cang_chai_homestay WHERE slug='homestay-a-de';  -- BR-96: merge bản ghi trùng
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'PHONE', '0379292222', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'PRO', 'Chủ nhà (anh A Dê) rất năng động, nhiệt huyết và am hiểu địa phương, hướng dẫn viên tour bản địa nhiệt tình; view ngắm lúa xuất sắc; ẩm thực tự nấu tươi ngon', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'CON', 'Đường lên bản dốc và nhiều cua khúc khuỷu đặc trưng địa hình vùng cao (ưu tiên di chuyển bằng xe máy số); mùa lúa chín rất nhanh kín phòng', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), 'TIP', 'Loại phòng: Nhà gỗ bungalow riêng tư, phòng ngủ tập thể nhà sàn (đệm đôi/đơn có màn chống muỗi)
Sức chứa: Khoảng 20 – 30 khách
Phong cách: Nhà gỗ mộc mạc truyền thống của người H\'Mông, hài hòa với cảnh quan thiên nhiên
View/Điểm nổi bật: Tọa lạc trên triền đồi cao La Pán Tẩn, tầm nhìn trực diện ra thung lũng ruộng bậc thang uốn lượn; điểm săn mây sớm và ngắm hoàng hôn rực rỡ
Phù hợp nhóm khách: Khách du lịch quốc tế, cặp đôi thích sự yên bình, nhóm bạn trẻ mê trekking và khám phá văn hóa bản địa
Giá tham khảo (nguyên văn): Khoảng 150.000 – 220.000 VNĐ/người/đêm (phòng dorm tập thể); 600.000 – 1.000.000 VNĐ/phòng riêng/bungalow (dao động tùy mùa vụ lúa chín)', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='homestay-a-de'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Nhà gỗ bungalow riêng tư, phòng ngủ tập thể nhà sàn (đệm đôi...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Lương Hưng Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Lương Hưng Homestay', NULL, '0964716235', 'Bản Thái, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0964716235', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Lương Hưng Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'luong-hung-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Lương Hưng Homestay' ORDER BY id DESC LIMIT 1),
  'Lương Hưng Homestay', 'luong hung homestay', 'Wifi, bình tắm nước nóng, sân đỗ xe ô tô và xe máy, phục vụ cơm gia đình với các món đặc sản dân tộc Thái, hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Bản Thái, TT Mù Cang Chải', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 'PHONE', '0964716235', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 'PRO', 'Nằm ngay sát trung tâm thị trấn nên đường sá bằng phẳng, xe ô tô đi vào tận nơi dễ dàng; chủ nhà đón tiếp chu đáo, mộc mạc; giá cả phải chăng', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 'CON', 'Không gian ngủ chung trên sàn truyền thống nên cách âm còn hạn chế; không có view nhìn trực diện ruộng bậc thang trên đồi cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), 'TIP', 'Loại phòng: Gian ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riêng có vách gỗ
Sức chứa: Khoảng 20 – 35 khách
Phong cách: Nhà sàn gỗ truyền thống, thoáng mát và đậm đà bản sắc văn hóa Thái
View/Điểm nổi bật: Tọa lạc giữa lòng Bản Thái thanh bình, nằm thoai thoải bên chân núi và nhìn ra nếp nhà làng bản cùng thung lũng Nậm Kim
Phù hợp nhóm khách: Khách đoàn, nhóm bạn trẻ, hội nhóm phượt, gia đình tìm kiếm trải nghiệm văn hóa cộng đồng với chi phí tiết kiệm
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn tập thể); 400.000 – 600.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='luong-hung-homestay'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Gian ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riê...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Homestay Minh Ngọc ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Homestay Minh Ngọc', NULL, '0912503469', 'Kim Nọi', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0912503469', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Minh Ngọc' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'homestay-minh-ngoc', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Minh Ngọc' ORDER BY id DESC LIMIT 1),
  'Homestay Minh Ngọc', 'homestay minh ngoc', 'Wifi, bình nước nóng lạnh, dịch vụ nấu ăn đặc sản người Thái (thịt lợn nướng, cá suối, xôi ngũ sắc), sân đỗ xe, hỗ trợ thuê xe máy',
  @rg_kim_noi, 'Kim Nọi', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 'PHONE', '0912503469', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 'PRO', 'Nằm rất gần trung tâm thị trấn Mù Cang Chải (cách khoảng 1–2 km), đường sá thuận lợi cho xe ô tô vào tận nơi; chủ nhà đón tiếp chu đáo, nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 'CON', 'Không gian nhà sàn tập thể nên khả năng cách âm còn hạn chế; tiện nghi mang tính cơ bản của mô hình homestay nông thôn', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), 'TIP', 'Loại phòng: Phòng ngủ chung nhà sàn (đệm/chiếu truyền thống), phòng riêng
Sức chứa: Khoảng 20 – 30 khách
Phong cách: Nhà sàn gỗ truyền thống của đồng bào người Thái, không gian mộc mạc và gần gũi
View/Điểm nổi bật: Tọa lạc giữa thung lũng Bản Kim Nọi yên tĩnh, bao quanh bởi triền núi và nương lúa thoai thoải ven suối
Phù hợp nhóm khách: Nhóm bạn trẻ, đoàn phượt, gia đình muốn trải nghiệm đời sống văn hóa bản địa với chi phí bình dân
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn tập thể); 400.000 – 600.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='homestay-minh-ngoc'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Phòng ngủ chung nhà sàn (đệm/chiếu truyền thống), phòng riên...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Suối Kim 2 Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Suối Kim 2 Homestay', NULL, '0329961420', 'Ngã Ba Kim, Púng Luông', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0329961420', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Suối Kim 2 Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'suoi-kim-2-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Suối Kim 2 Homestay' ORDER BY id DESC LIMIT 1),
  'Suối Kim 2 Homestay', 'suoi kim 2 homestay', 'Wifi, bình nước nóng lạnh, phục vụ ăn uống bình dân và đặc sản địa phương, sân để xe máy/ô tô, hỗ trợ thuê xe máy',
  @rg_pung_luong, 'Ngã Ba Kim, Púng Luông', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'PHONE', '0329961420', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'FACEBOOK', 'https://www.facebook.com/suoikim2homestay', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'PRO', 'Vị trí giao thông cực kỳ thuận lợi, dễ tìm, ngay ngã ba sầm uất với nhiều cửa hàng tạp hóa, quán ăn và trạm xăng; chi phí phòng nghỉ hợp lý', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'CON', 'Nằm gần trục đường giao thông chính nên có thể nghe tiếng xe qua lại ban ngày; không gian và tầm view không ôm trọn ruộng bậc thang như các homestay sâu trong bản', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), 'TIP', 'Loại phòng: Phòng ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riêng
Sức chứa: Khoảng 20 – 35 khách
Phong cách: Nhà sàn gỗ kết hợp nhà xây mộc mạc, bình dị
View/Điểm nổi bật: Tọa lạc ngay gần nút giao Ngã Ba Kim – đầu mối giao thông huyết mạch kết nối giữa Quốc lộ 32 và đường đi Nậm Khắt; cảnh quan xóm núi nhộn nhịp ban ngày, yên bình ban đêm
Phù hợp nhóm khách: Dân phượt, tài xế đường dài, nhóm du lịch bụi tìm trạm dừng chân thuận tiện trên trục đường chính
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 400.000 – 600.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-2-homestay'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Phòng ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng ri...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Nhà nghỉ cộng đồng Nông Văn Êm ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Nhà nghỉ cộng đồng Nông Văn Êm', NULL, '0367765445', 'Tổ 9, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0367765445', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Nhà nghỉ cộng đồng Nông Văn Êm' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-nghi-cong-dong-nong-van-em', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Nhà nghỉ cộng đồng Nông Văn Êm' ORDER BY id DESC LIMIT 1),
  'Nhà nghỉ cộng đồng Nông Văn Êm', 'nha nghi cong dong nong van em', 'Wifi, bình tắm nước nóng, sân để xe máy và ô tô, phục vụ ăn uống gia đình với các món đặc sản địa phương, hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Tổ 9, TT Mù Cang Chải', 100000, 500000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 'PHONE', '0367765445', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 'PRO', 'Vị trí gần trung tâm thị trấn nên việc đi lại, ăn uống ngoài và tiếp cận dịch vụ rất dễ dàng; không gian rộng rãi, thoáng mát; chủ nhà thân thiện', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 'CON', 'Trang thiết bị mang tính cơ bản của nhà nghỉ cộng đồng vùng cao; không gian sinh hoạt chung trên sàn nên cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), 'TIP', 'Loại phòng: Phòng ngủ tập thể nhà sàn (đệm/chiếu truyền thống, có rèm/màn ngăn), phòng riêng đơn giản
Sức chứa: Khoảng 20 – 35 khách
Phong cách: Nhà sàn gỗ truyền thống thoáng mát của đồng bào dân tộc Thái
View/Điểm nổi bật: Nằm ở khu vực ven thị trấn yên bình, tầm nhìn hướng ra xóm núi và những khoảng ruộng nương chân núi mộc mạc
Phù hợp nhóm khách: Nhóm phượt thủ, đoàn đông sinh viên, du khách ưu tiên du lịch trải nghiệm văn hóa bản địa tiết kiệm chi phí
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 350.000 – 500.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='nha-nghi-cong-dong-nong-van-em'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Phòng ngủ tập thể nhà sàn (đệm/chiếu truyền thống, có rèm/mà...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Homestay Tư Nguyệt ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Homestay Tư Nguyệt', NULL, '0813772213', 'Kim Nọi', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0813772213', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Tư Nguyệt' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'homestay-tu-nguyet', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Tư Nguyệt' ORDER BY id DESC LIMIT 1),
  'Homestay Tư Nguyệt', 'homestay tu nguyet', 'Wifi, bình tắm nước nóng, sân để xe máy và ô tô, phục vụ ăn uống gia đình với các món đặc sản dân tộc Thái, hỗ trợ thuê xe máy',
  @rg_kim_noi, 'Kim Nọi', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
SET @place_homestay_tu_nguyet := LAST_INSERT_ID();
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'PHONE', '0813772213', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'FACEBOOK', 'https://www.facebook.com/tungluong992', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'PRO', 'Nằm rất gần trung tâm thị trấn Mù Cang Chải (cách khoảng 1–2 km), đường đi bằng phẳng ô tô vào tận nơi; chủ nhà đón tiếp chu đáo, niềm nở', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'CON', 'Trang thiết bị tiện nghi mang tính cơ bản của nhà dân vùng cao; sinh hoạt chung trên sàn tập thể nên khả năng cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), 'TIP', 'Loại phòng: Phòng ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riêng vách gỗ
Sức chứa: Khoảng 20 – 30 khách
Phong cách: Nhà sàn gỗ truyền thống thoáng mát của đồng bào dân tộc Thái
View/Điểm nổi bật: Nằm trong không gian thanh bình của bản Kim Nọi, tầm nhìn hướng ra những nếp nhà sàn mộc mạc và triền núi thoai thoải ven thung lũng
Phù hợp nhóm khách: Đoàn phượt, nhóm học sinh - sinh viên, gia đình tìm kiếm trải nghiệm văn hóa du lịch cộng đồng với chi phí tiết kiệm
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 400.000 – 600.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Phòng ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng ri...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Homestay Quyết Đoản ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Homestay Quyết Đoản', NULL, '0329153287', 'Bản Thái Ít, Lìm Mông, Cao Phạ', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0329153287', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Quyết Đoản' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'homestay-quyet-doan', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Quyết Đoản' ORDER BY id DESC LIMIT 1),
  'Homestay Quyết Đoản', 'homestay quyet doan', 'Wifi, bình tắm nước nóng, sân để xe rộng rãi, phục vụ ăn uống đặc sản dân tộc Thái (cá suối nướng, gà đồi, xôi nếp nương), hỗ trợ thuê xe máy',
  @rg_cao_pha, 'Bản Thái Ít, Lìm Mông, Cao Phạ', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'PHONE', '0329153287', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'TIKTOK', 'https://vt.tiktok.com/ZSqtJaVhA/', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'PRO', 'Vị trí đắc địa ngay cửa ngõ thung lũng Cao Phạ - Lìm Mông; không gian làng bản mộc mạc, bình yên; chủ nhà thân thiện, nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'CON', 'Nằm ở khu vực Cao Phạ (cách trung tâm thị trấn Mù Cang Chải khoảng 25–30 km); trang thiết bị mang tính cơ bản của nhà sàn cộng đồng', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), 'TIP', 'Loại phòng: Gian ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riêng vách gỗ
Sức chứa: Khoảng 20 – 35 khách
Phong cách: Nhà sàn gỗ truyền thống thoáng mát của đồng bào dân tộc Thái
View/Điểm nổi bật: Tọa lạc dưới chân đèo Khau Phạ trong thung lũng Lìm Mông thanh bình; ngắm trọn cánh đồng lúa Cao Phạ và những cánh dù lượn hạ cánh từ đỉnh đèo
Phù hợp nhóm khách: Dân phượt, khách bay dù lượn Khau Phạ, nhóm bạn trẻ và gia đình muốn khám phá đời sống văn hóa bản Lìm Mông
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 400.000 – 600.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='homestay-quyet-doan'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Gian ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riê...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Hoai Phuong Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Hoai Phuong Homestay', NULL, '0339908404', 'Kim Nọi', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0339908404', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Hoai Phuong Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'hoai-phuong-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Hoai Phuong Homestay' ORDER BY id DESC LIMIT 1),
  'Hoai Phuong Homestay', 'hoai phuong homestay', 'Wifi, bình tắm nước nóng, sân để xe máy và ô tô, phục vụ ăn uống đặc sản dân tộc Thái (gà nướng mác khén, lợn bản, xôi ngũ sắc), hỗ trợ thuê xe máy',
  @rg_kim_noi, 'Kim Nọi', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 'PHONE', '0339908404', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 'PRO', 'Vị trí rất gần trung tâm thị trấn Mù Cang Chải (cách khoảng 1,5 km), đường đi bằng phẳng ô tô vào tận nơi thuận tiện; chủ nhà đón tiếp nhiệt tình, chu đáo', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 'CON', 'Tiện nghi mang tính cơ bản của mô hình homestay nông thôn; gian ngủ trên sàn tập thể nên khả năng cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), 'TIP', 'Loại phòng: Phòng ngủ chung nhà sàn (đệm/chiếu truyền thống, có rèm/màn ngăn), phòng riêng
Sức chứa: Khoảng 20 – 35 khách
Phong cách: Nhà sàn gỗ truyền thống thoáng mát của đồng bào người Thái vùng Tây Bắc
View/Điểm nổi bật: Nằm giữa khung cảnh thanh bình của Bản Kim Nọi, nhìn ra nếp nhà làng bản chân đồi và những thửa ruộng bậc thang thoai thoải ven suối
Phù hợp nhóm khách: Nhóm bạn trẻ, đoàn đông người đi phượt, gia đình muốn trải nghiệm du lịch cộng đồng mộc mạc và tiết kiệm
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 400.000 – 600.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='hoai-phuong-homestay'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Phòng ngủ chung nhà sàn (đệm/chiếu truyền thống, có rèm/màn ...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Home Stay Duy Cường ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Home Stay Duy Cường', NULL, '0964864094', 'Tổ 7, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0964864094', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Home Stay Duy Cường' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'home-stay-duy-cuong', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Home Stay Duy Cường' ORDER BY id DESC LIMIT 1),
  'Home Stay Duy Cường', 'home stay duy cuong', 'Wifi, bình nước nóng lạnh, phục vụ các món ăn gia đình/đặc sản Tây Bắc, bãi đỗ xe máy và ô tô, hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Tổ 7, TT Mù Cang Chải', 100000, 500000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'PHONE', '0964864094', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'FACEBOOK', 'https://www.facebook.com/nhanghiphuotmcc', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'PRO', 'Tọa lạc ngay khu vực thị trấn nên đường sá bằng phẳng, thuận tiện đi lại, mua sắm và ăn uống; gia chủ niềm nở, nhiệt tình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'CON', 'Tiện nghi mang tính cơ bản của mô hình lưu trú cộng đồng; không gian ngủ chung trên sàn nên khả năng cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), 'TIP', 'Loại phòng: Phòng ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riêng
Sức chứa: Khoảng 20 – 30 khách
Phong cách: Nhà sàn gỗ truyền thống thoáng mát của đồng bào người Thái
View/Điểm nổi bật: Nằm trong khu dân cư yên tĩnh tại thị trấn, tầm nhìn bao quát xóm làng thanh bình và những mảng xanh triền đồi
Phù hợp nhóm khách: Dân phượt, đoàn sinh viên, gia đình hoặc du khách đi du lịch tự túc tìm điểm lưu trú bình dân
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 350.000 – 500.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='home-stay-duy-cuong'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Phòng ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng ri...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ---- Homestay: Gà Tre Homestay ----
INSERT INTO provider (name, contact_name, contact_phone, address, status) VALUES ('Gà Tre Homestay', NULL, '0944529942', 'Tổ 2, TT Mù Cang Chải', 'ACTIVE');
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0944529942', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Gà Tre Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'ga-tre-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Gà Tre Homestay' ORDER BY id DESC LIMIT 1),
  'Gà Tre Homestay', 'ga tre homestay', 'Wifi, bình tắm nước nóng, sân để xe máy/ô tô, phục vụ ăn uống gia đình (gà nướng, thịt bản, cá suối), hỗ trợ thuê xe máy',
  @rg_tt_mu_cang_chai, 'Tổ 2, TT Mù Cang Chải', 100000, 600000, 'theo mô tả (xem TIP)',
  'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (DATA_CHÍNH_THỐNG.xlsx - sheet Homestay)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 'PHONE', '0944529942', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 'PRO', 'Nằm ngay tại thị trấn nên giao thông thuận tiện, dễ tiếp cận hàng quán và chợ Mù Cang Chải; chi phí dịch vụ bình dân; chủ nhà chu đáo', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 'CON', 'Trang thiết bị tiện nghi mang tính cơ bản của nhà dân; không gian ngủ chung trên sàn nên cách âm chưa cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), 'TIP', 'Loại phòng: Gian ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riêng
Sức chứa: Khoảng 20 – 30 khách
Phong cách: Nhà sàn gỗ truyền thống kết hợp không gian sinh hoạt mộc mạc vùng cao
View/Điểm nổi bật: Tọa lạc gần khu vực trung tâm thị trấn, không gian thoáng đãng nhìn ra nếp nhà bản làng và cảnh quan đồi núi bao quanh
Phù hợp nhóm khách: Dân phượt, đoàn sinh viên, gia đình hoặc du khách đi phượt tiết kiệm chi phí
Giá tham khảo (nguyên văn): Khoảng 100.000 – 150.000 VNĐ/người/đêm (ngủ sàn cộng đồng); 400.000 – 600.000 VNĐ/phòng riêng/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='ga-tre-homestay'));  -- [SINH] chỉ tạo dòng trống — file không có giờ check-in/out, nội quy nhà
-- [GHI CHÚ] Không tạo room_type/room_bed cho homestay này: cột 'Loại phòng'
--   và 'Sức chứa' trong file là văn bản mô tả tự do (vd 'Gian ngủ tập thể nhà sàn (đệm/chiếu truyền thống), phòng riê...'),
--   không đủ cấu trúc (số phòng, sức chứa/phòng, giá/loại) để nạp đúng vào
--   bảng room_type (các cột NOT NULL: max_occupancy, total_room_count...).
--   Đã lưu nguyên văn vào place_highlight (TIP) ở trên; cần nhập tay sau.

-- ============================================================================
-- 5. HOMESTAY (nguồn cộng đồng/reviewer) — sheet 'Homestay reviewer'.
--    source_type = PUBLIC_TRUSTED. Cũng bắt buộc có Provider (BR-06).
-- ============================================================================

-- ---- Homestay (reviewer): Mù Cang Chải Village Home ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Mù Cang Chải Village Home', '0396483968', 'Khu trung tâm, gần La Pán Tẩn', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0396483968', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mù Cang Chải Village Home' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'mu-cang-chai-village-home', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mù Cang Chải Village Home' ORDER BY id DESC LIMIT 1),
  'Mù Cang Chải Village Home', 'mu cang chai village home', 'WiFi miễn phí, bãi đỗ xe miễn phí, nhà hàng tại chỗ (món Á/Việt/chay), xe đạp cho thuê, ấm đun nước điện + bộ pha trà/cà phê, sân thượng chung, dịch vụ đưa đón miễn phí, lễ tân 24/24, dọn phòng hàng ngày, cho mang thú cưng (có phí/theo yêu cầu)',
  @rg_la_pan_tan, 'Khu trung tâm, gần La Pán Tẩn', 500000, 800000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.booking.com/Share-mjTVoaf', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'PHONE', '0396483968', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/RAw7MSjqSykHLe3T6', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'PRO', 'chủ nhà hỗ trợ nhiệt tình kể cả khi khách đến muộn/đổi lịch', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'CON', '1 khách bị xếp qua homestay lân cận khác với homestay đã đặt; 1 khách phản ánh không có bữa tối dù đã đặt trước (dịp lễ); có thể ồn vào buổi tối dịp lễ do karaoke, hoặc nằm gần đường', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), 'TIP', 'Loại phòng: Family Bungalow, Deluxe Bungalow (tổng 9 phòng)
Sức chứa: Family Bungalow: có phòng khách riêng + 1 phòng ngủ, 2 giường (phù hợp 3-4 người); Deluxe Bungalow: 1 phòng ngủ, 1 giường (phù hợp 2 người)
Phong cách: Bungalow hiện đại pha nét địa phương (tường cách âm, ban công view núi/vườn) — thiên về mô hình "resort nhỏ" hơn là homestay dân dã truyền thống
View/Điểm nổi bật: Vị trí trung tâm thị trấn, dễ di chuyển; ; view thung lũng đẹp
Phù hợp nhóm khách: Cặp đôi (điểm riêng 9.5 cho chuyến 2 người — cao nhất trong các phân khúc khách) và gia đình nhỏ (nhờ phòng Family Bungalow có phòng khách riêng); không nhận tiệc độc thân/hen-stag party — chính sách nêu rõ
Giá tham khảo (nguyên văn): 500.000-800.000đ/ đêm 2 người', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-village-home'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Mù Cang Chải Big View Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Mù Cang Chải Big View Homestay', '0865847890', 'Dề Thàng, Chế Cu Nha, Mù Cang Chai, Yen Bai, Vietnam', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0865847890', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mù Cang Chải Big View Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'mu-cang-chai-big-view-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mù Cang Chải Big View Homestay' ORDER BY id DESC LIMIT 1),
  'Mù Cang Chải Big View Homestay', 'mu cang chai big view homestay', 'WiFi miễn phí, bãi đỗ xe miễn phí, lễ tân 24/24, sân thượng đón nắng, vườn, quầy bar, bàn/tủ đồ trong phòng, ấm đun nước + trái cây ở một số phòng, bếp đầy đủ dùng chung (cho khách dorm), có cổng chắn an toàn cho em bé, hỗ trợ đặt tour (xe máy, xe đạp, trekking)',
  @rg_che_cu_nha, 'Dề Thàng, Chế Cu Nha, Mù Cang Chai, Yen Bai, Vietnam', 538000, 538000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.booking.com/Share-OLGp0RN', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'PHONE', '0865847890', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/1GcKqw1nDvVW4Z1t9', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'PRO', 'chủ nhà (chị Chua) đón khách nhiệt tình kể cả khi đến rất muộn trong đêm, yên bình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'CON', 'Chưa có thông tin hạn chế', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), 'TIP', 'Loại phòng: Phòng đôi/twin riêng (self-contained, có khu tiếp khách + phòng thay đồ) và phòng dorm cho đoàn đông
Sức chứa: Phòng riêng: 1-2 giường (phù hợp 2 người); Dorm: dạng cộng đồng cho nhóm lớn, dùng chung nhà tắm và bếp đầy đủ
Phong cách: Nhà sàn/guest house truyền thống có cải tạo hiện đại nhẹ (ban công, sân thượng) — pha giữa mộc mạc và tiện nghi
View/Điểm nổi bật: View toàn cảnh ruộng bậc thang từ ban công/hồ;
Phù hợp nhóm khách: Rất đa dạng — 1 trong số ít homestay có đủ phân khúc: khách độc hành, cặp đôi (phòng riêng, được mô tả là "romantic getaway"), gia đình, và đoàn đông (dorm cộng đồng)
Giá tham khảo (nguyên văn): 538.000/1 đêm 2 người', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-big-view-homestay'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Chải Eco House ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Chải Eco House', '0975727510', 'Tổ 2, Mù Cang Chải, Yên Bái', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0975727510', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Chải Eco House' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'chai-eco-house', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Chải Eco House' ORDER BY id DESC LIMIT 1),
  'Chải Eco House', 'chai eco house', 'Điều hòa, khu ăn uống riêng trong phòng, phòng tắm riêng (bồn cầu có vòi xịt vệ sinh, dép đi trong nhà), sàn lát gạch, bàn làm việc, WiFi miễn phí, lễ tân 24/24, bãi đỗ xe riêng miễn phí, nhận thú cưng, không phục vụ bữa sáng',
  @rg_mu_cang_chai, 'Tổ 2, Mù Cang Chải, Yên Bái', 300000, 350000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.booking.com/hotel/vn/chai-eco-house.html', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 'PHONE', '0975727510', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/my9i3aNaKRNmNnES8', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 'CON', 'Mùa đông lạnh. Home không nấu ăn; khách phải dùng BBQ hoặc đi ăn ngoài', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), 'TIP', 'Loại phòng: Phòng đôi (1 giường), phòng twin (2 giường), phòng 3 người (triple) — 28 phòng tổng
Sức chứa: Đôi: 2 người; Twin: 2 người (2 giường); Triple: có ban công view núi, phù hợp 3 người
Phong cách: Khách sạn mini 3 sao hiện đại, không phải nhà sàn truyền thống — khác hẳn phong cách "bungalow tự nhiên" của Eco Home (dòng vừa làm trước)
View/Điểm nổi bật: Homestay mới hoàn thiện nên còn mới, thiết kế hiện đại, tối giản, view chill, gọn gàng yên tĩnh. Gần các điểm tham quan trong bán kính khoảng 1 km; có BBQ và quán ăn gần nhà
Phù hợp nhóm khách: Đa dạng: đôi, cặp đôi (phòng twin/đôi), và nhóm nhỏ 3 người (phòng triple có ban công)
Giá tham khảo (nguyên văn): 300.000-350.000/đêm 2 người', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='chai-eco-house'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): A Su Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('A Su Homestay', '0373749322', 'Tà Chí Lừ, La Pán Tẩn, Mù Cang Chải, Yên Bái (độ cao ~1.500m, cách trung tâm thị trấn ~9,9km)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0373749322', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='A Su Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'a-su-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='A Su Homestay' ORDER BY id DESC LIMIT 1),
  'A Su Homestay', 'a su homestay', 'WiFi miễn phí, bãi đỗ xe miễn phí, bếp chung đầy đủ, nhà hàng tại chỗ (có món chay/không gluten), máy sưởi + nước nóng + máy pha cà phê trong phòng, lò sưởi ngoài trời, bồn tắm ngoài trời, sân vườn, quầy bar, dịch vụ tour/trekking, cho thuê xe, lớp học nấu ăn, giữ hành lý, nhận thú cưng',
  @rg_la_pan_tan, 'Tà Chí Lừ, La Pán Tẩn, Mù Cang Chải, Yên Bái (độ cao ~1.500m, cách trung tâm thị trấn ~9,9km)', 400000, 1000000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.booking.com/Share-KDX7Gmz', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'PHONE', '0373749322', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/Ek3bZnenUaE7Lg2V8', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'PRO', 'Chủ nhà (anh A Su) cực kỳ thân thiện, coi khách như người nhà; phòng ~50m2 mới, sạch, có máy sưởi/nước nóng/máy pha cà phê; view bao quát cả huyện + biển mây. Quy mô nhỏ, có thể phù hợp khách thích lưu trú gia đình', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'CON', 'Đường leo dốc lên homestay khá dốc (không quá dài nhưng cần cẩn thận); có review ghi nhận nước nóng không đủ để tắm thoải mái', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), 'TIP', 'Loại phòng: 10 phòng — dạng đôi (double), đôi giường (twin), đơn (single); có mô tả riêng dạng "Superior Bungalow" (khu vực có lò sưởi, 1 phòng khách + 1 phòng ngủ riêng, 2 phòng tắm)
Sức chứa: Phòng đôi/twin: 2 người; Superior Bungalow: 2 giường, không gian tách biệt hơn
Phong cách: Nhà sàn độc lập trên đồi, đứng riêng biệt giữa bản người H\'Mông — cảm giác biệt lập/riêng tư cao hơn phần lớn homestay khác đã tra
View/Điểm nổi bật: Homestay cao nhất Mù Cang Chải (1.500m); view trọn ruộng bậc thang cả 3 xã (La Pán Tẩn, Chế Cu Nha, Dế Xu Phình) + gần như toàn bộ huyện + biển mây
Phù hợp nhóm khách: Cặp đôi (không gian riêng tư, có Superior Bungalow); gia đình nhỏ
Giá tham khảo (nguyên văn): 400.000 VND -1.000.000 VND/đêm 2 người', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='a-su-homestay'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Wind's Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Wind\'s Homestay', '0339817462', 'Đồi Mâm Xôi, Mù Cang Chải', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0339817462', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Wind\'s Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'wind-s-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Wind\'s Homestay' ORDER BY id DESC LIMIT 1),
  'Wind\'s Homestay', 'wind\'s homestay', 'Wi-Fi miễn phí, phục vụ ăn uống đặc sản, quầy bar, bãi đỗ xe riêng, dịch vụ lửa trại, múa xòe/múa sạp',
  @rg_mu_cang_chai, 'Đồi Mâm Xôi, Mù Cang Chải', 300000, 800000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.facebook.com/dinhho21/', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'PHONE', '0339817462', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/uiiyHmXmWGQ9eCXM6', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'PRO', 'Phải đi bộ/xe ôm leo dốc tầm 20-30 phút từ chân đồi lên nếu không quen đi đường đèo dốc, tiện nghi ở mức cơ bản', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'CON', 'Có thể đông, ồn và phụ thuộc mùa lúa', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), 'TIP', 'Loại phòng: Phòng Dorm tập thể (nhà sàn), phòng riêng Bungalow gỗ mộc mạc
Sức chứa: Phòng Dorm tập thể (nhà sàn), phòng riêng Bungalow gỗ mộc mạc 10-15 người
Phong cách: Mộc mạc, hoang sơ, đậm chất nhà sàn gỗ vùng cao bản địa
View/Điểm nổi bật: View triệu đô trực diện đồi Mâm Xôi huyền thoại, ngắm trọn bình minh và hoàng hôn trên ruộng lúa
Phù hợp nhóm khách: bạn nam chủ nhà là tour guide dẫn đoàn, nói chuyện dễ thương, tiện đường chụp ảnh do vị trí gần điểm check-in Đồi Mâm Xôi; có ăn uống và lưu trú
Giá tham khảo (nguyên văn): 300.000đ – 800.000đ / đêm 2 người', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='wind-s-homestay'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Homestay Chù Chỏ ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Homestay Chù Chỏ', '0832074131', 'Tà Chí Lừ, Púng Luông, Mù Cang Chải (ĐT: 0832074131)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0832074131', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Homestay Chù Chỏ' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'homestay-chu-cho', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Chù Chỏ' ORDER BY id DESC LIMIT 1),
  'Homestay Chù Chỏ', 'homestay chu cho', 'Điều hòa, phòng tắm riêng (vòi sen, dép đi trong nhà), ban công view núi, khu ăn uống riêng, ấm đun nước điện, bộ dụng cụ bếp, WiFi miễn phí, bãi đỗ xe riêng miễn phí, bữa sáng kiểu Á, an ninh/an toàn',
  @rg_pung_luong, 'Tà Chí Lừ, Púng Luông, Mù Cang Chải (ĐT: 0832074131)', 630000, 630000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.vacationcottage.com/property/homestay-ch%C3%B9-ch%E1%BB%8F/BC-14820133', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'PHONE', '0832074131', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/gCQfooX8gSEe3Qsy8', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'PRO', 'bữa sáng kiểu Á, phòng rẻ, chị chủ người dân tộc chân chất thật thà, nấu ăn ngon', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'CON', 'Đường lên khá nhỏ và dốc — khách được cảnh báo cẩn thận khi lái xe gia đình (ô tô) lên đây', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), 'TIP', 'Loại phòng: Nhà 4 phòng ngủ (theo phân loại "4 Bedrooms House")
Sức chứa: phù hợp theo nhóm/gia đình thuê nguyên căn hơn là theo giường lẻ
Phong cách: Nhà sàn/house kiểu gia đình, có sân vườn + sân thượng — không phải dạng dorm cộng đồng
View/Điểm nổi bật: View được mô tả là \'không tìm thấy ở nơi nào khác\'; đặc biệt đẹp lúc hoàng hôn; phòng có ban công nhìn núi,
Phù hợp nhóm khách: Thân thiện với trẻ em (child-friendly, được chủ nhà xác nhận)
Giá tham khảo (nguyên văn): 630.000/đêm 2 người', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='homestay-chu-cho'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Bamboo Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Bamboo Homestay', '0812170480', 'Bản Hấu Đề, La Pán Tẩn, Mù Cang Chải', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0812170480', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Bamboo Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'bamboo-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Bamboo Homestay' ORDER BY id DESC LIMIT 1),
  'Bamboo Homestay', 'bamboo homestay', 'Wi-Fi Internet, phục vụ cơm bản địa theo yêu cầu, khu vực đốt lửa trại/nướng BBQ ngoài trời, hỗ trợ thuê xe máy và dẫn tour trekking bản địa',
  @rg_la_pan_tan, 'Bản Hấu Đề, La Pán Tẩn, Mù Cang Chải', 100000, 400000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.facebook.com/p/Bamboo-Homestay-61556306561022/https://digiticket.vn/blog/homestay-mu-cang-chai/', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'PHONE', '0812170480', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/HnJfeuFoXt5SoB4Y8', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'PRO', 'Cơ sở vật chất sạch sẽ, vệ sinh khép kín. Anh chị chủ nhiệt tình, thân thiện, chu đáo (có chú chó đáng yêu), nấu ăn ngon', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'CON', 'Đường dốc hơi khó đi, suối chảy siết nên cẩn thận. Nhiều côn trùng bay vào phòng ban đêm vì sát ruộng', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), 'TIP', 'Loại phòng: 3 phòng ngủ. Giường tập thể (Dorm) trong nhà sàn lớn, phòng riêng lợp mái lá mộc mạc
Sức chứa: Từ khách đi bụi đơn lẻ, cặp đôi cho đến các nhóm phượt đông từ 10-15 người
Phong cách: Mộc mạc, giản dị và hoàn toàn tự nhiên với vật liệu chủ đạo là tre, nứa, gỗ bản địa và mái lá truyền thống
View/Điểm nổi bật: Nhà sàn làm bằng tre nứa, view thung lũng ruộng bậc thang; mới xây nên không gian mới, sạch; có trang Facebook riêng (~1,9k lượt follow), nằm ở vị trí tiện di chuyển đến các điểm tham quan, gần thị trấn, linh động thời gian checkin-checkout, Tọa độ săn mây lý tưởng vào sáng sớm; view ôm trọn thung lũng và những đường sóng ruộng bậc thang uốn lượn uốn quanh núi rừng Tây Bắc
Phù hợp nhóm khách: phù hợp nhất với khách đi phượt, dân du lịch bụi và các nhóm bạn trẻ yêu thích trải nghiệm thiên nhiên mộc mạc, săn mây và khám phá văn hóa bản địa giá rẻ.
Giá tham khảo (nguyên văn): 100.000đ – 400.000đ/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='bamboo-homestay'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Sùng A Hờ Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Sùng A Hờ Homestay', '0838921888', 'Tà Chơ, Mù Cang Chải', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0838921888', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Sùng A Hờ Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'sung-a-ho-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Sùng A Hờ Homestay' ORDER BY id DESC LIMIT 1),
  'Sùng A Hờ Homestay', 'sung a ho homestay', 'Phòng tắm riêng (vòi sen, dép, máy sấy tóc), 1 số phòng cách âm, ban công, WiFi miễn phí, bãi đỗ xe riêng miễn phí, bữa sáng buffet/kiểu Á, có quầy cà phê + bar tại chỗ, cho phép mang vật nuôi',
  @rg_mu_cang_chai, 'Tà Chơ, Mù Cang Chải', 170000, 500000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://dsdhome.vn/tin-tuc/homestay-mu-cang-chai.html', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'PHONE', '0838921888', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/3xDSdCPuWAxoq9EaA', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'PRO', 'Không gian thanh bình, dân dã, được nhiều bạn trẻ đi phượt lựa chọn (theo ghi chú trước); có tiện ích cà phê/bar riêng — khá hiếm ở nhóm homestay nhỏ', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'CON', 'quy mô nhỏ (3 phòng) nên dễ hết phòng cao điểm', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), 'TIP', 'Loại phòng: 3 phòng ngủ (phân loại "3 Bedrooms Apartment")
Sức chứa: quy mô nhỏ (chỉ 3 phòng) — phù hợp nhóm nhỏ
Phong cách: Dạng căn hộ/apartment nhỏ, không phải nhà sàn truyền thống — khác biệt với hầu hết homestay dân dã đã tra trong danh sách
View/Điểm nổi bật: View núi từ ban công
Phù hợp nhóm khách: phù hợp nhất với khách đi phượt, các bạn trẻ mê chụp ảnh và khách du lịch nước ngoài thích không gian yên tĩnh, biệt lập để săn mây và trải nghiệm nếp sống bản địa mộc mạc của người H\'Mông.
Giá tham khảo (nguyên văn): 170.000 – 500.000 / đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='sung-a-ho-homestay'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Suối Kim Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Suối Kim Homestay', '0367765445', 'Cách thị trấn Mù Cang Chải ~18km, sát QL32', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
-- [GHI CHÚ] SĐT 0367765445 đã được dùng để tạo account cho 1 provider khác trong
--   file (nghi ngờ lỗi nhập liệu trùng SĐT giữa 2 homestay khác nhau) ->
--   KHÔNG tạo thêm account cho 'Suối Kim Homestay' để tránh vi phạm UNIQUE
--   KEY account.phone. Provider vẫn được tạo nhưng CHƯA có tài khoản đăng
--   nhập -> cần rà soát/nhập SĐT đúng rồi tạo account thủ công.
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'suoi-kim-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Suối Kim Homestay' ORDER BY id DESC LIMIT 1),
  'Suối Kim Homestay', 'suoi kim homestay', 'Wi-Fi internet, phục vụ ăn uống đặc sản Tây Bắc tại nhà sàn, khoảng sân rộng có chỗ đỗ xe ô tô (từ 4 đến 16 chỗ), không gian thưởng trà ngắm cảnh ngoài hành lang.',
  @rg_tt_mu_cang_chai, 'Cách thị trấn Mù Cang Chải ~18km, sát QL32', 100000, 500000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://sinhtour.vn/homestay-o-mu-cang-chai/', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'PHONE', '0367765445', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/R37C2LAoSnfdrLtd6', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'PRO', 'Không gian rộng rãi, đồ ăn nấu ngon, gia đình chủ nhiệt', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'CON', 'Cách khá xa trung tâm thị trấn (~18km, ~30 phút xe máy). Có phản hồi hủy phòng của khách không báo trước', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), 'TIP', 'Loại phòng: Phòng tập thể rộng, có thể ngăn thành nhiều phòng nhỏ
Sức chứa: Rất thích hợp cho các đoàn đi đông người, nhóm phượt hoặc khách lẻ (sức chứa tổng lên tới hơn 30 người)
Phong cách: Mang đậm kiến trúc nhà sàn cổ mộc mạc hoài niệm của người Thái, giữ nguyên nếp sống bản địa dân dã và gần gũi.
View/Điểm nổi bật: Không gian rộng rãi, kiến trúc hoài cổ, nhiều nhà sàn được giữ/tái hiện sát thực tế; ô tô 4-16 chỗ đỗ được tận nơi, View hành lang ngắm núi non trập trùng và cánh đồng quanh thị trấn; vị trí gần trung tâm giúp dễ dàng ăn uống, dạo chợ phiên thị trấn và di chuyển sâu vào các bản lân cận như Bản Lìm Mông, bản Hua Khắ
Phù hợp nhóm khách: phù hợp nhất với đoàn khách đông người, gia đình hoặc nhóm đi phượt muốn tìm nơi lưu trú giá bình dân, gần trung tâm thị trấn để tiện đi lại, ăn uống và trải nghiệm văn hóa nhà sàn Thái cổ.
Giá tham khảo (nguyên văn): 100.000 - 500.000/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='suoi-kim-homestay'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Bluehome Homestay (Khau Phạ) ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Bluehome Homestay (Khau Phạ)', '0865186456', 'Bản Ít Thái, xã Cao Phạ, Mù Cang Chải, Yên Bái (gần điểm nhảy dù đèo Khau Phạ, cách trung tâm thị trấn ~19,9km)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0865186456', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Bluehome Homestay (Khau Phạ)' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'bluehome-homestay-khau-pha', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Bluehome Homestay (Khau Phạ)' ORDER BY id DESC LIMIT 1),
  'Bluehome Homestay (Khau Phạ)', 'bluehome homestay (khau pha)', 'WiFi miễn phí, bãi đỗ xe an toàn, dịch vụ phòng, lễ tân 24/24, tắm khoáng nóng/bồn tắm ngoài trời miễn phí, nhà hàng nguyên liệu tươi tại chỗ, sân hiên riêng mỗi phòng, ấm đun nước điện, bàn ăn, giá treo đồ, máy sấy tóc, đồ vệ sinh cá nhân miễn phí, bữa sáng kiểu Á',
  @rg_cao_pha, 'Bản Ít Thái, xã Cao Phạ, Mù Cang Chải, Yên Bái (gần điểm nhảy dù đèo Khau Phạ, cách trung tâm thị trấn ~19,9km)', 500000, 500000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://vietdovetravel.com/3-best-homestays-in-mu-cang-chai-with-amazing-views-2026-guide/', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'PHONE', '0865186456', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/i6qHcWjUzYQqbCCE7', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'PRO', 'Trải nghiệm văn hóa Thái đậm nét (cơm nhà, nước lá rừng, khèn Mông); có dịch vụ tắm khoáng nóng + văn nghệ dân tộc miễn phí — hiếm thấy ở các homestay khác đã tra; vị trí thuận lợi tới nhiều điểm tham quan (đèo Khau Phạ, ruộng bậc thang Tú Lệ, La Pán Tẩn)', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'CON', 'Có thể ồn vào ban đêm khi homestay kín phòng, Cách trung tâm khá xa (~20km)', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), 'TIP', 'Loại phòng: Đa dạng: phòng đôi, phòng 4 người (quadruple), dorm cộng đồng, và bungalow riêng tư
Sức chứa: Phòng đôi/quadruple: 2-4 người; dorm: cho nhóm đông, phù hợp cả khách lẻ lẫn đoàn
Phong cách: Nhà gỗ mộc mạc kết hợp bungalow riêng tư hiện đại nhẹ — pha giữa trải nghiệm bản địa Thái (cơm nhà, khèn Mông buổi tối) và tiện nghi nghỉ dưỡng nhẹ (bồn tắm, hồ bơi)
View/Điểm nổi bật: Bungalow view thung lũng 360°, có bồn tắm lớn ngoài trời hướng ruộng lúa/núi, có hồ bơi, phục vụ BBQ + bữa ăn nếu đặt trước, cho thuê xe đạp khám phá bản làng. View "triệu đô": biển mây phủ thung lũng Khau Phạ, ban công đón mây sớm; gần điểm nhảy dù nổi tiếng
Phù hợp nhóm khách: Trẻ em mọi lứa tuổi được chào đón, phù hợp cả khách lẻ (dorm), cặp đôi (bungalow riêng), và gia đình/nhóm bạn (phòng 4 người)
Giá tham khảo (nguyên văn): ~500.000đ/phòng cho 4 người', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='bluehome-homestay-khau-pha'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Pú Nhu Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Pú Nhu Homestay', '0941584153', 'Bản Pú Nhu Háng Sung, xã La Pán Tẩn, Mù Cang Chải, Yên Bái', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0941584153', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Pú Nhu Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'pu-nhu-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Pú Nhu Homestay' ORDER BY id DESC LIMIT 1),
  'Pú Nhu Homestay', 'pu nhu homestay', 'WiFi miễn phí toàn khu, bãi đỗ xe (tại chỗ + gần đó), lễ tân 24/24 (tiếng Anh + Việt), dọn phòng hàng ngày, giữ hành lý, ấm đun nước điện mọi phòng, phòng cách âm, khu hút thuốc riêng (toàn khu không hút thuốc trong phòng), máy sấy tóc + đồ vệ sinh cá nhân ở 1 số phòng',
  @rg_la_pan_tan, 'Bản Pú Nhu Háng Sung, xã La Pán Tẩn, Mù Cang Chải, Yên Bái', 432000, 432000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://digiticket.vn/blog/homestay-mu-cang-chai/', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'PHONE', '0941584153', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/XZFApebXWu7kTFhP9', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'PRO', 'Quy mô lớn (29 phòng) nên khả năng nhận khách cao hơn hẳn các homestay nhỏ khác', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'CON', 'Mới mở nên mùa cao điểm thường xuyên kín phòng — khách cần đặt trước 2–3 tuầnKhông có dịch vụ đưa đón sân bay (khác với nhiều homestay khác có hỗ trợ); là 1 trong số ít nơi ghi rõ "không nhận thú cưng" — cần lưu ý nếu khách mang theo pet', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), 'TIP', 'Loại phòng: Quy mô lớn — 29 phòng, một số phòng có điều hòa
Sức chứa: Phòng có tủ lạnh, nước đóng chai, cà phê/trà hòa tan ở 1 số phòng — trẻ 1-5 tuổi ở miễn phí nếu dùng chung giường có sẵn, trẻ từ 6 tuổi trở lên tính như người lớn
Phong cách: Homestay quy mô lớn kiểu "mini hotel" hơn là nhà sàn nhỏ
View/Điểm nổi bật: View \'nghìn like\' hướng thung lũng Mũi Giày, sát đường lên đồi Mâm Xôi (~100m); đa dạng loại phòng; chủ nhiệt tình, đồ ăn ngon giá hợp lý, nhà của dân nên giá phòng rẻ
Phù hợp nhóm khách: Đa dạng: gia đình có trẻ nhỏ (chính sách trẻ em rõ ràng, cho ở miễn phí dưới 6 tuổi), khách công tác (phòng cách âm, có điều hòa) — nhưng không nhận tiệc độc thân/hen party; không nhận thú cưng
Giá tham khảo (nguyên văn): 432.000/1 đêm 2 người', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='pu-nhu-homestay'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Dòng Suối Hmong Homestay & Bungalow ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Dòng Suối Hmong Homestay & Bungalow', '0354727980', 'Chế Cu Nha, Mù Cang Chải (cách trung tâm thị trấn ~4km, bên bờ suối)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0354727980', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Dòng Suối Hmong Homestay & Bungalow' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'dong-suoi-hmong-homestay-bungalow', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Dòng Suối Hmong Homestay & Bungalow' ORDER BY id DESC LIMIT 1),
  'Dòng Suối Hmong Homestay & Bungalow', 'dong suoi hmong homestay & bungalow', 'Điều hòa, máy sấy tóc, đồ vệ sinh cá nhân, ấm đun nước điện, TV màn hình phẳng, phòng khách riêng (ở bungalow), sân thượng đón nắng, phòng họp/hội nghị (phù hợp nhóm công tác), sân picnic, khu ăn ngoài trời, đưa đón sân bay',
  @rg_che_cu_nha, 'Chế Cu Nha, Mù Cang Chải (cách trung tâm thị trấn ~4km, bên bờ suối)', 150000, 550000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.booking.com/homestay/city/vn/mu-cang-chai.html', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'PHONE', '0354727980', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/raxv3F2gSDrxFY3w9', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'PRO', 'Phòng ốc sạch sẽ. Ông chủ người pháp, bà chủ người việt, homestay nằm kế bên con suối, sau lưng là ruộng bậc thang . Bữa tối được khen đặc biệt xuất sắc, món đặc trưng (mứt xoài-chanh dây, nem) được nhắc nhiều lần; chủ nhà am hiểu, hỗ trợ tour/trekking/xe máy có hướng dẫn địa phương; giờ yên tĩnh rõ ràng (22h-5h)', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'CON', 'Đồ ăn giá cao hơn bên ngoài. Không nhận tiệc độc thân/hen party; yêu cầu thanh toán trước qua chuyển khoản trước khi nhận phòng (khác với phần lớn homestay khác chỉ cần đặt cọc/thanh toán tại chỗ)', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), 'TIP', 'Loại phòng: Đa dạng: phòng đôi, gia đình, bungalow riêng (12 phòng)
Sức chứa: Điều hòa, giường dài hơn tiêu chuẩn, phòng gia đình cho nhóm/gia đình
Phong cách: Nhà sàn/bungalow ven suối, không gian xanh, tách biệt khỏi khu du lịch đông đúc
View/Điểm nổi bật: Vị trí đẹp, nhà cổ view tuyệt; bữa sáng/tối được khen nhiều; chủ nhà hỗ trợ tổ chức tour quanh ruộng bậc thang + rừng tre với tài xế địa phương, giá tour hợp lý. Có cả homestay và bungalow; định vị được trải nghiệm H’Mông.Tọa lạc bên suối, view sông + núi + vườn; theo 1 review "vị trí xa nơi đông khách du lịch giúp cảm nhận trọn vẻ đẹp nguyên sơ
Phù hợp nhóm khách: Cặp đôi (điểm riêng 9.6 cho chuyến 2 người); nhóm công tác/sự kiện (có phòng hội nghị); gia đình (phòng gia đình riêng) — nhưng khách dưới 18 tuổi chỉ được nhận phòng cùng bố mẹ/người giám hộ
Giá tham khảo (nguyên văn): 150.000 – 550.000đ/người/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='dong-suoi-hmong-homestay-bungalow'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Mù Cang Chải Dream House ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Mù Cang Chải Dream House', '0786166222', 'Ngã Ba Kim', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0786166222', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Mù Cang Chải Dream House' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'mu-cang-chai-dream-house', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Mù Cang Chải Dream House' ORDER BY id DESC LIMIT 1),
  'Mù Cang Chải Dream House', 'mu cang chai dream house', 'WiFi miễn phí, nhà hàng + quầy bar tại chỗ, sân vườn, sân thượng đón nắng, tủ lạnh, phòng tắm có vòi xịt vệ sinh + đồ vệ sinh cá nhân + máy sấy tóc, lễ tân 24/24, bữa sáng buffet/gọi món/kiểu Á,',
  @rg_mu_cang_chai, 'Ngã Ba Kim', 800000, 800000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://atravel.vn/homestay-mu-cang-chai', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'PHONE', '0786166222', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/945DKvhca8KtYo66A', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'PRO', 'Có 1 review 10/10: khách khen "cảm thấy như ở nhà", nhân viên chu đáo giữ ấm dù thời tiết lạnh bất thường hôm đó', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'CON', 'Chưa có thông tin về hạn chế', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), 'TIP', 'Loại phòng: Dạng "Cabin" 2 phòng ngủ
Sức chứa: Chưa rõ số người/phòng cụ thể
Phong cách: Dạng cabin/nhà nghỉ hiện đại, có nhà hàng phục vụ đa dạng khung giờ (brunch, trưa, tối, trà chiều, cocktail)
View/Điểm nổi bật: Phong cách hiện đại nhưng gần gũi thiên nhiên; ban công ngắm toàn cảnh ruộng bậc thang; có cho thuê xe đạp/xe máy; nhà hàng tại chỗ phục vụ món Tày
Giá tham khảo (nguyên văn): 800.000/đêm 2 người', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='mu-cang-chai-dream-house'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Súa Su Homestay ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Súa Su Homestay', '0866554428', 'Đèo Khau Phạ, Mù Cang Chải, Khu vực Tú Lệ', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0866554428', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Súa Su Homestay' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'sua-su-homestay', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Súa Su Homestay' ORDER BY id DESC LIMIT 1),
  'Súa Su Homestay', 'sua su homestay', 'Chỗ đỗ xe máy và ô tô rộng rãi.Phục vụ ăn uống tại chỗ với các món đặc sản Tây Bắc (gà đồi, lợn bản, xôi nếp Tú Lệ) theo yêu cầu.Hỗ trợ tư vấn lịch trình chi tiết, thuê xe ôm bản địa dẫn đường đi trekking.',
  @rg_tu_le, 'Đèo Khau Phạ, Mù Cang Chải, Khu vực Tú Lệ', 100000, 450000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://vietdovetravel.com/3-best-homestays-in-mu-cang-chai-with-amazing-views-2026-guide/', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'PHONE', '0866554428', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/aFH3viSqy2SBXth29', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'PRO', 'Nơi ở sạch sẽ, view ra thung lũng. Anh chủ thân thiện dễ', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'CON', 'Phòng được mô tả là đơn giản, chưa quá đủ thiết bị bàn ghế', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), 'TIP', 'Loại phòng: Phòng tập thể (Nhà sàn): Có 1 nhà sàn lớn cấu trúc không gian mở, trang bị từ 15 – 30 đệm cá nhân trải sàn.Phòng riêng: Có khoảng 4 – 6 phòng riêng biệt (bao gồm phòng đơn và phòng đôi cho gia đình).
Sức chứa: Sức chứa lớn từ 15 – 30 người, sử dụng đệm cá nhân trải sàn, phù hợp cho các đoàn phượt đông người.Phòng riêng biệt (Phòng đôi/Phòng gia đình): Sức chứa từ 2 – 4 người/phòng
Phong cách: nhà nghỉ bản địa truyền thống kết hợp nhà sàn dân tộc Thái, nhà sàn gỗ lớn, mộc mạc
View/Điểm nổi bật: Nổi tiếng nhiều năm với view toàn cảnh + cảnh dù lượn (paragliding) bay ngang qua — trải nghiệm độc nhất không nơi nào khác ở MCC có; gần các điểm dù lượn nổi tiếng (Bản Lìm Mông, Lìm Thái); nhân viên thân thiện
Phù hợp nhóm khách: Phù hợp nhóm đoàn đông, khách đi phượt và du lịch bụi
Giá tham khảo (nguyên văn): 100.000– 150.000 người/đêm (phòng cộng đồng) 300.000 – 450.000/đêm (phòng riêng). Homestay cũng cung cấp dịch vụ trọn gói (gồm ăn tối, ăn sáng và lưu trú) khoảng 300.000 /người.', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='sua-su-homestay'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Homestay Tư Nguyệt ----
-- [FILE+SUY LUẬN] Tên homestay trùng khớp tuyệt đối với 1 bản ghi đã có ở
--   sheet 'Homestay' (chính thống) -> coi là cùng 1 nơi, dùng lại Provider
--   và gán master_place_id (BR-96) thay vì tạo Provider/Account mới.
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'homestay-tu-nguyet-2', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Homestay Tư Nguyệt' ORDER BY id DESC LIMIT 1),
  'Homestay Tư Nguyệt', 'homestay tu nguyet', 'Mở cửa 24h, TV, tủ lạnh, bình nước nóng/lạnh, cho thuê xe máy, đặt tour/vé máy bay, đốt lửa trại + giao lưu văn nghệ dân tộc, ẩm thực dân tộc tại chỗ, bãi đỗ xe an ninh',
  @rg_tt_mu_cang_chai, 'Bản Thái, thị trấn Mù Cang Chải', 120000, 250000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://ticotravel.com.vn/homestay-mu-cang-chai/', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
UPDATE place SET master_place_id = @place_homestay_tu_nguyet WHERE slug='homestay-tu-nguyet-2';  -- BR-96: merge bản ghi trùng (xem mục 3+4)
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'PHONE', '0813772213', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/YuxQEGbChk2wYqXbA', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'PRO', 'Đã kinh doanh nhiều năm', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'CON', 'Chính sách hủy khá chặt: hủy trong vòng 6 ngày trước check-in bị tính phí 100%; dịp lễ Tết không được hủy/đổi/hoàn dưới mọi hình thức — cần lưu ý khi tư vấn khách đặt dịp cao điểm', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), 'TIP', 'Loại phòng: (1) Sàn ngủ tập thể — 3 sàn; (2) Phòng riêng — 10 phòng
Sức chứa: Sức chứa lớn, khoảng 30 người. Căn Bungalow riêng biệt thích hợp nhóm nhỏ 5-6 người
Phong cách: Nhà sàn gỗ Pơ Mu, phong cách truyền thống Thái kết hợp hiện đại
View/Điểm nổi bật: Phong cách truyền thống, vật liệu gỗ và đá, không gian ấm cúng gần gũi. Vị trí trung tâm, có khả năng thuận tiện cho ăn uống và di chuyển. Từ ban công ngắm được thung lũng ruộng bậc thang + rừng thông bát ngát; view toàn cảnh thị trấn MCC; nằm cạnh dòng suối
Phù hợp nhóm khách: Có hoạt động đốt lửa trại/giao lưu văn nghệ — phù hợp nhóm/đoàn muốn trải nghiệm cộng đồng, không chỉ nghỉ ngơi đơn thuần
Giá tham khảo (nguyên văn): Sàn ngủ tập thể: 120.000đ/khách/đêm; Phòng riêng: 250.000đ/khách/đêm', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), (SELECT id FROM amenity WHERE code='HOT_WATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='homestay-tu-nguyet-2'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): Indigenous Homestay – Trek & Local Life ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('Indigenous Homestay – Trek & Local Life', '0355014012', 'Bản Hấu Đề, xã La Pán Tẩn, Mù Cang Chải (cách trung tâm thị trấn ~12km về phía đông nam)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('0355014012', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='Indigenous Homestay – Trek & Local Life' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'indigenous-homestay-trek-local-life', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='Indigenous Homestay – Trek & Local Life' ORDER BY id DESC LIMIT 1),
  'Indigenous Homestay – Trek & Local Life', 'indigenous homestay – trek & local life', 'WiFi miễn phí, phòng tắm riêng, bàn làm việc, bãi đỗ xe (miễn phí + có valet), khu gửi xe đạp, sân thượng đón nắng, sân vườn, lò sưởi ngoài trời, khu picnic, phòng chơi trong nhà, đưa đón sân bay, nhà hàng phục vụ chay/vegan/không gluten/không sữa',
  @rg_la_pan_tan, 'Bản Hấu Đề, xã La Pán Tẩn, Mù Cang Chải (cách trung tâm thị trấn ~12km về phía đông nam)', 300000, 300000,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://digiticket.vn/blog/homestay-mu-cang-chai/', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'PHONE', '0355014012', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/Y2RLdXETXeDzuHiFA', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'PRO', 'Chủ nhà nhiệt tình, món ăn ngon, có tour trekking/xe đạp đi kèm;', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'CON', 'Hơi khó tiếp cận bằng xe máy (1 khách khuyên nên gọi trước cho chủ nhà để được chỉ đường từ đường chính); vị trí xa trung tâm ~12km', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), 'TIP', 'Loại phòng: Phòng gia đình (family rooms)
Sức chứa: Sức chứa khoảng từ 10 đến 15 khách cùng một lúc.
Phong cách: Nhà người H\'Mông bản địa thật (gia đình 6 người đang sinh sống), mở cửa đón khách để chia sẻ văn hóa
View/Điểm nổi bật: Sát quốc lộ 32 nên dễ đi chợ + di chuyển tới điểm tham quan; nhiều loại phòng cho cặp đôi/gia đình, giá hợp lý; có dịch vụ đón tiễn sân bay + tour địa phương.View núi từ trên đồi, xung quanh có động vật nuôi thả tự nhiên, cách xa khu du lịch đông đúc (khách nhận xét "không thấy khách du lịch nào khác suốt 3 ngày")
Phù hợp nhóm khách: Khách đi cặp/nhóm nhỏ muốn trải nghiệm sâu văn hóa H\'Mông thật (nấu ăn cùng, thu hoạch mùa màng cùng gia đình chủ); không phù hợp khách muốn tiện nghi cao cấp
Giá tham khảo (nguyên văn): ~300.000/đêm 2 người', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='WIFI'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='PARKING'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='indigenous-homestay-trek-local-life'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ---- Homestay (reviewer): GARRYA Mù Cang Chải ----
INSERT INTO provider (name, contact_phone, address, status) VALUES ('GARRYA Mù Cang Chải', '02163878989', 'Bản Pú Nhu, xã Púng Luông, Mù Cang Chải (sát điểm ngắm Mâm Xôi)', 'ACTIVE');  -- [SINH] provider tạo tự động để thoả BR-06 (Homestay bắt buộc có Provider)
INSERT INTO account (phone, password_hash, role, status, provider_id) VALUES ('02163878989', '$2y$10$PLACEHOLDER_CHANGE_ME_HASH', 'PROVIDER', 'ACTIVE', (SELECT id FROM provider WHERE name='GARRYA Mù Cang Chải' ORDER BY id DESC LIMIT 1));  -- [SINH] password_hash & account là dữ liệu phát sinh, không có trong file
INSERT INTO place (slug, category_id, kind, provider_id, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, source_url, verification, last_verified_at, attributes) VALUES (
  'garrya-mu-cang-chai', (SELECT id FROM category WHERE slug='luu-tru'), 'HOMESTAY', (SELECT id FROM provider WHERE name='GARRYA Mù Cang Chải' ORDER BY id DESC LIMIT 1),
  'GARRYA Mù Cang Chải', 'garrya mu cang chai', 'Hồ bơi ngoài trời + trong nhà, spa đầy đủ dịch vụ, phòng gym miễn phí, 2 nhà hàng + 2 quầy bar/lounge + 1 quán cà phê, dịch vụ đưa đón sân bay, minibar, két an toàn, bồn tắm riêng (ở villa), điều hòa, TV cáp, đưa đón taxi nội thành, giặt là, hồ bơi riêng ở villa',
  @rg_pung_luong, 'Bản Pú Nhu, xã Púng Luông, Mù Cang Chải (sát điểm ngắm Mâm Xôi)', NULL, NULL,
  'PUBLISHED', 'PUBLIC_TRUSTED', 'Reviewer tổng hợp (Booking.com/Google Maps/blog du lịch)', 'https://www.garrya.com/en/destinations/mu-cang-chai', 'VERIFIED', '2026-09-16', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'PHONE', '02163878989', TRUE);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'GOOGLE_MAPS', 'https://maps.app.goo.gl/K2rVWVMjv3TBsvc2A', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'PRO', 'Điểm 10/10 và 9.8/10 trên nhiều nền tảng; quản lý phản hồi trực tiếp từng review chi tiết, kể cả review chê, mức độ chuyên nghiệp CSKH cao', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'CON', 'phân khúc giá cao, không đại diện cho trải nghiệm \'homestay\' phổ thông của đa số khách mục tiêu nền tảng. Phí phát sinh cao: giường phụ ~1.757.700đ/người/đêm, xe đưa đón Hà Nội riêng ~2.700.000đ/lượt — chi phí tổng thể có thể vượt xa mức giá phòng niêm yết nếu đi gia đình đông người', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), 'TIP', 'Loại phòng: Deluxe Room King, Grand Deluxe King (1 phòng ngủ riêng), Suite 2 phòng ngủ có bếp, Pool Villa có hồ bơi riêng, Signature Suite (Wellbeing/Pool Suite)
Sức chứa: Deluxe: 2 người (1 giường King); Grand Deluxe: 4 người (1 phòng ngủ riêng); Suite 2PN: phù hợp nhóm/gia đình lớn hơn
Phong cách: Kiến trúc tre tối giản hiện đại kết hợp thủ công địa phương, theo chuẩn Banyan Group quốc tế
View/Điểm nổi bật: Kiến trúc tre độc đáo hòa vào địa hình đồi núi, họa tiết thổ cẩm H\'Mông; vị trí sát điểm ngắm bình minh Mâm Xôi; được báo quốc tế đánh giá là điểm đến \'chưa bị du lịch hóa quá mức\' khác với Sa Pa; quản lý phản hồi mọi review rất chuyên nghiệp, chu đáo, phân khúc nghỉ dưỡng cao cấp.Ngay sát điểm ngắm bình minh Mâm Xôi; villa nhìn thẳng ra ruộng bậc thang + núi
Phù hợp nhóm khách: Khách quốc tế cao cấp, cặp đôi tìm không gian wellness/retreat (có lớp yoga, thiền, chăm sóc sức khỏe), nhóm bạn/gia đình đông (suite 2PN); trẻ dưới 6 tuổi ở miễn phí cùng bố mẹ; 6-12 tuổi phụ thu bữa sáng
Giá tham khảo (nguyên văn): ~$150 – $370/đêm (tùy ngày, đã gồm thuế phí)', TRUE);
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='HEATER'), 'YES');
INSERT INTO place_amenity (place_id, amenity_id, value) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'), (SELECT id FROM amenity WHERE code='RESTAURANT'), 'YES');
INSERT INTO homestay_profile (place_id) VALUES ((SELECT id FROM place WHERE slug='garrya-mu-cang-chai'));  -- [SINH] dòng trống, không có giờ check-in/out trong file
-- [GHI CHÚ] Không tạo room_type: 'Loại phòng'/'Sức chứa' là mô tả tự do, xem TIP ở trên.

-- ============================================================================
-- 6. ĐIỂM ĐẾN (place, kind=ATTRACTION) — sheet 'Điểm đến'. Không có Provider
--    (attraction không bắt buộc thuộc Provider theo BR-06, chỉ Homestay mới
--    bắt buộc). provider_id để NULL.
-- ============================================================================

-- ---- Điểm đến: La Pán Tẩn ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'la-pan-tan', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'La Pán Tẩn', 'la pan tan', '-Một trong những khu vực ruộng bậc thang đẹp và nổi tiếng nhất Mù Cang Chải.
-Nổi bật với những thửa ruộng hình mâm xôi.
-Đẹp nhất vào mùa lúa chín, thường khoảng tháng 9–10.
-Rất phù hợp để săn ảnh bình minh/hoàng hôn.', @rg_la_pan_tan,
  'Đồi Mâm Xôi nằm tại La Pán Tẩn, cách trung tâm Mù Cang Chải hơn 8 km', NULL, NULL, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='la-pan-tan'), 'TIP', 'Xu hướng khách: Cao điểm: cuối tháng 9 – tháng 10.
Nhóm khách nổi bật về hành vi: chụp ảnh, check-in, ngắm ruộng bậc thang.
Mùa nước đổ tháng 5–6 cũng có sức hút, nhưng thấp hơn mùa vàng theo các nguồn du lịch.
Chưa có số liệu công khai về giới tính và độ tuổi.', TRUE);

-- ---- Điểm đến: Đồi Mâm Xôi ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'doi-mam-xoi', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Đồi Mâm Xôi', 'doi mam xoi', 'Biểu tượng du lịch của Mù Cang Chải.
Nằm tại khu vực La Pán Tẩn.
Có thể đi xe lên gần khu vực tham quan rồi đi bộ/xe trung chuyển tùy thời điểm.
Đây gần như là điểm không nên bỏ qua nếu lần đầu đến Mù Cang Chải.', @rg_mu_cang_chai,
  NULL, 30000, 30000, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);

-- ---- Điểm đến: Chế Cu Nha ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'che-cu-nha', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Chế Cu Nha', 'che cu nha', 'Một trong những vùng ruộng bậc thang đẹp nhất.
Ít cảm giác "điểm du lịch đại trà" hơn một số điểm trung tâm.
Đường lên có nhiều đoạn dốc, nhưng cảnh núi và ruộng rất đẹp.', @rg_che_cu_nha,
  'Khu vực Chế Cu Nha, Mù Cang Chải, Lào Cai', NULL, NULL, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='che-cu-nha'), 'TIP', 'Xu hướng khách: xu hướng sản phẩm của Chế Cu Nha đang chuyển từ chỉ ngắm cảnh sang du lịch cộng đồng + văn hóa + trải nghiệm.', TRUE);

-- ---- Điểm đến: Dế Xu Phình ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'de-xu-phinh', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Dế Xu Phình', 'de xu phinh', 'Nổi tiếng với những thửa ruộng bậc thang trải rộng trên sườn núi.
Có nhiều góc chụp toàn cảnh.
Có thể kết hợp với La Pán Tẩn trong cùng một buổi.', @rg_de_xu_phinh,
  'Khu vực Dế Xu Phình, Mù Cang Chải, Lào Cai', NULL, NULL, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='de-xu-phinh'), 'TIP', 'Xu hướng khách: Về xu hướng, điểm này phù hợp với:

nhiếp ảnh;
ngắm ruộng bậc thang;
trekking;
trải nghiệm bản làng;
khách muốn tìm không gian ít đô thị hóa hơn.
Mùa đẹp        🌾 Tháng 9–10
Mùa nước đổ        🌱 Tháng 5–6', TRUE);

-- ---- Điểm đến: Đèo Khau Phạ ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'deo-khau-pha', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Đèo Khau Phạ', 'deo khau pha', 'Một trong tứ đại đỉnh đèo của Tây Bắc.
Cung đường nằm giữa Tú Lệ và Mù Cang Chải.
Có thể ngắm toàn cảnh núi rừng và thung lũng.
Là nơi tổ chức dù lượn mùa vàng vào một số thời điểm.', @rg_cao_pha,
  'Khu vực Cao Phạ – Tú Lệ, trên QL32', 1500000, 3000000, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='deo-khau-pha'), 'TIP', 'Xu hướng khách: Ngoài ngắm cảnh, Khau Phạ nổi bật với hoạt động dù lượn "Bay trên mùa vàng", cho phép du khách nhìn xuống thung lũng Lìm Mông trong mùa lúa chín.', TRUE);

-- ---- Điểm đến: Thung lũng Tú Lệ ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'thung-lung-tu-le', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Thung lũng Tú Lệ', 'thung lung tu le', 'Nằm trên cung đường Hà Nội → Mù Cang Chải.
Nổi tiếng với ruộng lúa, núi và bản làng người Thái.
Có thể kết hợp nghỉ 1 đêm ở Tú Lệ nếu muốn chuyến đi thong thả.', @rg_tu_le,
  'Thung lũng Tú Lệ, khu vực Văn Chấn', 0, 0, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='thung-lung-tu-le'), 'TIP', 'Xu hướng khách: Điểm này nổi bật với:

ruộng bậc thang;
văn hóa người Thái;
nếp Tú Lệ;
cốm;
thung lũng Tú Lệ;
Lìm Mông – Lìm Thá', TRUE);

-- ---- Điểm đến: Thác Pú Nhu ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'thac-pu-nhu', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Thác Pú Nhu', 'thac pu nhu', 'Thác nước nằm giữa núi rừng.
Không khí mát, khá thích hợp để nghỉ chân sau khi đi các điểm ruộng bậc thang.
Có đường đi bộ ngắn vào thác.', @rg_la_pan_tan,
  'Bản Pú Nhu, khu vực La Pán Tẩn
Khoảng 10 km từ trung tâm Mù Cang Chải', 0, 0, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);
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
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'thac-mo', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Thác Mơ', 'thac mo', 'Một điểm thiên nhiên khác ở Mù Cang Chải.
Có dòng nước chảy giữa núi rừng, cảnh khá nguyên sơ.
Phù hợp nếu bạn muốn chuyến đi có thêm thiên nhiên thay vì chỉ săn ruộng lúa.', @rg_mo_de,
  'Giữa đỉnh Nả Háng A và Nả Háng B, khu vực Mồ Dề', 0, 0, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);
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
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'doi-mong-ngua', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Đồi Móng Ngựa', 'doi mong ngua', 'Ruộng bậc thang uốn cong hình móng ngựa/võng
Điểm hấp dẫn nhất của Đồi Móng Ngựa là các thửa ruộng bậc thang uốn thành những vòng cung lớn, tạo hiệu ứng thị giác rất rõ khi nhìn từ trên cao. Đây là kiểu cảnh quan đặc biệt phù hợp với nhiếp ảnh và check-in.', @rg_mu_cang_chai,
  'Khu vực Sáng Nhù, Mù Cang Chải, Lào Cai
Hơn 2 km từ trung tâm Mù Cang Chải', 30000, 30000, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='doi-mong-ngua'), 'TIP', 'Xu hướng khách: Check-in, chụp ảnh, ngắm lúa, săn ảnh mùa vàng
Mùa cao điểm        Khoảng tháng 9 – tháng 10
Mùa nước đổ        Khoảng tháng 5 – tháng 6', TRUE);

-- ---- Điểm đến: Rừng Trúc ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'rung-truc', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Rừng Trúc', 'rung truc', 'Rừng trúc lâu năm, không gian xanh, nguyên sơ
Tuổi rừng Khoảng 60 năm', @rg_mo_de,
  'Mồ Dề – Nả Háng Tủa, Mù Cang Chải, Lào Cai
Khoảng 20 km từ trung tâm Mù Cang Chải', 30000, 30000, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='rung-truc'), 'TIP', 'Xu hướng khách: Đi bộ, trekking, chụp ảnh, khám phá thiên nhiên
Mùa cao điểm        Không phụ thuộc mạnh vào mùa lúa như Mâm Xôi/Móng Ngựa', TRUE);

-- ---- Điểm đến: Sống Lưng Khủng Long ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, address, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'song-lung-khung-long', (SELECT id FROM category WHERE slug='diem-den'), 'ATTRACTION',
  'Sống Lưng Khủng Long', 'song lung khung long', 'Sống núi đá nhô ra như lưng khủng long
Điểm gây ấn tượng là con đường mòn nằm cheo leo trên sườn núi, với các phiến đá xếp nối tiếp nhau tạo hình giống những chiếc gai trên lưng khủng long. Từ trên cao có thể quan sát một vùng rộng của ruộng bậc thang và các bản làng phía dưới', @rg_de_xu_phinh,
  'Bản Phình Hồ, Dế Xu Phình
~19 km từ trung tâm', 30000, 30000, NULL, 'PUBLISHED',
  'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Điểm đến)', 'UNVERIFIED', JSON_OBJECT()
);
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
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-hang-quyen-huong', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Nhà hàng Quyền Hường', 'nha hang quyen huong', @rg_mu_cang_chai, 'khu trung tâm, QL32',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-quyen-huong'), 'PHONE', '0942447103', TRUE);

-- ---- Nhà hàng: Nhà Sàn Quán Mạnh Thơm ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-san-quan-manh-thom', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Nhà Sàn Quán Mạnh Thơm', 'nha san quan manh thom', @rg_mu_cang_chai, 'QL32',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-san-quan-manh-thom'), 'PHONE', '0972003166', TRUE);

-- ---- Nhà hàng: Nhà Hàng Tuấn Thuý ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-hang-tuan-thuy', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Nhà Hàng Tuấn Thuý', 'nha hang tuan thuy', @rg_mu_cang_chai, 'QL32',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-tuan-thuy'), 'PHONE', '0977279165', TRUE);

-- ---- Nhà hàng: NHÀ HÀNG Thắng Dung ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-hang-thang-dung', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'NHÀ HÀNG Thắng Dung', 'nha hang thang dung', @rg_mu_cang_chai, 'khu thị trấn',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-thang-dung'), 'PHONE', '0986675935', TRUE);

-- ---- Nhà hàng: Nhà Hàng Hằng Béo ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-hang-hang-beo', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Nhà Hàng Hằng Béo', 'nha hang hang beo', @rg_mu_cang_chai, '181 Tổ 3',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-hang-beo'), 'PHONE', '0944904047', TRUE);

-- ---- Nhà hàng: Nhà Hàng A Tân Quán ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-hang-a-tan-quan', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Nhà Hàng A Tân Quán', 'nha hang a tan quan', @rg_mu_cang_chai, 'Tổ 1',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);

-- ---- Nhà hàng: Nhà Hàng Thùy Linh ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-hang-thuy-linh', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Nhà Hàng Thùy Linh', 'nha hang thuy linh', @rg_mu_cang_chai, 'Thôn 2',
  150000, 1500000, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-thuy-linh'), 'PHONE', '919809352', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='nha-hang-thuy-linh'), 'TIP', 'Đánh giá tham khảo từ nguồn ngoài (chưa qua hệ thống review nội bộ): Đánh giá 4,4 sao', TRUE);

-- ---- Nhà hàng: Nhà hàng Vườn Đào ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-hang-vuon-dao', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Nhà hàng Vườn Đào', 'nha hang vuon dao', @rg_mu_cang_chai, 'Tổ 2',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);

-- ---- Nhà hàng: Nhà Hàng Thành Oanh Thắng Cố Ngựa ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-hang-thanh-oanh-thang-co-ngua', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Nhà Hàng Thành Oanh Thắng Cố Ngựa', 'nha hang thanh oanh thang co ngua', @rg_mu_cang_chai, 'khu Mù Cang Chải',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);

-- ---- Nhà hàng: Nhà Hàng Nguyệt Thắng ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'nha-hang-nguyet-thang', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Nhà Hàng Nguyệt Thắng', 'nha hang nguyet thang', @rg_tt_mu_cang_chai, '127 thị trấn Mù Cang Chải',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);

-- ---- Nhà hàng: Quán Thuật Hà ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'quan-thuat-ha', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Quán Thuật Hà', 'quan thuat ha', @rg_mu_cang_chai, 'QL32',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);

-- ---- Nhà hàng: Quán Ăn Mu Cang Chai ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'quan-an-mu-cang-chai', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Quán Ăn Mu Cang Chai', 'quan an mu cang chai', @rg_mu_cang_chai, 'QL32',
  NULL, NULL, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);

-- ---- Nhà hàng: Quán con khỉ ----
INSERT INTO place (slug, category_id, kind, name, name_norm, region_id, address, price_ref_min, price_ref_max, visibility, source_type, source_name, verification, attributes) VALUES (
  'quan-con-khi', (SELECT id FROM category WHERE slug='an-uong'), 'FOOD',
  'Quán con khỉ', 'quan con khi', @rg_mu_cang_chai, 'khu Mù Cang Chải',
  30000, 300000, 'PUBLISHED', 'OFFICIAL', 'Dữ liệu chính thống MCC (sheet Nhà hàng)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='quan-con-khi'), 'PHONE', '988820608', TRUE);
INSERT INTO place_highlight (place_id, type, content, is_public) VALUES ((SELECT id FROM place WHERE slug='quan-con-khi'), 'TIP', 'Đánh giá tham khảo từ nguồn ngoài (chưa qua hệ thống review nội bộ): 4,7 sao', TRUE);

-- ============================================================================
-- 8. DI CHUYỂN / NHÀ XE (place, kind=TRANSPORT) — sheet 'Di chuyển'.
--    provider_id NULL (nhà xe liên tỉnh, không phải Provider đăng ký trên
--    nền tảng). Gộp Loại hình/Giá vé/Thời gian/Tuyến đường vào description.
-- ============================================================================

-- ---- Nhà xe: Hà Trang (Lai Châu) ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'ha-trang-lai-chau', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Hà Trang (Lai Châu)', 'ha trang (lai chau)', 'Loại hình: Giường nằm 42 phòng; Thời gian: ~7,5 giờ; Tuyến đường: Hà Nội ↔ Mù Cang Chải', @rg_mu_cang_chai,
  NULL, NULL, 'Theo ngày', 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='ha-trang-lai-chau'), 'PHONE', '0975559911', TRUE);

-- ---- Nhà xe: Sơn Phương ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'son-phuong', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Sơn Phương', 'son phuong', 'Loại hình: Giường nằm; Thời gian: ~7 giờ 25 phút; Tuyến đường: 3 chuyến/ngày trên RedBus', @rg_mu_cang_chai,
  300000, 300000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='son-phuong'), 'PHONE', '0976232118', TRUE);

-- ---- Nhà xe: Hưng Thành (Lai Châu) ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'hung-thanh-lai-chau', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Hưng Thành (Lai Châu)', 'hung thanh (lai chau)', 'Loại hình: Giường nằm; Thời gian: ~7–8 giờ; Tuyến đường: Có tuyến Hà Nội – Mù Cang Chải', @rg_mu_cang_chai,
  NULL, NULL, 'Liên hệ', 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='hung-thanh-lai-chau'), 'PHONE', '0981202525', TRUE);

-- ---- Nhà xe: Cường Lan ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'cuong-lan', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Cường Lan', 'cuong lan', 'Loại hình: Giường nằm/Limousine; Thời gian: ~7–8 giờ; Tuyến đường: Có tuyến qua Yên Bái', @rg_mu_cang_chai,
  350000, 350000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='cuong-lan'), 'PHONE', '0963856856', TRUE);

-- ---- Nhà xe: Anh Khang Authentic ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'anh-khang-authentic', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Anh Khang Authentic', 'anh khang authentic', 'Loại hình: Limousine 9 chỗ', @rg_mu_cang_chai,
  380000, 380000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='anh-khang-authentic'), 'PHONE', '0986359477', TRUE);

-- ---- Nhà xe: Gia Khánh ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'gia-khanh', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Gia Khánh', 'gia khanh', 'Loại hình: Có chuyến đêm', @rg_mu_cang_chai,
  250000, 250000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='gia-khanh'), 'PHONE', '0981413413/1900202708', TRUE);

-- ---- Nhà xe: Cường Lan ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'cuong-lan-2', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Cường Lan', 'cuong lan', 'Loại hình: Nhiều khung giờ', @rg_mu_cang_chai,
  350000, 350000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='cuong-lan-2'), 'PHONE', '0347842842', TRUE);

-- ---- Nhà xe: Nam Thắng Limousine ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'nam-thang-limousine', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Nam Thắng Limousine', 'nam thang limousine', 'Loại hình: Ghế massage', @rg_mu_cang_chai,
  280000, 280000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='nam-thang-limousine'), 'PHONE', '02430936036', TRUE);

-- ---- Nhà xe: Golden Limousine ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'golden-limousine', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Golden Limousine', 'golden limousine', 'Loại hình: Limousine', @rg_mu_cang_chai,
  300000, 300000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='golden-limousine'), 'PHONE', '19006772', TRUE);

-- ---- Nhà xe: An Bình Limousine ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'an-binh-limousine', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'An Bình Limousine', 'an binh limousine', 'Loại hình: Mức giá thấp hơn', @rg_mu_cang_chai,
  200000, 200000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='an-binh-limousine'), 'PHONE', '0988050310', TRUE);

-- ---- Nhà xe: Xe Ghép Yên Bái ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'xe-ghep-yen-bai', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Xe Ghép Yên Bái', 'xe ghep yen bai', 'Loại hình: 5–7 chỗ; Tuyến đường: Tận nơi Hà Nội ↔ Mù Cang Chải', @rg_mu_cang_chai,
  700000, 700000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='xe-ghep-yen-bai'), 'PHONE', '0962535333', TRUE);

-- ---- Nhà xe: Xe ghép Yên Bái – Chế Cu Nha ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'xe-ghep-yen-bai-che-cu-nha', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Xe ghép Yên Bái – Chế Cu Nha', 'xe ghep yen bai – che cu nha', 'Loại hình: 5–7 chỗ; Tuyến đường: Tận nhà Chế Cu Nha ↔ Hà Nội', @rg_mu_cang_chai,
  700000, 700000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='xe-ghep-yen-bai-che-cu-nha'), 'PHONE', '0888521007', TRUE);

-- ---- Nhà xe: Xe ghép Yên Bái – Chế Tạo ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'xe-ghep-yen-bai-che-tao', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Xe ghép Yên Bái – Chế Tạo', 'xe ghep yen bai – che tao', 'Loại hình: 5–7 chỗ; Tuyến đường: Tận nơi Chế Tạo ↔ Hà Nội', @rg_mu_cang_chai,
  700000, 700000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
INSERT INTO place_contact (place_id, channel, value, is_public) VALUES ((SELECT id FROM place WHERE slug='xe-ghep-yen-bai-che-tao'), 'PHONE', '0962535333', TRUE);

-- ---- Nhà xe: Xe ghép Yên Bái – Nậm Có ----
INSERT INTO place (slug, category_id, kind, name, name_norm, description, region_id, price_ref_min, price_ref_max, price_unit_note, visibility, source_type, source_name, verification, attributes) VALUES (
  'xe-ghep-yen-bai-nam-co', (SELECT id FROM category WHERE slug='di-chuyen'), 'TRANSPORT',
  'Xe ghép Yên Bái – Nậm Có', 'xe ghep yen bai – nam co', 'Loại hình: 5–7 chỗ; Tuyến đường: Tận nơi Nậm Có ↔ Hà Nội', @rg_mu_cang_chai,
  700000, 700000, NULL, 'PUBLISHED', 'PUBLIC_TRUSTED', 'Dữ liệu chính thống MCC (sheet Di chuyển)', 'UNVERIFIED', JSON_OBJECT()
);
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
INSERT INTO festival (slug, name, name_norm, season_note, core_value, suitable_experience, etiquette_dont, region_id, visibility) VALUES (
  'gau-tao', 'Gầu Tào', 'gau tao', 'Đầu năm mới; lịch cụ thể theo địa phương', 'Cầu phúc, cầu mệnh, mùa màng, sức khỏe; sinh hoạt cộng đồng',
  'Xem phần hội được phép; nghe giới thiệu bối cảnh; giao lưu khèn/múa; ẩm thực cộng đồng
Nhóm khách phù hợp: Khách văn hóa, nghiên cứu, khách quốc tế, nhóm nhỏ
Dịch vụ có thể bán: Hướng dẫn bản địa, homestay, ăn uống, tour văn hóa', 'Tự ý quay/chụp nghi lễ; diễn lại phần thiêng; chen lấn', @rg_mu_cang_chai, 'PUBLISHED'
);

-- ---- Lễ hội: Mừng cơm mới ----
INSERT INTO festival (slug, name, name_norm, season_note, core_value, suitable_experience, etiquette_dont, region_id, visibility) VALUES (
  'mung-com-moi', 'Mừng cơm mới', 'mung com moi', 'Sau vụ lúa; tùy gia đình', 'Biết ơn tổ tiên, trời đất; đoàn tụ và mừng mùa',
  'Trải nghiệm nông nghiệp, nghe kể chuyện, thưởng thức món từ gạo mới khi được mời
Nhóm khách phù hợp: Gia đình, khách giáo dục, khách chậm
Dịch vụ có thể bán: Bữa cơm bản địa, tour ruộng, lưu trú', 'Biến lễ gia đình thành show; áp đặt lễ vật/lịch', @rg_mu_cang_chai, 'PUBLISHED'
);

-- ---- Lễ hội: Festival Khèn Mông ----
INSERT INTO festival (slug, name, name_norm, season_note, core_value, suitable_experience, etiquette_dont, region_id, visibility) VALUES (
  'festival-khen-mong', 'Festival Khèn Mông', 'festival khen mong', 'Thường gắn chào xuân', 'Tôn vinh nghệ thuật khèn và trao truyền',
  'Xem trình diễn; workshop khèn; gặp nghệ nhân; mua nhạc cụ hợp pháp
Nhóm khách phù hợp: Khách trẻ, khách văn hóa, nhiếp ảnh
Dịch vụ có thể bán: Vé sự kiện, workshop, bán sản phẩm, lưu trú', 'Chỉ dùng khèn như tiết mục minh họa thiếu bối cảnh', @rg_mu_cang_chai, 'PUBLISHED'
);

-- ---- Lễ hội: Hoa Tớ Dày ----
INSERT INTO festival (slug, name, name_norm, season_note, core_value, suitable_experience, etiquette_dont, region_id, visibility) VALUES (
  'hoa-to-day', 'Hoa Tớ Dày', 'hoa to day', 'Cuối năm–đầu năm', 'Cảnh quan hoa và không khí chào xuân',
  'Ngắm hoa có kiểm soát, chụp ảnh, đi bộ, kết hợp bản làng
Nhóm khách phù hợp: Khách nghỉ dưỡng, nhiếp ảnh, gia đình
Dịch vụ có thể bán: Tour cảnh quan, homestay, ẩm thực', 'Bẻ cành, giẫm cây, xả rác, quá tải điểm hoa', @rg_mu_cang_chai, 'PUBLISHED'
);

-- ---- Lễ hội: Mùa vàng/khám phá ruộng bậc thang ----
INSERT INTO festival (slug, name, name_norm, season_note, core_value, suitable_experience, etiquette_dont, region_id, visibility) VALUES (
  'mua-vang-kham-pha-ruong-bac-thang', 'Mùa vàng/khám phá ruộng bậc thang', 'mua vang/kham pha ruong bac thang', 'Mùa lúa chín', 'Lao động, cảnh quan và sinh kế nông nghiệp',
  'Trekking, nhiếp ảnh, trải nghiệm gặt/làm nông khi được phép
Nhóm khách phù hợp: Khách cảnh quan, trekking, nhiếp ảnh
Dịch vụ có thể bán: Hướng dẫn, xe địa phương, nông sản, homestay', 'Đi vào ruộng, phá bờ thửa, gây cản trở sản xuất', @rg_mu_cang_chai, 'PUBLISHED'
);

COMMIT;

-- ============================================================================
-- HẾT SCRIPT. Tổng kết dữ liệu KHÔNG có trong DATA_CHÍNH_THỐNG.xlsx mà script
-- này phải TỰ SINH thêm để thoả ràng buộc khóa ngoại/NOT NULL của schema:
--   1. Toàn bộ bảng REGION (region) — cây khu vực Yên Bái > Mù Cang Chải/Văn
--      Chấn > xã/thị trấn — suy luận từ địa chỉ trong file, KHÔNG có sheet gốc.
--   2. Toàn bộ PROVIDER + ACCOUNT cho mỗi Homestay — file không có sheet
--      quản lý nhà cung cấp/tài khoản; password_hash là placeholder giả.
--   3. homestay_profile được tạo RỖNG (chỉ có place_id) cho mọi homestay vì
--      file không có giờ check-in/check-out, nội quy nhà, phụ phí.
--   4. KHÔNG có room_type/room_bed/room_amenity/room_inventory_day/
--      cancellation_policy nào được tạo — dữ liệu 'Loại phòng'/'Sức chứa' là
--      văn bản tự do không đủ cấu trúc; toàn bộ nội dung gốc đã được giữ lại
--      trong place_highlight (type=TIP) để nhập tay sau.
--   5. category_id và amenity_id không insert lại — tham chiếu tới dữ liệu
--      mẫu có sẵn trong mục 13 của script schema gốc.
--   6. place_amenity chỉ được suy luận (value=YES) qua so khớp từ khoá đơn
--      giản trong cột 'Tiện ích' — CHƯA rà soát thủ công, có thể sai/sót.
--   7. price_ref_min/price_ref_max cho Homestay/Điểm đến/Nhà hàng/Di chuyển
--      là MIN/MAX tự động trích từ mọi con số dạng '000.000' xuất hiện trong
--      cột giá (thường gồm nhiều mức giá khác nhau: dorm, phòng riêng...),
--      CHỈ mang tính tham khảo thô — không phải một mức giá chính xác.
--   8. place.visibility luôn để 'PUBLISHED' (không tự PUBLISH) — cần Admin/CTV
--      duyệt qua UC tương ứng trước khi hiển thị công khai.
--   9. Bản ghi trùng lặp 'Homestay A De' / 'Hello Mu Cang Chai Homestay' được
--      phát hiện qua trùng SĐT liên hệ trong chính file — đã gán
--      master_place_id theo BR-96, không phải dữ liệu ngoài file.
--  10. Không nạp phần 'Tài nguyên văn hóa' / 'Phân khúc khách' / 'Sản phẩm
--      tour' trong sheet Văn hóa vì chưa có bảng tương ứng trong schema.
-- ============================================================================-- Place: Dò Gừ Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9868.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9868.jpg', 'image/jpeg', 'Dò Gừ Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%do gu homestay%' LIMIT 1;

-- Place: Dò Gừ Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9869.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9869.jpg', 'image/jpeg', 'Dò Gừ Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%do gu homestay%' LIMIT 1;

-- Place: Dò Gừ Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9870.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9870.jpg', 'image/jpeg', 'Dò Gừ Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%do gu homestay%' LIMIT 1;

-- Place: Dò Gừ Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9871.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9871.jpg', 'image/jpeg', 'Dò Gừ Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%do gu homestay%' LIMIT 1;

-- Place: Dò Gừ Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9872.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9872.jpg', 'image/jpeg', 'Dò Gừ Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%do gu homestay%' LIMIT 1;

-- Place: Dò Gừ Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9873.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9873.jpg', 'image/jpeg', 'Dò Gừ Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%do gu homestay%' LIMIT 1;

-- Place: Dò Gừ Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9874.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/D%C3%B2%20G%E1%BB%AB%20Homestay/IMG_9874.jpg', 'image/jpeg', 'Dò Gừ Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%do gu homestay%' LIMIT 1;

-- Place: Hello Mù Cang Chải Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9858.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9858.jpg', 'image/png', 'Hello Mù Cang Chải Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%hello mu cang chai homestay%' LIMIT 1;

-- Place: Hello Mù Cang Chải Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9860.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9860.jpg', 'image/jpeg', 'Hello Mù Cang Chải Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%hello mu cang chai homestay%' LIMIT 1;

-- Place: Hello Mù Cang Chải Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9861.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9861.jpg', 'image/jpeg', 'Hello Mù Cang Chải Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%hello mu cang chai homestay%' LIMIT 1;

-- Place: Hello Mù Cang Chải Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9862.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9862.jpg', 'image/jpeg', 'Hello Mù Cang Chải Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%hello mu cang chai homestay%' LIMIT 1;

-- Place: Hello Mù Cang Chải Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9863.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9863.jpg', 'image/jpeg', 'Hello Mù Cang Chải Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%hello mu cang chai homestay%' LIMIT 1;

-- Place: Hello Mù Cang Chải Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9864.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9864.jpg', 'image/jpeg', 'Hello Mù Cang Chải Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%hello mu cang chai homestay%' LIMIT 1;

-- Place: Hello Mù Cang Chải Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9865.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9865.jpg', 'image/jpeg', 'Hello Mù Cang Chải Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%hello mu cang chai homestay%' LIMIT 1;

-- Place: Hello Mù Cang Chải Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9866.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969245/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9866.jpg', 'image/jpeg', 'Hello Mù Cang Chải Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%hello mu cang chai homestay%' LIMIT 1;

-- Place: Hello Mù Cang Chải Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9867.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Hello%20M%C3%B9%20Cang%20Ch%E1%BA%A3i%20Homestay/IMG_9867.jpg', 'image/jpeg', 'Hello Mù Cang Chải Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%hello mu cang chai homestay%' LIMIT 1;

-- Place: Mu Cang Chai Eco Lodge
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9875.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9875.jpg', 'image/jpeg', 'Mu Cang Chai Eco Lodge');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%mu cang chai eco lodge%' LIMIT 1;

-- Place: Mu Cang Chai Eco Lodge
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9876.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9876.jpg', 'image/jpeg', 'Mu Cang Chai Eco Lodge');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mu cang chai eco lodge%' LIMIT 1;

-- Place: Mu Cang Chai Eco Lodge
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9877.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9877.jpg', 'image/jpeg', 'Mu Cang Chai Eco Lodge');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mu cang chai eco lodge%' LIMIT 1;

-- Place: Mu Cang Chai Eco Lodge
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9878.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9878.jpg', 'image/jpeg', 'Mu Cang Chai Eco Lodge');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mu cang chai eco lodge%' LIMIT 1;

-- Place: Mu Cang Chai Eco Lodge
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9879.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9879.jpg', 'image/jpeg', 'Mu Cang Chai Eco Lodge');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mu cang chai eco lodge%' LIMIT 1;

-- Place: Mu Cang Chai Eco Lodge
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9880.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Mu%20Cang%20Chai%20Eco%20Lodge/IMG_9880.jpg', 'image/jpeg', 'Mu Cang Chai Eco Lodge');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mu cang chai eco lodge%' LIMIT 1;

-- Place: Mù Cang Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/M%C3%B9%20Cang%20Homestay/IMG_9885.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/M%C3%B9%20Cang%20Homestay/IMG_9885.jpg', 'image/jpeg', 'Mù Cang Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%mu cang homestay%' LIMIT 1;

-- Place: Mù Cang Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/M%C3%B9%20Cang%20Homestay/IMG_9886.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/M%C3%B9%20Cang%20Homestay/IMG_9886.webp', 'image/webp', 'Mù Cang Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mu cang homestay%' LIMIT 1;

-- Place: Mù Cang Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/M%C3%B9%20Cang%20Homestay/IMG_9887.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/M%C3%B9%20Cang%20Homestay/IMG_9887.jpg', 'image/jpeg', 'Mù Cang Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mu cang homestay%' LIMIT 1;

-- Place: Mù Cang Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/M%C3%B9%20Cang%20Homestay/IMG_9888.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/M%C3%B9%20Cang%20Homestay/IMG_9888.jpg', 'image/jpeg', 'Mù Cang Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mu cang homestay%' LIMIT 1;

-- Place: Mù Cang Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/M%C3%B9%20Cang%20Homestay/IMG_9889.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/M%C3%B9%20Cang%20Homestay/IMG_9889.jpg', 'image/jpeg', 'Mù Cang Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mu cang homestay%' LIMIT 1;

-- Place: Ngọc Thúy Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Ng%E1%BB%8Dc%20Th%C3%BAy%20Homestay/IMG_9881.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Ng%E1%BB%8Dc%20Th%C3%BAy%20Homestay/IMG_9881.jpg', 'image/jpeg', 'Ngọc Thúy Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%ngoc thuy homestay%' LIMIT 1;

-- Place: Ngọc Thúy Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Ng%E1%BB%8Dc%20Th%C3%BAy%20Homestay/IMG_9882.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Ng%E1%BB%8Dc%20Th%C3%BAy%20Homestay/IMG_9882.jpg', 'image/jpeg', 'Ngọc Thúy Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ngoc thuy homestay%' LIMIT 1;

-- Place: Ngọc Thúy Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Ng%E1%BB%8Dc%20Th%C3%BAy%20Homestay/IMG_9883.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Ng%E1%BB%8Dc%20Th%C3%BAy%20Homestay/IMG_9883.jpg', 'image/jpeg', 'Ngọc Thúy Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ngoc thuy homestay%' LIMIT 1;

-- Place: Ngọc Thúy Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Ng%E1%BB%8Dc%20Th%C3%BAy%20Homestay/IMG_9884.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/Ng%E1%BB%8Dc%20Th%C3%BAy%20Homestay/IMG_9884.jpg', 'image/jpeg', 'Ngọc Thúy Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ngoc thuy homestay%' LIMIT 1;

-- Place: Dế Xu Phình
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/15528057012_4913f193d4_b.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/15528057012_4913f193d4_b.jpg', 'image/jpeg', 'Dế Xu Phình');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%de xu phinh%' LIMIT 1;

-- Place: Dế Xu Phình
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/de-xu-phinh-1-1780660849.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/de-xu-phinh-1-1780660849.jpg', 'image/jpeg', 'Dế Xu Phình');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%de xu phinh%' LIMIT 1;

-- Place: Dế Xu Phình
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/kham_pha_xa_de_xu_phinh_6.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/kham_pha_xa_de_xu_phinh_6.jpg', 'image/jpeg', 'Dế Xu Phình');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%de xu phinh%' LIMIT 1;

-- Place: Dế Xu Phình
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/kham_pha_xa_de_xu_phinh_7.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/kham_pha_xa_de_xu_phinh_7.jpg', 'image/jpeg', 'Dế Xu Phình');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%de xu phinh%' LIMIT 1;

-- Place: Dế Xu Phình
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/kham_pha_xa_de_xu_phinh_8.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/kham_pha_xa_de_xu_phinh_8.jpg', 'image/jpeg', 'Dế Xu Phình');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%de xu phinh%' LIMIT 1;

-- Place: Dế Xu Phình
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/kham_pha_xa_de_xu_phinh_9.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/D%E1%BA%BF%20Xu%20Ph%C3%ACnh/kham_pha_xa_de_xu_phinh_9.jpg', 'image/jpeg', 'Dế Xu Phình');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%de xu phinh%' LIMIT 1;

-- Place: La Pán Tẩn
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images_1.jpg', 'image/jpeg', 'La Pán Tẩn');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%la pan tan%' LIMIT 1;

-- Place: La Pán Tẩn
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images_2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images_2.jpg', 'image/jpeg', 'La Pán Tẩn');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%la pan tan%' LIMIT 1;

-- Place: La Pán Tẩn
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images_3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969246/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images_3.jpg', 'image/jpeg', 'La Pán Tẩn');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%la pan tan%' LIMIT 1;

-- Place: La Pán Tẩn
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images_4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images_4.jpg', 'image/jpeg', 'La Pán Tẩn');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%la pan tan%' LIMIT 1;

-- Place: La Pán Tẩn
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images_5.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images_5.jpg', 'image/jpeg', 'La Pán Tẩn');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%la pan tan%' LIMIT 1;

-- Place: La Pán Tẩn
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/images.jpg', 'image/jpeg', 'La Pán Tẩn');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%la pan tan%' LIMIT 1;

-- Place: La Pán Tẩn
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/mb-box-copy-5-16467344438131571131366.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/La%20P%C3%A1n%20T%E1%BA%A9n/mb-box-copy-5-16467344438131571131366.jpg', 'image/jpeg', 'La Pán Tẩn');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%la pan tan%' LIMIT 1;

-- Place: Rừng Trúc
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/images_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/images_1.jpg', 'image/jpeg', 'Rừng Trúc');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%rung truc%' LIMIT 1;

-- Place: Rừng Trúc
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/images_2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/images_2.jpg', 'image/jpeg', 'Rừng Trúc');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%rung truc%' LIMIT 1;

-- Place: Rừng Trúc
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/images_3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/images_3.jpg', 'image/jpeg', 'Rừng Trúc');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%rung truc%' LIMIT 1;

-- Place: Rừng Trúc
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/images_4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/images_4.jpg', 'image/jpeg', 'Rừng Trúc');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%rung truc%' LIMIT 1;

-- Place: Rừng Trúc
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/images_6.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/images_6.jpg', 'image/jpeg', 'Rừng Trúc');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%rung truc%' LIMIT 1;

-- Place: Sống lưng khủng long
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/images_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/images_1.jpg', 'image/jpeg', 'Sống lưng khủng long');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%song lung khung long%' LIMIT 1;

-- Place: Sống lưng khủng long
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/images_2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/images_2.jpg', 'image/jpeg', 'Sống lưng khủng long');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%song lung khung long%' LIMIT 1;

-- Place: Sống lưng khủng long
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/images_3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/images_3.jpg', 'image/jpeg', 'Sống lưng khủng long');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%song lung khung long%' LIMIT 1;

-- Place: Sống lưng khủng long
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/images.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/images.jpg', 'image/jpeg', 'Sống lưng khủng long');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%song lung khung long%' LIMIT 1;

-- Place: Đèo Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/deo-khau-pha-7.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/deo-khau-pha-7.jpg', 'image/jpeg', 'Đèo Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%deo khau pha%' LIMIT 1;

-- Place: Đèo Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/deo_khau_pha.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/deo_khau_pha.jpg', 'image/jpeg', 'Đèo Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%deo khau pha%' LIMIT 1;

-- Place: Đèo Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/mu-cang-chai-pys-travel009.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/mu-cang-chai-pys-travel009.jpg', 'image/jpeg', 'Đèo Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%deo khau pha%' LIMIT 1;

-- Place: Đèo Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/ngam-deo-khau-pha.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969247/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/ngam-deo-khau-pha.jpg', 'image/jpeg', 'Đèo Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%deo khau pha%' LIMIT 1;

-- Place: Đèo Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/vietgoing_nex2101226711.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/vietgoing_nex2101226711.webp', 'image/webp', 'Đèo Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%deo khau pha%' LIMIT 1;

-- Place: Đèo Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/dqqyajlqumadsp3fkz4n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/dqqyajlqumadsp3fkz4n.jpg', 'image/jpeg', 'Đèo Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%deo khau pha%' LIMIT 1;

-- Place: Đồi Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/Doi-Mam-Xoi1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/Doi-Mam-Xoi1.jpg', 'image/jpeg', 'Đồi Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%doi mam xoi%' LIMIT 1;

-- Place: Đồi Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images_1.jpg', 'image/jpeg', 'Đồi Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mam xoi%' LIMIT 1;

-- Place: Đồi Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images_2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images_2.jpg', 'image/jpeg', 'Đồi Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mam xoi%' LIMIT 1;

-- Place: Đồi Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images_3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images_3.jpg', 'image/jpeg', 'Đồi Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mam xoi%' LIMIT 1;

-- Place: Đồi Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images_4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images_4.jpg', 'image/jpeg', 'Đồi Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mam xoi%' LIMIT 1;

-- Place: Đồi Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images_5.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images_5.jpg', 'image/jpeg', 'Đồi Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mam xoi%' LIMIT 1;

-- Place: Đồi Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%A2m%20X%C3%B4i/images.jpg', 'image/jpeg', 'Đồi Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mam xoi%' LIMIT 1;

-- Place: Đồi Móng ngựa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/images_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/images_1.jpg', 'image/jpeg', 'Đồi Móng ngựa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%doi mong ngua%' LIMIT 1;

-- Place: Đồi Móng ngựa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/images_2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/images_2.jpg', 'image/jpeg', 'Đồi Móng ngựa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mong ngua%' LIMIT 1;

-- Place: Đồi Móng ngựa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/images_3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/images_3.jpg', 'image/jpeg', 'Đồi Móng ngựa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mong ngua%' LIMIT 1;

-- Place: Đồi Móng ngựa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/images.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/images.jpg', 'image/jpeg', 'Đồi Móng ngựa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mong ngua%' LIMIT 1;

-- Place: Đồi Móng ngựa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/mong-ngua-mu-cang-chai-4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/mong-ngua-mu-cang-chai-4.jpg', 'image/jpeg', 'Đồi Móng ngựa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mong ngua%' LIMIT 1;

-- Place: Đồi Móng ngựa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/review-doi-mong-ngua-mu-cang-chai-vao-mua-lua-chin-vang-01-1646760834.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20ng%E1%BB%B1a/review-doi-mong-ngua-mu-cang-chai-vao-mua-lua-chin-vang-01-1646760834.jpg', 'image/jpeg', 'Đồi Móng ngựa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mong ngua%' LIMIT 1;

-- Place: A Su Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/A%20Su%20Homestay/763385242_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/A%20Su%20Homestay/763385242_1.jpg', 'image/jpeg', 'A Su Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%a su homestay%' LIMIT 1;

-- Place: A Su Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/A%20Su%20Homestay/773667409_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/A%20Su%20Homestay/773667409_1.jpg', 'image/jpeg', 'A Su Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%a su homestay%' LIMIT 1;

-- Place: A Su Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/A%20Su%20Homestay/773929389_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/A%20Su%20Homestay/773929389_1.jpg', 'image/jpeg', 'A Su Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%a su homestay%' LIMIT 1;

-- Place: A Su Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/A%20Su%20Homestay/773930178_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/A%20Su%20Homestay/773930178_1.jpg', 'image/jpeg', 'A Su Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%a su homestay%' LIMIT 1;

-- Place: A Su Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/A%20Su%20Homestay/773962064_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969248/dulichso/A%20Su%20Homestay/773962064_1.jpg', 'image/jpeg', 'A Su Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%a su homestay%' LIMIT 1;

-- Place: A Su Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/A%20Su%20Homestay/910024013_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/A%20Su%20Homestay/910024013_1.jpg', 'image/jpeg', 'A Su Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%a su homestay%' LIMIT 1;

-- Place: Bamboo homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/476427381_122219067296210218_71928455168594724_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/476427381_122219067296210218_71928455168594724_n.jpg', 'image/jpeg', 'Bamboo homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%bamboo homestay%' LIMIT 1;

-- Place: Bamboo homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/476614269_122219055806210218_6326804044838882183_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/476614269_122219055806210218_6326804044838882183_n.jpg', 'image/jpeg', 'Bamboo homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bamboo homestay%' LIMIT 1;

-- Place: Bamboo homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/482985741_122228299844210218_3248229600121343094_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/482985741_122228299844210218_3248229600121343094_n.jpg', 'image/jpeg', 'Bamboo homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bamboo homestay%' LIMIT 1;

-- Place: Bamboo homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/487564298_122233100378210218_174525241187467849_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/487564298_122233100378210218_174525241187467849_n.jpg', 'image/jpeg', 'Bamboo homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bamboo homestay%' LIMIT 1;

-- Place: Bamboo homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/488187812_122233101332210218_2292527068350722391_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/488187812_122233101332210218_2292527068350722391_n.jpg', 'image/jpeg', 'Bamboo homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bamboo homestay%' LIMIT 1;

-- Place: Bamboo homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/557625937_122270989988210218_5849635432883467643_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bamboo%20homestay/557625937_122270989988210218_5849635432883467643_n.jpg', 'image/jpeg', 'Bamboo homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bamboo homestay%' LIMIT 1;

-- Place: Big View Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Big%20View%20Homestay/786829043.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Big%20View%20Homestay/786829043.jpg', 'image/jpeg', 'Big View Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%big view homestay%' LIMIT 1;

-- Place: Big View Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Big%20View%20Homestay/786829164.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Big%20View%20Homestay/786829164.jpg', 'image/jpeg', 'Big View Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%big view homestay%' LIMIT 1;

-- Place: Big View Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Big%20View%20Homestay/786829258.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Big%20View%20Homestay/786829258.jpg', 'image/jpeg', 'Big View Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%big view homestay%' LIMIT 1;

-- Place: Big View Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Big%20View%20Homestay/786829353.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Big%20View%20Homestay/786829353.jpg', 'image/jpeg', 'Big View Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%big view homestay%' LIMIT 1;

-- Place: Big View Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Big%20View%20Homestay/786829531.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Big%20View%20Homestay/786829531.jpg', 'image/jpeg', 'Big View Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%big view homestay%' LIMIT 1;

-- Place: Bluehome
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/002a2361_edited_d6c5_z.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/002a2361_edited_d6c5_z.webp', 'image/webp', 'Bluehome');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%bluehome%' LIMIT 1;

-- Place: Bluehome
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/3810b536_z.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/3810b536_z.webp', 'image/webp', 'Bluehome');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bluehome%' LIMIT 1;

-- Place: Bluehome
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/3bee28d4_z.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/3bee28d4_z.webp', 'image/webp', 'Bluehome');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bluehome%' LIMIT 1;

-- Place: Bluehome
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/5699138c_z.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/5699138c_z.webp', 'image/webp', 'Bluehome');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bluehome%' LIMIT 1;

-- Place: Bluehome
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/9a6a7895_z.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/9a6a7895_z.webp', 'image/webp', 'Bluehome');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bluehome%' LIMIT 1;

-- Place: Bluehome
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/ab4feaca_z.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/ab4feaca_z.webp', 'image/webp', 'Bluehome');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bluehome%' LIMIT 1;

-- Place: Bluehome
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/fc4ffedf_z.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Bluehome/fc4ffedf_z.webp', 'image/webp', 'Bluehome');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%bluehome%' LIMIT 1;

-- Place: Chù Chỏ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Ch%C3%B9%20Ch%E1%BB%8F/786883878.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Ch%C3%B9%20Ch%E1%BB%8F/786883878.jpg', 'image/jpeg', 'Chù Chỏ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%chu cho%' LIMIT 1;

-- Place: Chù Chỏ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%C3%B9%20Ch%E1%BB%8F/786883921.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%C3%B9%20Ch%E1%BB%8F/786883921.jpg', 'image/jpeg', 'Chù Chỏ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chu cho%' LIMIT 1;

-- Place: Chù Chỏ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Ch%C3%B9%20Ch%E1%BB%8F/787266451.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969249/dulichso/Ch%C3%B9%20Ch%E1%BB%8F/787266451.jpg', 'image/jpeg', 'Chù Chỏ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chu cho%' LIMIT 1;

-- Place: Chù Chỏ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%C3%B9%20Ch%E1%BB%8F/898405491.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%C3%B9%20Ch%E1%BB%8F/898405491.jpg', 'image/jpeg', 'Chù Chỏ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chu cho%' LIMIT 1;

-- Place: Chù Chỏ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%C3%B9%20Ch%E1%BB%8F/898405743.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%C3%B9%20Ch%E1%BB%8F/898405743.jpg', 'image/jpeg', 'Chù Chỏ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chu cho%' LIMIT 1;

-- Place: Chải Eco House
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%E1%BA%A3i%20Eco%20House/727307454.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%E1%BA%A3i%20Eco%20House/727307454.jpg', 'image/jpeg', 'Chải Eco House');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%chai eco house%' LIMIT 1;

-- Place: Chải Eco House
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%E1%BA%A3i%20Eco%20House/741766553.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%E1%BA%A3i%20Eco%20House/741766553.jpg', 'image/jpeg', 'Chải Eco House');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chai eco house%' LIMIT 1;

-- Place: Chải Eco House
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%E1%BA%A3i%20Eco%20House/760260130.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%E1%BA%A3i%20Eco%20House/760260130.jpg', 'image/jpeg', 'Chải Eco House');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chai eco house%' LIMIT 1;

-- Place: Chải Eco House
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%E1%BA%A3i%20Eco%20House/895879878.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%E1%BA%A3i%20Eco%20House/895879878.jpg', 'image/jpeg', 'Chải Eco House');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chai eco house%' LIMIT 1;

-- Place: Chải Eco House
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%E1%BA%A3i%20Eco%20House/f1147e85f99b7e66b1ddc8774725149a.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Ch%E1%BA%A3i%20Eco%20House/f1147e85f99b7e66b1ddc8774725149a.webp', 'image/webp', 'Chải Eco House');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chai eco house%' LIMIT 1;

-- Place: Dream House
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Dream%20House/607296190_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Dream%20House/607296190_1.jpg', 'image/jpeg', 'Dream House');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%dream house%' LIMIT 1;

-- Place: Dream House
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Dream%20House/607296234.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Dream%20House/607296234.jpg', 'image/jpeg', 'Dream House');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%dream house%' LIMIT 1;

-- Place: Dream House
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Dream%20House/607296237.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Dream%20House/607296237.jpg', 'image/jpeg', 'Dream House');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%dream house%' LIMIT 1;

-- Place: Dream House
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Dream%20House/765626344.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Dream%20House/765626344.jpg', 'image/jpeg', 'Dream House');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%dream house%' LIMIT 1;

-- Place: Dream House
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Dream%20House/788052383.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/Dream%20House/788052383.jpg', 'image/jpeg', 'Dream House');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%dream house%' LIMIT 1;

-- Place: Dòng Suối Hmong Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/352511051.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/352511051.jpg', 'image/jpeg', 'Dòng Suối Hmong Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%dong suoi hmong homestay%' LIMIT 1;

-- Place: Dòng Suối Hmong Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/372681805.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/372681805.jpg', 'image/jpeg', 'Dòng Suối Hmong Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%dong suoi hmong homestay%' LIMIT 1;

-- Place: Dòng Suối Hmong Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/404501072.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/404501072.jpg', 'image/jpeg', 'Dòng Suối Hmong Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%dong suoi hmong homestay%' LIMIT 1;

-- Place: Dòng Suối Hmong Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/477549318.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/477549318.jpg', 'image/jpeg', 'Dòng Suối Hmong Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%dong suoi hmong homestay%' LIMIT 1;

-- Place: Dòng Suối Hmong Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/478752824.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/478752824.jpg', 'image/jpeg', 'Dòng Suối Hmong Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%dong suoi hmong homestay%' LIMIT 1;

-- Place: Dòng Suối Hmong Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/480388099.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969250/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/480388099.jpg', 'image/jpeg', 'Dòng Suối Hmong Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%dong suoi hmong homestay%' LIMIT 1;

-- Place: Dòng Suối Hmong Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/497014179.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/D%C3%B2ng%20Su%E1%BB%91i%20Hmong%20Homestay/497014179.jpg', 'image/jpeg', 'Dòng Suối Hmong Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%dong suoi hmong homestay%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/674970840.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/674970840.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/674971143.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/674971143.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/674971440.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/674971440.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620884.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620884.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620886.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620886.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620887.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620887.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620889.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620889.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620890.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620890.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620898.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620898.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620912.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620912.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620922.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620922.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Garrrya
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620998.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Garrrya/906620998.jpg', 'image/jpeg', 'Garrrya');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%garrrya%' LIMIT 1;

-- Place: Indigenous Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/222347848.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/222347848.jpg', 'image/jpeg', 'Indigenous Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%indigenous homestay%' LIMIT 1;

-- Place: Indigenous Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/308927714.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/308927714.jpg', 'image/jpeg', 'Indigenous Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%indigenous homestay%' LIMIT 1;

-- Place: Indigenous Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/357871132.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/357871132.jpg', 'image/jpeg', 'Indigenous Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%indigenous homestay%' LIMIT 1;

-- Place: Indigenous Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/592669980.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/592669980.jpg', 'image/jpeg', 'Indigenous Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%indigenous homestay%' LIMIT 1;

-- Place: Indigenous Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/849095627.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/849095627.jpg', 'image/jpeg', 'Indigenous Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%indigenous homestay%' LIMIT 1;

-- Place: Indigenous Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/859037334.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/859037334.jpg', 'image/jpeg', 'Indigenous Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%indigenous homestay%' LIMIT 1;

-- Place: Indigenous Homestay
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/859614873_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Indigenous%20Homestay/859614873_1.jpg', 'image/jpeg', 'Indigenous Homestay');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%indigenous homestay%' LIMIT 1;

-- Place: Pú nhu
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/0a0e56160fd6f819a5e53933fc6b796b.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/0a0e56160fd6f819a5e53933fc6b796b.jpg', 'image/jpeg', 'Pú nhu');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%pu nhu%' LIMIT 1;

-- Place: Pú nhu
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/19c10f1732c2c88d9368594fe71f3524.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/19c10f1732c2c88d9368594fe71f3524.jpg', 'image/jpeg', 'Pú nhu');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%pu nhu%' LIMIT 1;

-- Place: Pú nhu
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/26f658b53275be6b1cfc29bf290dceb1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/26f658b53275be6b1cfc29bf290dceb1.jpg', 'image/jpeg', 'Pú nhu');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%pu nhu%' LIMIT 1;

-- Place: Pú nhu
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/3b76e98fc2721c2c4d02a39642694946.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/3b76e98fc2721c2c4d02a39642694946.webp', 'image/webp', 'Pú nhu');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%pu nhu%' LIMIT 1;

-- Place: Pú nhu
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/624011859.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/624011859.jpg', 'image/jpeg', 'Pú nhu');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%pu nhu%' LIMIT 1;

-- Place: Pú nhu
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/624011867.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/624011867.jpg', 'image/jpeg', 'Pú nhu');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%pu nhu%' LIMIT 1;

-- Place: Pú nhu
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/d2d3584a89e2d5ca79f51067e0cfa994.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/P%C3%BA%20nhu/d2d3584a89e2d5ca79f51067e0cfa994.webp', 'image/webp', 'Pú nhu');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%pu nhu%' LIMIT 1;

-- Place: Suối Kim
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Su%E1%BB%91i%20Kim/277672892_411813034278174_5926842539090576597_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969251/dulichso/Su%E1%BB%91i%20Kim/277672892_411813034278174_5926842539090576597_n.jpg', 'image/jpeg', 'Suối Kim');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%suoi kim%' LIMIT 1;

-- Place: Suối Kim
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/Su%E1%BB%91i%20Kim/61335734_678740742596533_6600878693977948160_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/Su%E1%BB%91i%20Kim/61335734_678740742596533_6600878693977948160_n.jpg', 'image/jpeg', 'Suối Kim');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%suoi kim%' LIMIT 1;

-- Place: Suối Kim
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/Su%E1%BB%91i%20Kim/68611936_732444210559519_5123255875087106048_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/Su%E1%BB%91i%20Kim/68611936_732444210559519_5123255875087106048_n.jpg', 'image/jpeg', 'Suối Kim');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%suoi kim%' LIMIT 1;

-- Place: Suối Kim
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/Su%E1%BB%91i%20Kim/69100443_732444260559514_8311701684237631488_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/Su%E1%BB%91i%20Kim/69100443_732444260559514_8311701684237631488_n.jpg', 'image/jpeg', 'Suối Kim');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%suoi kim%' LIMIT 1;

-- Place: Sùng A Hờ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628059336.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628059336.jpg', 'image/jpeg', 'Sùng A Hờ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%sung a ho%' LIMIT 1;

-- Place: Sùng A Hờ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628059350.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628059350.jpg', 'image/jpeg', 'Sùng A Hờ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%sung a ho%' LIMIT 1;

-- Place: Sùng A Hờ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628059368.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628059368.jpg', 'image/jpeg', 'Sùng A Hờ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%sung a ho%' LIMIT 1;

-- Place: Sùng A Hờ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628059371.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628059371.jpg', 'image/jpeg', 'Sùng A Hờ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%sung a ho%' LIMIT 1;

-- Place: Sùng A Hờ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628059942.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628059942.jpg', 'image/jpeg', 'Sùng A Hờ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%sung a ho%' LIMIT 1;

-- Place: Sùng A Hờ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628066649.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%B9ng%20A%20H%E1%BB%9D/628066649.jpg', 'image/jpeg', 'Sùng A Hờ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%sung a ho%' LIMIT 1;

-- Place: Súa Su
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%BAa%20Su/unnamed_1.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%BAa%20Su/unnamed_1.webp', 'image/webp', 'Súa Su');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%sua su%' LIMIT 1;

-- Place: Súa Su
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%BAa%20Su/unnamed_2.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%BAa%20Su/unnamed_2.webp', 'image/webp', 'Súa Su');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%sua su%' LIMIT 1;

-- Place: Súa Su
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%BAa%20Su/unnamed_3.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%BAa%20Su/unnamed_3.webp', 'image/webp', 'Súa Su');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%sua su%' LIMIT 1;

-- Place: Súa Su
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%BAa%20Su/unnamed.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/S%C3%BAa%20Su/unnamed.webp', 'image/webp', 'Súa Su');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%sua su%' LIMIT 1;

-- Place: Tư Nguyệt
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/T%C6%B0%20Nguy%E1%BB%87t/480767161_1135681258255254_7269740997835331983_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/T%C6%B0%20Nguy%E1%BB%87t/480767161_1135681258255254_7269740997835331983_n.jpg', 'image/jpeg', 'Tư Nguyệt');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%tu nguyet%' LIMIT 1;

-- Place: Tư Nguyệt
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/T%C6%B0%20Nguy%E1%BB%87t/480900602_1138682914621755_189775045142822256_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/T%C6%B0%20Nguy%E1%BB%87t/480900602_1138682914621755_189775045142822256_n.jpg', 'image/jpeg', 'Tư Nguyệt');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%tu nguyet%' LIMIT 1;

-- Place: Tư Nguyệt
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/T%C6%B0%20Nguy%E1%BB%87t/777298074_1579091690580873_5043735961642172039_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/T%C6%B0%20Nguy%E1%BB%87t/777298074_1579091690580873_5043735961642172039_n.jpg', 'image/jpeg', 'Tư Nguyệt');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%tu nguyet%' LIMIT 1;

-- Place: Tư Nguyệt
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/T%C6%B0%20Nguy%E1%BB%87t/777800967_1579091887247520_8042033156220121840_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969252/dulichso/T%C6%B0%20Nguy%E1%BB%87t/777800967_1579091887247520_8042033156220121840_n.jpg', 'image/jpeg', 'Tư Nguyệt');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%tu nguyet%' LIMIT 1;

-- Place: Tư Nguyệt
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/T%C6%B0%20Nguy%E1%BB%87t/777855283_1579091910580851_8035747759725634946_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/T%C6%B0%20Nguy%E1%BB%87t/777855283_1579091910580851_8035747759725634946_n.jpg', 'image/jpeg', 'Tư Nguyệt');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%tu nguyet%' LIMIT 1;

-- Place: Tư Nguyệt
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/T%C6%B0%20Nguy%E1%BB%87t/784981919_1586927766463932_3320751344400242468_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/T%C6%B0%20Nguy%E1%BB%87t/784981919_1586927766463932_3320751344400242468_n.jpg', 'image/jpeg', 'Tư Nguyệt');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%tu nguyet%' LIMIT 1;

-- Place: Tư Nguyệt
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/T%C6%B0%20Nguy%E1%BB%87t/785640749_1586927756463933_7702216867449163794_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/T%C6%B0%20Nguy%E1%BB%87t/785640749_1586927756463933_7702216867449163794_n.jpg', 'image/jpeg', 'Tư Nguyệt');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%tu nguyet%' LIMIT 1;

-- Place: Village Home
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/Village%20Home/656475993.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/Village%20Home/656475993.jpg', 'image/jpeg', 'Village Home');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%village home%' LIMIT 1;

-- Place: Village Home
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/Village%20Home/656476065.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/Village%20Home/656476065.jpg', 'image/jpeg', 'Village Home');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%village home%' LIMIT 1;

-- Place: Village Home
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/Village%20Home/656476070.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/Village%20Home/656476070.jpg', 'image/jpeg', 'Village Home');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%village home%' LIMIT 1;

-- Place: Village Home
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/Village%20Home/779951790.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/Village%20Home/779951790.jpg', 'image/jpeg', 'Village Home');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%village home%' LIMIT 1;

-- Place: A Tân Quán
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/A%20T%C3%A2n%20Qu%C3%A1n/522666088_122105260508944720_4032334098784163747_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/A%20T%C3%A2n%20Qu%C3%A1n/522666088_122105260508944720_4032334098784163747_n.jpg', 'image/jpeg', 'A Tân Quán');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%a tan quan%' LIMIT 1;

-- Place: A Tân Quán
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/A%20T%C3%A2n%20Qu%C3%A1n/534162410_122116920200944720_3733546771296622264_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/A%20T%C3%A2n%20Qu%C3%A1n/534162410_122116920200944720_3733546771296622264_n.jpg', 'image/jpeg', 'A Tân Quán');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%a tan quan%' LIMIT 1;

-- Place: A Tân Quán
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/A%20T%C3%A2n%20Qu%C3%A1n/ysmuduhehmpyurzuihal.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/A%20T%C3%A2n%20Qu%C3%A1n/ysmuduhehmpyurzuihal.png', 'image/png', 'A Tân Quán');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%a tan quan%' LIMIT 1;

-- Place: A Tân Quán
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/A%20T%C3%A2n%20Qu%C3%A1n/gxncjogp7nnxpu4kq0fs.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/A%20T%C3%A2n%20Qu%C3%A1n/gxncjogp7nnxpu4kq0fs.png', 'image/png', 'A Tân Quán');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%a tan quan%' LIMIT 1;

-- Place: A Tân Quán
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/A%20T%C3%A2n%20Qu%C3%A1n/j1otraxpjhxq3uvsnnfe.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/A%20T%C3%A2n%20Qu%C3%A1n/j1otraxpjhxq3uvsnnfe.png', 'image/png', 'A Tân Quán');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%a tan quan%' LIMIT 1;

-- Place: Mạnh Thơm
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/dsprwonxdamiacqgrttq.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/dsprwonxdamiacqgrttq.png', 'image/png', 'Mạnh Thơm');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%manh thom%' LIMIT 1;

-- Place: Mạnh Thơm
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/dsjsksddw0h3jl5nyqnj.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/dsjsksddw0h3jl5nyqnj.png', 'image/png', 'Mạnh Thơm');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%manh thom%' LIMIT 1;

-- Place: Mạnh Thơm
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/fuvr5pz3w3ecygcisfgk.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/fuvr5pz3w3ecygcisfgk.png', 'image/png', 'Mạnh Thơm');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%manh thom%' LIMIT 1;

-- Place: Mạnh Thơm
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/vzch0o6euopkl9mzyi7n.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/vzch0o6euopkl9mzyi7n.png', 'image/png', 'Mạnh Thơm');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%manh thom%' LIMIT 1;

-- Place: Mạnh Thơm
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/muz7iyt1aygbofhdsyrv.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/muz7iyt1aygbofhdsyrv.png', 'image/png', 'Mạnh Thơm');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%manh thom%' LIMIT 1;

-- Place: Mạnh Thơm
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/huy59twgxntbq2iddk7z.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/M%E1%BA%A1nh%20Th%C6%A1m/huy59twgxntbq2iddk7z.png', 'image/png', 'Mạnh Thơm');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%manh thom%' LIMIT 1;

-- Place: Quyền Hường
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/480795008_1127113659114045_5117211428974991803_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969253/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/480795008_1127113659114045_5117211428974991803_n.jpg', 'image/jpeg', 'Quyền Hường');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%quyen huong%' LIMIT 1;

-- Place: Quyền Hường
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/480997264_1122740182884726_6804959304591683343_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/480997264_1122740182884726_6804959304591683343_n.jpg', 'image/jpeg', 'Quyền Hường');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quyen huong%' LIMIT 1;

-- Place: Quyền Hường
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/540755245_1267551408403602_6268418483420415730_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/540755245_1267551408403602_6268418483420415730_n.jpg', 'image/jpeg', 'Quyền Hường');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quyen huong%' LIMIT 1;

-- Place: Quyền Hường
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/541529970_1267550295070380_2281074878062017778_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/541529970_1267550295070380_2281074878062017778_n.jpg', 'image/jpeg', 'Quyền Hường');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quyen huong%' LIMIT 1;

-- Place: Quyền Hường
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/542757163_1267550465070363_5773403836387364227_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/542757163_1267550465070363_5773403836387364227_n.jpg', 'image/jpeg', 'Quyền Hường');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quyen huong%' LIMIT 1;

-- Place: Quyền Hường
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/789580347_1566079741884099_1639326585334820550_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Quy%E1%BB%81n%20H%C6%B0%E1%BB%9Dng/789580347_1566079741884099_1639326585334820550_n.jpg', 'image/jpeg', 'Quyền Hường');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quyen huong%' LIMIT 1;

-- Place: Quán Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/768550868_122361292544003618_138028651158167731_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/768550868_122361292544003618_138028651158167731_n.jpg', 'image/jpeg', 'Quán Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%quan mam xoi%' LIMIT 1;

-- Place: Quán Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/789708965_122364668432003618_8019069042465868144_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/789708965_122364668432003618_8019069042465868144_n.jpg', 'image/jpeg', 'Quán Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quan mam xoi%' LIMIT 1;

-- Place: Quán Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/791045532_122364668636003618_6340073801083258051_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/791045532_122364668636003618_6340073801083258051_n.jpg', 'image/jpeg', 'Quán Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quan mam xoi%' LIMIT 1;

-- Place: Quán Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/791145907_122364668378003618_7593238349464995535_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/791145907_122364668378003618_7593238349464995535_n.jpg', 'image/jpeg', 'Quán Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quan mam xoi%' LIMIT 1;

-- Place: Quán Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/791706931_122364667892003618_4247802587561069841_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/791706931_122364667892003618_4247802587561069841_n.jpg', 'image/jpeg', 'Quán Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quan mam xoi%' LIMIT 1;

-- Place: Quán Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/791728449_122364668990003618_7778575432401148064_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/791728449_122364668990003618_7778575432401148064_n.jpg', 'image/jpeg', 'Quán Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quan mam xoi%' LIMIT 1;

-- Place: Quán Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/792091174_122364667946003618_2447021808160998368_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969254/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/792091174_122364667946003618_2447021808160998368_n.jpg', 'image/jpeg', 'Quán Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quan mam xoi%' LIMIT 1;

-- Place: Quán Mâm Xôi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/bu0essyt8s4mvltvaid5.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Qu%C3%A1n%20M%C3%A2m%20X%C3%B4i/bu0essyt8s4mvltvaid5.png', 'image/png', 'Quán Mâm Xôi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%quan mam xoi%' LIMIT 1;

-- Place: Thành Oanh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%A0nh%20Oanh/ehaidryzxakmcroabqtz.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%A0nh%20Oanh/ehaidryzxakmcroabqtz.png', 'image/png', 'Thành Oanh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%thanh oanh%' LIMIT 1;

-- Place: Thành Oanh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%A0nh%20Oanh/tuoncinuvc3u2t4mxig3.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%A0nh%20Oanh/tuoncinuvc3u2t4mxig3.png', 'image/png', 'Thành Oanh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thanh oanh%' LIMIT 1;

-- Place: Thành Oanh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%A0nh%20Oanh/niwz6ok54vygdiyttycq.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%A0nh%20Oanh/niwz6ok54vygdiyttycq.png', 'image/png', 'Thành Oanh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thanh oanh%' LIMIT 1;

-- Place: Thành Oanh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%A0nh%20Oanh/l66ljpisxddxdtnapffp.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%A0nh%20Oanh/l66ljpisxddxdtnapffp.png', 'image/png', 'Thành Oanh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thanh oanh%' LIMIT 1;

-- Place: Thành Oanh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%A0nh%20Oanh/irvwookgyfna5z56zsxc.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%A0nh%20Oanh/irvwookgyfna5z56zsxc.png', 'image/png', 'Thành Oanh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thanh oanh%' LIMIT 1;

-- Place: Thùy Linh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/785364033_1717365537057395_3944428654388047342_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/785364033_1717365537057395_3944428654388047342_n.jpg', 'image/jpeg', 'Thùy Linh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%thuy linh%' LIMIT 1;

-- Place: Thùy Linh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/786303874_1718470180280264_6821283345118861799_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/786303874_1718470180280264_6821283345118861799_n.jpg', 'image/jpeg', 'Thùy Linh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thuy linh%' LIMIT 1;

-- Place: Thùy Linh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/787650656_1717365710390711_2321280729780766395_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/787650656_1717365710390711_2321280729780766395_n.jpg', 'image/jpeg', 'Thùy Linh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thuy linh%' LIMIT 1;

-- Place: Thùy Linh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/790230554_1718470256946923_8752209957279715335_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/790230554_1718470256946923_8752209957279715335_n.jpg', 'image/jpeg', 'Thùy Linh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thuy linh%' LIMIT 1;

-- Place: Thùy Linh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/790425803_1717365810390701_8585534307796140789_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/790425803_1717365810390701_8585534307796140789_n.jpg', 'image/jpeg', 'Thùy Linh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thuy linh%' LIMIT 1;

-- Place: Thùy Linh
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/790614955_1718470303613585_5952819247755437431_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Th%C3%B9y%20Linh/790614955_1718470303613585_5952819247755437431_n.jpg', 'image/jpeg', 'Thùy Linh');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thuy linh%' LIMIT 1;

-- Place: Vua Xứ Mù
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/485005291_972217818433565_540571554114907826_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/485005291_972217818433565_540571554114907826_n.jpg', 'image/jpeg', 'Vua Xứ Mù');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%vua xu mu%' LIMIT 1;

-- Place: Vua Xứ Mù
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/607971661_1195336152788396_2598467293630567451_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/607971661_1195336152788396_2598467293630567451_n.jpg', 'image/jpeg', 'Vua Xứ Mù');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%vua xu mu%' LIMIT 1;

-- Place: Vua Xứ Mù
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/608171069_1198346852487326_5135549956653239836_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/608171069_1198346852487326_5135549956653239836_n.jpg', 'image/jpeg', 'Vua Xứ Mù');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%vua xu mu%' LIMIT 1;

-- Place: Vua Xứ Mù
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/608756442_1198346859153992_1446894768427755310_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/608756442_1198346859153992_1446894768427755310_n.jpg', 'image/jpeg', 'Vua Xứ Mù');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%vua xu mu%' LIMIT 1;

-- Place: Vua Xứ Mù
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/686328112_1295815589407118_4923814735662230907_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/686328112_1295815589407118_4923814735662230907_n.jpg', 'image/jpeg', 'Vua Xứ Mù');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%vua xu mu%' LIMIT 1;

-- Place: Vua Xứ Mù
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/688044185_1295815566073787_4923058816261770539_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/688044185_1295815566073787_4923058816261770539_n.jpg', 'image/jpeg', 'Vua Xứ Mù');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%vua xu mu%' LIMIT 1;

-- Place: Vua Xứ Mù
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/688074861_1295815606073783_6558184838243920174_n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Vua%20X%E1%BB%A9%20M%C3%B9/688074861_1295815606073783_6558184838243920174_n.jpg', 'image/jpeg', 'Vua Xứ Mù');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%vua xu mu%' LIMIT 1;

-- Place: Bánh chưng đen
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/B%C3%A1nh%20ch%C6%B0ng%20%C4%91en/BC1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/B%C3%A1nh%20ch%C6%B0ng%20%C4%91en/BC1.jpg', 'image/jpeg', 'Bánh chưng đen');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%banh chung den%' LIMIT 1;

-- Place: Bánh chưng đen
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/B%C3%A1nh%20ch%C6%B0ng%20%C4%91en/BC2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/B%C3%A1nh%20ch%C6%B0ng%20%C4%91en/BC2.jpg', 'image/jpeg', 'Bánh chưng đen');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%banh chung den%' LIMIT 1;

-- Place: Châu chấu rang
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Ch%C3%A2u%20ch%E1%BA%A5u%20rang/y7ospn5v3jjkjypmeutv.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969255/dulichso/Ch%C3%A2u%20ch%E1%BA%A5u%20rang/y7ospn5v3jjkjypmeutv.jpg', 'image/jpeg', 'Châu chấu rang');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%chau chau rang%' LIMIT 1;

-- Place: Châu chấu rang
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/Ch%C3%A2u%20ch%E1%BA%A5u%20rang/k5undk2sw6znouebr2fn.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/Ch%C3%A2u%20ch%E1%BA%A5u%20rang/k5undk2sw6znouebr2fn.jpg', 'image/jpeg', 'Châu chấu rang');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chau chau rang%' LIMIT 1;

-- Place: Châu chấu rang
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/Ch%C3%A2u%20ch%E1%BA%A5u%20rang/c2nmoh8grw1z6so9c3ne.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/Ch%C3%A2u%20ch%E1%BA%A5u%20rang/c2nmoh8grw1z6so9c3ne.jpg', 'image/jpeg', 'Châu chấu rang');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chau chau rang%' LIMIT 1;

-- Place: Châu chấu rang
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/Ch%C3%A2u%20ch%E1%BA%A5u%20rang/qiddylxxmkg0arztir1l.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/Ch%C3%A2u%20ch%E1%BA%A5u%20rang/qiddylxxmkg0arztir1l.jpg', 'image/jpeg', 'Châu chấu rang');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%chau chau rang%' LIMIT 1;

-- Place: Cá suối nướng Pa Pinh Tộp
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%C3%A1%20su%E1%BB%91i%20n%C6%B0%E1%BB%9Bng%20Pa%20Pinh%20T%E1%BB%99p/vfdju45tmk4fpxwynxdc.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%C3%A1%20su%E1%BB%91i%20n%C6%B0%E1%BB%9Bng%20Pa%20Pinh%20T%E1%BB%99p/vfdju45tmk4fpxwynxdc.webp', 'image/webp', 'Cá suối nướng Pa Pinh Tộp');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%ca suoi nuong pa pinh top%' LIMIT 1;

-- Place: Cá suối nướng Pa Pinh Tộp
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%C3%A1%20su%E1%BB%91i%20n%C6%B0%E1%BB%9Bng%20Pa%20Pinh%20T%E1%BB%99p/oerkkehdga8tdhbjgbay.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%C3%A1%20su%E1%BB%91i%20n%C6%B0%E1%BB%9Bng%20Pa%20Pinh%20T%E1%BB%99p/oerkkehdga8tdhbjgbay.jpg', 'image/jpeg', 'Cá suối nướng Pa Pinh Tộp');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ca suoi nuong pa pinh top%' LIMIT 1;

-- Place: Cá tầm, cá hồi Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%C3%A1%20t%E1%BA%A7m%2C%20c%C3%A1%20h%E1%BB%93i%20Khau%20Ph%E1%BA%A1/ctdu7jnkywshn6uahip0.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%C3%A1%20t%E1%BA%A7m%2C%20c%C3%A1%20h%E1%BB%93i%20Khau%20Ph%E1%BA%A1/ctdu7jnkywshn6uahip0.jpg', 'image/jpeg', 'Cá tầm, cá hồi Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%ca tam, ca hoi khau pha%' LIMIT 1;

-- Place: Cá tầm, cá hồi Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%C3%A1%20t%E1%BA%A7m%2C%20c%C3%A1%20h%E1%BB%93i%20Khau%20Ph%E1%BA%A1/d0kooctjwspc8bgtptzj.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%C3%A1%20t%E1%BA%A7m%2C%20c%C3%A1%20h%E1%BB%93i%20Khau%20Ph%E1%BA%A1/d0kooctjwspc8bgtptzj.jpg', 'image/jpeg', 'Cá tầm, cá hồi Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ca tam, ca hoi khau pha%' LIMIT 1;

-- Place: Cá tầm, cá hồi Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%C3%A1%20t%E1%BA%A7m%2C%20c%C3%A1%20h%E1%BB%93i%20Khau%20Ph%E1%BA%A1/rcy9ntjvyl4uvplkv7na.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%C3%A1%20t%E1%BA%A7m%2C%20c%C3%A1%20h%E1%BB%93i%20Khau%20Ph%E1%BA%A1/rcy9ntjvyl4uvplkv7na.jpg', 'image/jpeg', 'Cá tầm, cá hồi Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ca tam, ca hoi khau pha%' LIMIT 1;

-- Place: Cốm Tú Lệ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%E1%BB%91m%20T%C3%BA%20L%E1%BB%87/sejk1duhrfybaxgks3di.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%E1%BB%91m%20T%C3%BA%20L%E1%BB%87/sejk1duhrfybaxgks3di.jpg', 'image/jpeg', 'Cốm Tú Lệ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%com tu le%' LIMIT 1;

-- Place: Cốm Tú Lệ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%E1%BB%91m%20T%C3%BA%20L%E1%BB%87/ftzkeus02puxcwti5fyj.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%E1%BB%91m%20T%C3%BA%20L%E1%BB%87/ftzkeus02puxcwti5fyj.jpg', 'image/jpeg', 'Cốm Tú Lệ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%com tu le%' LIMIT 1;

-- Place: Cốm Tú Lệ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%E1%BB%91m%20T%C3%BA%20L%E1%BB%87/ndpzbmf4azjt2gukrwzz.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/C%E1%BB%91m%20T%C3%BA%20L%E1%BB%87/ndpzbmf4azjt2gukrwzz.jpg', 'image/jpeg', 'Cốm Tú Lệ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%com tu le%' LIMIT 1;

-- Place: Gà Đen, Gà nướng mắc mật
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/G%C3%A0%20%C4%90en%2C%20G%C3%A0%20n%C6%B0%E1%BB%9Bng%20m%E1%BA%AFc%20m%E1%BA%ADt/idmxnogw5rzjglga0lpm.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/G%C3%A0%20%C4%90en%2C%20G%C3%A0%20n%C6%B0%E1%BB%9Bng%20m%E1%BA%AFc%20m%E1%BA%ADt/idmxnogw5rzjglga0lpm.jpg', 'image/jpeg', 'Gà Đen, Gà nướng mắc mật');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%ga den, ga nuong mac mat%' LIMIT 1;

-- Place: Gà Đen, Gà nướng mắc mật
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/G%C3%A0%20%C4%90en%2C%20G%C3%A0%20n%C6%B0%E1%BB%9Bng%20m%E1%BA%AFc%20m%E1%BA%ADt/aqrd0hmorhel2qrj0ela.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/G%C3%A0%20%C4%90en%2C%20G%C3%A0%20n%C6%B0%E1%BB%9Bng%20m%E1%BA%AFc%20m%E1%BA%ADt/aqrd0hmorhel2qrj0ela.jpg', 'image/jpeg', 'Gà Đen, Gà nướng mắc mật');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ga den, ga nuong mac mat%' LIMIT 1;

-- Place: Gà Đen, Gà nướng mắc mật
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/G%C3%A0%20%C4%90en%2C%20G%C3%A0%20n%C6%B0%E1%BB%9Bng%20m%E1%BA%AFc%20m%E1%BA%ADt/xcttjowoz5gdbdwawrg4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/G%C3%A0%20%C4%90en%2C%20G%C3%A0%20n%C6%B0%E1%BB%9Bng%20m%E1%BA%AFc%20m%E1%BA%ADt/xcttjowoz5gdbdwawrg4.jpg', 'image/jpeg', 'Gà Đen, Gà nướng mắc mật');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ga den, ga nuong mac mat%' LIMIT 1;

-- Place: Mèn mén
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/M%C3%A8n%20m%C3%A9n/mm_1.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/M%C3%A8n%20m%C3%A9n/mm_1.webp', 'image/webp', 'Mèn mén');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%men men%' LIMIT 1;

-- Place: Mèn mén
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/M%C3%A8n%20m%C3%A9n/mm2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/M%C3%A8n%20m%C3%A9n/mm2.jpg', 'image/jpeg', 'Mèn mén');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%men men%' LIMIT 1;

-- Place: Mèn mén
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/M%C3%A8n%20m%C3%A9n/mm3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/M%C3%A8n%20m%C3%A9n/mm3.jpg', 'image/jpeg', 'Mèn mén');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%men men%' LIMIT 1;

-- Place: Mèn mén
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/M%C3%A8n%20m%C3%A9n/mm4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/M%C3%A8n%20m%C3%A9n/mm4.jpg', 'image/jpeg', 'Mèn mén');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%men men%' LIMIT 1;

-- Place: Măng ớt Trạm Tấu
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/M%C4%83ng%20%E1%BB%9Bt%20Tr%E1%BA%A1m%20T%E1%BA%A5u/m_ng_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969256/dulichso/M%C4%83ng%20%E1%BB%9Bt%20Tr%E1%BA%A1m%20T%E1%BA%A5u/m_ng_1.jpg', 'image/jpeg', 'Măng ớt Trạm Tấu');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%mang ot tram tau%' LIMIT 1;

-- Place: Măng ớt Trạm Tấu
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%C4%83ng%20%E1%BB%9Bt%20Tr%E1%BA%A1m%20T%E1%BA%A5u/m_ng_2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%C4%83ng%20%E1%BB%9Bt%20Tr%E1%BA%A1m%20T%E1%BA%A5u/m_ng_2.jpg', 'image/jpeg', 'Măng ớt Trạm Tấu');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mang ot tram tau%' LIMIT 1;

-- Place: Mận Tam Hoa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADn%20Tam%20Hoa/qrjvjnqx2wkchnzuy3ct.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADn%20Tam%20Hoa/qrjvjnqx2wkchnzuy3ct.jpg', 'image/jpeg', 'Mận Tam Hoa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%man tam hoa%' LIMIT 1;

-- Place: Mận Tam Hoa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADn%20Tam%20Hoa/plhn5nvxabhryrqikms9.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADn%20Tam%20Hoa/plhn5nvxabhryrqikms9.jpg', 'image/jpeg', 'Mận Tam Hoa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%man tam hoa%' LIMIT 1;

-- Place: Mận Tam Hoa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADn%20Tam%20Hoa/jqrgyfobpkvsayivwqc1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADn%20Tam%20Hoa/jqrgyfobpkvsayivwqc1.jpg', 'image/jpeg', 'Mận Tam Hoa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%man tam hoa%' LIMIT 1;

-- Place: Mận Tam Hoa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADn%20Tam%20Hoa/rpak8vdnbvzdgvgs8ohn.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADn%20Tam%20Hoa/rpak8vdnbvzdgvgs8ohn.jpg', 'image/jpeg', 'Mận Tam Hoa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%man tam hoa%' LIMIT 1;

-- Place: Mật ong trắng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADt%20ong%20tr%E1%BA%AFng/bee_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADt%20ong%20tr%E1%BA%AFng/bee_1.jpg', 'image/jpeg', 'Mật ong trắng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%mat ong trang%' LIMIT 1;

-- Place: Mật ong trắng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADt%20ong%20tr%E1%BA%AFng/bee_2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADt%20ong%20tr%E1%BA%AFng/bee_2.jpg', 'image/jpeg', 'Mật ong trắng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mat ong trang%' LIMIT 1;

-- Place: Mật ong trắng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADt%20ong%20tr%E1%BA%AFng/bee_3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%E1%BA%ADt%20ong%20tr%E1%BA%AFng/bee_3.jpg', 'image/jpeg', 'Mật ong trắng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mat ong trang%' LIMIT 1;

-- Place: Nhộng ong rừng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Nh%E1%BB%99ng%20ong%20r%E1%BB%ABng/nbee_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Nh%E1%BB%99ng%20ong%20r%E1%BB%ABng/nbee_1.jpg', 'image/jpeg', 'Nhộng ong rừng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%nhong ong rung%' LIMIT 1;

-- Place: Nhộng ong rừng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Nh%E1%BB%99ng%20ong%20r%E1%BB%ABng/nbee2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Nh%E1%BB%99ng%20ong%20r%E1%BB%ABng/nbee2.jpg', 'image/jpeg', 'Nhộng ong rừng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%nhong ong rung%' LIMIT 1;

-- Place: Nhộng ong rừng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Nh%E1%BB%99ng%20ong%20r%E1%BB%ABng/nbee3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Nh%E1%BB%99ng%20ong%20r%E1%BB%ABng/nbee3.jpg', 'image/jpeg', 'Nhộng ong rừng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%nhong ong rung%' LIMIT 1;

-- Place: Nhộng ong rừng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Nh%E1%BB%99ng%20ong%20r%E1%BB%ABng/nbee4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Nh%E1%BB%99ng%20ong%20r%E1%BB%ABng/nbee4.jpg', 'image/jpeg', 'Nhộng ong rừng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%nhong ong rung%' LIMIT 1;

-- Place: Rượu táo mèo
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/R%C6%B0%E1%BB%A3u%20t%C3%A1o%20m%C3%A8o/ngzmfr2j59kpcpvw5tfy.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/R%C6%B0%E1%BB%A3u%20t%C3%A1o%20m%C3%A8o/ngzmfr2j59kpcpvw5tfy.jpg', 'image/jpeg', 'Rượu táo mèo');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%ruou tao meo%' LIMIT 1;

-- Place: Rượu táo mèo
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/R%C6%B0%E1%BB%A3u%20t%C3%A1o%20m%C3%A8o/enst6cemstaua5iwrn5q.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/R%C6%B0%E1%BB%A3u%20t%C3%A1o%20m%C3%A8o/enst6cemstaua5iwrn5q.jpg', 'image/jpeg', 'Rượu táo mèo');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ruou tao meo%' LIMIT 1;

-- Place: Rượu táo mèo
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/R%C6%B0%E1%BB%A3u%20t%C3%A1o%20m%C3%A8o/ubbs2hngy9dj1ddnodov.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/R%C6%B0%E1%BB%A3u%20t%C3%A1o%20m%C3%A8o/ubbs2hngy9dj1ddnodov.jpg', 'image/jpeg', 'Rượu táo mèo');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ruou tao meo%' LIMIT 1;

-- Place: Rượu táo mèo
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/R%C6%B0%E1%BB%A3u%20t%C3%A1o%20m%C3%A8o/j1f9jex9gnnvn7ob0eam.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/R%C6%B0%E1%BB%A3u%20t%C3%A1o%20m%C3%A8o/j1f9jex9gnnvn7ob0eam.jpg', 'image/jpeg', 'Rượu táo mèo');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%ruou tao meo%' LIMIT 1;

-- Place: Thịt lợn đen kẹp cây rừng nướng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20l%E1%BB%A3n%20%C4%91en%20k%E1%BA%B9p%20c%C3%A2y%20r%E1%BB%ABng%20n%C6%B0%E1%BB%9Bng/pig_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20l%E1%BB%A3n%20%C4%91en%20k%E1%BA%B9p%20c%C3%A2y%20r%E1%BB%ABng%20n%C6%B0%E1%BB%9Bng/pig_1.jpg', 'image/jpeg', 'Thịt lợn đen kẹp cây rừng nướng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%thit lon den kep cay rung nuong%' LIMIT 1;

-- Place: Thịt lợn đen kẹp cây rừng nướng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20l%E1%BB%A3n%20%C4%91en%20k%E1%BA%B9p%20c%C3%A2y%20r%E1%BB%ABng%20n%C6%B0%E1%BB%9Bng/pig_2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20l%E1%BB%A3n%20%C4%91en%20k%E1%BA%B9p%20c%C3%A2y%20r%E1%BB%ABng%20n%C6%B0%E1%BB%9Bng/pig_2.jpg', 'image/jpeg', 'Thịt lợn đen kẹp cây rừng nướng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thit lon den kep cay rung nuong%' LIMIT 1;

-- Place: Thịt lợn đen kẹp cây rừng nướng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20l%E1%BB%A3n%20%C4%91en%20k%E1%BA%B9p%20c%C3%A2y%20r%E1%BB%ABng%20n%C6%B0%E1%BB%9Bng/pig_3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20l%E1%BB%A3n%20%C4%91en%20k%E1%BA%B9p%20c%C3%A2y%20r%E1%BB%ABng%20n%C6%B0%E1%BB%9Bng/pig_3.jpg', 'image/jpeg', 'Thịt lợn đen kẹp cây rừng nướng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thit lon den kep cay rung nuong%' LIMIT 1;

-- Place: Thịt trâu gác bếp
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20tr%C3%A2u%20g%C3%A1c%20b%E1%BA%BFp/bf_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20tr%C3%A2u%20g%C3%A1c%20b%E1%BA%BFp/bf_1.jpg', 'image/webp', 'Thịt trâu gác bếp');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%thit trau gac bep%' LIMIT 1;

-- Place: Thịt trâu gác bếp
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20tr%C3%A2u%20g%C3%A1c%20b%E1%BA%BFp/bf_2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20tr%C3%A2u%20g%C3%A1c%20b%E1%BA%BFp/bf_2.jpg', 'image/jpeg', 'Thịt trâu gác bếp');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thit trau gac bep%' LIMIT 1;

-- Place: Thịt trâu gác bếp
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20tr%C3%A2u%20g%C3%A1c%20b%E1%BA%BFp/bf_3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20tr%C3%A2u%20g%C3%A1c%20b%E1%BA%BFp/bf_3.jpg', 'image/jpeg', 'Thịt trâu gác bếp');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thit trau gac bep%' LIMIT 1;

-- Place: Thịt trâu gác bếp
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20tr%C3%A2u%20g%C3%A1c%20b%E1%BA%BFp/bf_4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/Th%E1%BB%8Bt%20tr%C3%A2u%20g%C3%A1c%20b%E1%BA%BFp/bf_4.jpg', 'image/jpeg', 'Thịt trâu gác bếp');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thit trau gac bep%' LIMIT 1;

-- Place: Xôi Tú Lệ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/X%C3%B4i%20T%C3%BA%20L%E1%BB%87/a2hl6hadsevw5hawvvwa.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/X%C3%B4i%20T%C3%BA%20L%E1%BB%87/a2hl6hadsevw5hawvvwa.jpg', 'image/jpeg', 'Xôi Tú Lệ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%xoi tu le%' LIMIT 1;

-- Place: Xôi Tú Lệ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/X%C3%B4i%20T%C3%BA%20L%E1%BB%87/pjlqi531ppa0loqd1bpa.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/X%C3%B4i%20T%C3%BA%20L%E1%BB%87/pjlqi531ppa0loqd1bpa.jpg', 'image/jpeg', 'Xôi Tú Lệ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%xoi tu le%' LIMIT 1;

-- Place: Xôi Tú Lệ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/X%C3%B4i%20T%C3%BA%20L%E1%BB%87/lrnz3ay4xnjq22psivh1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/X%C3%B4i%20T%C3%BA%20L%E1%BB%87/lrnz3ay4xnjq22psivh1.jpg', 'image/jpeg', 'Xôi Tú Lệ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%xoi tu le%' LIMIT 1;

-- Place: Mâm xôi (Lớn)
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%C3%A2m%20x%C3%B4i%20%28L%E1%BB%9Bn%29/kietzmkibsjwq6m0s9ij.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969257/dulichso/M%C3%A2m%20x%C3%B4i%20%28L%E1%BB%9Bn%29/kietzmkibsjwq6m0s9ij.jpg', 'image/jpeg', 'Mâm xôi (Lớn)');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%mam xoi (lon)%' LIMIT 1;

-- Place: Mâm xôi (Lớn)
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28L%E1%BB%9Bn%29/nn11nhxhg6qbuwjayva9.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28L%E1%BB%9Bn%29/nn11nhxhg6qbuwjayva9.jpg', 'image/jpeg', 'Mâm xôi (Lớn)');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mam xoi (lon)%' LIMIT 1;

-- Place: Mâm xôi (Lớn)
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28L%E1%BB%9Bn%29/ijjukeirstzzjx8zddr8.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28L%E1%BB%9Bn%29/ijjukeirstzzjx8zddr8.jpg', 'image/webp', 'Mâm xôi (Lớn)');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mam xoi (lon)%' LIMIT 1;

-- Place: Mâm xôi (Lớn)
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28L%E1%BB%9Bn%29/whmsbwvnefwkutkvd6gq.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28L%E1%BB%9Bn%29/whmsbwvnefwkutkvd6gq.jpg', 'image/webp', 'Mâm xôi (Lớn)');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mam xoi (lon)%' LIMIT 1;

-- Place: Mâm xôi (Nhỏ)
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28Nh%E1%BB%8F%29/ihxfnvtrt6yafzmikw1n.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28Nh%E1%BB%8F%29/ihxfnvtrt6yafzmikw1n.jpg', 'image/jpeg', 'Mâm xôi (Nhỏ)');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%mam xoi (nho)%' LIMIT 1;

-- Place: Mâm xôi (Nhỏ)
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/M%C3%A2m%20x%C3%B4i%20%28Nh%E1%BB%8F%29/zvdofgi4w4lx1waevzmi.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/M%C3%A2m%20x%C3%B4i%20%28Nh%E1%BB%8F%29/zvdofgi4w4lx1waevzmi.jpg', 'image/jpeg', 'Mâm xôi (Nhỏ)');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mam xoi (nho)%' LIMIT 1;

-- Place: Mâm xôi (Nhỏ)
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28Nh%E1%BB%8F%29/bgaamtreld5qxbo74olb.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28Nh%E1%BB%8F%29/bgaamtreld5qxbo74olb.jpg', 'image/jpeg', 'Mâm xôi (Nhỏ)');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mam xoi (nho)%' LIMIT 1;

-- Place: Mâm xôi (Nhỏ)
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28Nh%E1%BB%8F%29/dpftpz696cvwjfhit0it.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20%28Nh%E1%BB%8F%29/dpftpz696cvwjfhit0it.webp', 'image/webp', 'Mâm xôi (Nhỏ)');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mam xoi (nho)%' LIMIT 1;

-- Place: Mâm xôi Lao Chải
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20Lao%20Ch%E1%BA%A3i/a4yjo9kjv8ozhob62eky.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20Lao%20Ch%E1%BA%A3i/a4yjo9kjv8ozhob62eky.jpg', 'image/jpeg', 'Mâm xôi Lao Chải');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%mam xoi lao chai%' LIMIT 1;

-- Place: Mâm xôi Lao Chải
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20Lao%20Ch%E1%BA%A3i/ibxh4ababtph6gplasou.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20Lao%20Ch%E1%BA%A3i/ibxh4ababtph6gplasou.webp', 'image/webp', 'Mâm xôi Lao Chải');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mam xoi lao chai%' LIMIT 1;

-- Place: Mâm xôi Lao Chải
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20Lao%20Ch%E1%BA%A3i/llrhsa7jy78y46hwhlx2.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%A2m%20x%C3%B4i%20Lao%20Ch%E1%BA%A3i/llrhsa7jy78y46hwhlx2.jpg', 'image/jpeg', 'Mâm xôi Lao Chải');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mam xoi lao chai%' LIMIT 1;

-- Place: Móng ngựa Lao Chải
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%B3ng%20ng%E1%BB%B1a%20Lao%20Ch%E1%BA%A3i/u1p35l4tnlqtkeaczg0g.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%B3ng%20ng%E1%BB%B1a%20Lao%20Ch%E1%BA%A3i/u1p35l4tnlqtkeaczg0g.jpg', 'image/jpeg', 'Móng ngựa Lao Chải');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%mong ngua lao chai%' LIMIT 1;

-- Place: Móng ngựa Lao Chải
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%B3ng%20ng%E1%BB%B1a%20Lao%20Ch%E1%BA%A3i/gz10ztwwnecwz96zqkrm.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%B3ng%20ng%E1%BB%B1a%20Lao%20Ch%E1%BA%A3i/gz10ztwwnecwz96zqkrm.jpg', 'image/jpeg', 'Móng ngựa Lao Chải');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mong ngua lao chai%' LIMIT 1;

-- Place: Móng ngựa Lao Chải
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%B3ng%20ng%E1%BB%B1a%20Lao%20Ch%E1%BA%A3i/lw3rtyjxzmgpuafz41i3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%B3ng%20ng%E1%BB%B1a%20Lao%20Ch%E1%BA%A3i/lw3rtyjxzmgpuafz41i3.jpg', 'image/jpeg', 'Móng ngựa Lao Chải');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mong ngua lao chai%' LIMIT 1;

-- Place: Móng ngựa Lao Chải
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%B3ng%20ng%E1%BB%B1a%20Lao%20Ch%E1%BA%A3i/iamzyfgsoa59hzwjdxol.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%C3%B3ng%20ng%E1%BB%B1a%20Lao%20Ch%E1%BA%A3i/iamzyfgsoa59hzwjdxol.webp', 'image/webp', 'Móng ngựa Lao Chải');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mong ngua lao chai%' LIMIT 1;

-- Place: Mỏm đá Kim Nọi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%E1%BB%8Fm%20%C4%91%C3%A1%20Kim%20N%E1%BB%8Di/cqshz6c7uzv6anfoe4wo.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%E1%BB%8Fm%20%C4%91%C3%A1%20Kim%20N%E1%BB%8Di/cqshz6c7uzv6anfoe4wo.jpg', 'image/jpeg', 'Mỏm đá Kim Nọi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%mom da kim noi%' LIMIT 1;

-- Place: Mỏm đá Kim Nọi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%E1%BB%8Fm%20%C4%91%C3%A1%20Kim%20N%E1%BB%8Di/gjnfyzvoyyokg3ponsgz.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%E1%BB%8Fm%20%C4%91%C3%A1%20Kim%20N%E1%BB%8Di/gjnfyzvoyyokg3ponsgz.jpg', 'image/jpeg', 'Mỏm đá Kim Nọi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mom da kim noi%' LIMIT 1;

-- Place: Mỏm đá Kim Nọi
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%E1%BB%8Fm%20%C4%91%C3%A1%20Kim%20N%E1%BB%8Di/w4j8m4axoaeylk4gk2kw.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/M%E1%BB%8Fm%20%C4%91%C3%A1%20Kim%20N%E1%BB%8Di/w4j8m4axoaeylk4gk2kw.webp', 'image/webp', 'Mỏm đá Kim Nọi');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%mom da kim noi%' LIMIT 1;

-- Place: Nhà Ngô Màng Mủ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/Nh%C3%A0%20Ng%C3%B4%20M%C3%A0ng%20M%E1%BB%A7/h4jss1snvvzeduntaeny.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969258/dulichso/Nh%C3%A0%20Ng%C3%B4%20M%C3%A0ng%20M%E1%BB%A7/h4jss1snvvzeduntaeny.jpg', 'image/jpeg', 'Nhà Ngô Màng Mủ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%nha ngo mang mu%' LIMIT 1;

-- Place: Nhà Ngô Màng Mủ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Nh%C3%A0%20Ng%C3%B4%20M%C3%A0ng%20M%E1%BB%A7/ity13vgddjzuzp6k7ngi.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Nh%C3%A0%20Ng%C3%B4%20M%C3%A0ng%20M%E1%BB%A7/ity13vgddjzuzp6k7ngi.jpg', 'image/jpeg', 'Nhà Ngô Màng Mủ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%nha ngo mang mu%' LIMIT 1;

-- Place: Nhà Ngô Màng Mủ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Nh%C3%A0%20Ng%C3%B4%20M%C3%A0ng%20M%E1%BB%A7/wxtkqazvisonhbiwobyt.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Nh%C3%A0%20Ng%C3%B4%20M%C3%A0ng%20M%E1%BB%A7/wxtkqazvisonhbiwobyt.jpg', 'image/jpeg', 'Nhà Ngô Màng Mủ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%nha ngo mang mu%' LIMIT 1;

-- Place: Rừng Trúc
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/gj9jf6kxeo2moem9cnsv.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/gj9jf6kxeo2moem9cnsv.jpg', 'image/jpeg', 'Rừng Trúc');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%rung truc%' LIMIT 1;

-- Place: Rừng Trúc
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/q4si7q1dvzahaftpnzhk.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/q4si7q1dvzahaftpnzhk.jpg', 'image/jpeg', 'Rừng Trúc');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%rung truc%' LIMIT 1;

-- Place: Rừng Trúc
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/ae604atzhkwbv3bxqe3z.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/ae604atzhkwbv3bxqe3z.jpg', 'image/jpeg', 'Rừng Trúc');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%rung truc%' LIMIT 1;

-- Place: Rừng Trúc
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/hlpr6lhseu0zggbz0uxr.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/R%E1%BB%ABng%20Tr%C3%BAc/hlpr6lhseu0zggbz0uxr.jpg', 'image/jpeg', 'Rừng Trúc');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%rung truc%' LIMIT 1;

-- Place: Sống lưng khủng long
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/t-rex_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/t-rex_1.jpg', 'image/jpeg', 'Sống lưng khủng long');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%song lung khung long%' LIMIT 1;

-- Place: Sống lưng khủng long
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/t-rex_2.png', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/t-rex_2.png', 'image/png', 'Sống lưng khủng long');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%song lung khung long%' LIMIT 1;

-- Place: Sống lưng khủng long
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/t-rex_3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/S%E1%BB%91ng%20l%C6%B0ng%20kh%E1%BB%A7ng%20long/t-rex_3.jpg', 'image/jpeg', 'Sống lưng khủng long');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%song lung khung long%' LIMIT 1;

-- Place: Thung lũng Cao Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Thung%20l%C5%A9ng%20Cao%20Ph%E1%BA%A1/thung_ling_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Thung%20l%C5%A9ng%20Cao%20Ph%E1%BA%A1/thung_ling_1.jpg', 'image/jpeg', 'Thung lũng Cao Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%thung lung cao pha%' LIMIT 1;

-- Place: Thung lũng Cao Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Thung%20l%C5%A9ng%20Cao%20Ph%E1%BA%A1/thung_ling_22.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Thung%20l%C5%A9ng%20Cao%20Ph%E1%BA%A1/thung_ling_22.jpg', 'image/jpeg', 'Thung lũng Cao Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thung lung cao pha%' LIMIT 1;

-- Place: Thung lũng Cao Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Thung%20l%C5%A9ng%20Cao%20Ph%E1%BA%A1/thung_ling_3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Thung%20l%C5%A9ng%20Cao%20Ph%E1%BA%A1/thung_ling_3.jpg', 'image/jpeg', 'Thung lũng Cao Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thung lung cao pha%' LIMIT 1;

-- Place: Thung lũng Cao Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Thung%20l%C5%A9ng%20Cao%20Ph%E1%BA%A1/thung_ling_4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Thung%20l%C5%A9ng%20Cao%20Ph%E1%BA%A1/thung_ling_4.jpg', 'image/jpeg', 'Thung lũng Cao Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thung lung cao pha%' LIMIT 1;

-- Place: Thác 7 tầng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%207%20t%E1%BA%A7ng/vuz2kaoaewagjcwngxdr.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%207%20t%E1%BA%A7ng/vuz2kaoaewagjcwngxdr.jpg', 'image/jpeg', 'Thác 7 tầng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%thac 7 tang%' LIMIT 1;

-- Place: Thác 7 tầng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%207%20t%E1%BA%A7ng/osser2wpy8wluhtuvlcg.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%207%20t%E1%BA%A7ng/osser2wpy8wluhtuvlcg.jpg', 'image/jpeg', 'Thác 7 tầng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thac 7 tang%' LIMIT 1;

-- Place: Thác 7 tầng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%207%20t%E1%BA%A7ng/tgqlbogclebzjimnys1b.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%207%20t%E1%BA%A7ng/tgqlbogclebzjimnys1b.jpg', 'image/jpeg', 'Thác 7 tầng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thac 7 tang%' LIMIT 1;

-- Place: Thác 7 tầng
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%207%20t%E1%BA%A7ng/dvejy6gycbxgchujupw4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%207%20t%E1%BA%A7ng/dvejy6gycbxgchujupw4.jpg', 'image/jpeg', 'Thác 7 tầng');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thac 7 tang%' LIMIT 1;

-- Place: Thác Hậu Đề
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%20H%E1%BA%ADu%20%C4%90%E1%BB%81/pq8dtlwfazfjkr95w10j.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%20H%E1%BA%ADu%20%C4%90%E1%BB%81/pq8dtlwfazfjkr95w10j.jpg', 'image/jpeg', 'Thác Hậu Đề');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%thac hau de%' LIMIT 1;

-- Place: Thác Hậu Đề
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%20H%E1%BA%ADu%20%C4%90%E1%BB%81/vgrfzqxyo8cpil7aitk3.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%20H%E1%BA%ADu%20%C4%90%E1%BB%81/vgrfzqxyo8cpil7aitk3.jpg', 'image/jpeg', 'Thác Hậu Đề');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thac hau de%' LIMIT 1;

-- Place: Thác Hậu Đề
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%20H%E1%BA%ADu%20%C4%90%E1%BB%81/j2tp3lvjsqthtwdm5xax.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969259/dulichso/Th%C3%A1c%20H%E1%BA%ADu%20%C4%90%E1%BB%81/j2tp3lvjsqthtwdm5xax.jpg', 'image/jpeg', 'Thác Hậu Đề');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thac hau de%' LIMIT 1;

-- Place: Thác Hậu Đề
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/Th%C3%A1c%20H%E1%BA%ADu%20%C4%90%E1%BB%81/vh7hoqdvpjmzjfdyigfs.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/Th%C3%A1c%20H%E1%BA%ADu%20%C4%90%E1%BB%81/vh7hoqdvpjmzjfdyigfs.jpg', 'image/jpeg', 'Thác Hậu Đề');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%thac hau de%' LIMIT 1;

-- Place: Võng lúa Hãng Đăng Dê
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/V%C3%B5ng%20l%C3%BAa%20H%C3%A3ng%20%C4%90%C4%83ng%20D%C3%AA/stjtlffmflgwftqadtpt.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/V%C3%B5ng%20l%C3%BAa%20H%C3%A3ng%20%C4%90%C4%83ng%20D%C3%AA/stjtlffmflgwftqadtpt.jpg', 'image/jpeg', 'Võng lúa Hãng Đăng Dê');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'COVER', 1 FROM place 
WHERE name_norm LIKE '%vong lua hang dang de%' LIMIT 1;

-- Place: Võng lúa Hãng Đăng Dê
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/V%C3%B5ng%20l%C3%BAa%20H%C3%A3ng%20%C4%90%C4%83ng%20D%C3%AA/dqqtejyau1odwp1hkozl.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/V%C3%B5ng%20l%C3%BAa%20H%C3%A3ng%20%C4%90%C4%83ng%20D%C3%AA/dqqtejyau1odwp1hkozl.jpg', 'image/jpeg', 'Võng lúa Hãng Đăng Dê');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%vong lua hang dang de%' LIMIT 1;

-- Place: Võng lúa Hãng Đăng Dê
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/V%C3%B5ng%20l%C3%BAa%20H%C3%A3ng%20%C4%90%C4%83ng%20D%C3%AA/obbgypxr4tqjelgu9hmg.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/V%C3%B5ng%20l%C3%BAa%20H%C3%A3ng%20%C4%90%C4%83ng%20D%C3%AA/obbgypxr4tqjelgu9hmg.jpg', 'image/jpeg', 'Võng lúa Hãng Đăng Dê');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%vong lua hang dang de%' LIMIT 1;

-- Place: Đèo Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/khau_pha_1.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/khau_pha_1.jpg', 'image/jpeg', 'Đèo Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%deo khau pha%' LIMIT 1;

-- Place: Đèo Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/khau_pha_3.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/khau_pha_3.webp', 'image/webp', 'Đèo Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%deo khau pha%' LIMIT 1;

-- Place: Đèo Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/khau_pha_4.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/khau_pha_4.jpg', 'image/jpeg', 'Đèo Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%deo khau pha%' LIMIT 1;

-- Place: Đèo Khau Phạ
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/khau_pha.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%C3%A8o%20Khau%20Ph%E1%BA%A1/khau_pha.jpg', 'image/jpeg', 'Đèo Khau Phạ');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%deo khau pha%' LIMIT 1;

-- Place: Đồi Móng Ngựa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20Ng%E1%BB%B1a/nqre9nor5t6ssfbpfl0w.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20Ng%E1%BB%B1a/nqre9nor5t6ssfbpfl0w.jpg', 'image/jpeg', 'Đồi Móng Ngựa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mong ngua%' LIMIT 1;

-- Place: Đồi Móng Ngựa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20Ng%E1%BB%B1a/ewqyklyfqqirfqyzqsqx.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20Ng%E1%BB%B1a/ewqyklyfqqirfqyzqsqx.jpg', 'image/jpeg', 'Đồi Móng Ngựa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mong ngua%' LIMIT 1;

-- Place: Đồi Móng Ngựa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20Ng%E1%BB%B1a/p376nm5rz5ozibgynp0z.jpg', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20Ng%E1%BB%B1a/p376nm5rz5ozibgynp0z.jpg', 'image/jpeg', 'Đồi Móng Ngựa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mong ngua%' LIMIT 1;

-- Place: Đồi Móng Ngựa
INSERT INTO media_asset (storage_key, public_url, mime_type, alt_text) VALUES ('https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20Ng%E1%BB%B1a/ehm5xt7mmcy8r6fpvchb.webp', 'https://res.cloudinary.com/kttdfqzj/image/upload/v1789969260/dulichso/%C4%90%E1%BB%93i%20M%C3%B3ng%20Ng%E1%BB%B1a/ehm5xt7mmcy8r6fpvchb.webp', 'image/webp', 'Đồi Móng Ngựa');
SET @media_id = LAST_INSERT_ID();
INSERT INTO place_media (place_id, media_id, role, sort_order) 
SELECT id, @media_id, 'GALLERY', 1 FROM place 
WHERE name_norm LIKE '%doi mong ngua%' LIMIT 1;

