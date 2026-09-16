import { useEffect, useState } from 'react';

/**
 * Màu cho chart, đọc từ design token hiện hành (theme + accent).
 * SVG attribute của Recharts không nhận var(), nên phải resolve ra chuỗi rgb().
 *
 * Bộ màu đã chạy qua validator của dataviz skill với brand mặc định (indigo):
 *  - series (1 chuỗi): primary-500 ở cả light lẫn dark
 *  - ordinal 3 bậc:    light 400/600/800, dark 300/500/700
 */
export interface ChartTheme {
    isDark: boolean;
    /** Màu chuỗi dữ liệu chính */
    series: string;
    /** 3 bậc thứ tự (nhạt → đậm) — Beginner / Intermediate / Advanced */
    ordinal: [string, string, string];
    grid: string;
    text: string;
    textMuted: string;
    surface: string;
}

const readTheme = (): ChartTheme => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    // "99 102 241" → "rgb(99, 102, 241)" (dạng có dấu phẩy để SVG attribute chắc chắn hiểu)
    const rgb = (name: string) => `rgb(${cs.getPropertyValue(name).trim().split(/\s+/).join(', ')})`;
    const isDark = root.classList.contains('dark');

    return {
        isDark,
        series: rgb('--color-primary-500'),
        ordinal: isDark
            ? [rgb('--color-primary-300'), rgb('--color-primary-500'), rgb('--color-primary-700')]
            : [rgb('--color-primary-400'), rgb('--color-primary-600'), rgb('--color-primary-800')],
        grid: rgb('--line'),
        text: rgb('--fg-2'),
        textMuted: rgb('--fg-subtle'),
        surface: rgb('--surface'),
    };
};

export function useChartTheme(): ChartTheme {
    const [theme, setTheme] = useState<ChartTheme>(readTheme);

    useEffect(() => {
        // Theme đổi qua class `dark`, accent đổi qua inline style trên <html>
        const observer = new MutationObserver(() => setTheme(readTheme()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
        return () => observer.disconnect();
    }, []);

    return theme;
}
