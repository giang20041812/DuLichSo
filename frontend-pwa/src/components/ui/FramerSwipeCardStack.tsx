import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FramerSwipeCardStackProps {
  children: React.ReactNode[];
  className?: string;
  gridClassName?: string;
}

export const FramerSwipeCardStack: React.FC<FramerSwipeCardStackProps> = ({
  children,
  className = '',
  gridClassName = 'md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const total = children.length;
  const x = useMotionValue(0);

  // Auto reset index if total changes
  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(total - 1);
    }
  }, [total, currentIndex]);

  if (total === 0) return null;

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      handlePrev();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* ===== DESKTOP VIEW: STANDARD GRID ===== */}
      <div className={`hidden md:grid ${gridClassName}`}>
        {children}
      </div>

      {/* ===== RESPONSIVE MOBILE / TABLET VIEW: FRAMER SWIPE STACK ===== */}
      <div className="block md:hidden relative w-full overflow-hidden px-1 py-2">
        {/* Swipeable Container */}
        <div ref={containerRef} className="relative w-full touch-pan-y">
          <motion.div
            className="flex w-full"
            animate={{ x: `-${currentIndex * 100}%` }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 28,
              mass: 0.8
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ x }}
          >
            {children.map((child, index) => {
              const isCurrent = index === currentIndex;
              return (
                <motion.div
                  key={index}
                  className="w-full shrink-0 px-2 select-none"
                  animate={{
                    scale: isCurrent ? 1 : 0.96,
                    opacity: isCurrent ? 1 : 0.75,
                  }}
                  transition={{ duration: 0.25 }}
                >
                  {child}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Navigation Controls: Dots & Chevrons */}
        {total > 1 && (
          <div className="flex items-center justify-between mt-3 px-3">
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="Xem thẻ trước"
              className="w-8 h-8 rounded-lg border-2 border-slate-200 bg-white text-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-2xs hover:border-[#048C73] hover:text-[#048C73] active:scale-90 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Pagination Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: total }).map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentIndex(dotIdx)}
                  aria-label={`Chuyển tới thẻ ${dotIdx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    dotIdx === currentIndex
                      ? 'w-6 bg-[#048C73] shadow-xs'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === total - 1}
              aria-label="Xem thẻ tiếp theo"
              className="w-8 h-8 rounded-lg border-2 border-slate-200 bg-white text-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-2xs hover:border-[#048C73] hover:text-[#048C73] active:scale-90 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FramerSwipeCardStack;
