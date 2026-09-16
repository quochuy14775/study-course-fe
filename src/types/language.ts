import type { TechCategory } from '../lib/techBrand';

export interface FrameworkSummary {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
    brandColor?: string | null;
    category?: TechCategory | null;
}

export interface Language {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
    /** #RRGGBB do admin chọn; null → FE tự gợi ý theo slug / logo */
    brandColor?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
    frameworks: FrameworkSummary[];
}

export interface LanguageSummary {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
    brandColor?: string | null;
}

export interface LanguageRequest {
    name: string;
    slug: string;
    iconUrl?: string | null;
    brandColor?: string | null;
    isActive: boolean;
    frameworkIds?: number[];
}
