import { NavLink } from "react-router-dom"
import { Search, Heart, Briefcase, UserCircle } from "lucide-react"

export default function BottomNav() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#66716c]/20 pb-safe">
      <div className="flex justify-between items-center px-2 py-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 gap-1 ${isActive ? 'text-[#16709a]' : 'text-[#66716c]'}`
          }
        >
          <Search className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Tìm kiếm</span>
        </NavLink>
        
        <NavLink 
          to="/saved" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 gap-1 ${isActive ? 'text-[#16709a]' : 'text-[#66716c]'}`
          }
        >
          <Heart className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Yêu thích</span>
        </NavLink>
        
        <NavLink 
          to="/bookings" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 gap-1 ${isActive ? 'text-[#16709a]' : 'text-[#66716c]'}`
          }
        >
          <Briefcase className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Đơn của tôi</span>
        </NavLink>
        
        <NavLink 
          to="/account" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 gap-1 ${isActive ? 'text-[#16709a]' : 'text-[#66716c]'}`
          }
        >
          <UserCircle className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Tài khoản</span>
        </NavLink>
      </div>
    </div>
  )
}
