/**
 * Màu thương hiệu + nhóm cho ngôn ngữ / framework, tra theo slug.
 * Slug không có trong bảng → sinh màu ổn định từ hash (cùng slug luôn cùng màu).
 */

export type TechCategory = 'frontend' | 'backend' | 'mobile' | 'fullstack' | 'styling' | 'testing' | 'data' | 'devops';

/** Màu đại diện cho từng nhóm — dùng cho chip lọc / thanh phân bố (khác với màu thương hiệu của từng framework). */
export const CATEGORY_COLOR: Record<TechCategory, string> = {
    frontend: '#0EA5E9',
    backend: '#10B981',
    mobile: '#8B5CF6',
    fullstack: '#F59E0B',
    styling: '#EC4899',
    testing: '#F43F5E',
    data: '#6366F1',
    devops: '#64748B',
};

export const CATEGORY_LABEL: Record<TechCategory, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    mobile: 'Mobile',
    fullstack: 'Fullstack',
    styling: 'UI / CSS',
    testing: 'Testing',
    data: 'Data',
    devops: 'DevOps',
};

interface Brand {
    color: string;
    category?: TechCategory;
}

/* Màu lấy từ logo chính thức; key là slug thường gặp (viết thường, bỏ ký tự đặc biệt). */
const FRAMEWORKS: Record<string, Brand> = {
    react:          { color: '#61DAFB', category: 'frontend' },
    reactjs:        { color: '#61DAFB', category: 'frontend' },
    nextjs:         { color: '#111111', category: 'fullstack' },
    next:           { color: '#111111', category: 'fullstack' },
    vue:            { color: '#42B883', category: 'frontend' },
    vuejs:          { color: '#42B883', category: 'frontend' },
    nuxt:           { color: '#00DC82', category: 'fullstack' },
    nuxtjs:         { color: '#00DC82', category: 'fullstack' },
    angular:        { color: '#DD0031', category: 'frontend' },
    svelte:         { color: '#FF3E00', category: 'frontend' },
    sveltekit:      { color: '#FF3E00', category: 'fullstack' },
    solid:          { color: '#2C4F7C', category: 'frontend' },
    solidjs:        { color: '#2C4F7C', category: 'frontend' },
    astro:          { color: '#BC52EE', category: 'frontend' },
    remix:          { color: '#3992FF', category: 'fullstack' },
    express:        { color: '#6B7280', category: 'backend' },
    expressjs:      { color: '#6B7280', category: 'backend' },
    nestjs:         { color: '#E0234E', category: 'backend' },
    nest:           { color: '#E0234E', category: 'backend' },
    fastify:        { color: '#202020', category: 'backend' },
    koa:            { color: '#33333D', category: 'backend' },
    nodejs:         { color: '#5FA04E', category: 'backend' },
    node:           { color: '#5FA04E', category: 'backend' },
    django:         { color: '#0C4B33', category: 'backend' },
    flask:          { color: '#3B3B3B', category: 'backend' },
    fastapi:        { color: '#009688', category: 'backend' },
    spring:         { color: '#6DB33F', category: 'backend' },
    springboot:     { color: '#6DB33F', category: 'backend' },
    'spring-boot':  { color: '#6DB33F', category: 'backend' },
    aspnet:         { color: '#512BD4', category: 'backend' },
    aspnetcore:     { color: '#512BD4', category: 'backend' },
    'asp-net-core': { color: '#512BD4', category: 'backend' },
    'aspnet-core':  { color: '#512BD4', category: 'backend' },
    dotnet:         { color: '#512BD4', category: 'backend' },
    blazor:         { color: '#5C2D91', category: 'frontend' },
    laravel:        { color: '#FF2D20', category: 'backend' },
    symfony:        { color: '#1A1A1A', category: 'backend' },
    rails:          { color: '#CC0000', category: 'fullstack' },
    'ruby-on-rails':{ color: '#CC0000', category: 'fullstack' },
    gin:            { color: '#00ADD8', category: 'backend' },
    fiber:          { color: '#00ADD8', category: 'backend' },
    echo:           { color: '#00ADD8', category: 'backend' },
    actix:          { color: '#B7410E', category: 'backend' },
    axum:           { color: '#B7410E', category: 'backend' },
    flutter:        { color: '#02569B', category: 'mobile' },
    'react-native': { color: '#61DAFB', category: 'mobile' },
    reactnative:    { color: '#61DAFB', category: 'mobile' },
    expo:           { color: '#000020', category: 'mobile' },
    ionic:          { color: '#3880FF', category: 'mobile' },
    swiftui:        { color: '#F05138', category: 'mobile' },
    'jetpack-compose': { color: '#4285F4', category: 'mobile' },
    tailwind:       { color: '#06B6D4', category: 'styling' },
    tailwindcss:    { color: '#06B6D4', category: 'styling' },
    bootstrap:      { color: '#7952B3', category: 'styling' },
    jest:           { color: '#C21325', category: 'testing' },
    vitest:         { color: '#6E9F18', category: 'testing' },
    cypress:        { color: '#69D3A7', category: 'testing' },
    playwright:     { color: '#2EAD33', category: 'testing' },
    electron:       { color: '#47848F', category: 'frontend' },
    docker:         { color: '#2496ED', category: 'devops' },
    kubernetes:     { color: '#326CE5', category: 'devops' },
    pandas:         { color: '#150458', category: 'data' },
    pytorch:        { color: '#EE4C2C', category: 'data' },
    tensorflow:     { color: '#FF6F00', category: 'data' },
};

