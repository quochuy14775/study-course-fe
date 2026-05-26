import React from 'react';
import { Check } from 'lucide-react';

/* =======================
   TYPES
======================= */

interface CustomCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    className?: string;
    disabled?: boolean;
}

/* =======================
   COMPONENT
======================= */

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
    checked,
    onChange,
    label,
    description,
    className = '',
    disabled = false,
}) => {
    return (
        <label
            className={`flex items-center gap-3 text-slate-800 cursor-pointer transition-all ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-slate-900'
            } ${className}`}
        >
            {/* Custom Checkbox Container */}
            <div
                className={`
                    relative flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200
                    flex items-center justify-center
                    ${
                        checked
                            ? 'bg-gradient-to-r from-[#fb7185] to-[#06b6d4] border-[#06b6d4]'
                            : 'bg-white border-slate-300 hover:border-slate-400'
                    }
                    ${disabled ? 'cursor-not-allowed opacity-60' : ''}
                `}
            >
                {/* Checkmark Icon */}
                {checked && (
                    <Check size={14} className="text-white font-bold" strokeWidth={3} />
                )}

                {/* Hidden native checkbox for accessibility */}
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                    disabled={disabled}
                />
            </div>

            {/* Text Content */}
            {label && (
                <div className="flex-1">
                    <span className="text-sm font-medium">{label}</span>
                    {description && (
                        <span className="ml-0 text-xs text-slate-500 block">
                            {description}
                        </span>
                    )}
                </div>
            )}
        </label>
    );
};

export default CustomCheckbox;

