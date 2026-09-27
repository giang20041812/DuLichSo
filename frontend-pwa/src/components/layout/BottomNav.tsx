import { NavLink } from "react-router-dom"
import { Home, Compass, Utensils, BedDouble, Layers } from "lucide-react"

export default function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex justify-between items-center px-1 py-1.5">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 gap-1 py-1 transition-colors ${
              isActive ? 'text-[#048c73] font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Home className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[11px] leading-tight truncate">Trang chủ</span>
              {isActive && <div className="w-5 h-0.5 bg-[#048c73] rounded-full mt-0.5" />}
            </>
          )}
        </NavLink>
        
        <NavLink 
          to="/homestays" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 gap-1 py-1 transition-colors ${
              isActive ? 'text-[#048c73] font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <BedDouble className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[11px] leading-tight truncate">Lưu trú</span>
              {isActive && <div className="w-5 h-0.5 bg-[#048c73] rounded-full mt-0.5" />}
            </>
          )}
        </NavLink>
        
        <NavLink 
          to="/culture" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 gap-1 py-1 transition-colors ${
              isActive ? 'text-[#048c73] font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Compass className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[11px] leading-tight truncate">Văn hóa</span>
              {isActive && <div className="w-5 h-0.5 bg-[#048c73] rounded-full mt-0.5" />}
            </>
          )}
        </NavLink>
        
        <NavLink 
          to="/restaurants" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 gap-1 py-1 transition-colors ${
              isActive ? 'text-[#048c73] font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Utensils className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[11px] leading-tight truncate">Ẩm thực</span>
              {isActive && <div className="w-5 h-0.5 bg-[#048c73] rounded-full mt-0.5" />}
            </>
          )}
        </NavLink>

        <NavLink 
          to="/services" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 gap-1 py-1 transition-colors ${
              isActive ? 'text-[#048c73] font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Layers className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[11px] leading-tight truncate">Dịch vụ & Tiện ích</span>
              {isActive && <div className="w-5 h-0.5 bg-[#048c73] rounded-full mt-0.5" />}
            </>
          )}
        </NavLink>
      </div>
    </div>
  )
}
