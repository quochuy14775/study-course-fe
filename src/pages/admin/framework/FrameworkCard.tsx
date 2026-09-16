import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Layers, EyeOff } from 'lucide-react';
import type { Framework } from '../../../types/framework';
import { resolveFrameworkBrand, resolveLanguageBrand, tint, brandText, CATEGORY_LABEL, CATEGORY_COLOR } from '../../../lib/techBrand';
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

const CORNER = 'absolute w-3 h-3 border-[color:var(--brand-line)] transition-all duration-300 group-hover:border-[color:var(--brand)]';

/**
 * "Blueprint tile" — framework như một chi tiết trên bản thiết kế: nền chấm, 4 góc đánh dấu ⌜⌝⌞⌟
 * (nở ra khi hover), tag nhóm màu category, logo lớn ở giữa, và dải "móng" phía dưới liệt kê
 * ngôn ngữ nó chạy trên (ô vuông, khác với avatar tròn bên trang ngôn ngữ).
 */
const FrameworkCard: React.FC<Props> = ({ framework, onEdit, onDelete, preview = false, className }) => {
    const brand = resolveFrameworkBrand(framework);
    const initials = framework.name.slice(0, 2).toUpperCase() || '?';
    const catColor = brand.category ? CATEGORY_COLOR[brand.category] : undefined;
    const vars = {
        '--brand': brand.color,
        '--brand-text': brandText(brand.color),
        '--brand-soft': tint(brand.color, 12),
        '--brand-line': tint(brand.color, 45),
        '--brand-glow': tint(brand.color, 30),
    } as React.CSSProperties;
    const langs = framework.languages ?? [];

    return (
        <motion.article
            style={vars}
            initial={preview ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            whileHover={preview ? undefined : { y: -4 }}
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-card',
                'transition-[border-color,box-shadow] duration-300',
                'hover:border-[color:var(--brand-line)] hover:shadow-[0_20px_44px_-18px_var(--brand-glow)]',
                className,
            )}
        >
            {/* ── Phần bản vẽ ── */}
            <div className="relative flex-1 flex flex-col">
                {/* Nền chấm blueprint, mờ dần ra rìa */}
                <div className="absolute inset-0 pointer-events-none opacity-60 [background-image:radial-gradient(var(--brand-line)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_50%_40%,black_15%,transparent_75%)]" aria-hidden />

                {/* 4 góc đánh dấu */}
                <span className={cn(CORNER, 'top-3 left-3 border-t border-l rounded-tl-sm group-hover:-translate-x-0.5 group-hover:-translate-y-0.5')} aria-hidden />
                <span className={cn(CORNER, 'top-3 right-3 border-t border-r rounded-tr-sm group-hover:translate-x-0.5 group-hover:-translate-y-0.5')} aria-hidden />
                <span className={cn(CORNER, 'bottom-3 left-3 border-b border-l rounded-bl-sm group-hover:-translate-x-0.5 group-hover:translate-y-0.5')} aria-hidden />
                <span className={cn(CORNER, 'bottom-3 right-3 border-b border-r rounded-br-sm group-hover:translate-x-0.5 group-hover:translate-y-0.5')} aria-hidden />

                {/* Hàng trên: tag nhóm + trạng thái / hành động */}
                <div className="relative flex items-center justify-between gap-2 px-5 pt-5">
                    {catColor && brand.category ? (
                        <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: tint(catColor, 14), color: catColor, boxShadow: `inset 0 0 0 1px ${tint(catColor, 30)}` }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
                            {CATEGORY_LABEL[brand.category]}
                        </span>
                    ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Chưa phân nhóm</span>
                    )}

                    <div className="flex items-center gap-1">
                        {!framework.isActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-3 text-fg-muted text-[10px] font-bold uppercase tracking-wider">
                                <EyeOff className="w-3 h-3" /> ẩn
                            </span>
                        )}
                        {!preview && (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onEdit && (
                                    <Tooltip content="Sửa" side="bottom">
                                        <button onClick={() => onEdit(framework)} className="w-7 h-7 rounded-full bg-surface/90 border border-line text-fg-muted hover:text-primary-600 hover:border-primary-300 flex items-center justify-center shadow-sm transition-colors" aria-label="Sửa framework">
                                            <Edit2 size={12} />
                                        </button>
                                    </Tooltip>
                                )}
                                {onDelete && (
                                    <Tooltip content="Xóa" side="bottom">
                                        <button onClick={() => onDelete(framework.id)} className="w-7 h-7 rounded-full bg-surface/90 border border-line text-fg-muted hover:text-rose-600 hover:border-rose-300 flex items-center justify-center shadow-sm transition-colors" aria-label="Xóa framework">
                                            <Trash2 size={12} />
                                        </button>
                                    </Tooltip>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Logo + tên */}
                <div className={cn('relative flex-1 flex flex-col items-center px-5 pt-5 pb-6', !framework.isActive && 'grayscale')}>
                    <div
                        className="relative w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
                        style={{
                            background: `linear-gradient(145deg, ${tint(brand.color, 24)} 0%, ${tint(brand.color, 6)} 100%)`,
                            boxShadow: 'inset 0 0 0 1px var(--brand-line), 0 12px 28px -14px var(--brand-glow)',
                        }}
                    >
                        {framework.iconUrl ? (
                            <img
                                src={framework.iconUrl}
                                alt={framework.name}
                                className="w-10 h-10 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.15)]"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : brand.source === 'hash' ? (
                            <Layers className="w-8 h-8" style={{ color: 'var(--brand-text)' }} />
                        ) : (
                            <span className="font-black text-2xl tracking-tight" style={{ color: 'var(--brand-text)' }}>{initials}</span>
                        )}
                    </div>

                    <h3 className="mt-3.5 max-w-full font-bold text-fg text-center truncate transition-colors group-hover:text-[color:var(--brand-text)]">
                        {framework.name || 'Tên framework'}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-fg-subtle max-w-full">
                        <span className="truncate">{framework.slug || 'slug'}</span>
                        <span aria-hidden>·</span>
                        <span className="inline-flex items-center gap-1 flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: brand.color }} />
                            {brand.color.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Dải móng: ngôn ngữ chạy trên ── */}
            <div className="relative border-t border-line bg-surface-2/60 px-4 py-2.5 flex items-center gap-2 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-fg-subtle flex-shrink-0">Chạy trên</span>
                {langs.length > 0 ? (
                    <div className="flex items-center gap-1 min-w-0">
                        {langs.slice(0, 4).map((l) => {
                            const lb = resolveLanguageBrand(l);
                            return (
                                <Tooltip key={l.id} content={l.name} side="top">
                                    <span
                                        className="w-6 h-6 rounded-md bg-surface flex items-center justify-center text-[9px] font-black overflow-hidden"
                                        style={{ boxShadow: `inset 0 0 0 1px ${tint(lb.color, 55)}`, color: brandText(lb.color) }}
                                    >
                                        {l.iconUrl
                                            ? <img src={l.iconUrl} alt="" className="w-4 h-4 object-contain" loading="lazy" />
                                            : l.name.slice(0, 2).toUpperCase()}
                                    </span>
                                </Tooltip>
                            );
                        })}
                        {langs.length > 4 && (
                            <span className="w-6 h-6 rounded-md bg-surface-3 text-fg-muted text-[9px] font-bold flex items-center justify-center">+{langs.length - 4}</span>
                        )}
                    </div>
                ) : (
                    <span className="text-[11px] text-fg-subtle italic">chưa gắn ngôn ngữ</span>
                )}
                <span className="ml-auto font-mono text-[10px] text-fg-subtle flex-shrink-0">
                    {framework.createdAt ? new Date(framework.createdAt).toLocaleDateString('vi-VN') : '—'}
                </span>
            </div>
        </motion.article>
    );
};

export default FrameworkCard;
