import React, { useEffect, useRef, useState } from 'react';
import { Palette, Sparkles, Loader2, Check } from 'lucide-react';
import { SOURCE_LABEL, type BrandSource, type ResolvedBrand } from '../lib/techBrand';
import { cn } from '../lib/cn';

interface Props {
    /** #RRGGBB hoặc rỗng */
    value: string;
    onChange: (hex: string) => void;
    /** Chạy chuỗi gợi ý: bảng tra → logo → hash */
    suggest: () => Promise<ResolvedBrand>;
    /** Slug + iconUrl hiện tại — đổi là tự gợi ý lại (chỉ khi admin chưa tự chọn) */
    autoKey: string;
    label?: string;
    hint?: string;
}

const PRESETS = ['#61DAFB', '#42B883', '#DD0031', '#6DB33F', '#512BD4', '#FF2D20', '#3178C6', '#F7DF1E', '#00ADD8', '#0C4B33'];

const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

/**
 * Ô chọn màu thương hiệu: color picker + hex + preset + nút "Gợi ý".
 * Tự gợi ý khi slug/icon đổi, nhưng ngừng tự động ngay khi admin chọn tay (không đè lựa chọn của người).
 */
const BrandColorField: React.FC<Props> = ({ value, onChange, suggest, autoKey, label = 'Màu thương hiệu', hint }) => {
    const [busy, setBusy] = useState(false);
    const [source, setSource] = useState<BrandSource | null>(null);
    const [touched, setTouched] = useState(false);
    const lastKey = useRef<string>('');

    const runSuggest = async (force = false) => {
        if (busy) return;
        if (!force && touched) return;
        setBusy(true);
        try {
            const res = await suggest();
            onChange(res.color);
            setSource(res.source);
            if (force) setTouched(false);
        } finally {
            setBusy(false);
        }
    };

    // Slug / icon đổi → gợi ý lại nếu admin chưa tự chọn (màu đang có chỉ là gợi ý cũ, được phép thay)
    useEffect(() => {
        if (!autoKey || autoKey === lastKey.current) return;
        lastKey.current = autoKey;
        if (!touched) void runSuggest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoKey]);

    const pick = (hex: string) => {
        setTouched(true);
        setSource('db');
        onChange(hex.toUpperCase());
    };

    return (
        <div>
            <label className="text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <Palette size={11} /> {label}
            </label>

            <div className="flex items-center gap-2">
                {/* Swatch + native picker */}
                <label
                    className="relative w-11 h-11 rounded-xl border border-ink-200 overflow-hidden cursor-pointer flex-shrink-0 shadow-inner"
                    style={{ background: isHex(value) ? value : 'repeating-conic-gradient(#e2e8f0 0 25%, #fff 0 50%) 0 0 / 10px 10px' }}
                    title="Chọn màu"
                >
                    <input
                        type="color"
                        value={isHex(value) ? value : '#6366F1'}
                        onChange={(e) => pick(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="Chọn màu thương hiệu"
                    />
                </label>

                <input
                    value={value}
                    onChange={(e) => {
                        const v = e.target.value.trim();
                        setTouched(true);
                        setSource('db');
                        onChange(v.startsWith('#') || v === '' ? v.toUpperCase() : `#${v}`.toUpperCase());
                    }}
                    placeholder="#61DAFB"
                    maxLength={7}
                    className={cn(
                        'flex-1 min-w-0 bg-white text-ink-900 placeholder:text-ink-400 border rounded-xl px-3 py-2.5 text-sm font-mono transition-all outline-none',
                        value && !isHex(value)
                            ? 'border-rose-400 focus:ring-4 focus:ring-rose-300/20'
                            : 'border-ink-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15',
                    )}
                />

                <button
                    type="button"
                    onClick={() => runSuggest(true)}
                    disabled={busy}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 disabled:opacity-60 transition-colors"
                    title="Bảng thương hiệu → logo → tự sinh"
                >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Gợi ý
                </button>
            </div>

            {/* Preset nhanh */}
            <div className="flex items-center gap-1.5 mt-2">
                {PRESETS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => pick(c)}
                        aria-label={c}
                        className="w-5 h-5 rounded-full ring-2 ring-white shadow-sm hover:scale-110 transition-transform flex items-center justify-center"
                        style={{ background: c }}
                    >
                        {value.toUpperCase() === c && <Check size={11} className="text-white drop-shadow" strokeWidth={3} />}
                    </button>
                ))}
            </div>

            <p className="text-[11px] text-ink-400 mt-1.5">
                {source ? `Nguồn: ${SOURCE_LABEL[source]}` : (hint ?? 'Để trống → hệ thống tự gợi ý theo slug, rồi tới logo.')}
                {value && !isHex(value) && <span className="text-rose-600 ml-1">· cần dạng #RRGGBB</span>}
            </p>
        </div>
    );
};

export default BrandColorField;
