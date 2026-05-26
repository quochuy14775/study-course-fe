import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideProps } from 'lucide-react';

/* =======================
   TYPES
======================= */

type IconType = React.ComponentType<LucideProps>;

interface DropdownOption {
    value: string;
    label: string;
    icon?: IconType;
    iconClass?: string;
    className?: string;
}

interface CustomDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: DropdownOption[];
    placeholder?: string;
    label?: string;
    className?: string;
    error?: string; // optional error message to display like text inputs
    buttonRef?: React.RefObject<HTMLButtonElement>; // optional ref to the internal button so parents can focus it
}

/* =======================
   COMPONENT
======================= */

const CustomDropdown: React.FC<CustomDropdownProps> = ({
                                                           value,
                                                           onChange,
                                                           options,
                                                           placeholder = 'Select...',
                                                           label,
                                                           className = '',
                                                           error,
                                                           buttonRef,
                                                       }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    /* =======================
       CLOSE OUTSIDE
    ======================= */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!dropdownRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /* =======================
       DATA
    ======================= */
    const selectedOption = options.find(opt => String(opt.value) === String(value));

    /* =======================
       RENDER
    ======================= */
    return (
        <div ref={dropdownRef} className={`relative w-full ${className}`}>
            {label && (
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {label}
                </label>
            )}

            {/* wrapper - show red border when error present */}
            <div
                className={`
                    rounded-lg p-[1.5px] transition-all duration-200  border
                    ${error ? 'border-red-500' : 'border-slate-300'}
                    ${isOpen
                    ? (error ? 'bg-gradient-to-r from-[#fb7185] to-[#06b6d4]' : 'bg-gradient-to-r from-[#fb7185] to-[#06b6d4]')
                    : 'bg-transparent'}
                `}
            >
                {/* BUTTON */}
                <button
                    type="button"
                    ref={buttonRef}
                    onClick={() => setIsOpen(prev => !prev)}
                    className={`
                        w-full px-3 py-2 bg-white rounded-lg
                        flex items-center justify-between text-sm
                        transition-all duration-200
                        hover:border-slate-400
                        focus:outline-none
                        ${error ? 'border-red-500 focus:ring-red-300 focus:border-red-500' : ''}
                    `}
                >
                    <div className="flex items-center gap-2">
                        {selectedOption?.icon && (
                            <selectedOption.icon
                                size={14}
                                className={selectedOption.iconClass || 'text-slate-500'}
                            />
                        )}
                        <span className={`text-slate-800 ${selectedOption ? '' : 'text-slate-400'}`}>
                            {selectedOption?.label || placeholder}
                        </span>
                    </div>

                    <ChevronDown
                        size={14}
                        className={`text-slate-500 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    />
                </button>
            </div>

            {/* error text shown similar to inputs */}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            {/* MENU */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden">

                    {/* 🔥 gradient top line */}
                    <div className="h-[2px] bg-gradient-to-r from-[#fb7185] to-[#06b6d4]" />

                    <div className="max-h-60 overflow-y-auto">
                        {options.map(option => {
                            const isSelected = String(value) === String(option.value);
                            const Icon = option.icon;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full px-3 py-2 flex items-center gap-2 text-sm transition
                                        ${
                                        isSelected
                                            ? 'bg-slate-100 text-slate-900'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }
                                        ${option.className || ''}
                                    `}
                                >
                                    {Icon && (
                                        <Icon
                                            size={14}
                                            className={
                                                isSelected
                                                    ? 'text-slate-900'
                                                    : option.iconClass || 'text-slate-500'
                                            }
                                        />
                                    )}

                                    <span>{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;