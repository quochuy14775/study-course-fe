import React from 'react';
import { Tooltip } from './Tooltip';
import { cn } from '../../lib/cn';

interface TrafficLightsProps {
    className?: string;
    /** Nút đỏ — đóng */
    onClose?: () => void;
    /** Nút vàng — thu nhỏ / mở lại */
    onMinimize?: () => void;
    minimized?: boolean;
    /** Nút xanh — phóng to / thu về */
    onZoom?: () => void;
    zoomed?: boolean;
}

/**
 * 3 nút cửa sổ macOS. Không truyền handler → chỉ trang trí (aria-hidden).
 * Truyền handler → nút thật, có tooltip nói rõ tác dụng và glyph hiện khi rê chuột.
 */
export const TrafficLights: React.FC<TrafficLightsProps> = ({ className, onClose, onMinimize, minimized, onZoom, zoomed }) => {
    const lights: Array<{ color: string; glyph: string; label?: string; onClick?: () => void }> = [
        { color: '#ff5f57', glyph: '×', label: onClose ? 'Đóng' : undefined, onClick: onClose },
        { color: '#febc2e', glyph: minimized ? '+' : '−', label: onMinimize ? (minimized ? 'Mở lại' : 'Thu nhỏ') : undefined, onClick: onMinimize },
        { color: '#28c840', glyph: zoomed ? '−' : '+', label: onZoom ? (zoomed ? 'Thu về (Esc)' : 'Phóng to toàn màn hình') : undefined, onClick: onZoom },
    ];
    const interactive = lights.some((l) => l.onClick);
    const dot = 'flex w-3 h-3 items-center justify-center rounded-full text-[9px] font-bold leading-none text-black/60 ring-1 ring-black/15';

    return (
        <div className={cn('group/tl flex items-center gap-2', className)} aria-hidden={interactive ? undefined : true}>
            {lights.map(({ color, glyph, label, onClick }) => {
                const inner = <span className="opacity-0 group-hover/tl:opacity-100 transition-opacity">{glyph}</span>;
                if (!onClick) return <span key={color} className={dot} style={{ background: color }} aria-hidden>{inner}</span>;
                return (
                    <Tooltip key={color} content={label} side="bottom" sideOffset={8}>
                        <button
                            type="button"
                            onClick={onClick}
                            aria-label={label}
                            className={cn(dot, 'hover:brightness-110 hover:scale-110 active:scale-95 transition-transform')}
                            style={{ background: color }}
                        >
                            {inner}
                        </button>
                    </Tooltip>
                );
            })}
        </div>
    );
};
