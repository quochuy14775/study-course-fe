import React from 'react';
import { Edit2, Trash2, Calendar, Code2 } from 'lucide-react';
import type { Language } from '../../../types/language';
import { resolveLanguageBrand, resolveFrameworkBrand, tint } from '../../../lib/techBrand';
import { cn } from '../../../lib/cn';

interface Props {
    language: Language;
    onEdit?: (language: Language) => void;
    onDelete?: (id: number) => void;
}

/**
 * Card ngôn ngữ mang màu thương hiệu (JavaScript vàng, TypeScript xanh, Python xanh dương…):
 * thanh viền trái, nền icon, viền/glow khi hover; framework đi kèm hiện chấm màu riêng của chúng.
 */
const LanguageListItem: React.FC<Props> = ({ language, onEdit, onDelete }) => {
    const brand = resolveLanguageBrand(language);
    const initials = language.name.slice(0, 2).toUpperCase();
    const vars = {
        '--brand': brand.color,
        '--brand-soft': tint(brand.color, 12),
        '--brand-line': tint(brand.color, 45),
        '--brand-glow': tint(brand.color, 28),
    } as React.CSSProperties;

    return (
        <div
            style={vars}
            className={cn(
                'group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card',
                'transition-[border-color,box-shadow,transform] duration-300',
                'hover:-translate-y-0.5 hover:border-[color:var(--brand-line)] hover:shadow-[0_14px_32px_-14px_var(--brand-glow)]',
                !language.isActive && 'opacity-75 hover:opacity-100',
            )}
        >
            <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ background: brand.color }} aria-hidden />

            {language.iconUrl ? (
                <img
                    src={language.iconUrl}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute right-20 -bottom-5 w-28 h-28 object-contain opacity-[0.06] grayscale transition-all duration-500 group-hover:opacity-[0.14] group-hover:grayscale-0 group-hover:-rotate-6"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            ) : (
                <span
                    className="pointer-events-none absolute right-24 -bottom-4 font-black text-[84px] leading-none opacity-[0.05] select-none transition-opacity duration-500 group-hover:opacity-[0.09]"
                    style={{ color: brand.color }}
                    aria-hidden
                >
                    {initials.charAt(0)}
                </span>
            )}

            <div className="relative flex items-center gap-4 p-4 pl-5">
                <div
                    className="relative w-14 h-14 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105"
                    style={{ background: 'var(--brand-soft)', boxShadow: 'inset 0 0 0 1px var(--brand-line)' }}
                >
                    {language.iconUrl ? (
                        <img
                            src={language.iconUrl}
                            alt={language.name}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    ) : brand.source !== 'hash' ? (
                        <span className="font-black text-lg tracking-tight" style={{ color: brand.color }}>{initials}</span>
                    ) : (
                        <Code2 className="w-6 h-6" style={{ color: brand.color }} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-fg truncate transition-colors group-hover:text-[color:var(--brand)]">
                            {language.name}
                        </h3>
                        <span className="font-mono text-[10px] text-fg-subtle bg-surface-2 border border-line px-1.5 py-0.5 rounded">
                            {language.slug}
                        </span>
                        {language.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 text-[10px] font-bold">
                                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                ACTIVE
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-2 text-fg-muted text-[10px] font-bold">
                                <span className="w-1 h-1 rounded-full bg-fg-subtle" />
                                INACTIVE
                            </span>
                        )}
                    </div>

                    {/* Framework chips — mỗi framework một chấm màu thương hiệu riêng */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {language.frameworks?.length > 0 ? (
                            <>
                                <span className="text-[10px] uppercase tracking-wider text-fg-subtle font-semibold mr-0.5">Framework</span>
                                {language.frameworks.slice(0, 5).map((fw) => {
                                    const fb = resolveFrameworkBrand(fw);
                                    return (
                                        <span
                                            key={fw.id}
                                            className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-md bg-surface-2 border border-line text-[10px] font-semibold text-fg-2"
                                        >
                                            {fw.iconUrl
                                                ? <img src={fw.iconUrl} alt="" className="w-3 h-3 object-contain" loading="lazy" />
                                                : <span className="w-2 h-2 rounded-full" style={{ background: fb.color }} />}
                                            {fw.name}
                                        </span>
                                    );
                                })}
                                {language.frameworks.length > 5 && (
                                    <span className="px-2 py-0.5 bg-surface-2 text-fg-muted rounded-md text-[10px]">
                                        +{language.frameworks.length - 5}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-[11px] text-fg-subtle italic">Chưa có framework</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-fg-subtle font-mono">
                        <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(language.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {language.frameworks?.length > 0 && <span>· {language.frameworks.length} framework</span>}
                    </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(language)}
                            className="p-2 rounded-lg text-fg-subtle hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/15 transition-colors"
                            title="Sửa ngôn ngữ"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(language.id)}
                            className="p-2 rounded-lg text-fg-subtle hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors"
                            title="Xóa ngôn ngữ"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LanguageListItem;
