import { useState } from 'react';
import { PlaceMediaItem } from '../../types/homestay';
import { Image as ImageIcon, ChevronRight, X } from 'lucide-react';

interface HomestayGalleryProps {
  media: PlaceMediaItem[];
  categoryTag?: string;
}

export default function HomestayGallery({ media, categoryTag = 'Homestay cộng đồng' }: HomestayGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const cover = media[activeImageIndex] || media[0];
  const thumbnails = media.slice(0, 4);

  return (
    <section className="relative w-full">
      {/* Hero Media Card */}
      <div 
        className="relative h-72 sm:h-80 md:h-96 w-full overflow-hidden rounded-2xl cursor-pointer group shadow-sm"
        onClick={() => setIsLightboxOpen(true)}
      >
        <img
          src={cover?.publicUrl || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'}
          alt={cover?.caption || 'Homestay Cover'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="rounded-full bg-emerald-700/90 text-white text-xs font-semibold px-3 py-1 shadow-sm backdrop-blur-xs">
            {categoryTag}
          </span>
          <span className="rounded-full bg-black/60 text-white text-xs font-medium px-3 py-1 flex items-center gap-1.5 backdrop-blur-xs">
            <ImageIcon className="w-3.5 h-3.5" />
            {media.length > 0 ? `${media.length} hình` : '12 hình'}
          </span>
        </div>

        {/* Bottom Hero Caption */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="text-white max-w-[70%]">
            <h3 className="font-semibold text-sm sm:text-base line-clamp-1 drop-shadow-sm">
              {cover?.caption || 'Nhà sàn gỗ 40 năm tuổi nguyên bản'}
            </h3>
            <p className="text-xs text-white/80 line-clamp-1">
              Thung lũng Tú Lệ, Mù Cang Chải
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-white/90 hover:bg-white text-emerald-950 text-xs font-semibold px-3 py-1.5 flex items-center gap-1 shadow-sm transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Thumbnails Row */}
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {thumbnails.map((item, idx) => (
          <button
            key={item.id || idx}
            type="button"
            onClick={() => setActiveImageIndex(idx)}
            className={`relative h-18 sm:h-22 rounded-xl overflow-hidden cursor-pointer transition-all ${
              activeImageIndex === idx ? 'ring-2 ring-emerald-700 ring-offset-1' : 'opacity-85 hover:opacity-100'
            }`}
          >
            <img
              src={item.publicUrl}
              alt={item.caption || `Ảnh ${idx + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-white/10"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[75vh] w-full flex items-center justify-center">
            <img
              src={cover?.publicUrl}
              alt={cover?.caption}
              className="max-h-[75vh] max-w-full object-contain rounded-lg"
            />
          </div>

          <p className="mt-4 text-white text-sm text-center max-w-xl">
            {cover?.caption}
          </p>

          <div className="mt-4 flex gap-2 overflow-x-auto max-w-full pb-2">
            {media.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 ${
                  activeImageIndex === idx ? 'border-emerald-500' : 'border-transparent opacity-60'
                }`}
              >
                <img src={item.publicUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
