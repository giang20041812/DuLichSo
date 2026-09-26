import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import { hasHeroOverlay } from "@/lib/routeUtils"

export default function AppShell() {
  const location = useLocation();
  const hasHeroImage = hasHeroOverlay(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header />
      
      <main className={`flex-1 w-full relative z-10 ${hasHeroImage ? '' : 'pt-[118px] sm:pt-[124px] md:pt-[130px]'}`}>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
