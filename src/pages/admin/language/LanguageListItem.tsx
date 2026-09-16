import React from 'react';
import { Edit2, Trash2, Code2 } from 'lucide-react';
import type { Language } from '../../../types/language';
import { resolveLanguageBrand, resolveFrameworkBrand, tint, brandText } from '../../../lib/techBrand';
import { Tooltip } from '../../../components/ui/Tooltip';
import { cn } from '../../../lib/cn';

interface Props {
    language: Language;
    /** Thứ tự trong danh sách (0-based) — hiện làm số dòng ở gutter */
    index: number;
    onEdit?: (language: Language) => void;
    onDelete?: (id: number) => void;
}

/** Cột của hàng — phải khớp với header trong trang (md+). */
export const LANGUAGE_ROW_COLS =
    'grid-cols-[2.25rem_minmax(0,1fr)_auto] md:grid-cols-[2.5rem_minmax(0,1.25fr)_minmax(0,2fr)_4.5rem_5.5rem_3.75rem]';

/**
 * Một "dòng code" trong editor: số dòng ở gutter, logo + tên, rồi `=> [React, Vue, …]`,
 * `true/false`, ngày tạo. Hover tô nền màu thương hiệu nhạt như đang chọn dòng, số dòng đổi màu.
 */
const LanguageListItem: React.FC<Props> = ({ language, index, onEdit, onDelete }) => {
    const brand = resolveLanguageBrand(language);
    const initials = language.name.slice(0, 2).toUpperCase();
    const vars = {
        '--brand': brand.color,
        '--brand-text': brandText(brand.color),
        '--brand-soft': tint(brand.color, 10),
        '--brand-line': tint(brand.color, 45),
    } as React.CSSProperties;
    const fws = language.frameworks ?? [];

    return (
        <div
            style={vars}
            className={cn(
                'group relative grid items-center gap-x-3 gap-y-1.5 px-3 py-2.5 font-mono transition-colors',
                LANGUAGE_ROW_COLS,
                'hover:bg-[color:var(--brand-soft)]',
                !language.isActive && 'opacity-70 hover:opacity-100',
            )}
        >
            {/* Thanh chọn dòng bên trái */}
            <span className="absolute left-0 inset-y-1 w-0.5 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: brand.color }} aria-hidden />

            {/* Số dòng */}
            <span className="text-[11px] text-fg-subtle tabular-nums text-right pr-1 select-none transition-colors group-hover:text-[color:var(--brand-text)] group-hover:font-bold" aria-hidden>
                {String(index + 1).padStart(2, '0')}
            </span>

            {/* Logo + tên + slug */}
            <div className="flex items-center gap-2.5 min-w-0">
                <span
                    className={cn('w-8 h-8 flex-shrink-0 rounded-md flex items-center justify-center overflow-hidden', !language.isActive && 'grayscale')}
                    style={{ background: tint(brand.color, 12), boxShadow: 'inset 0 0 0 1px var(--brand-line)' }}
                >
                    {language.iconUrl ? (
                        <img src={language.iconUrl} alt={language.name} className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : brand.source !== 'hash' ? (
                        <span className="font-black text-xs" style={{ color: 'var(--brand-text)' }}>{initials}</span>
                    ) : (
                        <Code2 className="w-4 h-4" style={{ color: 'var(--brand-text)' }} />
                    )}
                </span>
                <div className="min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-sans font-bold text-sm text-fg truncate transition-colors group-hover:text-[color:var(--brand-text)]">{language.name}</h3>
                        {/* Trạng thái rút gọn cho mobile */}
                        <span className={cn('md:hidden w-1.5 h-1.5 rounded-full flex-shrink-0', language.isActive ? 'bg-emerald-500' : 'bg-fg-subtle')} aria-label={language.isActive ? 'Đang hoạt động' : 'Đang ẩn'} />
                    </div>
                    <div className="text-[10px] truncate">
                        <span className="text-fg-subtle">slug: </span>
                        <span className="text-code-600 dark:text-code-400">"{language.slug}"</span>
                    </div>
                </div>
            </div>

            {/* Frameworks — hàng 2 trên mobile, cột riêng trên md+ */}
            <div className="col-start-2 col-span-2 md:col-start-auto md:col-span-1 flex flex-wrap items-center gap-1 min-w-0 text-[11px]">
                <span className="text-fg-subtle">=&gt;</span>
                <span className="text-fg-subtle">[</span>
                {fws.length > 0 ? (
                    <>
                        {fws.slice(0, 5).map((fw, i) => {
                            const fb = resolveFrameworkBrand(fw);
                            return (
                                <React.Fragment key={fw.id}>
                                    <Tooltip content={fw.name} side="top">
                                        <span className="inline-flex items-center gap-1 pl-1 pr-1.5 h-5 rounded bg-surface-2 border border-line text-[10px] font-semibold text-fg-2">
                                            {fw.iconUrl
                                                ? <img src={fw.iconUrl} alt="" className="w-3 h-3 object-contain" loading="lazy" />
                                                : <span className="w-1.5 h-1.5 rounded-sm" style={{ background: fb.color }} />}
                                            {fw.name}
                                        </span>
                                    </Tooltip>
                                    {i < Math.min(fws.length, 5) - 1 && <span className="text-fg-subtle">,</span>}
                                </React.Fragment>
                            );
                        })}
                        {fws.length > 5 && <span className="text-fg-subtle">, …+{fws.length - 5}</span>}
                    </>
                ) : (
                    <span className="text-fg-subtle italic">{'/* chưa có */'}</span>
                )}
                <span className="text-fg-subtle">]</span>
            </div>

            {/* Trạng thái */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px]">
                <span className={cn('w-1.5 h-1.5 rounded-full', language.isActive ? 'bg-emerald-500' : 'bg-fg-subtle')} />
                {language.isActive
                    ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">true</span>
                    : <span className="text-fg-muted font-semibold">false</span>}
            </div>

            {/* Ngày tạo */}
            <div className="hidden md:block text-[11px] text-fg-subtle tabular-nums">
                {new Date(language.createdAt).toLocaleDateString('vi-VN')}
            </div>

            {/* Hành động */}
            <div className="flex justify-end gap-0.5 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {onEdit && (
                    <Tooltip content="Sửa" side="top">
                        <button onClick={() => onEdit(language)} className="w-7 h-7 rounded-md text-fg-subtle hover:text-primary-600 hover:bg-surface flex items-center justify-center transition-colors" aria-label="Sửa ngôn ngữ">
                            <Edit2 size={13} />
                        </button>
                    </Tooltip>
                )}
                {onDelete && (
                    <Tooltip content="Xóa" side="top">
                        <button onClick={() => onDelete(language.id)} className="w-7 h-7 rounded-md text-fg-subtle hover:text-rose-600 hover:bg-surface flex items-center justify-center transition-colors" aria-label="Xóa ngôn ngữ">
                            <Trash2 size={13} />
                        </button>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};

export default LanguageListItem;
