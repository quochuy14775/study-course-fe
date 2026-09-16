import React from 'react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/cn';

/**
 * Dropdown menu dựa trên Radix: focus trap, điều hướng phím mũi tên, ESC, click-outside,
 * tự lật vị trí khi sát mép màn hình. Style bằng Tailwind ở đây để mọi menu giống nhau.
 */
export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;

export const DropdownMenuContent = React.forwardRef<
    React.ComponentRef<typeof DropdownPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
    <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            collisionPadding={12}
            className={cn(
                'z-[60] min-w-[12rem] overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-soft-lg',
                'origin-[var(--radix-dropdown-menu-content-transform-origin)]',
                'data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out',
                className,
            )}
            {...props}
        />
    </DropdownPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef<
    React.ComponentRef<typeof DropdownPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { destructive?: boolean }
>(({ className, destructive = false, ...props }, ref) => (
    <DropdownPrimitive.Item
        ref={ref}
        className={cn(
            'group relative flex select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors',
            'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            destructive
                ? 'text-rose-600 data-[highlighted]:bg-rose-50 dark:text-rose-400 dark:data-[highlighted]:bg-rose-500/10'
                : 'text-fg-2 data-[highlighted]:bg-surface-2 data-[highlighted]:text-fg',
            className,
        )}
        {...props}
    />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuCheckboxItem = React.forwardRef<
    React.ComponentRef<typeof DropdownPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem>
>(({ className, children, ...props }, ref) => (
    <DropdownPrimitive.CheckboxItem
        ref={ref}
        className={cn(
            'relative flex select-none items-center gap-3 rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium outline-none transition-colors',
            'text-fg-2 data-[highlighted]:bg-surface-2 data-[highlighted]:text-fg',
            'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
        )}
        {...props}
    >
        <span className="absolute left-3 flex h-4 w-4 items-center justify-center rounded-md border border-line bg-surface">
            <DropdownPrimitive.ItemIndicator>
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 6.5 5 9l4.5-6" />
                </svg>
            </DropdownPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export const DropdownMenuLabel = React.forwardRef<
    React.ComponentRef<typeof DropdownPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>
>(({ className, ...props }, ref) => (
    <DropdownPrimitive.Label
        ref={ref}
        className={cn('px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle', className)}
        {...props}
    />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = React.forwardRef<
    React.ComponentRef<typeof DropdownPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <DropdownPrimitive.Separator
        ref={ref}
        className={cn('my-1.5 h-px bg-line', className)}
        {...props}
    />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

/** Phím tắt hiển thị bên phải item. */
export const DropdownMenuShortcut: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
    <span
        className={cn('ml-auto font-mono text-[10px] font-semibold tracking-wider text-fg-subtle', className)}
        {...props}
    />
);
