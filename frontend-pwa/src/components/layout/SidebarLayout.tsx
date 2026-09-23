import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function SidebarLayout() {
  // 1. Khi CHƯA responsive (màn hình lớn desktop): Sidebar HIỆN SẴN mặc định
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  
  // 2. Khi TRONG CHẾ ĐỘ responsive (màn hình nhỏ mobile/tablet): Sidebar ẨN mặc định
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const location = useLocation();

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsDesktopSidebarOpen(prev => !prev);
    } else {
      setIsMobileSidebarOpen(prev => !prev);
    }
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
      {/* Header cố định ở đỉnh trang */}
      <Header toggleSidebar={toggleSidebar} />
      
      {/* Khu vực thân trang bên dưới Header */}
      <div className="flex flex-1 w-full pt-[60px] relative">
        {/* Sidebar: Trên desktop cố định (fixed) stick theo màn hình; Trên mobile là drawer */}
        <Sidebar 
          isDesktopOpen={isDesktopSidebarOpen} 
          isMobileOpen={isMobileSidebarOpen} 
          onCloseMobile={() => setIsMobileSidebarOpen(false)} 
        />
        
        {/* Nội dung chính của trang: Tự động co giãn và chừa khoảng trống cho fixed sidebar trên desktop */}
        <div 
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            isDesktopSidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-0'
          }`}
        >
          <main className={`flex-1 w-full relative z-10 ${hasHeroImage ? '-mt-[60px]' : ''}`}>
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
