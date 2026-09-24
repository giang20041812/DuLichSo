import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

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

  const hasHeroImage = location.pathname === '/' || 
    location.pathname.startsWith('/culture') || 
    location.pathname.startsWith('/explore') || 
    location.pathname.startsWith('/homestays') || 
    location.pathname.startsWith('/restaurants') || 
    location.pathname.startsWith('/food') || 
    location.pathname.startsWith('/destinations') || 
    location.pathname.startsWith('/transport') || 
    location.pathname.startsWith('/services') || 
    location.pathname.startsWith('/photo') || 
    location.pathname.startsWith('/rental') || 
    location.pathname.startsWith('/tours');

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

      {/* Khu vực thân trang bên dưới Header */}
      <div className="flex flex-1 w-full pt-[60px] relative">
        {/* Nội dung chính của trang: Rộng rãi, toàn màn hình */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
          <main className={`flex-1 w-full relative z-10 ${hasHeroImage ? '-mt-[60px]' : ''}`}>
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
