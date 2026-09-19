# VietJourney Design System

Đây là tài liệu hướng dẫn cho hệ thống Design System của dự án **VietJourney**.
Hệ thống được xây dựng dựa trên nguyên lý *Single Source of Truth* bằng CSS Variables,
tích hợp với Tailwind CSS v4 và shadcn/ui.

## Nguyên tắc thiết kế (Do's & Don'ts)

### 1. Colors & Accessibility
- **DO**: Luôn sử dụng token màu `--color-...` được định nghĩa trong `src/styles/globals.css`.
- **DO**: Chọn các cặp màu đảm bảo độ tương phản WCAG 2.1 AA.
- **DON'T**: KHÔNG hardcode mã hex (VD: `#16709A`) vào class Tailwind hay styles.
- **DON'T**: KHÔNG sử dụng chữ màu trắng trên nền `Sunset Gold` (`--color-accent`). Hãy dùng chữ `Ink Deep` (`--color-ink-deep`) khi nền là `Sunset Gold` để đảm bảo độ tương phản.

### 2. Typography
- **DO**: Ưu tiên sử dụng classes typography chuẩn (`display-hero`, `h1`..`h4`, `body`, `caption`, `overline`) được định nghĩa sẵn.
- **DO**: Hỗ trợ tốt tiếng Việt với line-height nới rộng (1.65 cho body).
- **DON'T**: KHÔNG gán rời rạc font-size và line-height ngoài các tokens đã quy định.

### 3. Spacing & Layout
- **DO**: Sử dụng grid 8pt (4, 8, 12, 16, 24, 32, 40, 48, 64, 80).
- **DO**: Bọc các trang con bằng `AppShell` để kế thừa bố cục layout (Header, Footer, Navigation).
- **DON'T**: Tránh sử dụng margin/padding tùy tiện (VD: `mt-[17px]`). Hãy bám sát vào spacing token của hệ thống.

## Cấu trúc thư mục

```text
src/
├── design/
│   └── tokens.json       # Chứa toàn bộ raw design tokens phục vụ xuất ra Figma
├── styles/
│   └── globals.css       # File cấu hình biến CSS :root và map Tailwind v4 @theme
├── lib/
│   └── cn.ts             # Hàm tiện ích kết hợp class clsx + tailwind-merge
└── components/
    ├── ui/               # Primitive components (Button, Input, Badge, Card...)
    └── layout/           # Component khung xương (AppShell, Header, Footer...)
```

## Chạy Showcase

Để xem bảng màu, thang chữ, cũng như tất cả components và state của chúng:
1. Chạy project: `npm run dev`
2. Mở trình duyệt tại đường dẫn `http://localhost:<port>/design-system`
