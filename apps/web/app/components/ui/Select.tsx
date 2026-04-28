import React, { forwardRef } from "react";

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            {label}
            {props.required && (
              <span className="text-terracotta-500 ml-1">*</span>
            )}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-xl border-2 appearance-none
              bg-white text-stone-900
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-terracotta-500/20
              ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-stone-200 focus:border-terracotta-500 hover:border-stone-300"
              }
              ${className}
            `}
            {...props}
          >
            {props.placeholder && (
              <option value="" disabled>
                {props.placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
            <svg
              className="w-5 h-5 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error ? (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-sm text-stone-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
