import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';

// Maps accent color id → Tailwind / HSL values injected as CSS vars
const ACCENT_MAP: Record<string, Record<string, string>> = {
    violet: {
        '--color-primary-50':  '245 243 255',
        '--color-primary-100': '237 233 254',
        '--color-primary-200': '221 214 254',
        '--color-primary-300': '196 181 253',
        '--color-primary-400': '167 139 250',
        '--color-primary-500': '139 92  246',
        '--color-primary-600': '124 58  237',
        '--color-primary-700': '109 40  217',
        '--color-accent-400':  '192 132 252',
        '--color-accent-500':  '168 85  247',
        '--color-accent-600':  '147 51  234',
    },
    blue: {
        '--color-primary-50':  '239 246 255',
        '--color-primary-100': '219 234 254',
        '--color-primary-200': '191 219 254',
        '--color-primary-300': '147 197 253',
        '--color-primary-400': '96  165 250',
        '--color-primary-500': '59  130 246',
        '--color-primary-600': '37  99  235',
        '--color-primary-700': '29  78  216',
        '--color-accent-400':  '129 140 248',
        '--color-accent-500':  '99  102 241',
        '--color-accent-600':  '79  70  229',
    },
    emerald: {
        '--color-primary-50':  '236 253 245',
        '--color-primary-100': '209 250 229',
        '--color-primary-200': '167 243 208',
        '--color-primary-300': '110 231 183',
        '--color-primary-400': '52  211 153',
        '--color-primary-500': '16  185 129',
        '--color-primary-600': '5   150 105',
        '--color-primary-700': '4   120 87',
        '--color-accent-400':  '52  211 153',
        '--color-accent-500':  '20  184 166',
        '--color-accent-600':  '13  148 136',
    },
    rose: {
        '--color-primary-50':  '255 241 242',
        '--color-primary-100': '255 228 230',
        '--color-primary-200': '254 205 211',
        '--color-primary-300': '253 164 175',
        '--color-primary-400': '251 113 133',
        '--color-primary-500': '244 63  94',
        '--color-primary-600': '225 29  72',
        '--color-primary-700': '190 18  60',
        '--color-accent-400':  '251 113 133',
        '--color-accent-500':  '244 63  94',
        '--color-accent-600':  '225 29  72',
    },
    amber: {
        '--color-primary-50':  '255 251 235',
        '--color-primary-100': '254 243 199',
        '--color-primary-200': '253 230 138',
        '--color-primary-300': '252 211 77',
        '--color-primary-400': '251 191 36',
        '--color-primary-500': '245 158 11',
        '--color-primary-600': '217 119 6',
        '--color-primary-700': '180 83  9',
        '--color-accent-400':  '251 146 60',
        '--color-accent-500':  '249 115 22',
        '--color-accent-600':  '234 88  12',
    },
    cyan: {
        '--color-primary-50':  '236 254 255',
        '--color-primary-100': '207 250 254',
        '--color-primary-200': '165 243 252',
        '--color-primary-300': '103 232 249',
        '--color-primary-400': '34  211 238',
        '--color-primary-500': '6   182 212',
        '--color-primary-600': '8   145 178',
        '--color-primary-700': '14  116 144',
        '--color-accent-400':  '56  189 248',
        '--color-accent-500':  '14  165 233',
        '--color-accent-600':  '2   132 199',
    },
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
            if (isDark) root.classList.add('dark');
            else root.classList.remove('dark');
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
        const vars = ACCENT_MAP[accentColor] ?? ACCENT_MAP.violet;
        const root = document.documentElement;
        Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
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
        if (reducedMotion) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
    }, [reducedMotion]);

    // Apply sidebar default collapsed (once on mount)
    useEffect(() => {
        if (sidebarDefaultCollapsed && !sidebarCollapsed) {
            toggleSidebarCollapsed();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
