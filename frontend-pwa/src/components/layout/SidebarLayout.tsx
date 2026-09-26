import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

import { hasHeroOverlay } from '@/lib/routeUtils';

export default function SidebarLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Tự động đóng sidebar khi chuyển đường dẫn (route)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Đóng sidebar khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasHeroImage = hasHeroOverlay(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)] relative overflow-x-hidden">
      {/* Header cố định ở đỉnh trang: nút 3 sọc chỉ hiện khi sidebar ẩn */}
      <Header 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* Sidebar dạng Drawer ở layer cao nhất z-[9999] với background trong suốt và dấu X góc phải trên cùng */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />

      {/* Khu vực thân trang bên dưới Header: nếu là trang hero overlay thì pt-0, nếu là trang chi tiết/trang thường thì pt-[118px] sm:pt-[124px] md:pt-[130px] để nằm dưới hẳn Header */}
      <div className={`flex flex-1 w-full relative transition-all duration-200 ${hasHeroImage ? 'pt-0' : 'pt-[118px] sm:pt-[124px] md:pt-[130px]'}`}>
        {/* Nội dung chính của trang: Rộng rãi, toàn màn hình */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
          <main className="flex-1 w-full relative z-10">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
