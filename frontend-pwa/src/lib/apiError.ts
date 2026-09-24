import axios from 'axios';

/** Lấy thông báo lỗi do server trả về ({message}) để hiển thị; rơi về câu mặc định nếu không có. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data: unknown = err.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const msg = (data as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim()) return msg;
    }
    if (!err.response) return 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng.';
  }
  return fallback;
}
