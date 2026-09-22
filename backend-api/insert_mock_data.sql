USE dulichso;

-- Thêm Phòng Tiêu Chuẩn Giường Đôi cho tất cả các Homestay chưa có phòng
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status, created_at, updated_at)
SELECT id, 'Phòng Tiêu Chuẩn Giường Đôi', 'Phòng thoải mái với giường đôi cỡ lớn, được trang bị đầy đủ tiện nghi thiết yếu.', 2, 5, 'YES', 25.00, 500000, 'ACTIVE', NOW(), NOW()
FROM place
WHERE kind = 'HOMESTAY' AND id NOT IN (
    SELECT place_id FROM room_type WHERE name = 'Phòng Tiêu Chuẩn Giường Đôi'
);

-- Thêm Phòng Gia Đình Có Ban Công cho tất cả các Homestay
INSERT INTO room_type (place_id, name, description, max_occupancy, total_room_count, private_bathroom, area_sqm, base_price, status, created_at, updated_at)
SELECT id, 'Phòng Gia Đình Có Ban Công', 'Rộng rãi cho gia đình, không gian thoáng mát, view đẹp toàn cảnh thiên nhiên.', 4, 2, 'YES', 40.00, 1200000, 'ACTIVE', NOW(), NOW()
FROM place
WHERE kind = 'HOMESTAY' AND id NOT IN (
    SELECT place_id FROM room_type WHERE name = 'Phòng Gia Đình Có Ban Công'
);

-- Note: Ảnh phòng nếu để trống thì Frontend sẽ tự động lấy ảnh Cover của Homestay để làm ảnh phòng.
-- Tiện nghi (amenities) của Place nếu trống thì Backend đã tự động đắp mock data (Wi-Fi miễn phí, Bãi đỗ xe...)
