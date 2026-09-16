import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Code2, EyeOff } from 'lucide-react';
import type { Language } from '../../../types/language';
import { resolveLanguageBrand, resolveFrameworkBrand, tint, brandText } from '../../../lib/techBrand';
import { Tooltip } from '../../../components/ui/Tooltip';
import { cn } from '../../../lib/cn';

interface Props {
    language: Language;
    onEdit?: (language: Language) => void;
    onDelete?: (id: number) => void;
    /** Dùng trong dialog: không có nút, không animation entrance */
    preview?: boolean;
    className?: string;
}

/** Một "dòng code" trong card: số dòng ở gutter + nội dung. `centered` để số dòng canh giữa hàng cao (hàng logo). */
const Line: React.FC<{ n: number; children: React.ReactNode; className?: string; centered?: boolean }> = ({ n, children, className, centered }) => (
    <div className={cn('relative pl-9 min-h-[1.5rem] flex gap-1.5 leading-6', centered ? 'items-center' : 'items-start', className)}>
        <span
            className={cn('absolute left-0 w-7 text-right text-[10px] text-fg-subtle select-none tabular-nums', centered && 'top-1/2 -translate-y-1/2')}
            aria-hidden
        >
            {String(n).padStart(2, '0')}
        </span>
        {children}
    </div>
);

/**
 * "Source file card" — ngôn ngữ hiển thị như một file mã nguồn mở trong editor:
 * title bar 3 chấm + tên file, gutter số dòng, thân là các dòng `slug: "…"`, `frameworks: […]`,
 * `active: true` viết bằng mono. Màu thương hiệu tô cho chấm, dải trên, tile logo và tên khi hover.
 */
