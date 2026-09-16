import type { TechCategory } from '../lib/techBrand';

export interface LanguageSummary {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
    /** #RRGGBB do admin chọn; null → FE tự gợi ý theo slug */
    brandColor?: string | null;
}

export interface Framework {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
    /** #RRGGBB do admin chọn; null → FE tự gợi ý theo slug / logo */
    brandColor?: string | null;
    /** Nhóm do admin chọn; null → FE tự gợi ý theo slug */
    category?: TechCategory | null;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
    languages: LanguageSummary[];
}

export interface FrameworkSummary {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
    brandColor?: string | null;
    category?: TechCategory | null;
}

export interface FrameworkRequest {
    name: string;
    slug: string;
    iconUrl?: string | null;
    brandColor?: string | null;
    category?: TechCategory | null;
    isActive: boolean;
    languageIds?: number[];
}
