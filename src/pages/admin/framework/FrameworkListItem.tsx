import React from 'react';
import { Edit2, Trash2, Calendar, Layers } from 'lucide-react';
import type { Framework } from '../../../types/framework';
import { resolveFrameworkBrand, resolveLanguageBrand, tint, brandText, CATEGORY_LABEL, CATEGORY_COLOR } from '../../../lib/techBrand';
import { Tooltip } from '../../../components/ui/Tooltip';
import { cn } from '../../../lib/cn';

interface Props {
    framework: Framework;
    onEdit?: (framework: Framework) => void;
    onDelete?: (id: number) => void;
}

/**
 * "Stack row" — hàng gồm hai lớp: bên trái là framework (logo, tên, tag nhóm, trạng thái),
 * bên phải là khối "móng" liệt kê ngôn ngữ nó chạy trên. Mép trái có glyph 3 thanh xếp chồng
 * màu thương hiệu, nền chấm blueprint mờ dần.
 */
const FrameworkListItem: React.FC<Props> = ({ framework, onEdit, onDelete }) => {
    const brand = resolveFrameworkBrand(framework);
    const initials = framework.name.slice(0, 2).toUpperCase();
    const catColor = brand.category ? CATEGORY_COLOR[brand.category] : undefined;
    const vars = {
        '--brand': brand.color,
        '--brand-text': brandText(brand.color),
        '--brand-soft': tint(brand.color, 12),
        '--brand-line': tint(brand.color, 45),
        '--brand-glow': tint(brand.color, 28),
    } as React.CSSProperties;
    const langs = framework.languages ?? [];

    return (
        <div
            style={vars}
            className={cn(
                'group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card',
                'transition-[border-color,box-shadow,transform] duration-300',
                'hover:-translate-y-0.5 hover:border-[color:var(--brand-line)] hover:shadow-[0_14px_32px_-14px_var(--brand-glow)]',
                !framework.isActive && 'opacity-75 hover:opacity-100',
            )}
        >
            {/* Nền chấm blueprint, mờ dần sang phải */}
            <div className="absolute inset-y-0 left-0 w-56 pointer-events-none opacity-50 [background-image:radial-gradient(var(--brand-line)_1px,transparent_1px)] [background-size:12px_12px] [mask-image:linear-gradient(to_right,black,transparent)]" aria-hidden />

            {/* Glyph 3 thanh xếp chồng */}
            <span className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-[3px]" aria-hidden>
                {[1, 0.55, 0.25].map((o) => (
                    <span key={o} className="w-1 h-3 rounded-r-full transition-all duration-300 group-hover:w-1.5" style={{ background: brand.color, opacity: o }} />
                ))}
            </span>

            <div className="relative flex flex-col md:flex-row md:items-center gap-3 md:gap-5 p-4 pl-5">
                {/* ── Lớp framework ── */}
                <div className="flex items-center gap-3.5 min-w-0 md:flex-1">
                    <div
                        className={cn('w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105', !framework.isActive && 'grayscale')}
                        style={{
                            background: `linear-gradient(145deg, ${tint(brand.color, 24)} 0%, ${tint(brand.color, 6)} 100%)`,
                            boxShadow: 'inset 0 0 0 1px var(--brand-line)',
                        }}
                    >
                        {framework.iconUrl ? (
                            <img src={framework.iconUrl} alt={framework.name} className="w-7 h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : brand.source !== 'hash' ? (
                            <span className="font-black text-base tracking-tight" style={{ color: 'var(--brand-text)' }}>{initials}</span>
                        ) : (
                            <Layers className="w-5 h-5" style={{ color: 'var(--brand-text)' }} />
                        )}
                    </div>

                    <div className="min-w-0 pr-16 md:pr-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                            <h3 className="font-bold text-fg truncate transition-colors group-hover:text-[color:var(--brand-text)]">{framework.name}</h3>
                            <span className="font-mono text-[10px] text-fg-subtle truncate">{framework.slug}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {catColor && brand.category ? (
                                <span
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                    style={{ background: tint(catColor, 14), color: catColor, boxShadow: `inset 0 0 0 1px ${tint(catColor, 30)}` }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
                                    {CATEGORY_LABEL[brand.category]}
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full bg-surface-2 text-fg-subtle text-[10px] font-semibold uppercase tracking-wider">Chưa phân nhóm</span>
                            )}
                            {framework.isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hoạt động
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-2 text-fg-muted text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-fg-subtle" /> Đang ẩn
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-fg-subtle">
                                <Calendar size={10} />
                                {new Date(framework.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Lớp móng: ngôn ngữ chạy trên ── */}
                <div className="flex items-center gap-2.5 min-w-0 md:max-w-[46%] rounded-xl bg-surface-2/70 border border-line-2 px-3 py-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-fg-subtle flex-shrink-0">Chạy trên</span>
                    {langs.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 min-w-0">
                            {langs.slice(0, 5).map((l) => {
                                const lb = resolveLanguageBrand(l);
                                return (
                                    <span
                                        key={l.id}
                                        className="inline-flex items-center gap-1.5 pl-1 pr-2 h-6 rounded-md bg-surface text-[10px] font-semibold text-fg-2"
                                        style={{ boxShadow: `inset 0 0 0 1px ${tint(lb.color, 50)}` }}
                                    >
                                        <span className="w-4 h-4 rounded flex items-center justify-center overflow-hidden" style={{ background: tint(lb.color, 16) }}>
                                            {l.iconUrl
                                                ? <img src={l.iconUrl} alt="" className="w-3 h-3 object-contain" loading="lazy" />
                                                : <span className="w-1.5 h-1.5 rounded-sm" style={{ background: lb.color }} />}
                                        </span>
                                        {l.name}
                                    </span>
                                );
                            })}
                            {langs.length > 5 && (
                                <span className="px-1.5 h-6 inline-flex items-center rounded-md bg-surface-3 text-fg-muted text-[10px] font-bold">+{langs.length - 5}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-[11px] text-fg-subtle italic">chưa gắn ngôn ngữ</span>
                    )}
                </div>

                {/* ── Hành động ── */}
                <div className="absolute top-3 right-3 md:static flex gap-1 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {onEdit && (
                        <Tooltip content="Sửa" side="top">
                            <button onClick={() => onEdit(framework)} className="w-8 h-8 rounded-full border border-line bg-surface text-fg-subtle hover:text-primary-600 hover:border-primary-300 flex items-center justify-center transition-colors" aria-label="Sửa framework">
                                <Edit2 size={13} />
                            </button>
                        </Tooltip>
                    )}
                    {onDelete && (
                        <Tooltip content="Xóa" side="top">
                            <button onClick={() => onDelete(framework.id)} className="w-8 h-8 rounded-full border border-line bg-surface text-fg-subtle hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition-colors" aria-label="Xóa framework">
                                <Trash2 size={13} />
                            </button>
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FrameworkListItem;
