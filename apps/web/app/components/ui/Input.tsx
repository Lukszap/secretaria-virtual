import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
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
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl border-2 
            bg-white text-stone-900 placeholder-stone-400
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
        />
        {error ? (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-sm text-stone-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
