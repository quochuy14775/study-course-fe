import React, { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { TrafficLights } from './TrafficLights';
import { cn } from '../../lib/cn';

interface MacWindowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Tiêu đề căn giữa title bar (có thể kèm icon) */
    title: React.ReactNode;
    /** Nội dung góc phải title bar (nút, kbd…) — giữ ngắn để không đè tiêu đề */
    right?: React.ReactNode;
    /** Thanh trạng thái dưới cùng, mono nhỏ */
    footer?: React.ReactNode;
    /** Nút đỏ bấm được → đóng */
    onClose?: () => void;
    /** Nút vàng bấm được → thu nhỏ còn title bar; `minimized` do cha giữ */
    onMinimize?: () => void;
    minimized?: boolean;
    /** Nút xanh bấm được → phóng to / thu về */
    onZoom?: () => void;
    zoomed?: boolean;
    /**
     * Khóa localStorage cho dải gợi ý "ba nút góc trái bấm được" — chỉ hiện một lần
     * cho mỗi khóa, tự ẩn khi người dùng bấm bất kỳ nút nào hoặc đóng gợi ý.
     */
    hintKey?: string;
}

/**
 * Cửa sổ macOS theo theme: title bar có đèn giao thông + tiêu đề căn giữa,
 * body tự do, footer tùy chọn. Đèn giao thông thành nút thật khi có handler.
 */
export const MacWindow: React.FC<MacWindowProps> = ({
    title, right, footer, onClose, onMinimize, minimized, onZoom, zoomed, hintKey, className, children, ...props
}) => {
    const interactive = !!(onClose || onMinimize || onZoom);
    const [hint, setHint] = useState(false);
    useEffect(() => {
        if (!hintKey || !interactive) return;
        try { setHint(localStorage.getItem(`mac-window-hint:${hintKey}`) !== '1'); } catch { setHint(true); }
    }, [hintKey, interactive]);
    const dismissHint = () => {
        setHint(false);
        try { if (hintKey) localStorage.setItem(`mac-window-hint:${hintKey}`, '1'); } catch { /* ignore */ }
    };
    // Bọc handler để bấm nút nào cũng tắt gợi ý
    const wrap = (fn?: () => void) => fn && (() => { if (hint) dismissHint(); fn(); });

    const actions = [
        onClose && 'Đóng',
        onMinimize && (minimized ? 'Mở lại' : 'Thu nhỏ'),
        onZoom && 'Phóng to',
    ].filter(Boolean).join(' · ');

    return (
        <div
            className={cn(
                'relative rounded-xl border border-line bg-surface/90 backdrop-blur-md overflow-hidden',
                'shadow-[0_1px_2px_rgb(15_23_42/0.06),0_24px_48px_-24px_rgb(15_23_42/0.25)] dark:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.8)]',
                className,
            )}
            {...props}
        >
            <div className="relative flex items-center h-9 px-4 border-b border-line bg-surface-2/60">
                <TrafficLights
                    onClose={wrap(onClose)}
                    onMinimize={wrap(onMinimize)}
                    minimized={minimized}
                    onZoom={wrap(onZoom)}
                    zoomed={zoomed}
                />
                <div className="absolute inset-x-24 flex items-center justify-center gap-1.5 text-[12px] font-medium text-fg-2 pointer-events-none truncate">
                    {title}
                </div>
                {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
            </div>

            {/* Gợi ý lần đầu: ba nút góc trái là nút thật */}
            {hint && !minimized && (
                <div className="flex items-center gap-2 px-4 h-8 border-b border-amber-200/70 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10 text-[12px] text-amber-800 dark:text-amber-200">
                    <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                        Ba nút <span aria-hidden>🔴🟡🟢</span> góc trái bấm được: <span className="font-medium">{actions}</span> — rê chuột để xem.
                    </span>
                    <button onClick={dismissHint} aria-label="Đóng gợi ý" className="ml-auto flex w-6 h-6 items-center justify-center rounded-md hover:bg-amber-500/15 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {!minimized && children}

            {footer && !minimized && (
                <div className="flex items-center gap-3 h-7 px-4 border-t border-line bg-surface-2/40 font-mono text-[11px] text-fg-muted whitespace-nowrap overflow-hidden">
                    {footer}
                </div>
            )}
        </div>
    );
};
