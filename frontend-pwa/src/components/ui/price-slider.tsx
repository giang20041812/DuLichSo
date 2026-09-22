import React, { useState, useEffect, useRef, useCallback } from 'react';

interface PriceSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onChangeEnd: (value: [number, number]) => void;
}

export function PriceSlider({ min, max, step, value, onChange, onChangeEnd }: PriceSliderProps) {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  const minValRef = useRef(value[0]);
  const maxValRef = useRef(value[1]);
  const range = useRef<HTMLDivElement>(null);

  const getPercent = useCallback(
    (val: number) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  );

  useEffect(() => {
    setMinVal(value[0]);
    setMaxVal(value[1]);
  }, [value]);

  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, getPercent]);

  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, getPercent]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxVal - step);
    setMinVal(val);
    minValRef.current = val;
    onChange([val, maxVal]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minVal + step);
    setMaxVal(val);
    maxValRef.current = val;
    onChange([minVal, val]);
  };

  const handleMouseUp = () => {
    onChangeEnd([minVal, maxVal]);
  };

  const formatPrice = (price: number) => {
    if (price >= max) return `VND ${price.toLocaleString('vi-VN')}+`;
    return `VND ${price.toLocaleString('vi-VN')}`;
  };

  return (
    <div className="flex flex-col w-full px-2">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-[var(--color-ink-deep)]">
          {formatPrice(minVal)} - {formatPrice(maxVal)}
        </span>
      </div>

      <div className="relative w-full h-5 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className="absolute w-full h-0 pointer-events-none appearance-none z-20 outline-none"
          style={{
            WebkitAppearance: 'none',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className="absolute w-full h-0 pointer-events-none appearance-none z-30 outline-none"
          style={{
            WebkitAppearance: 'none',
          }}
        />

        <div className="relative w-full h-1 bg-gray-200 rounded-full z-10 mx-1">
          <div
            ref={range}
            className="absolute h-1 bg-[#048c73] rounded-full"
          ></div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        input[type=range]::-webkit-slider-thumb {
          pointer-events: all;
          width: 20px;
          height: 20px;
          -webkit-appearance: none;
          @apply bg-[#048c73] rounded-full cursor-pointer shadow-md border-2 border-white;
        }
        input[type=range]::-moz-range-thumb {
          pointer-events: all;
          width: 20px;
          height: 20px;
          @apply bg-[#048c73] rounded-full cursor-pointer shadow-md border-2 border-white;
        }
      `}} />
    </div>
  );
}
