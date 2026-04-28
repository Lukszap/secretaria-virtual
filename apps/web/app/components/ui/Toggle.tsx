import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-7 w-12 items-center rounded-full
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:ring-offset-2
          ${checked ? "bg-terracotta-600" : "bg-stone-300"}
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        `}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full bg-white shadow
            transition duration-200 ease-in-out
            ${checked ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-stone-700">
              {label}
            </span>
          )}
          {description && (
            <span className="text-sm text-stone-500">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
