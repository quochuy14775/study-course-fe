import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

export const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full font-semibold leading-none whitespace-nowrap',
    {
        variants: {
            variant: {
                neutral: 'bg-surface-2 text-fg-2 border border-line',
                primary: 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-500/15 dark:text-primary-300 dark:border-primary-500/30',
                success: 'bg-code-50 text-code-700 border border-code-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
                warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
                danger: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
                gradient: 'text-white bg-gradient-to-r from-primary-500 to-accent-500 shadow-[0_2px_8px_rgb(var(--color-primary-500)/0.35)]',
                glass: 'bg-white/15 text-white border border-white/25 backdrop-blur-sm',
            },
            size: {
                sm: 'px-2 py-0.5 text-[10px] uppercase tracking-wider',
                md: 'px-2.5 py-1 text-[11px]',
            },
        },
        defaultVariants: { variant: 'neutral', size: 'md' },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({ className, variant, size, ...props }) => (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
);
