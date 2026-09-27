#!/usr/bin/env bash
# NFR-BKP-01: phục hồi CSDL từ bản sao lưu do backup-mysql.sh tạo (RTO mục tiêu <= 4 giờ).
# CẢNH BÁO: ghi đè dữ liệu trong CSDL đích. Nên phục hồi vào CSDL kiểm thử (TARGET_DB) trước để xác nhận bản sao lưu dùng được.
#
#   Cách dùng:  CONFIRM_RESTORE=yes DB_USERNAME=... DB_PASSWORD=... ./restore-mysql.sh <file.sql.gz> [TARGET_DB]
#   DB_HOST (localhost), DB_PORT (3306); TARGET_DB mặc định là dulichso_restore_test (an toàn), muốn ghi đè CSDL thật phải chỉ định rõ.
set -euo pipefail

file="${1:?Cách dùng: $0 <file.sql.gz> [TARGET_DB]}"
target="${2:-dulichso_restore_test}"
: "${DB_USERNAME:?Thiếu DB_USERNAME}"
: "${DB_PASSWORD:?Thiếu DB_PASSWORD}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"

if [ "${CONFIRM_RESTORE:-}" != "yes" ]; then
  echo "Từ chối: đặt CONFIRM_RESTORE=yes để xác nhận phục hồi vào CSDL '$target'." >&2
  exit 1
fi
[ -f "$file" ] || { echo "Không thấy file: $file" >&2; exit 1; }

# Kiểm tra toàn vẹn trước khi động vào CSDL.
if [ -f "$file.sha256" ]; then
  sha256sum -c "$file.sha256"
fi
gzip -t "$file"

export MYSQL_PWD="$DB_PASSWORD"
mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USERNAME" \
  -e "CREATE DATABASE IF NOT EXISTS \`$target\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"
gunzip -c "$file" | mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USERNAME" --default-character-set=utf8mb4 "$target"

echo "OK: đã phục hồi $file vào CSDL '$target'. Kiểm tra nhanh số bản ghi booking/account trước khi chuyển ứng dụng sang CSDL này."
