export default function Subnav() {
  const items = ["Tất cả", "Tour biển đảo", "Khám phá miền núi", "Di sản văn hóa", "Nghỉ dưỡng 5 sao", "Ẩm thực địa phương", "Tour sinh thái"]
  
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-4">
      <div className="flex gap-3 min-w-max px-4 max-w-[1280px] mx-auto">
        {items.map((item, i) => (
          <button 
            key={item} 
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              i === 0 
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' 
                : 'bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-primary-50)] border-[var(--color-muted)]'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
