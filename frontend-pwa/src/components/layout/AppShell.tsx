import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"

export default function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header />
      
      <main className="flex-1 w-full relative z-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
