import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Code2, EyeOff, Layers } from 'lucide-react';
import type { Language } from '../../../types/language';
import { resolveLanguageBrand, resolveFrameworkBrand, tint, onBrand } from '../../../lib/techBrand';
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

/**
 * "Poster card" cho ngôn ngữ: dải gradient màu thương hiệu + logo lớn, hệ sinh thái framework
 * xếp chồng (mỗi framework viền màu riêng). Hover: nhấc + glow + logo nghiêng.
 */
const LanguageCard: React.FC<Props> = ({ language, onEdit, onDelete, preview = false, className }) => {
    const brand = resolveLanguageBrand(language);
    const initials = language.name.slice(0, 2).toUpperCase() || '?';
    const vars = {
        '--brand': brand.color,
        '--brand-soft': tint(brand.color, 12),
        '--brand-line': tint(brand.color, 45),
        '--brand-glow': tint(brand.color, 30),
    } as React.CSSProperties;
    const fws = language.frameworks ?? [];

    return (
        <motion.div
            style={vars}
            initial={preview ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            whileHover={preview ? undefined : { y: -5 }}
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card',
                'transition-[border-color,box-shadow] duration-300',
                'hover:border-[color:var(--brand-line)] hover:shadow-[0_18px_40px_-16px_var(--brand-glow)]',
                className,
            )}
        >
            {/* ── Dải thương hiệu ── */}
            <div
                className={cn('relative h-28 flex items-center justify-center overflow-hidden', !language.isActive && 'grayscale')}
                style={{ background: `linear-gradient(135deg, ${tint(brand.color, 34)} 0%, ${tint(brand.color, 8)} 100%)` }}
            >
                {/* Ngôn ngữ: họa tiết dấu ngoặc code thay cho lưới */}
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-black text-5xl opacity-[0.08] select-none" style={{ color: brand.color }} aria-hidden>{'{'}</span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-black text-5xl opacity-[0.08] select-none" style={{ color: brand.color }} aria-hidden>{'}'}</span>
                <div className="absolute -top-10 -right-6 w-32 h-32 rounded-full blur-2xl opacity-60" style={{ background: 'var(--brand-glow)' }} />

                {language.iconUrl ? (
                    <img
                        src={language.iconUrl}
                        alt={language.name}
                        className="relative w-16 h-16 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <span
                        className="relative w-16 h-16 rounded-2xl flex items-center justify-center font-mono font-black text-2xl tracking-tight shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                        style={{ background: brand.color, color: onBrand(brand.color) }}
                    >
                        {brand.source === 'hash' ? <Code2 className="w-7 h-7" /> : initials}
                    </span>
                )}

                {/* Số framework */}
                {fws.length > 0 && (
                    <span
                        className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                        style={{ background: tint(brand.color, 18), color: brand.color, boxShadow: 'inset 0 0 0 1px var(--brand-line)' }}
                    >
                        <Layers className="w-3 h-3" /> {fws.length} framework
                    </span>
                )}

                <div className="absolute top-3 right-3 flex items-center gap-1">
                    {!language.isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink-900/70 text-white text-[10px] font-bold backdrop-blur-sm">
                            <EyeOff className="w-3 h-3" /> ẨN
                        </span>
                    )}
                    {!preview && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                                <Tooltip content="Sửa" side="bottom">
                                    <button onClick={() => onEdit(language)} className="w-7 h-7 rounded-lg bg-white/80 dark:bg-ink-900/70 backdrop-blur-sm text-fg-2 hover:text-primary-600 flex items-center justify-center shadow-sm transition-colors" aria-label="Sửa ngôn ngữ">
                                        <Edit2 size={13} />
                                    </button>
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip content="Xóa" side="bottom">
                                    <button onClick={() => onDelete(language.id)} className="w-7 h-7 rounded-lg bg-white/80 dark:bg-ink-900/70 backdrop-blur-sm text-fg-2 hover:text-rose-600 flex items-center justify-center shadow-sm transition-colors" aria-label="Xóa ngôn ngữ">
                                        <Trash2 size={13} />
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Thân ── */}
            <div className="flex-1 flex flex-col p-4">
                <div className="flex items-baseline gap-2 min-w-0">
                    <h3 className="font-bold text-fg truncate transition-colors group-hover:text-[color:var(--brand)]">{language.name || 'Tên ngôn ngữ'}</h3>
                    <span className="font-mono text-[10px] text-fg-subtle truncate">{language.slug || 'slug'}</span>
                </div>

                {/* Hệ sinh thái framework */}
                <div className="mt-3 flex items-center gap-2 min-w-0">
                    {fws.length > 0 ? (
                        <>
                            <div className="flex -space-x-1.5 flex-shrink-0">
                                {fws.slice(0, 4).map((f) => {
                                    const fb = resolveFrameworkBrand(f);
                                    return (
                                        <Tooltip key={f.id} content={f.name} side="top">
                                            <span
                                                className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-[9px] font-black ring-2 ring-surface overflow-hidden"
                                                style={{ boxShadow: `0 0 0 1.5px ${fb.color}`, color: fb.color }}
                                            >
                                                {f.iconUrl
                                                    ? <img src={f.iconUrl} alt="" className="w-4 h-4 object-contain" loading="lazy" />
                                                    : f.name.slice(0, 2).toUpperCase()}
                                            </span>
                                        </Tooltip>
                                    );
                                })}
                                {fws.length > 4 && (
                                    <span className="w-6 h-6 rounded-full bg-surface-2 text-fg-muted text-[9px] font-bold flex items-center justify-center ring-2 ring-surface">+{fws.length - 4}</span>
                                )}
                            </div>
                            <span className="text-[11px] text-fg-muted truncate">
                                {fws.slice(0, 3).map((f) => f.name).join(' · ')}{fws.length > 3 ? ' · …' : ''}
                            </span>
                        </>
                    ) : (
                        <span className="text-[11px] text-fg-subtle italic">Chưa có framework</span>
                    )}
                </div>

                <div className="mt-auto pt-3 flex items-center justify-between text-[10px] font-mono text-fg-subtle">
                    <span>{language.createdAt ? new Date(language.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: brand.color }} />
                        {brand.color.toUpperCase()}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default LanguageCard;
