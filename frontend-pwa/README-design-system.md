# VietJourney Design System

Đây là tài liệu hướng dẫn cho hệ thống Design System của dự án **VietJourney**.
Hệ thống được xây dựng dựa trên nguyên lý *Single Source of Truth* bằng CSS Variables,
tích hợp với Tailwind CSS v4 và shadcn/ui.

## Nguyên tắc thiết kế (Do's & Don'ts)

### 1. Colors & Accessibility (Bảng màu Thiên Nhiên Eco: Green, Light Green & Aqua)
- **Bảng màu chủ đạo**:
  - `Deep Teal` (`#048C73` - `--color-primary`): Màu thương hiệu chính, header, nút chính, liên kết.
  - `Bright Aqua` (`#3DC9D9` - `--color-secondary`): Điểm nhấn biển trời, icon, badge nước/du lịch.
  - `Leaf Green` (`#52D967` - `--color-accent`): CTA chuyển đổi đặt tour, rating, giá ưu đãi.
  - `Mint Aqua` (`#7EF2DD` - `--color-primary-light`): Nền nhạt, chip active, hover state.
  - `Soft Lime` (`#88F28F` - `--color-accent-light`): Nhãn sinh thái, eco tag.
  - `Eco Mist` (`#F3FAF7` - `--color-canvas`): Nền trang thanh thoát, dịu mắt.
  - `Pure White` (`#FFFFFF` - `--color-surface`): Nền card, modal, container.
  - `Deep Forest` (`#0A2E26` - `--color-ink-deep`): Heading đậm, footer, độ tương phản cao.
- **DO**: Luôn sử dụng token màu `--color-...` được định nghĩa trong `src/styles/globals.css`.
- **DO**: Chọn các cặp màu đảm bảo độ tương phản WCAG 2.1 AA.
- **DON'T**: KHÔNG hardcode mã hex vào class Tailwind hay styles.
- **DON'T**: Trên nền màu sáng như `Bright Aqua` (`--color-secondary`), `Leaf Green` (`--color-accent`), `Mint Aqua`, hãy luôn dùng chữ `Deep Forest` (`--color-ink-deep`) để đảm bảo độ tương phản tối đa.

### 2. Typography
- **DO**: Ưu tiên sử dụng classes typography chuẩn (`display-hero`, `h1`..`h4`, `body`, `caption`, `overline`) được định nghĩa sẵn.
- **DO**: Hỗ trợ tốt tiếng Việt với line-height nới rộng (1.65 cho body).
- **DON'T**: KHÔNG gán rời rạc font-size và line-height ngoài các tokens đã quy định.

### 3. Spacing & Layout
- **DO**: Sử dụng grid 8pt (4, 8, 12, 16, 24, 32, 40, 48, 64, 80).
- **DO**: Bọc các trang con bằng `AppShell` để kế thừa bố cục layout (Header, Footer, Navigation).
- **DON'T**: Tránh sử dụng margin/padding tùy tiện (VD: `mt-[17px]`). Hãy bám sát vào spacing token của hệ thống.

### 4. Border Radius (Quy tắc bo góc)
- **DO**: Giữ border-radius tinh tế, tối giản, sắc sảo (nhỏ thôi: 4px - 6px, tối đa 8px cho panel/card lớn).
- **DO**: Sử dụng đúng token `--radius-sm` (4px), `--radius-md` (6px), `--radius-lg` (8px).
- **DON'T**: KHÔNG bo góc quá đà (`rounded-2xl`, `rounded-3xl`, `rounded-full` trên cards, panels, modals, nút bấm). Không dùng kiểu pill-button tròn xoe.

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
