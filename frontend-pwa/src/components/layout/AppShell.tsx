import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import { hasHeroOverlay } from "@/lib/routeUtils"

import heroBg from "@/assets/hero-home.jpg";

export default function AppShell() {
  const location = useLocation();
  const hasHeroImage = hasHeroOverlay(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-canvas)] text-[var(--color-ink)] relative">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#fefce8]/60 to-[#f0fdf4]/70 pointer-events-none backdrop-blur-[1px]" />
      
      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        
        <main className={`flex-1 w-full relative ${hasHeroImage ? '' : 'pt-[118px] sm:pt-[124px] md:pt-[130px]'}`}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  )
}
