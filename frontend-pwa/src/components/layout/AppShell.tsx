import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import BottomNav from "./BottomNav"

export default function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-canvas)] text-[var(--color-ink)] pb-16 lg:pb-0">
      <Header />
      
      <main className="flex-1 w-full relative z-10">
        <Outlet />
      </main>

      <Footer />
      <BottomNav />
    </div>
  )
}
