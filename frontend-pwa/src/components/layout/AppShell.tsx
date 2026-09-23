import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"

export default function AppShell() {
  const location = useLocation();
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
    <div className="flex min-h-screen flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header />
      
      <main className={`flex-1 w-full relative z-10 ${hasHeroImage ? '' : 'pt-[110px]'}`}>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
