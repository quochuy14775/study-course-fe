import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Dòng lệnh đầu cửa sổ terminal (theo theme, dùng trong MacWindow):
 *   ➜ ~ eduhub stats --public
 */
export const TermCommand: React.FC<{ cmd: string; flags?: string; cwd?: string; className?: string }> = ({ cmd, flags, cwd = '~', className }) => (
    <div className={cn('flex items-center gap-1.5 px-4 h-9 border-b border-line font-mono text-[11.5px] whitespace-nowrap overflow-hidden', className)}>
        <span className="text-emerald-500">➜</span>
        <span className="text-sky-600 dark:text-sky-300">{cwd}</span>
        <span className="text-fg-2">{cmd}</span>
        {flags && <span className="text-primary-600 dark:text-primary-300">{flags}</span>}
    </div>
);

/** Nhãn dạng identifier trong terminal: `// key` */
export const TermKey: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <span className={cn('font-mono text-[11px] text-fg-muted', className)}>
        <span className="text-fg-subtle select-none">{'// '}</span>{children}
    </span>
);

export interface TermStatItem { icon: LucideIcon; k: string; label: string; value: string | number; sub?: string }

/** Lưới ô thống kê trong cửa sổ terminal — mỗi ô: `// key`, số lớn, nhãn. Cùng khuôn với stats ở trang chủ. */
export const TermStatGrid: React.FC<{ items: TermStatItem[]; className?: string }> = ({ items, className }) => (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-px bg-line', className)}>
        {items.map((t) => (
            <div key={t.k} className="group relative bg-surface p-5 transition-colors duration-300 hover:bg-surface-2/60">
                <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                <div className="flex items-center gap-2">
                    <span className="flex w-6 h-6 items-center justify-center rounded-md border border-line bg-surface text-primary-600 dark:text-primary-300 flex-shrink-0">
                        <t.icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                    </span>
                    <TermKey className="truncate">{t.k}</TermKey>
                </div>
                <p className="mt-3 text-2xl sm:text-[1.85rem] font-extrabold tracking-tight text-fg leading-none tabular-nums">{t.value}</p>
                <p className="text-xs text-fg-muted mt-1.5 truncate">{t.label}{t.sub && <span className="text-fg-subtle"> · {t.sub}</span>}</p>
            </div>
        ))}
    </div>
);

/**
 * Thanh tiến độ bằng ký tự khối, kiểu htop: ████████░░ 83%
 * Tổng độ dài cố định để các dòng thẳng cột.
 */
export const TermBar: React.FC<{ percent: number; width?: number; className?: string; tone?: 'primary' | 'emerald' | 'amber' | 'sky' }> = ({
    percent, width = 12, className, tone = 'primary',
}) => {
    const p = Math.max(0, Math.min(100, percent));
    const filled = Math.round((p / 100) * width);
    const color = {
        primary: 'text-primary-600 dark:text-primary-300',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        amber:   'text-amber-600 dark:text-amber-400',
        sky:     'text-sky-600 dark:text-sky-300',
    }[tone];
    return (
        <span className={cn('font-mono text-[11px] tabular-nums whitespace-pre', className)} role="img" aria-label={`${Math.round(p)}%`}>
            <span className={color}>{'█'.repeat(filled)}</span>
            <span className="text-fg-subtle/60">{'░'.repeat(width - filled)}</span>
        </span>
    );
};
