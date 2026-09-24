import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Đưa modal / ngăn kéo ra thẳng document.body.
 * Nếu để trong cây trang, một phần tử cha có transform/animation/filter sẽ trở thành khung chứa
 * của `position: fixed` và làm lớp phủ bị cắt theo vùng nội dung thay vì phủ toàn màn hình.
 */
export default function OverlayPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
