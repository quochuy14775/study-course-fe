import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/cn';

/** Đặt một lần ở gốc app (App.tsx). */
export const TooltipProvider = TooltipPrimitive.Provider;

interface TooltipProps {
    content: React.ReactNode;
    side?: TooltipPrimitive.TooltipContentProps['side'];
    align?: TooltipPrimitive.TooltipContentProps['align'];
    sideOffset?: number;
    /** Tắt tooltip (vd. sidebar đang mở rộng thì không cần). */
    disabled?: boolean;
    className?: string;
    children: React.ReactElement;
}

/**
 * Tooltip dùng Radix: keyboard-accessible, tự canh vị trí, đóng khi ESC.
 * `children` phải là một element nhận ref (button, a, div...).
 */
export const Tooltip: React.FC<TooltipProps> = ({
    content,
    side = 'top',
    align = 'center',
    sideOffset = 6,
    disabled = false,
    className,
    children,
}) => {
    if (disabled) return children;

    return (
        <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                    side={side}
                    align={align}
                    sideOffset={sideOffset}
                    className={cn(
                        'z-[60] select-none rounded-lg px-2.5 py-1.5 text-xs font-medium',
                        'bg-ink-900 text-white shadow-soft-lg dark:bg-ink-100 dark:text-ink-900',
                        'data-[state=delayed-open]:animate-scale-in data-[state=closed]:animate-scale-out',
                        className,
                    )}
                >
                    {content}
                    <TooltipPrimitive.Arrow className="fill-ink-900 dark:fill-ink-100" width={10} height={5} />
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    );
};
