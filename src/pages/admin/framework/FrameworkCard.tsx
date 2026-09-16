import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Layers, EyeOff } from 'lucide-react';
import type { Framework } from '../../../types/framework';
import { resolveFrameworkBrand, resolveLanguageBrand, tint, onBrand, CATEGORY_LABEL } from '../../../lib/techBrand';
import { Tooltip } from '../../../components/ui/Tooltip';
import { cn } from '../../../lib/cn';

interface Props {
    framework: Framework;
    onEdit?: (framework: Framework) => void;
    onDelete?: (id: number) => void;
    /** Dùng trong dialog: không có nút, không animation entrance */
    preview?: boolean;
    className?: string;
}

/**
 * "Poster card" cho framework: dải gradient màu thương hiệu + logo lớn, chip nhóm,
 * avatar ngôn ngữ xếp chồng (mỗi cái viền màu riêng). Hover: nhấc + glow + logo nghiêng.
 */
const FrameworkCard: React.FC<Props> = ({ framework, onEdit, onDelete, preview = false, className }) => {
    const brand = resolveFrameworkBrand(framework);
    const initials = framework.name.slice(0, 2).toUpperCase() || '?';
    const vars = {
        '--brand': brand.color,
        '--brand-soft': tint(brand.color, 12),
        '--brand-line': tint(brand.color, 45),
        '--brand-glow': tint(brand.color, 30),
    } as React.CSSProperties;
    const langs = framework.languages ?? [];

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
                className={cn('relative h-28 flex items-center justify-center overflow-hidden', !framework.isActive && 'grayscale')}
                style={{ background: `linear-gradient(135deg, ${tint(brand.color, 34)} 0%, ${tint(brand.color, 8)} 100%)` }}
            >
                {/* lưới mờ + vệt sáng */}
                <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,var(--brand)_1px,transparent_1px),linear-gradient(to_bottom,var(--brand)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_75%)]" />
                <div className="absolute -top-10 -right-6 w-32 h-32 rounded-full blur-2xl opacity-60" style={{ background: 'var(--brand-glow)' }} />

                {/* Logo / chữ cái */}
                {framework.iconUrl ? (
                    <img
                        src={framework.iconUrl}
                        alt={framework.name}
                        className="relative w-16 h-16 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <span
                        className="relative w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl tracking-tight shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                        style={{ background: brand.color, color: onBrand(brand.color) }}
                    >
                        {brand.source === 'hash' ? <Layers className="w-7 h-7" /> : initials}
                    </span>
                )}

                {/* Chip nhóm */}
                {brand.category && (
                    <span
                        className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                        style={{ background: tint(brand.color, 18), color: brand.color, boxShadow: 'inset 0 0 0 1px var(--brand-line)' }}
                    >
                        {CATEGORY_LABEL[brand.category]}
                    </span>
                )}

                {/* Trạng thái / hành động */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                    {!framework.isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink-900/70 text-white text-[10px] font-bold backdrop-blur-sm">
                            <EyeOff className="w-3 h-3" /> ẨN
                        </span>
                    )}
                    {!preview && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                                <Tooltip content="Sửa" side="bottom">
                                    <button onClick={() => onEdit(framework)} className="w-7 h-7 rounded-lg bg-white/80 dark:bg-ink-900/70 backdrop-blur-sm text-fg-2 hover:text-primary-600 flex items-center justify-center shadow-sm transition-colors" aria-label="Sửa framework">
                                        <Edit2 size={13} />
                                    </button>
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip content="Xóa" side="bottom">
                                    <button onClick={() => onDelete(framework.id)} className="w-7 h-7 rounded-lg bg-white/80 dark:bg-ink-900/70 backdrop-blur-sm text-fg-2 hover:text-rose-600 flex items-center justify-center shadow-sm transition-colors" aria-label="Xóa framework">
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
                    <h3 className="font-bold text-fg truncate transition-colors group-hover:text-[color:var(--brand)]">{framework.name || 'Tên framework'}</h3>
                    <span className="font-mono text-[10px] text-fg-subtle truncate">{framework.slug || 'slug'}</span>
                </div>

                {/* Ngôn ngữ chạy trên — avatar xếp chồng + tên */}
                <div className="mt-3 flex items-center gap-2 min-w-0">
                    {langs.length > 0 ? (
                        <>
                            <div className="flex -space-x-1.5 flex-shrink-0">
                                {langs.slice(0, 4).map((l) => {
                                    const lb = resolveLanguageBrand(l);
                                    return (
                                        <Tooltip key={l.id} content={l.name} side="top">
                                            <span
                                                className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-[9px] font-black ring-2 ring-surface overflow-hidden"
                                                style={{ boxShadow: `0 0 0 1.5px ${lb.color}`, color: lb.color }}
                                            >
                                                {l.iconUrl
                                                    ? <img src={l.iconUrl} alt="" className="w-4 h-4 object-contain" loading="lazy" />
                                                    : l.name.slice(0, 2).toUpperCase()}
                                            </span>
                                        </Tooltip>
                                    );
                                })}
                                {langs.length > 4 && (
                                    <span className="w-6 h-6 rounded-full bg-surface-2 text-fg-muted text-[9px] font-bold flex items-center justify-center ring-2 ring-surface">+{langs.length - 4}</span>
                                )}
                            </div>
                            <span className="text-[11px] text-fg-muted truncate">
                                {langs.slice(0, 3).map((l) => l.name).join(' · ')}{langs.length > 3 ? ' · …' : ''}
                            </span>
                        </>
                    ) : (
                        <span className="text-[11px] text-fg-subtle italic">Chưa gắn ngôn ngữ</span>
                    )}
                </div>

                <div className="mt-auto pt-3 flex items-center justify-between text-[10px] font-mono text-fg-subtle">
                    <span>{framework.createdAt ? new Date(framework.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: brand.color }} />
                        {brand.color.toUpperCase()}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default FrameworkCard;