const LanguageCard: React.FC<Props> = ({ language, onEdit, onDelete, preview = false, className }) => {
    const brand = resolveLanguageBrand(language);
    const initials = language.name.slice(0, 2).toUpperCase() || '?';
    const vars = {
        '--brand': brand.color,
        '--brand-text': brandText(brand.color),
        '--brand-soft': tint(brand.color, 12),
        '--brand-line': tint(brand.color, 45),
        '--brand-glow': tint(brand.color, 30),
    } as React.CSSProperties;
    const fws = language.frameworks ?? [];
    const fileName = `${language.slug || 'slug'}.lang`;

    return (
        <motion.article
            style={vars}
            initial={preview ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            whileHover={preview ? undefined : { y: -4 }}
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card font-mono',
                'transition-[border-color,box-shadow] duration-300',
                'hover:border-[color:var(--brand-line)] hover:shadow-[0_18px_40px_-16px_var(--brand-glow)]',
                !language.isActive && 'opacity-80 hover:opacity-100',
                className,
            )}
        >
            {/* Dải màu thương hiệu trên cùng */}
            <span className="absolute inset-x-0 top-0 h-[2px]" style={{ background: brand.color }} aria-hidden />

            {/* ── Title bar ── */}
            <div className="flex items-center gap-2 h-9 px-3 bg-surface-2/70 border-b border-line transition-colors group-hover:bg-[color:var(--brand-soft)]">
                <span className="flex gap-1.5" aria-hidden>
                    {[1, 0.6, 0.3].map((o) => (
                        <span key={o} className="w-2.5 h-2.5 rounded-full" style={{ background: brand.color, opacity: o }} />
                    ))}
                </span>
                <span className="ml-1 text-[11px] text-fg-muted truncate">{fileName}</span>

                <div className="ml-auto flex items-center gap-1">
                    {!language.isActive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-3 text-fg-muted text-[9px] font-bold uppercase tracking-wider">
                            <EyeOff className="w-3 h-3" /> ẩn
                        </span>
                    )}
                    {!preview && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                                <Tooltip content="Sửa" side="bottom">
                                    <button onClick={() => onEdit(language)} className="w-6 h-6 rounded text-fg-muted hover:text-primary-600 hover:bg-surface flex items-center justify-center transition-colors" aria-label="Sửa ngôn ngữ">
                                        <Edit2 size={12} />
                                    </button>
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip content="Xóa" side="bottom">
                                    <button onClick={() => onDelete(language.id)} className="w-6 h-6 rounded text-fg-muted hover:text-rose-600 hover:bg-surface flex items-center justify-center transition-colors" aria-label="Xóa ngôn ngữ">
                                        <Trash2 size={12} />
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Thân: gutter + các dòng ── */}
            <div className="relative flex-1 flex flex-col">
                <div className="absolute inset-y-0 left-0 w-8 bg-surface-2/40 border-r border-line-2" aria-hidden />
                {/* Watermark dấu ngoặc */}
                <span className="pointer-events-none absolute right-2 -bottom-3 font-black text-6xl leading-none opacity-[0.05] select-none transition-opacity duration-500 group-hover:opacity-[0.1]" style={{ color: brand.color }} aria-hidden>
                    {'{}'}
                </span>

                <div className="relative flex-1 flex flex-col pr-3 py-3 text-[12px]">
                    {/* 01 — logo + tên */}
                    <Line n={1} centered className="min-h-[2.5rem]">
                        <span
                            className={cn('w-9 h-9 flex-shrink-0 rounded-md flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105', !language.isActive && 'grayscale')}
                            style={{ background: 'var(--brand-soft)', boxShadow: 'inset 0 0 0 1px var(--brand-line)' }}
                        >
                            {language.iconUrl ? (
                                <img src={language.iconUrl} alt={language.name} className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : brand.source !== 'hash' ? (
                                <span className="font-black text-sm" style={{ color: 'var(--brand-text)' }}>{initials}</span>
                            ) : (
                                <Code2 className="w-4 h-4" style={{ color: 'var(--brand-text)' }} />
                            )}
                        </span>
                        <h3 className="ml-1.5 font-sans font-bold text-[15px] text-fg truncate transition-colors group-hover:text-[color:var(--brand-text)]">
                            {language.name || 'Tên ngôn ngữ'}
                        </h3>
                    </Line>

                    {/* 02 — slug */}
                    <Line n={2}>
                        <span className="text-fg-muted">slug</span>
                        <span className="text-fg-subtle">:</span>
                        <span className="text-code-600 dark:text-code-400 truncate">"{language.slug || 'slug'}"</span>
                    </Line>

                    {/* 03 — frameworks */}
                    <Line n={3}>
                        <span className="text-fg-muted flex-shrink-0">frameworks</span>
                        <span className="text-fg-subtle flex-shrink-0">:</span>
                        <span className="flex flex-wrap items-center gap-1 min-w-0">
                            <span className="text-fg-subtle">[</span>
                            {fws.length > 0 ? (
                                <>
                                    {fws.slice(0, 4).map((f, i) => {
                                        const fb = resolveFrameworkBrand(f);
                                        return (
                                            <React.Fragment key={f.id}>
                                                <Tooltip content={f.name} side="top">
                                                    <span className="inline-flex items-center gap-1 pl-1 pr-1.5 h-5 rounded bg-surface-2 border border-line text-[10px] font-semibold text-fg-2">
                                                        {f.iconUrl
                                                            ? <img src={f.iconUrl} alt="" className="w-3 h-3 object-contain" loading="lazy" />
                                                            : <span className="w-1.5 h-1.5 rounded-sm" style={{ background: fb.color }} />}
                                                        {f.name}
                                                    </span>
                                                </Tooltip>
                                                {i < Math.min(fws.length, 4) - 1 && <span className="text-fg-subtle">,</span>}
                                            </React.Fragment>
                                        );
                                    })}
                                    {fws.length > 4 && <span className="text-fg-subtle">, …+{fws.length - 4}</span>}
                                </>
                            ) : (
                                <span className="text-fg-subtle italic">{'/* chưa có */'}</span>
                            )}
                            <span className="text-fg-subtle">]</span>
                        </span>
                    </Line>

                    {/* 04 — trạng thái */}
                    <Line n={4}>
                        <span className="text-fg-muted">active</span>
                        <span className="text-fg-subtle">:</span>
                        {language.isActive
                            ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">true</span>
                            : <span className="text-rose-500 dark:text-rose-400 font-semibold">false</span>}
                    </Line>

                    {/* Footer */}
                    <div className="mt-auto pt-3 ml-9">
                        <div className="flex items-center justify-between pt-2 text-[10px] text-fg-subtle border-t border-dashed border-line-2">
                            <span>{language.createdAt ? new Date(language.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                            <span className="inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-sm" style={{ background: brand.color }} />
                                {brand.color.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.article>
    );
};

export default LanguageCard;
