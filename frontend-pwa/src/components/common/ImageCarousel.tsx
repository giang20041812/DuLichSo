import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  emptyContent?: ReactNode;
  initialIndex?: number;
}

export default function ImageCarousel({ images, alt, className = '', imageClassName = 'h-full w-full object-cover', emptyContent, initialIndex = 0 }: ImageCarouselProps) {
  const validImages = images.filter((image) => image.trim().length > 0);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, Math.min(initialIndex, Math.max(0, validImages.length - 1))));
  const [isOpen, setIsOpen] = useState(false);
  const canNavigate = validImages.length > 1;

  useEffect(() => {
    if (activeIndex >= validImages.length) setActiveIndex(0);
  }, [activeIndex, validImages.length]);

  if (validImages.length === 0) return <div className={className}>{emptyContent}</div>;
  const previous = () => setActiveIndex((index) => (index - 1 + validImages.length) % validImages.length);
  const next = () => setActiveIndex((index) => (index + 1) % validImages.length);

  return (
    <>
      <div className={`relative overflow-hidden ${className}`}>
        <button type="button" className="block h-full w-full cursor-zoom-in" onClick={() => setIsOpen(true)} aria-label={`Mở ảnh ${activeIndex + 1} của ${validImages.length}`}>
          <img src={validImages[activeIndex]} alt={`${alt} ${activeIndex + 1}`} className={imageClassName} />
        </button>
        {canNavigate && <>
          <button type="button" onClick={previous} aria-label="Ảnh trước" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md bg-black/55 p-2 text-white hover:bg-black/75"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={next} aria-label="Ảnh tiếp theo" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-black/55 p-2 text-white hover:bg-black/75"><ChevronRight className="h-5 w-5" /></button>
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-sm bg-black/65 px-2 py-1 text-xs font-semibold text-white">{activeIndex + 1}/{validImages.length}</span>
        </>}
      </div>
      {isOpen && <ImageLightbox images={validImages} index={activeIndex} alt={alt} onIndexChange={setActiveIndex} onClose={() => setIsOpen(false)} />}
    </>
  );
}
