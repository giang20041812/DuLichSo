-- ============================================================================
--  NỀN TẢNG DU LỊCH MÙ CANG CHẢI — DATABASE v0.1 (Phase 1) — BẢN MYSQL
--  Chuyển đổi từ bản gốc PostgreSQL 15+ (UCS.docx, BR-01..BR-117, Actor sheet,
--  DATA_CHÍNH_THỐNG.xlsx) sang MySQL 8.0.16+.
--  Ngày chuyển đổi : 2026-09-21
--
--  MySQL KHÔNG CÓ các tính năng sau của PostgreSQL nên đã phải thay thế:
--   1. EXTENSION (btree_gist, pg_trgm, unaccent, citext) → không tồn tại.
--      - citext   → VARCHAR + COLLATE utf8mb4_0900_ai_ci (không phân biệt hoa/
--        thường VÀ không phân biệt dấu — đặt làm collation mặc định cho DB/bảng).
--      - unaccent → không có hàm tương đương sẵn. vn_norm() bên dưới chỉ hạ chữ
--        thường; việc bỏ dấu tiếng Việt nên xử lý ở tầng ứng dụng trước khi ghi,
--        hoặc dựa vào collation ai_ci ở trên khi so sánh/tìm kiếm.
--      - pg_trgm  → không có index trigram. Dùng INDEX B-Tree thường trên
--        name_norm, hoặc FULLTEXT ... WITH PARSER ngram nếu cần tìm mờ.
--      - btree_gist (EXCLUDE constraint) → MySQL không có kiểu range & EXCLUDE.
--        daterange được tách thành 2 cột period_start/period_end (DATE); việc
--        chống chồng lấn được ép bằng TRIGGER thay vì EXCLUDE constraint.
--   2. CREATE TYPE ... AS ENUM → MySQL không có kiểu ENUM dùng lại (named type).
--      Mọi ENUM được khai báo trực tiếp (inline) tại từng cột sử dụng.
--   3. BIGSERIAL → BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
--   4. JSONB → JSON (MySQL không phân biệt JSON/JSONB, không GIN index được;
--      nếu sau này cần lọc nhanh theo 1 key JSON cụ thể, thêm generated column
--      + INDEX riêng cho key đó).
--   5. TIMESTAMPTZ → DATETIME (TIMESTAMP của MySQL giới hạn tới năm 2038 và tự
--      quy đổi theo time_zone của session — DATETIME ổn định hơn cho nghiệp vụ).
--   6. UNIQUE/INDEX có mệnh đề WHERE (partial index) → MySQL không hỗ trợ.
--      - Với UNIQUE có điều kiện (1 ảnh COVER/place, 1 giao dịch SUCCESS/booking,
--        chỉ 1 danh mục HOMESTAY, không trùng booking còn hiệu lực...): thêm 1
--        cột generated (ảo) trả về NULL khi không thoả điều kiện, rồi tạo UNIQUE
--        INDEX trên cột đó — MySQL cho phép nhiều NULL trong unique index nên
--        chỉ các dòng thoả điều kiện mới bị ép duy nhất.
--      - Với INDEX thường (không phải unique) có WHERE chỉ để tối ưu: bỏ mệnh đề
--        WHERE, giữ lại index đầy đủ (có thể thêm cột status vào index để bù).
--   7. Composite FOREIGN KEY (category_id, kind) → category(id, kind): MySQL/
--      InnoDB hỗ trợ bình thường, giữ nguyên logic.
--   8. CHECK constraint cần subquery liên bảng (refund.amount so với
--      payment_transaction.amount gốc) → vẫn dùng TRIGGER như hướng đi bản gốc
--      đã chọn, chỉ đổi cú pháp PL/pgSQL → MySQL (SIGNAL SQLSTATE).
--   9. Mọi bảng: ENGINE=InnoDB, CHARACTER SET utf8mb4, COLLATE
--      utf8mb4_0900_ai_ci.
--
--  YÊU CẦU: MySQL 8.0.16 trở lên (CHECK constraint thực sự được ép, generated
--  column, descending index, JSON default biểu thức đều cần MySQL 8.0.13–8.0.16+).
-- ============================================================================

SET NAMES utf8mb4;

-- ============================================================================
-- 0. GHI CHÚ VỀ ENUM & HÀM CHUẨN HOÁ TÊN
--    (Không còn CREATE TYPE — xem danh sách ENUM inline trong từng bảng bên dưới)
-- =account===========================================================================

DROP FUNCTION IF EXISTS vn_norm;
DELIMITER $$
CREATE FUNCTION vn_norm(txt TEXT)
RETURNS VARCHAR(255)
DETERMINISTIC
BEGIN
    -- MySQL không có unaccent(). Hàm này chỉ hạ chữ thường + trim.
    -- Khuyến nghị: bỏ dấu tiếng Việt ở tầng ứng dụng trước khi ghi vào name_norm,
    -- hoặc dựa vào collation utf8mb4_0900_ai_ci khi so sánh/tìm kiếm gần đúng.
    RETURN LOWER(TRIM(txt));
END$$
DELIMITER ;

-- ============================================================================
-- 1. MASTER DATA
-- ============================================================================

