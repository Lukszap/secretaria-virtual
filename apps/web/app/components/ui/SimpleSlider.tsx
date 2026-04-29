interface SimpleSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

export function SimpleSlider({ value, onChange, label, min = 0, max = 100 }: SimpleSliderProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-terracotta-600"
        />
        <span className="text-sm font-medium text-stone-700 min-w-12 text-right">
          {value}%
        </span>
      </div>
    </div>
  );
}
