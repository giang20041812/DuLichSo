import { useState } from 'react';
import { ArrowLeft, Calendar, Users, Search, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

export default function CompactSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [occupancy, setOccupancy] = useState("1 phòng · 2 người lớn · 0 trẻ em");

  return (
    <>
      {/* Compact Bar (Image 1) */}
      <div 
        className="w-full max-w-4xl mx-auto px-4 md:px-8 mt-4"
      >
        <div 
          onClick={() => setIsOpen(true)}
          className="bg-white border-[3px] border-[#febb02] rounded-lg p-2.5 flex items-center gap-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/');
            }} 
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-[#1a1a1a]" />
          </button>
          <span className="text-[15px] font-bold text-[#1a1a1a] tracking-tight">
            {destination ? `${destination} · ${dates || "Thêm ngày"}` : "Bạn muốn đi đâu?"}
          </span>
        </div>
      </div>

      {/* Modal (Image 2) */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100000] flex flex-col justify-start bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full shadow-2xl animate-in slide-in-from-top-2 duration-300">
             {/* Header */}
             <div className="flex items-center p-4 bg-white relative">
                <button onClick={() => setIsOpen(false)} className="p-2 absolute left-2 text-[#1a1a1a] hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
                <h2 className="w-full text-center font-bold text-lg text-[#1a1a1a]">Thay đổi tìm kiếm của bạn</h2>
             </div>

             {/* Fields */}
             <div className="p-4 pt-2">
               <div className="flex flex-col border-[3px] border-[#febb02] rounded-lg bg-white overflow-hidden shadow-sm max-w-3xl mx-auto">
                  
                  {/* Location Field */}
                  <div className="flex items-center gap-3 p-3.5 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-text">
                    <Search className="w-5 h-5 text-[#1a1a1a]" strokeWidth={2} />
                    <input 
                      type="text" 
                      placeholder="Bạn muốn đi đâu?" 
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      className="flex-1 outline-none font-bold text-[#1a1a1a] text-[15px] bg-transparent placeholder:text-gray-400" 
                    />
                  </div>
                  
                  {/* Dates Field */}
                  <div className="flex items-center gap-3 p-3.5 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setDates("24 Th9 - 25 Th9")}>
                    <Calendar className="w-5 h-5 text-[#1a1a1a]" strokeWidth={2} />
                    <span className="flex-1 font-bold text-[#1a1a1a] text-[15px]">{dates || "Thêm ngày"}</span>
                  </div>
                  
                  {/* Occupancy Field */}
                  <div className="flex items-center gap-3 p-3.5 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setOccupancy("1 phòng · 2 người lớn · 1 trẻ em")}>
                    <Users className="w-5 h-5 text-[#1a1a1a]" strokeWidth={2} />
                    <span className="flex-1 font-bold text-[#1a1a1a] text-[15px]">{occupancy}</span>
                  </div>
                  
                  {/* Search Button */}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-[#006ce4] hover:bg-[#0057b8] text-white font-bold text-lg py-3.5 text-center transition-colors"
                  >
                    Tìm
                  </button>
               </div>
             </div>
          </div>
          
          {/* Backdrop Clickable Area */}
          <div className="flex-1 w-full h-full" onClick={() => setIsOpen(false)}></div>
        </div>,
        document.body
      )}
    </>
  )
}
