import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';

/**
 * Bảng màu accent. Mỗi entry ghi đè --color-primary-* và --color-accent-* (dạng "r g b")
 * mà tailwind.config.js đọc qua rgb(var(--x) / alpha). Giá trị mặc định (khi chưa chọn)
 * nằm ở src/index.css; entry 'violet' trùng với mặc định để không đổi diện mạo.
 */
type Scale = [string, string, string, string, string, string, string, string, string, string];

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

// Tailwind v3 palettes, r g b
const PALETTE: Record<string, Scale> = {
    indigo:  ['238 242 255', '224 231 255', '199 210 254', '165 180 252', '129 140 248', '99 102 241',  '79 70 229',   '67 56 202',   '55 48 163',   '49 46 129'],
    violet:  ['245 243 255', '237 233 254', '221 214 254', '196 181 253', '167 139 250', '139 92 246',  '124 58 237',  '109 40 217',  '91 33 182',   '76 29 149'],
    purple:  ['250 245 255', '243 232 255', '233 213 255', '216 180 254', '192 132 252', '168 85 247',  '147 51 234',  '126 34 206',  '107 33 168',  '88 28 135'],
    blue:    ['239 246 255', '219 234 254', '191 219 254', '147 197 253', '96 165 250',  '59 130 246',  '37 99 235',   '29 78 216',   '30 64 175',   '30 58 138'],
    sky:     ['240 249 255', '224 242 254', '186 230 253', '125 211 252', '56 189 248',  '14 165 233',  '2 132 199',   '3 105 161',   '7 89 133',    '12 74 110'],
    emerald: ['236 253 245', '209 250 229', '167 243 208', '110 231 183', '52 211 153',  '16 185 129',  '5 150 105',   '4 120 87',    '6 95 70',     '6 78 59'],
    teal:    ['240 253 250', '204 251 241', '153 246 228', '94 234 212',  '45 212 191',  '20 184 166',  '13 148 136',  '15 118 110',  '17 94 89',    '19 78 74'],
    rose:    ['255 241 242', '255 228 230', '254 205 211', '253 164 175', '251 113 133', '244 63 94',   '225 29 72',   '190 18 60',   '159 18 57',   '136 19 55'],
    pink:    ['253 242 248', '252 231 243', '251 207 232', '249 168 212', '244 114 182', '236 72 153',  '219 39 119',  '190 24 93',   '157 23 77',   '131 24 67'],
    amber:   ['255 251 235', '254 243 199', '253 230 138', '252 211 77',  '251 191 36',  '245 158 11',  '217 119 6',   '180 83 9',    '146 64 14',   '120 53 15'],
    orange:  ['255 247 237', '255 237 213', '254 215 170', '253 186 116', '251 146 60',  '249 115 22',  '234 88 12',   '194 65 12',   '154 52 18',   '124 45 18'],
    cyan:    ['236 254 255', '207 250 254', '165 243 252', '103 232 249', '34 211 238',  '6 182 212',   '8 145 178',   '14 116 144',  '21 94 117',   '22 78 99'],
};

// accent id (settingsStore) → [primary palette, accent palette]
const ACCENT_MAP: Record<string, [string, string]> = {
    violet:  ['indigo',  'violet'],
    blue:    ['blue',    'indigo'],
    emerald: ['emerald', 'teal'],
    rose:    ['rose',    'pink'],
    amber:   ['amber',   'orange'],
    cyan:    ['cyan',    'sky'],
};

const FONT_SIZE_MAP: Record<string, string> = {
    sm: '13px',
    md: '15px',
    lg: '17px',
};

export function useApplySettings() {
    const { themeMode, accentColor, fontSize, sidebarDefaultCollapsed, reducedMotion } = useSettingsStore();
    const { sidebarCollapsed, toggleSidebarCollapsed } = useUiStore();

    // Apply theme (light/dark/system)
    useEffect(() => {
        const root = document.documentElement;
        const apply = (isDark: boolean) => {
            root.classList.toggle('dark', isDark);
            // Thanh địa chỉ / status bar trên mobile khớp với nền
            document.querySelector('meta[name="theme-color"]')
                ?.setAttribute('content', isDark ? '#0b1220' : '#6366f1');
        };

        if (themeMode === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            apply(mq.matches);
            const handler = (e: MediaQueryListEvent) => apply(e.matches);
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
        apply(themeMode === 'dark');
    }, [themeMode]);

    // Apply accent color CSS vars
    useEffect(() => {
        const [primaryName, accentName] = ACCENT_MAP[accentColor] ?? ACCENT_MAP.violet;
        const root = document.documentElement;
        SHADES.forEach((shade, i) => {
            root.style.setProperty(`--color-primary-${shade}`, PALETTE[primaryName][i]);
            root.style.setProperty(`--color-accent-${shade}`, PALETTE[accentName][i]);
        });
    }, [accentColor]);

    // Apply font size
    useEffect(() => {
        document.documentElement.style.setProperty('--app-font-size', FONT_SIZE_MAP[fontSize] ?? '15px');
        document.documentElement.style.fontSize = FONT_SIZE_MAP[fontSize] ?? '15px';
    }, [fontSize]);

    // Apply reduced motion
    useEffect(() => {
        document.documentElement.style.setProperty(
            '--motion-duration',
            reducedMotion ? '0ms' : ''
        );
        document.documentElement.classList.toggle('reduce-motion', reducedMotion);
    }, [reducedMotion]);

    // Apply sidebar default collapsed (once on mount)
    useEffect(() => {
        if (sidebarDefaultCollapsed && !sidebarCollapsed) {
            toggleSidebarCollapsed();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