-- 1.1 Khu vực (OQ-16-01). Cây phân cấp, filter UC-01 dùng path prefix.
CREATE TABLE region (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(64)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    name_norm   VARCHAR(255) NOT NULL,
    level       SMALLINT     NOT NULL,             -- 1=tỉnh, 2=xã/phường, 3=bản/thôn
    parent_id   BIGINT UNSIGNED NULL,
    path        VARCHAR(255) NOT NULL,              -- '/lao-cai/mu-cang-chai/la-pan-tan'
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_region_parent FOREIGN KEY (parent_id) REFERENCES region(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_region_path ON region (path);   -- B-Tree hỗ trợ sẵn LIKE 'prefix%'

-- 1.2 Danh mục (UC-15). Phẳng 1 cấp, Admin quản lý.
CREATE TABLE category (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kind          ENUM('HOMESTAY','RESTAURANT','CUISINE','ATTRACTION','PHOTO','RENTAL','TRANSPORT','SERVICE','CULTURE') NOT NULL,
    slug          VARCHAR(191) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    icon_media_id BIGINT UNSIGNED NULL,             -- FK thêm ở mục 2
    sort_order    INT NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    -- Emulation cho: CREATE UNIQUE INDEX ... ON category (kind) WHERE kind='HOMESTAY'
    homestay_guard TINYINT GENERATED ALWAYS AS (CASE WHEN kind = 'HOMESTAY' THEN 1 END) VIRTUAL,
    UNIQUE KEY uq_category_id_kind (id, kind)        -- phục vụ composite FK từ place
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Phase 1 chỉ có duy nhất 1 danh mục Lưu trú/Homestay (UC-10)
CREATE UNIQUE INDEX uq_category_single_homestay ON category (homestay_guard);

-- 1.3 Tiện ích (dùng chung cho Homestay và Room Type)
CREATE TABLE amenity (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(64) NOT NULL UNIQUE,        -- HOT_WATER, HEATER, BACKUP_POWER, STABLE_WATER, WIFI...
    name        VARCHAR(255) NOT NULL,
    scope       ENUM('PLACE','ROOM') NOT NULL,
    is_essential BOOLEAN NOT NULL DEFAULT FALSE,     -- UC-02 §2.2 "tiện ích thiết yếu"
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 1.4 Tag tự do (BR-05: 1 danh mục chính + nhiều tag)
CREATE TABLE tag (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_code  VARCHAR(64) NOT NULL,                -- STYLE | AUDIENCE | VIEW | SEASON | CUISINE ...
    slug        VARCHAR(191) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 1.5 Từ điển field đặc thù theo danh mục (OQ-16-02 chưa chốt)
CREATE TABLE category_field_def (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id   BIGINT UNSIGNED NOT NULL,
    field_key     VARCHAR(128) NOT NULL,             -- 'route', 'vehicle_type', 'ticket_price'...
    label         VARCHAR(255) NOT NULL,
    data_type     VARCHAR(16) NOT NULL,
    enum_values   JSON,
    is_required_for_publish BOOLEAN NOT NULL DEFAULT FALSE,  -- BR-07/BR-09
    sort_order    INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_category_field (category_id, field_key),
    CONSTRAINT fk_cfd_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE,
    CONSTRAINT ck_cfd_data_type CHECK (data_type IN ('text','number','boolean','date','enum','money'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 2. MEDIA — 1 bảng file dùng chung + bảng nối có FK thật
-- ============================================================================

CREATE TABLE media_asset (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    storage_key     VARCHAR(500) NOT NULL UNIQUE,     -- đường dẫn trên S3/MinIO
    public_url      VARCHAR(1000),
    mime_type       VARCHAR(128) NOT NULL,
    width_px        INT,
    height_px       INT,
    size_bytes      BIGINT,
    checksum_sha256 CHAR(64) UNIQUE,                  -- chống upload trùng
    alt_text        VARCHAR(500),
    credit          VARCHAR(255),                     -- BR-98: nguồn ảnh
    source_url      VARCHAR(1000),
    license_note    TEXT,                             -- BR-98/99: điều kiện sử dụng
    uploaded_by     BIGINT UNSIGNED,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE category
    ADD CONSTRAINT fk_category_icon FOREIGN KEY (icon_media_id) REFERENCES media_asset(id);

-- ============================================================================
-- 3. TÀI KHOẢN & NHÀ CUNG CẤP (UC-08, UC-09)
-- ============================================================================

-- 3.1 Provider — hồ sơ nghiệp vụ
CREATE TABLE provider (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    contact_name    VARCHAR(255),
    contact_phone   VARCHAR(32),
    contact_email   VARCHAR(255),
    address         VARCHAR(500),
    note            TEXT,
    status          ENUM('ACTIVE','SUSPENDED','TERMINATED') NOT NULL DEFAULT 'ACTIVE',  -- UC-09: không có Pending Approval
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3.2 Account — credential. Tách hẳn status khỏi provider (UC-08).
CREATE TABLE account (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) UNIQUE,              -- thay CITEXT: collation ai_ci đã không phân biệt hoa/thường
    phone           VARCHAR(32) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('ADMIN','PROVIDER') NOT NULL,
    status          ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    provider_id     BIGINT UNSIGNED NULL,
    full_name       VARCHAR(255),
    last_login_at   DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_provider FOREIGN KEY (provider_id) REFERENCES provider(id),
    CONSTRAINT ck_account_identifier CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CONSTRAINT ck_account_provider   CHECK (
        (role = 'PROVIDER' AND provider_id IS NOT NULL) OR
        (role = 'ADMIN'    AND provider_id IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- BR-84 / UC-09: Phase 1 — 1 Provider ↔ 1 Account.
-- MySQL cho phép nhiều NULL trong unique index nên không cần điều kiện WHERE:
-- Sang Phase 2 (BR-116 mở) chỉ cần DROP INDEX này.
CREATE UNIQUE INDEX uq_account_one_per_provider ON account (provider_id);

-- ============================================================================
-- 4. PLACE — supertype cho MỌI địa điểm/dịch vụ
-- ============================================================================
CREATE TABLE place (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug                VARCHAR(191) NOT NULL UNIQUE,  -- UC-02 truy cập bằng id hoặc slug
    category_id         BIGINT UNSIGNED NOT NULL,
    kind                ENUM('HOMESTAY','RESTAURANT','CUISINE','ATTRACTION','PHOTO','RENTAL','TRANSPORT','SERVICE','CULTURE') NOT NULL,
    provider_id         BIGINT UNSIGNED NULL,          -- BR-06: 1 Provider có thể sở hữu/vận hành NHIỀU Place (Quan hệ 1 - N)

    name                VARCHAR(255) NOT NULL,
    name_norm           VARCHAR(255) NOT NULL,         -- BR-19, set bằng vn_norm(name)
    description         TEXT,
    region_id           BIGINT UNSIGNED NULL,
    address             VARCHAR(500),
    latitude            DECIMAL(9,6),
    longitude           DECIMAL(9,6),
    access_note         TEXT,                          -- "đường vào" (UC-10)

    price_ref_min       DECIMAL(12,0),                 -- giá tham khảo, NULL = không tham gia filter giá (BR-22)
    price_ref_max       DECIMAL(12,0),
    price_unit_note     VARCHAR(64),                   -- '/người/đêm', '/vé', '/suất'

    visibility          ENUM('DRAFT','PUBLISHED','UNPUBLISHED') NOT NULL DEFAULT 'DRAFT',
    operation_status    ENUM('OPERATING','TEMP_CLOSED') NOT NULL DEFAULT 'OPERATING',
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE, -- UC-16: soft delete ≠ visibility
    is_suitable_by_time BOOLEAN NOT NULL DEFAULT FALSE, -- Phù hợp theo thời gian / mùa vụ hiện tại
    suitable_date_start DATE NULL,                      -- Ngày bắt đầu mùa vụ / thời điểm đẹp nhất
    suitable_date_end   DATE NULL,                      -- Ngày kết thúc mùa vụ / thời điểm đẹp nhất

    -- NGUỒN DỮ LIỆU — chỉ 1 trường phân biệt chính thống/reviewer, không tách bảng (BR-90/92/93)
    source_type         ENUM('OFFICIAL','PROVIDER','PUBLIC_TRUSTED','SOCIAL_COMMUNITY') NOT NULL DEFAULT 'PUBLIC_TRUSTED',
    source_name         VARCHAR(255),                  -- 'Booking.com', 'Reviewer - Nguyễn Văn A', 'Khảo sát thực địa 16/08/2026'
    source_url          VARCHAR(1000),
    verification        ENUM('VERIFIED','UNVERIFIED','NEEDS_UPDATE','ARCHIVED') NOT NULL DEFAULT 'UNVERIFIED', -- BR-91/94
    last_verified_at    DATE,                                                   -- BR-90
    master_place_id     BIGINT UNSIGNED NULL,                                   -- BR-96: merge trùng bản ghi

    rating_avg          DECIMAL(3,2),                  -- BR-83, denormalized
    rating_count        INT NOT NULL DEFAULT 0,

    attributes          JSON NOT NULL DEFAULT (JSON_OBJECT()),  -- field đặc thù theo category_field_def

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          BIGINT UNSIGNED NULL,
    updated_by          BIGINT UNSIGNED NULL,

    -- kind của place luôn khớp kind của category → composite FK, không cần trigger
    CONSTRAINT fk_place_category FOREIGN KEY (category_id, kind)
        REFERENCES category(id, kind),
    CONSTRAINT fk_place_provider   FOREIGN KEY (provider_id) REFERENCES provider(id),
    CONSTRAINT fk_place_region     FOREIGN KEY (region_id) REFERENCES region(id),
    CONSTRAINT fk_place_master     FOREIGN KEY (master_place_id) REFERENCES place(id),
    CONSTRAINT fk_place_created_by FOREIGN KEY (created_by) REFERENCES account(id),
    CONSTRAINT fk_place_updated_by FOREIGN KEY (updated_by) REFERENCES account(id),

    -- BR-06: Homestay bắt buộc thuộc 1 Provider
    CONSTRAINT ck_place_homestay_provider CHECK (kind <> 'HOMESTAY' OR provider_id IS NOT NULL),
    CONSTRAINT ck_place_price_range CHECK (price_ref_min IS NULL OR price_ref_max IS NULL OR price_ref_min <= price_ref_max),
    CONSTRAINT ck_place_geo CHECK ((latitude IS NULL) = (longitude IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Index phục vụ UC-01. MySQL không có partial index nên giữ index đầy đủ,
-- lọc visibility/is_deleted vẫn thực hiện ở WHERE của câu SELECT (view v_place_public bên dưới).
CREATE INDEX idx_place_public ON place (visibility, is_deleted, category_id, region_id, price_ref_min);
CREATE INDEX idx_place_name_trgm ON place (name_norm);      -- thay cho GIN trgm; có thể bổ sung FULLTEXT ngram nếu cần tìm mờ
CREATE INDEX idx_place_provider ON place (provider_id);
-- attributes JSON: không GIN-index được; nếu cần lọc nhanh theo 1 key cụ thể,
-- thêm generated column, ví dụ:
-- ALTER TABLE place ADD COLUMN attr_route VARCHAR(255)
--   GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(attributes,'$.route'))) VIRTUAL,
--   ADD INDEX idx_place_attr_route (attr_route);

-- 4.1 Kênh liên hệ public (OQ-16-03: chưa chốt danh sách kênh)
CREATE TABLE place_contact (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    place_id    BIGINT UNSIGNED NOT NULL,
    channel     ENUM('PHONE','ZALO','EMAIL','WEBSITE','FACEBOOK','TIKTOK','YOUTUBE','GOOGLE_MAPS','OTHER') NOT NULL,
    value       VARCHAR(500) NOT NULL,
    is_public   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_place_contact_place FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_place_contact ON place_contact (place_id);

-- 4.2 Giờ hoạt động (UC-16: Ăn uống, Điểm đến)
CREATE TABLE place_opening_hour (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    place_id    BIGINT UNSIGNED NOT NULL,
    day_of_week TINYINT NOT NULL,
    open_time   TIME,
    close_time  TIME,
    is_closed   BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_poh_place FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE,
    CONSTRAINT ck_poh_day CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT ck_opening_hour CHECK (is_closed OR (open_time IS NOT NULL AND close_time IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4.3 Tiện ích cấp Place — 3 trạng thái, KHÔNG dùng quan hệ n-n thuần
CREATE TABLE place_amenity (
    place_id    BIGINT UNSIGNED NOT NULL,
    amenity_id  BIGINT UNSIGNED NOT NULL,
    value       ENUM('YES','NO','UNVERIFIED') NOT NULL DEFAULT 'UNVERIFIED',
    note        TEXT,
    PRIMARY KEY (place_id, amenity_id),
    CONSTRAINT fk_pa_place   FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE,
    CONSTRAINT fk_pa_amenity FOREIGN KEY (amenity_id) REFERENCES amenity(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4.4 Tag
CREATE TABLE place_tag (
    place_id BIGINT UNSIGNED NOT NULL,
    tag_id   BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (place_id, tag_id),
    CONSTRAINT fk_pt_place FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_tag   FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_place_tag_reverse ON place_tag (tag_id);

-- 4.5 Ưu điểm / Hạn chế / Pain point
CREATE TABLE place_highlight (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    place_id    BIGINT UNSIGNED NOT NULL,
    type        ENUM('PRO','CON','TIP','PAIN_POINT') NOT NULL,
    content     TEXT NOT NULL,
    is_public   BOOLEAN NOT NULL DEFAULT TRUE,       -- PAIN_POINT thường internal
    sort_order  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_ph_place FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_place_highlight ON place_highlight (place_id, type);

-- 4.6 Ảnh của Place
CREATE TABLE place_media (
    place_id    BIGINT UNSIGNED NOT NULL,
    media_id    BIGINT UNSIGNED NOT NULL,
    role        ENUM('COVER','GALLERY') NOT NULL DEFAULT 'GALLERY',
    caption     VARCHAR(500),
    sort_order  INT NOT NULL DEFAULT 0,
    -- Emulation cho UNIQUE INDEX ... WHERE role='COVER' (BR-07: tối đa 1 ảnh đại diện)
    cover_guard BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN role = 'COVER' THEN place_id END) VIRTUAL,
    PRIMARY KEY (place_id, media_id),
    CONSTRAINT fk_pm_place FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_media FOREIGN KEY (media_id) REFERENCES media_asset(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE UNIQUE INDEX uq_place_cover ON place_media (cover_guard);
CREATE INDEX idx_place_media_order ON place_media (place_id, sort_order);

-- ============================================================================
-- 5. NGUỒN DỮ LIỆU
-- ============================================================================
-- Không có bảng riêng. "Chính thống" vs "reviewer" (và mọi phân biệt nguồn khác)
-- chỉ là giá trị của place.source_type + place.source_name + place.source_url.
-- Nếu phát hiện trùng giữa 2 nguồn, dùng place.master_place_id (BR-96) để merge.

-- ============================================================================
-- 6. HOMESTAY (UC-10) — subtype 1-1 của place
-- ============================================================================
CREATE TABLE homestay_profile (
    place_id            BIGINT UNSIGNED PRIMARY KEY,
    check_in_from       TIME,
    check_out_until     TIME,
    house_rules         TEXT,
    surcharge_note      TEXT,
    current_policy_id   BIGINT UNSIGNED NULL,        -- FK ở 6.1
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hp_place FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6.1 Chính sách hủy — bản ghi BẤT BIẾN, sửa = tạo version mới (BR-62/63)
CREATE TABLE cancellation_policy (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    place_id                BIGINT UNSIGNED NOT NULL,
    version                 INT NOT NULL,
    name                    VARCHAR(255) NOT NULL,
    free_cancel_cutoff_hours INT NOT NULL,           -- BR-60/61
    refund_on_late_cancel   ENUM('FULL_REFUND','NO_REFUND') NOT NULL DEFAULT 'NO_REFUND',
    content_text            TEXT NOT NULL,
    effective_from          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              BIGINT UNSIGNED NULL,
    UNIQUE KEY uq_policy_place_version (place_id, version),
    CONSTRAINT fk_cp_place      FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE,
    CONSTRAINT fk_cp_created_by FOREIGN KEY (created_by) REFERENCES account(id),
    CONSTRAINT ck_cp_cutoff CHECK (free_cancel_cutoff_hours >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE homestay_profile
    ADD CONSTRAINT fk_homestay_policy FOREIGN KEY (current_policy_id) REFERENCES cancellation_policy(id);

-- 6.2 Loại phòng (UC-11)
CREATE TABLE room_type (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    place_id            BIGINT UNSIGNED NOT NULL,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    max_occupancy       INT NOT NULL,                -- sức chứa 1 phòng
    total_room_count    INT NOT NULL,                -- BL-03
    private_bathroom    ENUM('YES','NO','UNVERIFIED') NOT NULL DEFAULT 'UNVERIFIED',
    area_sqm            DECIMAL(6,2),
    base_price          DECIMAL(12,0),               -- UC-12 BL-01
    status              ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_room_type_place_name (place_id, name),   -- UC-11 §3.1
    CONSTRAINT fk_rt_place FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE RESTRICT,
    CONSTRAINT ck_rt_occupancy CHECK (max_occupancy > 0),
    CONSTRAINT ck_rt_count CHECK (total_room_count > 0),
    CONSTRAINT ck_rt_price CHECK (base_price IS NULL OR base_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_room_type_place ON room_type (place_id, status);

CREATE TABLE room_bed (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_type_id BIGINT UNSIGNED NOT NULL,
    bed_type     VARCHAR(32) NOT NULL,       -- DOUBLE, SINGLE, BUNK, FLOOR_MATTRESS (nhà sàn)
    quantity     INT NOT NULL,
    CONSTRAINT fk_rb_room_type FOREIGN KEY (room_type_id) REFERENCES room_type(id) ON DELETE CASCADE,
    CONSTRAINT ck_rb_qty CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE room_amenity (
    room_type_id BIGINT UNSIGNED NOT NULL,
    amenity_id   BIGINT UNSIGNED NOT NULL,
    value        ENUM('YES','NO','UNVERIFIED') NOT NULL DEFAULT 'UNVERIFIED',
    PRIMARY KEY (room_type_id, amenity_id),
    CONSTRAINT fk_ra_room_type FOREIGN KEY (room_type_id) REFERENCES room_type(id) ON DELETE CASCADE,
    CONSTRAINT fk_ra_amenity   FOREIGN KEY (amenity_id) REFERENCES amenity(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE room_type_media (
    room_type_id BIGINT UNSIGNED NOT NULL,
    media_id     BIGINT UNSIGNED NOT NULL,
    role         ENUM('COVER','GALLERY') NOT NULL DEFAULT 'GALLERY',
    caption      VARCHAR(500),
    sort_order   INT NOT NULL DEFAULT 0,
    cover_guard  BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN role = 'COVER' THEN room_type_id END) VIRTUAL,
    PRIMARY KEY (room_type_id, media_id),
    CONSTRAINT fk_rtm_room_type FOREIGN KEY (room_type_id) REFERENCES room_type(id) ON DELETE CASCADE,
    CONSTRAINT fk_rtm_media     FOREIGN KEY (media_id) REFERENCES media_asset(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE UNIQUE INDEX uq_room_cover ON room_type_media (cover_guard);

-- 6.3 Giá đặc biệt (UC-12) — MySQL không có kiểu daterange & EXCLUDE constraint,
-- nên tách period thành 2 cột + ép chống-chồng-lấn bằng TRIGGER (xem cuối file).
CREATE TABLE room_special_price (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_type_id BIGINT UNSIGNED NOT NULL,
    name         VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,               -- tương đương daterange '[...]' — inclusive cả 2 đầu
    period_end   DATE NOT NULL,
    price        DECIMAL(12,0) NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by   BIGINT UNSIGNED NULL,
    CONSTRAINT fk_rsp_room_type  FOREIGN KEY (room_type_id) REFERENCES room_type(id) ON DELETE CASCADE,
    CONSTRAINT fk_rsp_created_by FOREIGN KEY (created_by) REFERENCES account(id),
    CONSTRAINT ck_rsp_price CHECK (price >= 0),
    CONSTRAINT ck_rsp_period CHECK (period_start <= period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_rsp_room_period ON room_special_price (room_type_id, period_start, period_end);

-- 6.4 Tồn kho theo ngày (UC-13)
CREATE TABLE room_inventory_day (
    room_type_id    BIGINT UNSIGNED NOT NULL,
    stay_date       DATE NOT NULL,
    total_rooms     INT NOT NULL,
    held_rooms      INT NOT NULL DEFAULT 0,
    confirmed_rooms INT NOT NULL DEFAULT 0,
    stop_sell       BOOLEAN NOT NULL DEFAULT FALSE,
    available_rooms INT GENERATED ALWAYS AS (total_rooms - held_rooms - confirmed_rooms) STORED,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (room_type_id, stay_date),
    CONSTRAINT fk_rid_room_type FOREIGN KEY (room_type_id) REFERENCES room_type(id) ON DELETE CASCADE,
    CONSTRAINT ck_rid_total CHECK (total_rooms >= 0),
    CONSTRAINT ck_rid_held CHECK (held_rooms >= 0),
    CONSTRAINT ck_rid_confirmed CHECK (confirmed_rooms >= 0),
    -- BR-29/30 + UC-13 BL-01: không overbooking
    CONSTRAINT ck_inventory_non_negative CHECK (held_rooms + confirmed_rooms <= total_rooms)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_inventory_date ON room_inventory_day (stay_date);

-- ============================================================================
-- 7. BOOKING (UC-05/06/07/14/17)
-- ============================================================================
CREATE TABLE booking (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_code        VARCHAR(32) NOT NULL UNIQUE,
    place_id            BIGINT UNSIGNED NOT NULL,
    room_type_id        BIGINT UNSIGNED NOT NULL,
    provider_id         BIGINT UNSIGNED NOT NULL,     -- denormalize: BR-87/41 scope check 1 join

    check_in            DATE NOT NULL,
    check_out           DATE NOT NULL,
    nights              INT GENERATED ALWAYS AS (DATEDIFF(check_out, check_in)) STORED,
    room_count          INT NOT NULL,
    guest_count         INT NOT NULL,

    -- UC-05: khách KHÔNG cần tài khoản
    guest_name          VARCHAR(255) NOT NULL,
    guest_phone         VARCHAR(32) NOT NULL,
    guest_email         VARCHAR(255),
    guest_note          TEXT,

    status              ENUM('PENDING','AWAITING_PAYMENT','CONFIRMED','REJECTED','CANCELLED','EXPIRED','COMPLETED','NO_SHOW') NOT NULL DEFAULT 'PENDING',
    hold_expires_at     DATETIME,                     -- deadline NCC Accept/Reject: created_at + 12h (BR-42/43)
    payment_deadline_at DATETIME,                     -- deadline khách thanh toán: NCC accept + 15 phút (BR-50)

    -- Snapshot giá (BR-26/27)
    currency            CHAR(3) NOT NULL DEFAULT 'VND',
    total_amount        DECIMAL(14,0) NOT NULL,

    -- Snapshot chính sách hủy (BR-62/63, UC-05)
    policy_id           BIGINT UNSIGNED NULL,
    policy_snapshot      JSON NOT NULL,

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at        DATETIME,
    closed_at           DATETIME,
    close_reason        VARCHAR(500),
    closed_by_actor     ENUM('CUSTOMER','PROVIDER','ADMIN','SYSTEM'),

    -- Emulation cho UNIQUE ... WHERE status IN ('PENDING','AWAITING_PAYMENT','CONFIRMED') (BR-37)
    dup_guard           TINYINT GENERATED ALWAYS AS
        (CASE WHEN status IN ('PENDING','AWAITING_PAYMENT','CONFIRMED') THEN 1 END) VIRTUAL,

    CONSTRAINT fk_booking_place     FOREIGN KEY (place_id) REFERENCES place(id),
    CONSTRAINT fk_booking_room_type FOREIGN KEY (room_type_id) REFERENCES room_type(id),
    CONSTRAINT fk_booking_provider  FOREIGN KEY (provider_id) REFERENCES provider(id),
    CONSTRAINT fk_booking_policy    FOREIGN KEY (policy_id) REFERENCES cancellation_policy(id),

    CONSTRAINT ck_booking_room_count  CHECK (room_count > 0),
    CONSTRAINT ck_booking_guest_count CHECK (guest_count > 0),
    CONSTRAINT ck_booking_amount      CHECK (total_amount >= 0),
    CONSTRAINT ck_booking_dates CHECK (check_out > check_in),
    CONSTRAINT ck_booking_close CHECK (
        status NOT IN ('REJECTED','CANCELLED') OR close_reason IS NOT NULL)   -- BR-46, UC-14
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- UC-06: tra cứu bằng đúng cặp Booking Code + SĐT
CREATE INDEX idx_booking_lookup   ON booking (booking_code, guest_phone);
CREATE INDEX idx_booking_provider ON booking (provider_id, status, check_in);
CREATE INDEX idx_booking_expiry   ON booking (status, hold_expires_at);
CREATE INDEX idx_booking_pay_expiry ON booking (status, payment_deadline_at);
-- BR-37: chặn trùng booking còn hiệu lực cùng khách / cùng phòng / cùng kỳ
CREATE UNIQUE INDEX uq_booking_no_duplicate
    ON booking (room_type_id, guest_phone, check_in, check_out, dup_guard);

-- 7.1 Giá từng đêm — snapshot bất biến (BR-26, UC-05)
CREATE TABLE booking_night (
    booking_id  BIGINT UNSIGNED NOT NULL,
    stay_date   DATE NOT NULL,
    unit_price  DECIMAL(12,0) NOT NULL,
    room_count  INT NOT NULL,
    PRIMARY KEY (booking_id, stay_date),
    CONSTRAINT fk_bn_booking FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE CASCADE,
    CONSTRAINT ck_bn_price CHECK (unit_price >= 0),
    CONSTRAINT ck_bn_count CHECK (room_count > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7.1.1 Dịch vụ đi kèm booking (không tính giá)
CREATE TABLE booking_service_item (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id      BIGINT UNSIGNED NOT NULL,
    service_name    VARCHAR(255) NOT NULL,
    service_code    VARCHAR(64),
    note            VARCHAR(500),
    is_included     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bsi_booking FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_bsi_booking ON booking_service_item (booking_id);

-- 7.2 Lịch sử trạng thái (BR-104/105)
CREATE TABLE booking_status_history (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id   BIGINT UNSIGNED NOT NULL,
    from_status  ENUM('PENDING','AWAITING_PAYMENT','CONFIRMED','REJECTED','CANCELLED','EXPIRED','COMPLETED','NO_SHOW'),
    to_status    ENUM('PENDING','AWAITING_PAYMENT','CONFIRMED','REJECTED','CANCELLED','EXPIRED','COMPLETED','NO_SHOW') NOT NULL,
    actor        ENUM('CUSTOMER','PROVIDER','ADMIN','SYSTEM') NOT NULL,
    actor_id     BIGINT UNSIGNED,
    reason       VARCHAR(500),
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bsh_booking FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_booking_history ON booking_status_history (booking_id, created_at);

-- 7.3 Cổng thanh toán (BR-51..58)
CREATE TABLE payment_gateway (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(32) NOT NULL UNIQUE,     -- VNPAY, MOMO, ZALOPAY, BANK_TRANSFER
    name        VARCHAR(128) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- BR-52: một Booking chỉ có 1 nghĩa vụ thanh toán → tối đa 1 giao dịch SUCCESS
-- cho mỗi booking, ép bằng unique index trên generated column thay vì app tự kiểm tra.
CREATE TABLE payment_transaction (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id      BIGINT UNSIGNED NOT NULL,
    gateway_id      BIGINT UNSIGNED NOT NULL,
    external_txn_id VARCHAR(128),                -- mã giao dịch phía cổng thanh toán
    amount          DECIMAL(14,0) NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'VND',
    status          ENUM('INITIATED','SUCCESS','FAILED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'INITIATED',
    initiated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at         DATETIME,
    raw_callback    JSON,                        -- lưu nguyên callback từ cổng để đối soát (BR-54/56)
    success_guard   BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status = 'SUCCESS' THEN booking_id END) VIRTUAL,
    UNIQUE KEY uq_gateway_txn (gateway_id, external_txn_id),
    CONSTRAINT fk_pt_booking FOREIGN KEY (booking_id) REFERENCES booking(id),
    CONSTRAINT fk_pt_gateway FOREIGN KEY (gateway_id) REFERENCES payment_gateway(id),
    CONSTRAINT ck_pt_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_payment_booking ON payment_transaction (booking_id);
CREATE UNIQUE INDEX uq_payment_success_per_booking ON payment_transaction (success_guard);

-- Hoàn tiền. BR-68: chỉ Full Refund hoặc No Refund, không có Partial Refund.
CREATE TABLE refund (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id              BIGINT UNSIGNED NOT NULL,
    payment_transaction_id  BIGINT UNSIGNED NOT NULL,   -- BR-69: phải có Payment Success gốc
    refund_type             ENUM('FULL_REFUND','NO_REFUND') NOT NULL DEFAULT 'FULL_REFUND',
    amount                  DECIMAL(14,0) NOT NULL,
    reason                  VARCHAR(500) NOT NULL,
    status                  ENUM('PENDING','PROCESSED','REJECTED') NOT NULL DEFAULT 'PENDING',
    requested_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at            DATETIME,
    processed_by            BIGINT UNSIGNED NULL,
    active_guard            BIGINT UNSIGNED GENERATED ALWAYS AS
        (CASE WHEN status <> 'REJECTED' THEN payment_transaction_id END) VIRTUAL,
    CONSTRAINT fk_refund_booking      FOREIGN KEY (booking_id) REFERENCES booking(id),
    CONSTRAINT fk_refund_payment      FOREIGN KEY (payment_transaction_id) REFERENCES payment_transaction(id),
    CONSTRAINT fk_refund_processed_by FOREIGN KEY (processed_by) REFERENCES account(id),
    CONSTRAINT ck_refund_amount CHECK (amount >= 0)
    -- BR-70: refund.amount không vượt quá payment_transaction.amount gốc → CHECK
    -- của MySQL không cho subquery liên bảng → ép bằng TRIGGER (xem cuối file).
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_refund_booking ON refund (booking_id);
-- Không được refund 2 lần cho cùng 1 giao dịch thanh toán (bỏ qua các refund đã REJECTED)
CREATE UNIQUE INDEX uq_refund_one_per_payment ON refund (active_guard);

-- ============================================================================
-- 8. REVIEW (BR-76..83) — Phase 1.5, chưa có UC
-- ============================================================================
CREATE TABLE review (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    place_id       BIGINT UNSIGNED NOT NULL,
    booking_id     BIGINT UNSIGNED NOT NULL UNIQUE,   -- BR-77/78
    rating         TINYINT NOT NULL,
    content        TEXT,
    status         ENUM('VISIBLE','HIDDEN') NOT NULL DEFAULT 'VISIBLE',  -- BR-82
    editable_until DATETIME NOT NULL,                 -- BR-80: +7 ngày
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_place   FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES booking(id),
    CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_review_place ON review (place_id, status);

-- ============================================================================
-- 9. AUDIT (BR-104/105)
-- ============================================================================
CREATE TABLE audit_log (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor        ENUM('CUSTOMER','PROVIDER','ADMIN','SYSTEM') NOT NULL,
    actor_id     BIGINT UNSIGNED,
    action       VARCHAR(128) NOT NULL,       -- BOOKING_CANCEL, PLACE_PUBLISH, PROVIDER_SUSPEND...
    entity_type  VARCHAR(64) NOT NULL,
    entity_id    BIGINT UNSIGNED NOT NULL,
    reason       VARCHAR(500),
    before_data  JSON,
    after_data   JSON,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id, created_at DESC);

-- ============================================================================
-- 10. THÔNG BÁO
--     Khách không có account (UC-05/06) → recipient là phone/email nhúng trực
--     tiếp; NCC/Admin có account → recipient là account_id.
-- ============================================================================
CREATE TABLE notification_template (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code          VARCHAR(64) NOT NULL UNIQUE,   -- BOOKING_CREATED, BOOKING_CONFIRMED, BOOKING_REJECTED,
                                                  -- HOLD_EXPIRING_SOON, PAYMENT_SUCCESS, PAYMENT_FAILED,
                                                  -- REFUND_PROCESSED, NEW_BOOKING_FOR_PROVIDER ...
    channel       ENUM('SMS','EMAIL','ZALO','IN_APP','PUSH') NOT NULL,
    subject       VARCHAR(255),                  -- dùng cho EMAIL
    body_template TEXT NOT NULL,                 -- có placeholder {{booking_code}}, {{homestay_name}}...
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE notification (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_code           VARCHAR(64) NOT NULL,
    channel                 ENUM('SMS','EMAIL','ZALO','IN_APP','PUSH') NOT NULL,

    recipient_type          ENUM('CUSTOMER','ACCOUNT') NOT NULL,
    recipient_account_id    BIGINT UNSIGNED NULL,     -- NCC / Admin
    recipient_phone         VARCHAR(32),              -- Khách (UC-05 không có account)
    recipient_email         VARCHAR(255),

    related_entity_type     VARCHAR(64),              -- 'booking' | 'payment_transaction' | 'refund' | 'place'
    related_entity_id       BIGINT UNSIGNED,
    payload                 JSON NOT NULL DEFAULT (JSON_OBJECT()),  -- dữ liệu render template

    status                  ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
    error_message           VARCHAR(500),
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at                 DATETIME,

    CONSTRAINT fk_notification_template FOREIGN KEY (template_code) REFERENCES notification_template(code),
    CONSTRAINT fk_notification_account  FOREIGN KEY (recipient_account_id) REFERENCES account(id),
    CONSTRAINT ck_notification_recipient CHECK (
        (recipient_type = 'ACCOUNT'  AND recipient_account_id IS NOT NULL) OR
        (recipient_type = 'CUSTOMER' AND (recipient_phone IS NOT NULL OR recipient_email IS NOT NULL))
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_notification_entity ON notification (related_entity_type, related_entity_id);
CREATE INDEX idx_notification_pending ON notification (status, created_at);
CREATE INDEX idx_notification_account ON notification (recipient_account_id);

-- ============================================================================
-- 10.1 LỄ HỘI & SỰ KIỆN VĂN HÓA (Festival & Occurrences)
-- ============================================================================
CREATE TABLE festival (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug                VARCHAR(191) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    name_norm           VARCHAR(255) NOT NULL,
    season_note         VARCHAR(500),
    core_value          TEXT,
    suitable_experience TEXT,
    etiquette_dont      TEXT,
    cover_image_url     VARCHAR(500),
    location            VARCHAR(255),
    region_id           BIGINT UNSIGNED NULL,
    visibility          ENUM('DRAFT','PUBLISHED','UNPUBLISHED') NOT NULL DEFAULT 'DRAFT',
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    is_suitable_by_time BOOLEAN NOT NULL DEFAULT FALSE,
    suitable_date_start DATE NULL,
    suitable_date_end   DATE NULL,
    CONSTRAINT fk_festival_region FOREIGN KEY (region_id) REFERENCES region(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE festival_occurrence (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    festival_id   BIGINT UNSIGNED NOT NULL,
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    is_estimated  BOOLEAN NOT NULL DEFAULT TRUE,
    note          VARCHAR(500),
    CONSTRAINT fk_fo_festival FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE,
    CONSTRAINT ck_fo_dates CHECK (period_end >= period_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE INDEX idx_fo_dates ON festival_occurrence (festival_id, period_start, period_end);

-- ============================================================================
-- 11. VIEW phục vụ UC-01/02 — điều kiện public gom về 1 chỗ
-- ============================================================================
CREATE OR REPLACE VIEW v_place_public AS
SELECT p.*
FROM place p
JOIN category c ON c.id = p.category_id
WHERE p.visibility = 'PUBLISHED'
  AND p.is_deleted = FALSE
  AND c.is_active  = TRUE
  AND p.master_place_id IS NULL;          -- BR-96: bản ghi đã merge không hiển thị

-- ============================================================================
-- 12. TRIGGER thay thế cho EXCLUDE constraint / CHECK liên bảng của PostgreSQL
-- ============================================================================

-- 12.1 UC-12 BL-05: hai đợt giá đặc biệt của cùng room type không được chồng lấn.
--      (thay cho: EXCLUDE USING gist (room_type_id WITH =, period WITH &&))
DROP TRIGGER IF EXISTS trg_rsp_overlap_ins;
DROP TRIGGER IF EXISTS trg_rsp_overlap_upd;
DELIMITER $$
CREATE TRIGGER trg_rsp_overlap_ins
BEFORE INSERT ON room_special_price
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM room_special_price
        WHERE room_type_id = NEW.room_type_id
          AND period_start <= NEW.period_end
          AND period_end   >= NEW.period_start
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Khoảng giá đặc biệt bị chồng lấn với một đợt giá khác của cùng loại phòng';
    END IF;
END$$

CREATE TRIGGER trg_rsp_overlap_upd
BEFORE UPDATE ON room_special_price
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM room_special_price
        WHERE room_type_id = NEW.room_type_id
          AND id <> OLD.id
          AND period_start <= NEW.period_end
          AND period_end   >= NEW.period_start
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Khoảng giá đặc biệt bị chồng lấn với một đợt giá khác của cùng loại phòng';
    END IF;
END$$
DELIMITER ;

-- 12.2 BR-70: refund.amount không được vượt quá payment_transaction.amount gốc.
DROP TRIGGER IF EXISTS trg_refund_cap_ins;
DROP TRIGGER IF EXISTS trg_refund_cap_upd;
DELIMITER $$
CREATE TRIGGER trg_refund_cap_ins
BEFORE INSERT ON refund
FOR EACH ROW
BEGIN
    DECLARE paid DECIMAL(14,0);
    SELECT amount INTO paid FROM payment_transaction WHERE id = NEW.payment_transaction_id;
    IF NEW.amount > paid THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Số tiền hoàn vượt quá số tiền thanh toán gốc';
    END IF;
END$$

CREATE TRIGGER trg_refund_cap_upd
BEFORE UPDATE ON refund
FOR EACH ROW
BEGIN
    DECLARE paid DECIMAL(14,0);
    SELECT amount INTO paid FROM payment_transaction WHERE id = NEW.payment_transaction_id;
    IF NEW.amount > paid THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Số tiền hoàn vượt quá số tiền thanh toán gốc';
    END IF;
END$$
DELIMITER ;

-- ============================================================================
-- 13. GỢI Ý DỮ LIỆU MẪU
-- ============================================================================
INSERT INTO category (kind, slug, name, sort_order) VALUES
  ('HOMESTAY',   'luu-tru',   'Lưu trú / Homestay',               1),
  ('RESTAURANT', 'nha-hang',  'Nhà hàng & Quán ăn',               2),
  ('CUISINE',    'am-thuc',   'Ẩm thực & Món ngon bản địa',       3),
  ('ATTRACTION', 'diem-den',  'Điểm đến & Thắng cảnh',            4),
  ('PHOTO',      'chup-anh',  'Điểm & Dịch vụ Chụp ảnh',          5),
  ('RENTAL',     'thue-do',   'Cho thuê trang phục & Phương tiện',6),
  ('TRANSPORT',  'di-chuyen', 'Di chuyển',                        7),
  ('SERVICE',    'dich-vu',   'Dịch vụ',                          8),
  ('CULTURE',    'van-hoa',   'Văn hóa',                          9);

INSERT INTO amenity (code, name, scope, is_essential) VALUES
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

INSERT INTO payment_gateway (code, name) VALUES
  ('VNPAY',   'VNPay'),
  ('MOMO',    'MoMo'),
  ('ZALOPAY', 'ZaloPay'),
  ('BANK_TRANSFER', 'Chuyển khoản ngân hàng');

INSERT INTO notification_template (code, channel, subject, body_template) VALUES
  ('BOOKING_CREATED',          'SMS',   NULL, 'Bạn đã gửi yêu cầu đặt phòng {{booking_code}}. Chủ homestay sẽ xác nhận trong 12 giờ.'),
  ('BOOKING_CONFIRMED',        'SMS',   NULL, 'Đơn {{booking_code}} đã được xác nhận. Vui lòng thanh toán trong 15 phút để giữ phòng.'),
  ('BOOKING_REJECTED',         'SMS',   NULL, 'Rất tiếc, đơn {{booking_code}} đã bị từ chối. Lý do: {{reason}}.'),
  ('PAYMENT_SUCCESS',          'SMS',   NULL, 'Thanh toán đơn {{booking_code}} thành công. Chúc bạn có chuyến đi vui vẻ!'),
  ('NEW_BOOKING_FOR_PROVIDER', 'IN_APP','Có yêu cầu đặt phòng mới', 'Đơn {{booking_code}} cho {{homestay_name}} đang chờ bạn xác nhận.');

-- ============================================================================
-- 14. PHỤ LỤC — Bảng đề xuất cho Phase 1.5 (có dữ liệu thực tế nhưng CHƯA có UC)
--     Chưa chạy ở Phase 1 nếu PO chưa chốt Scope.
-- ============================================================================

-- 14.1 Đặc sản / sản vật (sheet "Đặc sản") — KHÔNG phải một địa điểm → không nhét vào place.
CREATE TABLE specialty (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug             VARCHAR(191) NOT NULL UNIQUE,
    name             VARCHAR(255) NOT NULL,
    name_norm        VARCHAR(255) NOT NULL,
    group_code       VARCHAR(32) NOT NULL,      -- MON_AN | SAN_VAT | DO_UONG | THU_CONG
    short_desc       VARCHAR(500),
    highlight        TEXT,
    ingredients      TEXT,
    consume_type     VARCHAR(16),
    price_ref_min    DECIMAL(12,0),
    price_ref_max    DECIMAL(12,0),
    cultural_note    TEXT,
    visibility       ENUM('DRAFT','PUBLISHED','UNPUBLISHED') NOT NULL DEFAULT 'DRAFT',
    verification     ENUM('VERIFIED','UNVERIFIED','NEEDS_UPDATE','ARCHIVED') NOT NULL DEFAULT 'UNVERIFIED',
    last_verified_at DATE,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_specialty_consume CHECK (consume_type IN ('EAT_IN','TAKE_AWAY','BOTH'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Nơi có thể ăn/mua đặc sản → nối về place
CREATE TABLE place_specialty (
    place_id     BIGINT UNSIGNED NOT NULL,
    specialty_id BIGINT UNSIGNED NOT NULL,
    note         TEXT,
    PRIMARY KEY (place_id, specialty_id),
    CONSTRAINT fk_ps_place     FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_specialty FOREIGN KEY (specialty_id) REFERENCES specialty(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE specialty_media (
    specialty_id BIGINT UNSIGNED NOT NULL,
    media_id     BIGINT UNSIGNED NOT NULL,
    role         ENUM('COVER','GALLERY') NOT NULL DEFAULT 'GALLERY',
    sort_order   INT NOT NULL DEFAULT 0,
    PRIMARY KEY (specialty_id, media_id),
    CONSTRAINT fk_sm_specialty FOREIGN KEY (specialty_id) REFERENCES specialty(id) ON DELETE CASCADE,
    CONSTRAINT fk_sm_media     FOREIGN KEY (media_id) REFERENCES media_asset(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 14.2 Lễ hội / sự kiện văn hóa (sheet "Văn hóa") — SỰ KIỆN theo thời gian, không phải địa điểm cố định.
CREATE TABLE festival (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug                VARCHAR(191) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    name_norm           VARCHAR(255) NOT NULL,
    season_note         VARCHAR(500),           -- "Đầu năm mới; lịch cụ thể theo địa phương"
    core_value          TEXT,
    suitable_experience TEXT,
    etiquette_dont      TEXT,                   -- "Điều không nên làm"
    region_id           BIGINT UNSIGNED NULL,
    visibility          ENUM('DRAFT','PUBLISHED','UNPUBLISHED') NOT NULL DEFAULT 'DRAFT',
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_festival_region FOREIGN KEY (region_id) REFERENCES region(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- daterange → tách 2 cột (không cần chống chồng lấn nên không cần trigger riêng)
CREATE TABLE festival_occurrence (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    festival_id  BIGINT UNSIGNED NOT NULL,
    period_start DATE NOT NULL,
    period_end   DATE NOT NULL,
    is_estimated BOOLEAN NOT NULL DEFAULT TRUE,
    note         VARCHAR(500),
    CONSTRAINT fk_fo_festival FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE,
    CONSTRAINT ck_fo_period CHECK (period_start <= period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 14.3 Yêu cầu hỗ trợ (BR-100..103)
CREATE TABLE support_ticket (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(32) NOT NULL UNIQUE,
    requester_name VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(32) NOT NULL,
    requester_email VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    booking_id BIGINT UNSIGNED NULL,
    place_id BIGINT UNSIGNED NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'NEW',
    assigned_to BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    closed_at DATETIME,
    CONSTRAINT fk_st_booking FOREIGN KEY (booking_id)
        REFERENCES booking (id),
    CONSTRAINT fk_st_place FOREIGN KEY (place_id)
        REFERENCES place (id),
    CONSTRAINT fk_st_assigned FOREIGN KEY (assigned_to)
        REFERENCES account (id),
    CONSTRAINT ck_ticket_status CHECK (status IN ('NEW' , 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    CONSTRAINT ck_ticket_target CHECK (NOT (booking_id IS NOT NULL
        AND place_id IS NOT NULL))
)  ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE = UTF8MB4_0900_AI_CI;