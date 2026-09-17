import React from 'react';
import { cn } from '../../lib/cn';

/**
 * 3 nút cửa sổ macOS (đóng / thu nhỏ / phóng to) — hiện glyph × − + khi rê chuột vào cụm.
 * Chỉ trang trí; dùng cho các khối "cửa sổ" (editor, terminal) trên trang chủ và dashboard.
 */
export const TrafficLights: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('group/tl flex items-center gap-2', className)} aria-hidden>
        {([['#ff5f57', '×'], ['#febc2e', '−'], ['#28c840', '+']] as const).map(([c, g]) => (
            <span
                key={c}
                className="flex w-3 h-3 items-center justify-center rounded-full text-[9px] font-bold leading-none text-black/60 ring-1 ring-black/15"
                style={{ background: c }}
            >
                <span className="opacity-0 group-hover/tl:opacity-100 transition-opacity">{g}</span>
            </span>
        ))}
    </div>
);
