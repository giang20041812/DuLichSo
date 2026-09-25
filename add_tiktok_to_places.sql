-- Script thêm link TikTok cho các địa điểm (places) trong bảng place_contact
-- Link TikTok: https://www.tiktok.com/@siunhonbonbon/video/7677072691366497543?is_from_webapp=1&sender_device=pc

USE dulichso;

-- 1. Nếu địa điểm đã có contact TIKTOK, cập nhật sang link mới
UPDATE place_contact
SET `value` = 'https://www.tiktok.com/@siunhonbonbon/video/7677072691366497543?is_from_webapp=1&sender_device=pc',
    `is_public` = 1
WHERE `channel` = 'TIKTOK';

-- 2. Thêm mới bản ghi TIKTOK cho tất cả các place chưa có channel TIKTOK
INSERT INTO place_contact (place_id, channel, `value`, is_public, sort_order)
SELECT p.id, 'TIKTOK', 'https://www.tiktok.com/@siunhonbonbon/video/7677072691366497543?is_from_webapp=1&sender_device=pc', 1, 10
FROM place p
WHERE NOT EXISTS (
    SELECT 1 FROM place_contact pc 
    WHERE pc.place_id = p.id AND pc.channel = 'TIKTOK'
);

-- Kiểm tra kết quả
SELECT COUNT(*) AS total_places FROM place;
SELECT COUNT(*) AS total_tiktok_contacts FROM place_contact WHERE channel = 'TIKTOK';