const LANGUAGES: Record<string, Brand> = {
    javascript: { color: '#F7DF1E' },
    js:         { color: '#F7DF1E' },
    typescript: { color: '#3178C6' },
    ts:         { color: '#3178C6' },
    python:     { color: '#3776AB' },
    java:       { color: '#E76F00' },
    csharp:     { color: '#512BD4' },
    'c-sharp':  { color: '#512BD4' },
    cs:         { color: '#512BD4' },
    go:         { color: '#00ADD8' },
    golang:     { color: '#00ADD8' },
    rust:       { color: '#B7410E' },
    php:        { color: '#777BB4' },
    ruby:       { color: '#CC342D' },
    kotlin:     { color: '#7F52FF' },
    swift:      { color: '#F05138' },
    dart:       { color: '#0175C2' },
    cpp:        { color: '#00599C' },
    'c-plus-plus': { color: '#00599C' },
    c:          { color: '#A8B9CC' },
    html:       { color: '#E34F26' },
    css:        { color: '#1572B6' },
    sql:        { color: '#336791' },
    scala:      { color: '#DC322F' },
    elixir:     { color: '#4B275F' },
    r:          { color: '#276DC3' },
};

const normalize = (slug: string) => slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

/** HSL (0–360, 0–1, 0–1) → #RRGGBB */
const hslToHex = (h: number, s: number, l: number): string => {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return `#${[f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};

/** Màu sinh từ hash — cùng slug luôn ra cùng màu, đủ đậm để làm viền/chữ; trả hex để lưu DB được. */
const hashColor = (s: string): string => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return hslToHex(h % 360, 0.62, 0.46);
};

export interface TechBrand {
    color: string;
    category?: TechCategory;
    /** true khi tra được trong bảng, false khi là màu sinh */
    known: boolean;
}

export const frameworkBrand = (slug: string): TechBrand => {
    const key = normalize(slug);
    const b = FRAMEWORKS[key] ?? FRAMEWORKS[key.replace(/-/g, '')];
    return b ? { ...b, known: true } : { color: hashColor(key), known: false };
};

export const languageBrand = (slug: string): TechBrand => {
    const key = normalize(slug);
    const b = LANGUAGES[key] ?? LANGUAGES[key.replace(/-/g, '')];
    return b ? { ...b, known: true } : { color: hashColor(key), known: false };
};

/* ─────────────────────────────────────────────────────────────
   Resolver: giá trị admin lưu trong DB thắng, rồi tới bảng tra, cuối cùng là hash
   ───────────────────────────────────────────────────────────── */

/** db = admin lưu · table = bảng tra theo slug · icon = đọc từ logo · hash = tự sinh từ slug */
export type BrandSource = 'db' | 'table' | 'icon' | 'hash';

export interface ResolvedBrand {
    color: string;
    category?: TechCategory;
    source: BrandSource;
}

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as TechCategory[];

export const isTechCategory = (v: unknown): v is TechCategory =>
    typeof v === 'string' && (CATEGORIES as string[]).includes(v);

const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

export const resolveFrameworkBrand = (fw: { slug: string; brandColor?: string | null; category?: string | null }): ResolvedBrand => {
    const table = frameworkBrand(fw.slug);
    const category = isTechCategory(fw.category) ? fw.category : table.category;
    if (isHex(fw.brandColor)) return { color: fw.brandColor, category, source: 'db' };
    return { color: table.color, category, source: table.known ? 'table' : 'hash' };
};

export const resolveLanguageBrand = (l: { slug: string; brandColor?: string | null }): ResolvedBrand => {
    const table = languageBrand(l.slug);
    if (isHex(l.brandColor)) return { color: l.brandColor, source: 'db' };
    return { color: table.color, source: table.known ? 'table' : 'hash' };
};

/* ─────────────────────────────────────────────────────────────
   Màu chủ đạo từ logo — chạy trên canvas ở client
   ───────────────────────────────────────────────────────────── */

const toHex = (r: number, g: number, b: number) =>
    `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

/**
 * Lấy màu xuất hiện nhiều nhất trong ảnh, bỏ pixel trong suốt / gần trắng / gần đen / xám.
 * Trả về null khi ảnh không tải được hoặc host không cho CORS (canvas bị "taint", không đọc được pixel).
 */
export const dominantColorFromImage = (url: string, timeoutMs = 6000): Promise<string | null> =>
    new Promise((resolve) => {
        if (!url || typeof document === 'undefined') return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = window.setTimeout(() => resolve(null), timeoutMs);

        img.onload = () => {
            window.clearTimeout(timer);
            try {
                const size = 48; // thu nhỏ để đếm nhanh, đủ để tìm màu chủ đạo
                const canvas = document.createElement('canvas');
                canvas.width = size; canvas.height = size;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return resolve(null);
                ctx.drawImage(img, 0, 0, size, size);
                const { data } = ctx.getImageData(0, 0, size, size);

                // Lượng tử hóa mỗi kênh về bậc 16 để gom các sắc gần nhau
                const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                    if (a < 128) continue;
                    const max = Math.max(r, g, b), min = Math.min(r, g, b);
                    const sat = max === 0 ? 0 : (max - min) / max;
                    if (max > 235 && sat < 0.15) continue;   // trắng
                    if (max < 40) continue;                    // đen
                    if (sat < 0.2) continue;                   // xám
                    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
                    const bk = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
                    bk.n++; bk.r += r; bk.g += g; bk.b += b;
                    buckets.set(key, bk);
                }

                let best: { n: number; r: number; g: number; b: number } | null = null;
                buckets.forEach((bk) => { if (!best || bk.n > best.n) best = bk; });
                if (!best) return resolve(null);
                const { n, r, g, b } = best as { n: number; r: number; g: number; b: number };
                resolve(toHex(Math.round(r / n), Math.round(g / n), Math.round(b / n)));
            } catch {
                resolve(null); // canvas tainted (không CORS) hoặc lỗi decode
            }
        };
        img.onerror = () => { window.clearTimeout(timer); resolve(null); };
        img.src = url;
    });

