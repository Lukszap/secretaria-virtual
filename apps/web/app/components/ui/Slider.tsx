import React from "react";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  label,
  showValue = true,
  valueFormatter = (v) => `${v}%`,
  className = "",
}: SliderProps) {
  // Calculate color based on percentage (cold to warm)
  const getTrackColor = (percentage: number) => {
    // From blue (low) to orange/red (high)
    if (percentage <= 25) return "#3b82f6"; // blue-500
    if (percentage <= 50) return "#8b5cf6"; // violet-500
    if (percentage <= 75) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };

  const percentage = ((value - min) / (max - min)) * 100;
  const trackColor = getTrackColor(percentage);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-stone-700">{label}</label>
          {showValue && (
            <span className="text-sm font-semibold" style={{ color: trackColor }}>
              {valueFormatter(value)}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer slider-input"
          style={
            {
              "--track-color": trackColor,
              "--percentage": `${percentage}%`,
            } as React.CSSProperties
          }
        />
        <div className="flex justify-between text-xs text-stone-400 mt-1">
          <span>{min}%</span>
          <span>{max}%</span>
        </div>
      </div>
    </div>
  );
}
