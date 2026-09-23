import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function SidebarLayout() {
  // Sidebar dạng drawer: Ẩn mặc định, chỉ mở khi click nút 3 sọc ở Header
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const location = useLocation();

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

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
      {/* Header cố định ở đỉnh trang với 3 sọc mở sidebar và thanh điều hướng kéo ngang responsive */}
      <Header onOpenSidebar={openSidebar} />
      
      {/* Sidebar trong suốt (frosted glass) với dấu X góc trên cùng bên phải để tắt */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />

      {/* Khu vực thân trang bên dưới Header (Header cao ~88px gồm 2 hàng) */}
      <div className="flex flex-1 w-full pt-[88px] md:pt-[92px] relative">
        {/* Nội dung chính của trang */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <main className={`flex-1 w-full relative z-10 ${hasHeroImage ? '-mt-[88px] md:-mt-[92px]' : ''}`}>
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