/**
 * Gợi ý màu cho dialog: bảng tra (nếu biết) → logo → hash.
 * Trả kèm nguồn để UI giải thích ("theo bảng", "từ logo", "tự sinh").
 */
export const suggestFrameworkBrand = async (slug: string, iconUrl?: string | null): Promise<ResolvedBrand> => {
    const table = frameworkBrand(slug);
    if (table.known) return { color: table.color, category: table.category, source: 'table' };
    const fromIcon = iconUrl ? await dominantColorFromImage(iconUrl) : null;
    return fromIcon ? { color: fromIcon, source: 'icon' } : { color: table.color, source: 'hash' };
};

export const suggestLanguageBrand = async (slug: string, iconUrl?: string | null): Promise<ResolvedBrand> => {
    const table = languageBrand(slug);
    if (table.known) return { color: table.color, source: 'table' };
    const fromIcon = iconUrl ? await dominantColorFromImage(iconUrl) : null;
    return fromIcon ? { color: fromIcon, source: 'icon' } : { color: table.color, source: 'hash' };
};

export const SOURCE_LABEL: Record<BrandSource, string> = {
    db: 'Admin chọn',
    table: 'Theo bảng thương hiệu',
    icon: 'Đọc từ logo',
    hash: 'Tự sinh từ slug',
};

/**
 * Trộn màu với alpha bằng color-mix — hoạt động với cả hex lẫn hsl(). Dùng cho nền / viền / glow.
 * (color-mix có ở Chrome 111+, Safari 16.2+, Firefox 113+.)
 */
export const tint = (color: string, alphaPct: number) =>
    `color-mix(in srgb, ${color} ${alphaPct}%, transparent)`;

/**
 * Màu thương hiệu dùng làm CHỮ trên nền surface: trộn 30% với --fg nên vàng/cyan sáng
 * đọc được ở light mode, còn màu tối (#111 của Next.js) không lẫn vào nền ở dark mode.
 */
export const brandText = (color: string) => `color-mix(in srgb, ${color} 70%, rgb(var(--fg)))`;

/** Màu chữ để đọc được trên nền màu thương hiệu (logo vàng/cyan sáng → chữ tối). */
export const onBrand = (color: string): string => {
    const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
    if (!m) return '#ffffff';
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 170 ? '#0f172a' : '#ffffff';
};
