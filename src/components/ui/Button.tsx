import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export const buttonVariants = cva(
    [
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold select-none',
        'transition-[transform,box-shadow,background-color,color,border-color,filter] duration-200',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/25',
    ],
    {
        variants: {
            variant: {
                primary: [
                    'text-white bg-gradient-to-r from-primary-600 to-accent-600',
                    'shadow-[0_1px_0_rgb(255_255_255/0.2)_inset,0_8px_20px_-6px_rgb(var(--color-primary-600)/0.55)]',
                    'hover:brightness-110 hover:shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_12px_28px_-6px_rgb(var(--color-primary-600)/0.6)]',
                ],
                secondary: [
                    'bg-surface text-fg border border-line shadow-card',
                    'hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50/60',
                    'dark:hover:bg-primary-500/10 dark:hover:text-primary-300 dark:hover:border-primary-500/40',
                ],
                ghost: 'text-fg-2 hover:bg-surface-2 hover:text-fg',
                soft: 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-500/15 dark:text-primary-300 dark:hover:bg-primary-500/25',
                danger: 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10',
                onDark: 'bg-white/10 text-white border border-white/15 backdrop-blur-sm hover:bg-white/20',
            },
            size: {
                xs: 'h-7 px-2.5 text-[11px] rounded-lg',
                sm: 'h-8 px-3 text-xs rounded-lg',
                md: 'h-10 px-4 text-sm rounded-xl',
                lg: 'h-12 px-6 text-base rounded-2xl',
                icon: 'h-9 w-9 rounded-xl',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    loading?: boolean;
}

/**
 * Nút chuẩn của app. Dùng `buttonVariants()` trực tiếp khi cần class cho <Link>/<a>.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => (
        <button
            ref={ref}
            className={cn(buttonVariants({ variant, size }), className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    ),
);
Button.displayName = 'Button';
