/**
 * Ảnh nền cho trang Đăng nhập / Đăng ký.
 *
 * Cách thay ảnh: chép file vào `frontend-pwa/public/images/auth/` với đúng tên bên dưới
 * (ví dụ `login-hero.jpg`) — không cần sửa code. Chưa có file thì tự dùng ảnh dự phòng `fallback`.
 * Kích thước khuyến nghị: 1400×1800 (dọc), JPG/WebP dưới 400KB.
 */
export interface AuthHeroImage {
  src: string;
  fallback: string;
  alt: string;
}

export const AUTH_IMAGES = {
  login: {
    src: '/images/auth/login-hero.jpg',
    fallback: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
    alt: 'Ruộng bậc thang mùa lúa chín Tây Bắc',
  },
  register: {
    src: '/images/auth/register-hero.jpg',
    fallback: 'https://images.unsplash.com/photo-1542159040-3b03f0b2f059?auto=format&fit=crop&w=1400&q=80',
    alt: 'Bản làng Tây Bắc trong sương sớm',
  },
} satisfies Record<string, AuthHeroImage>;
