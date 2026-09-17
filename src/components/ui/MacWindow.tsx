import React from 'react';
import { TrafficLights } from './TrafficLights';
import { cn } from '../../lib/cn';

interface MacWindowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Tiêu đề căn giữa title bar (có thể kèm icon) */
    title: React.ReactNode;
    /** Nội dung góc phải title bar (nút, kbd…) — giữ ngắn để không đè tiêu đề */
    right?: React.ReactNode;
    /** Thanh trạng thái dưới cùng, mono nhỏ */
    footer?: React.ReactNode;
}

/**
 * Cửa sổ macOS theo theme: title bar có đèn giao thông + tiêu đề căn giữa,
 * body tự do, footer tùy chọn. Dùng cho Terminal (stats) và Finder (khóa học) ở trang chủ.
 */
export const MacWindow: React.FC<MacWindowProps> = ({ title, right, footer, className, children, ...props }) => (
    <div
        className={cn(
            'relative rounded-xl border border-line bg-surface/90 backdrop-blur-md overflow-hidden',
            'shadow-[0_1px_2px_rgb(15_23_42/0.06),0_24px_48px_-24px_rgb(15_23_42/0.25)] dark:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.8)]',
            className,
        )}
        {...props}
    >
        <div className="relative flex items-center h-9 px-4 border-b border-line bg-surface-2/60">
            <TrafficLights />
            <div className="absolute inset-x-24 flex items-center justify-center gap-1.5 text-[12px] font-medium text-fg-2 pointer-events-none truncate">
                {title}
            </div>
            {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
        </div>

        {children}

        {footer && (
            <div className="flex items-center gap-3 h-7 px-4 border-t border-line bg-surface-2/40 font-mono text-[11px] text-fg-muted whitespace-nowrap overflow-hidden">
                {footer}
            </div>
        )}
    </div>
);
